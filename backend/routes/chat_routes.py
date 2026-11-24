import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import ai_service
from database import SessionLocal, get_db
from dependencies import get_current_user
from models import Conversation, Message, MessageAnalysis, User
from schemas import (
    ConversationCreate,
    ConversationDetail,
    ConversationRename,
    ConversationResponse,
)


router = APIRouter(
    prefix="/api/chat",
    tags=["AI Assistant"],
    dependencies=[Depends(get_current_user)]
)

MAX_MESSAGE_CHARS = 12000  # long enough for a pasted job description


def _now():
    return datetime.now(timezone.utc)


def _get_owned_conversation(db, conversation_id, user):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


def _make_title(text, attachment_name):
    text = " ".join((text or "").split())

    if text:
        return text[:60] + ("..." if len(text) > 60 else "")

    if attachment_name:
        return f"Resume review: {attachment_name}"[:120]

    return "New chat"


def _sse(payload):
    return f"data: {json.dumps(payload, default=str)}\n\n"


# ---------- Conversations ----------

@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc(), Conversation.id.desc()).all()


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_conversation(
    data: ConversationCreate | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = Conversation(
        user_id=current_user.id,
        title=(data.title.strip() if data and data.title and data.title.strip() else "New chat"),
        updated_at=_now()
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = _get_owned_conversation(db, conversation_id, current_user)

    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [_message_out(m) for m in conversation.messages],
    }


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: int,
    data: ConversationRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = _get_owned_conversation(db, conversation_id, current_user)

    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    conversation.title = title
    db.commit()
    db.refresh(conversation)

    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = _get_owned_conversation(db, conversation_id, current_user)

    db.delete(conversation)
    db.commit()


# ---------- Messages (text + optional resume upload, streamed reply) ----------

def _jd_report_of(msg):
    analysis = getattr(msg, "analysis", None)
    if analysis is None or analysis.kind != "jd_match":
        return None
    try:
        return json.loads(analysis.data)
    except ValueError:
        return None


def _message_out(msg, jd_pending=False):
    """Message as JSON, including the resume score card / JD match card when present."""
    is_user = msg.role == "user"
    return {
        "id": msg.id,
        "role": msg.role,
        "content": msg.content,
        "attachment_name": msg.attachment_name,
        "is_jd": is_user and ai_service.looks_like_jd(msg.content),
        "resume_report": (
            ai_service.build_resume_report(msg.attachment_text)
            if msg.attachment_text else None
        ),
        "jd_report": _jd_report_of(msg) if is_user else None,
        "jd_pending": jd_pending,
        "created_at": msg.created_at,
    }


def _find_jd_job(conversation, user_message):
    """
    Decide whether to run a resume-vs-JD match for this message:
      - message has a JD (pasted text) -> use this message's resume, or the latest resume in the chat
      - message has a resume only      -> use the latest JD pasted earlier in the chat
    """
    earlier = [m for m in conversation.messages if m.id != user_message.id and m.role == "user"]

    if ai_service.looks_like_jd(user_message.content):
        jd_text = user_message.content
        resume_text = user_message.attachment_text or next(
            (m.attachment_text for m in reversed(earlier) if m.attachment_text), None
        )
    elif user_message.attachment_text:
        resume_text = user_message.attachment_text
        jd_text = next((m.content for m in reversed(earlier) if ai_service.looks_like_jd(m.content)), None)
    else:
        return None

    if not jd_text or not resume_text:
        return None

    return {"message_id": user_message.id, "jd_text": jd_text, "resume_text": resume_text}


def _ensure_ai_configured():
    try:
        ai_service.get_client()
    except ai_service.AIConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _run_jd_match(jd_job, model_messages):
    """Builds and saves the JD match card; returns SSE events to send."""
    try:
        report = ai_service.build_jd_report(jd_job["resume_text"], jd_job["jd_text"])
    except Exception as e:
        print(f"[jd] match failed: {e!r}")
        return [{"type": "jd_report", "message_id": jd_job["message_id"], "report": None}]

    session = SessionLocal()
    try:
        session.add(MessageAnalysis(
            message_id=jd_job["message_id"],
            kind="jd_match",
            data=json.dumps(report)
        ))
        session.commit()
    finally:
        session.close()

    # Give the model the card so its explanation matches what the user sees
    model_messages[-1]["content"] += "\n\n" + ai_service.jd_report_for_model(report)

    return [{"type": "jd_report", "message_id": jd_job["message_id"], "report": report}]


def _stream_assistant_reply(conversation, user_message_out, jd_job=None):
    """Streams the assistant's reply for the conversation's current history and saves it."""
    model_messages = ai_service.to_model_messages(conversation.messages)

    conversation_meta = {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": conversation.updated_at,
    }
    conv_id = conversation.id

    def event_stream():
        yield _sse({"type": "start", "conversation": conversation_meta, "user_message": user_message_out})

        if jd_job:
            yield _sse({"type": "tool", "name": "analyse_jd"})
            for event in _run_jd_match(jd_job, model_messages):
                yield _sse(event)

        answer_parts = []
        error_text = None

        try:
            for kind, value in ai_service.stream_reply(model_messages):
                if kind == "delta":
                    answer_parts.append(value)
                    yield _sse({"type": "delta", "text": value})
                elif kind == "tool":
                    yield _sse({"type": "tool", "name": value})

        except Exception as e:
            error_text = "The AI service failed to respond. Please try again."
            print(f"[chat] Groq error: {e!r}")

        answer = "".join(answer_parts).strip()

        if error_text and not answer:
            yield _sse({"type": "error", "detail": error_text})
            return

        if error_text:
            answer += "\n\n_(The response was interrupted.)_"

        # Save the assistant's reply in a fresh session (the request session may be closed)
        session = SessionLocal()
        try:
            saved_conversation = session.get(Conversation, conv_id)
            if saved_conversation is None:
                # Chat was deleted while the answer was being generated
                yield _sse({"type": "error", "detail": "This chat no longer exists."})
                return

            assistant_message = Message(
                conversation_id=conv_id,
                role="assistant",
                content=answer or "_(No response)_"
            )
            session.add(assistant_message)
            saved_conversation.updated_at = _now()

            session.commit()
            session.refresh(assistant_message)

            yield _sse({"type": "done", "message": _message_out(assistant_message)})
        finally:
            session.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    content: str = Form(default=""),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = _get_owned_conversation(db, conversation_id, current_user)

    content = (content or "").strip()

    if len(content) > MAX_MESSAGE_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Message is too long (max {MAX_MESSAGE_CHARS} characters)"
        )

    attachment_name = None
    attachment_text = None

    if file is not None and file.filename:
        data = await file.read(ai_service.MAX_RESUME_BYTES + 1)

        try:
            attachment_text = ai_service.extract_resume_text(file.filename, data)
        except ai_service.ResumeError as e:
            raise HTTPException(status_code=400, detail=str(e))

        attachment_name = file.filename[:255]

    if not content and not attachment_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    _ensure_ai_configured()

    # Save the user's message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=content,
        attachment_name=attachment_name,
        attachment_text=attachment_text
    )
    db.add(user_message)

    if conversation.title == "New chat":
        conversation.title = _make_title(content, attachment_name)

    conversation.updated_at = _now()
    db.commit()
    db.refresh(user_message)
    db.refresh(conversation)

    jd_job = _find_jd_job(conversation, user_message)

    return _stream_assistant_reply(
        conversation,
        _message_out(user_message, jd_pending=jd_job is not None),
        jd_job=jd_job
    )


@router.post("/conversations/{conversation_id}/regenerate")
def regenerate_reply(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Replaces the last assistant reply with a new one (or answers a question left without a reply)."""
    conversation = _get_owned_conversation(db, conversation_id, current_user)

    messages = list(conversation.messages)

    if not messages:
        raise HTTPException(status_code=400, detail="There is nothing to regenerate in this chat")

    _ensure_ai_configured()

    if messages[-1].role == "assistant":
        db.delete(messages[-1])

    conversation.updated_at = _now()
    db.commit()
    db.refresh(conversation)

    if not conversation.messages or conversation.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="There is nothing to regenerate in this chat")

    return _stream_assistant_reply(conversation, None)
