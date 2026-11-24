import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown, Briefcase, Building2, FileText, Globe2, GraduationCap, History, MapPin, Sparkles, Target, Upload, Wallet, X,
} from 'lucide-react';
import ConversationList from '../components/chat/ConversationList';
import ChatMessage from '../components/chat/ChatMessage';
import ChatComposer from '../components/chat/ChatComposer';
import ResumeReport from '../components/chat/ResumeReport';
import JDMatchCard, { JDMatchPending } from '../components/chat/JDMatchCard';
import '../components/chat/chat.css';
import { ErrorState, Skeleton, Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import chatService, { validateResumeFile } from '../services/chatService';
import analyticsService from '../services/analyticsService';
import { formatNumber } from '../utils/format';
import { getErrorMessage, isCanceled } from '../utils/errors';

const SUGGESTIONS = [
  { icon: Sparkles, text: 'What are the top 10 most in-demand skills?' },
  { icon: Wallet, text: 'What is the average and median salary in these job postings?' },
  { icon: MapPin, text: 'Which locations are hiring the most?' },
  { icon: Briefcase, text: 'Show me remote data analyst jobs' },
  { icon: GraduationCap, text: 'How many fresher and internship jobs are there?' },
  { icon: Building2, text: 'Which companies are hiring the most?' },
];

function LiveStats() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    analyticsService
      .overview(controller.signal)
      .then(setStats)
      .catch((err) => { if (!isCanceled(err)) setFailed(true); });
    return () => controller.abort();
  }, []);

  if (failed) return null;

  const items = stats
    ? [
      { icon: Briefcase, value: stats.total_jobs, label: 'jobs' },
      { icon: Building2, value: stats.total_companies, label: 'companies' },
      { icon: Globe2, value: stats.workplace_distribution?.Remote, label: 'remote' },
    ]
    : null;

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {items
        ? items.map(({ icon: Icon, value, label }) => (
          <span key={label} className="chat-fade-in flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            <Icon size={13} className="text-violet-300" />
            <strong className="font-semibold text-white">{formatNumber(value)}</strong> {label}
          </span>
        ))
        : [0, 1, 2].map((i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}
    </div>
  );
}

function EmptyChat({ firstName, onPick }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-3 py-6 text-center sm:px-4 sm:py-10">
      <span className="chat-gradient-icon mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-glow">
        <Sparkles size={24} />
      </span>
      <h1 className="text-xl font-semibold text-white sm:text-2xl">
        Hi {firstName} <span aria-hidden="true">👋</span>
      </h1>
      <p className="mt-1 bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-lg font-medium text-transparent">
        How can I help with your job search?
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Answers are based on real job postings collected in this app.
      </p>

      <LiveStats />

      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, text }, i) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            style={{ animationDelay: `${i * 50}ms` }}
            className="chat-fade-in flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-sm text-slate-300 transition-colors hover:border-brand-purple/40 hover:bg-brand-purple/10 hover:text-white"
          >
            <Icon size={16} className="mt-0.5 shrink-0 text-violet-300" />
            {text}
          </button>
        ))}
      </div>

      <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl border border-brand-blue/25 bg-brand-blue/10 px-3.5 py-3 text-left text-sm text-blue-200">
        <FileText size={16} className="mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">Resume analyzer:</strong> drag &amp; drop your resume here or click{' '}
          <em>Upload resume</em> (PDF, DOCX or TXT). You&apos;ll get a score out of 100, matching and missing in-demand
          skills, and tips to improve it.
        </span>
      </div>

      <div className="mt-2 flex w-full items-start gap-2.5 rounded-xl border border-brand-purple/25 bg-brand-purple/10 px-3.5 py-3 text-left text-sm text-violet-200">
        <Target size={16} className="mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">Match with a job:</strong> upload your resume and paste the job description in the
          message box. You&apos;ll see your match %, the skills you have, and what to learn for each missing skill.
        </span>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { conversationId } = useParams();
  const activeId = conversationId ? Number(conversationId) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.full_name || '').trim().split(/\s+/)[0] || 'there';

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const abortRef = useRef(null);
  const skipLoadRef = useRef(null); // chat id just created by send(): don't reload it
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);
  const dragDepth = useRef(0);

  const upsertConversation = useCallback((conv) => {
    setConversations((list) => [{ ...list.find((c) => c.id === conv.id), ...conv }, ...list.filter((c) => c.id !== conv.id)]);
  }, []);

  // ---------- Chat history list ----------
  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      setConversations(await chatService.list());
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // ---------- Messages of the selected chat ----------
  useEffect(() => {
    setHistoryOpen(false);
    atBottomRef.current = true;

    if (skipLoadRef.current && skipLoadRef.current === activeId) {
      skipLoadRef.current = null;
      return undefined;
    }

    abortRef.current?.abort();
    setMsgError('');

    if (!activeId) {
      setMessages([]);
      return undefined;
    }

    const controller = new AbortController();
    setMsgLoading(true);
    setMessages([]);
    chatService
      .get(activeId, controller.signal)
      .then((data) => setMessages(data.messages))
      .catch((err) => { if (!isCanceled(err)) setMsgError(getErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setMsgLoading(false); });

    return () => controller.abort();
  }, [activeId]);

  // Stop any running stream when leaving the page
  useEffect(() => () => abortRef.current?.abort(), []);

  // ---------- Scrolling (8: jump-to-bottom button) ----------
  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  };

  // Follow new text only while the user is at the bottom.
  // With no messages (welcome screen), show it from the top.
  useEffect(() => {
    if (messages.length === 0) {
      scrollRef.current?.scrollTo({ top: 0 });
      setShowJump(false);
      return;
    }
    if (atBottomRef.current) scrollToBottom();
  }, [messages]);

  // ---------- Streaming (shared by send and regenerate) ----------
  const runStream = async (request, { tempUserId, tempBotId }) => {
    const updateBot = (fn) => setMessages((list) => list.map((m) => (m.id === tempBotId ? fn(m) : m)));
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let started = false; // server saved the question, so a retry (regenerate) is safe

    try {
      await request({
        signal: controller.signal,
        onEvent: (ev) => {
          if (ev.type === 'start') {
            started = true;
            if (tempUserId && ev.user_message) {
              setMessages((list) => list.map((m) => (m.id === tempUserId ? ev.user_message : m)));
            }
            upsertConversation(ev.conversation);
          } else if (ev.type === 'jd_report') {
            setMessages((list) => list.map((m) => (
              m.id === ev.message_id ? { ...m, jd_report: ev.report, jd_pending: false } : m
            )));
          } else if (ev.type === 'tool') {
            updateBot((m) => ({ ...m, tool: ev.name }));
          } else if (ev.type === 'delta') {
            updateBot((m) => ({ ...m, content: m.content + ev.text }));
          } else if (ev.type === 'done') {
            updateBot(() => ev.message);
          } else if (ev.type === 'error') {
            updateBot((m) => ({ ...m, streaming: false, error: ev.detail }));
          }
        },
      });
    } catch (err) {
      const error = err?.name === 'AbortError' ? 'Stopped. This reply was not saved.' : getErrorMessage(err);
      updateBot((m) => ({ ...m, streaming: false, error }));
    } finally {
      updateBot((m) => ({ ...m, streaming: false, canRetry: started }));
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  };

  const send = async ({ content, file: attached }) => {
    if (busy) return;
    setMsgError('');

    let id = activeId;
    if (!id) {
      try {
        const conv = await chatService.create();
        upsertConversation(conv);
        skipLoadRef.current = conv.id;
        navigate(`/assistant/${conv.id}`);
        id = conv.id;
      } catch (err) {
        setMsgError(getErrorMessage(err));
        return;
      }
    }

    const stamp = Date.now();
    const tempUserId = `tmp-user-${stamp}`;
    const tempBotId = `tmp-bot-${stamp}`;

    atBottomRef.current = true;
    setMessages((list) => [
      ...list,
      { id: tempUserId, role: 'user', content, attachment_name: attached?.name ?? null },
      { id: tempBotId, role: 'assistant', content: '', streaming: true },
    ]);

    await runStream((opts) => chatService.send(id, { content, file: attached }, opts), { tempUserId, tempBotId });
  };

  // 6: regenerate the last answer
  const regenerate = async () => {
    if (busy || !activeId) return;
    const tempBotId = `tmp-bot-${Date.now()}`;

    atBottomRef.current = true;
    setMessages((list) => {
      const rest = list[list.length - 1]?.role === 'assistant' ? list.slice(0, -1) : list;
      return [...rest, { id: tempBotId, role: 'assistant', content: '', streaming: true }];
    });

    await runStream((opts) => chatService.regenerate(activeId, opts), { tempBotId });
  };

  const stop = () => abortRef.current?.abort();

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setHistoryOpen(false);
    navigate('/assistant');
  }, [navigate]);

  // 12: Ctrl/Cmd + K starts a new chat
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        newChat();
      } else if (e.key === 'Escape') {
        setHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newChat]);

  const rename = async (id, title) => {
    try {
      upsertConversation(await chatService.rename(id, title));
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  };

  const remove = async (conv) => {
    if (!window.confirm(`Delete "${conv.title}"? This cannot be undone.`)) return;
    try {
      await chatService.remove(conv.id);
      setConversations((list) => list.filter((c) => c.id !== conv.id));
      if (conv.id === activeId) navigate('/assistant');
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  };

  // ---------- Resume file (4: drag & drop) ----------
  const selectFile = (f) => {
    const error = validateResumeFile(f);
    setFileError(error);
    setFile(error ? null : f);
  };

  const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');

  const dragHandlers = {
    onDragEnter: (e) => {
      if (!hasFiles(e) || busy) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e) => {
      if (hasFiles(e) && !busy) e.preventDefault();
    },
    onDragLeave: (e) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!busy && e.dataTransfer.files?.[0]) selectFile(e.dataTransfer.files[0]);
    },
  };

  // ---------- Render ----------
  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? 'New chat';
  const lastIndex = messages.length - 1;
  const userName = user?.full_name || user?.email;

  const historyPanel = (
    <ConversationList
      conversations={conversations}
      loading={listLoading}
      activeId={activeId}
      onNew={newChat}
      onSelect={(id) => navigate(`/assistant/${id}`)}
      onRename={rename}
      onDelete={remove}
    />
  );

  return (
    <div className="card relative -mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] min-h-[360px] overflow-hidden rounded-none border-x-0 sm:mx-0 sm:my-0 sm:h-[calc(100dvh-6.5rem)] sm:rounded-xl sm:border-x">
      {/* Chat history: always visible on desktop */}
      <aside className="hidden w-64 shrink-0 border-r lg:w-72 xl:w-80 border-white/10 bg-ink-900/40 md:block">
        {listError ? <ErrorState compact message={listError} onRetry={loadList} /> : historyPanel}
      </aside>

      {/* Chat history: drawer on mobile */}
      {historyOpen && (
        <div className="absolute inset-0 z-20 flex md:hidden">
          <div className="chat-fade-in flex w-72 max-w-[85%] flex-col border-r border-white/10 bg-ink-900">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-sm font-medium text-slate-200">Chat history</span>
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded p-1 text-slate-400 hover:bg-white/10" aria-label="Close history">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {listError ? <ErrorState compact message={listError} onRetry={loadList} /> : historyPanel}
            </div>
          </div>
          <button type="button" className="flex-1 bg-black/50 backdrop-blur-[1px]" onClick={() => setHistoryOpen(false)} aria-label="Close history" />
        </div>
      )}

      {/* Conversation */}
      <section className="relative flex min-w-0 flex-1 flex-col" {...dragHandlers}>
        {dragging && (
          <div className="chat-drop-zone pointer-events-none absolute inset-3 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-purple/70 bg-ink-900/90 text-center backdrop-blur-sm">
            <span className="chat-gradient-icon flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-glow">
              <Upload size={22} />
            </span>
            <p className="text-base font-semibold text-white">Drop your resume here</p>
            <p className="text-xs text-slate-400">PDF, DOCX or TXT · max 5 MB</p>
          </div>
        )}

        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-3 sm:px-4">
          <button type="button" onClick={() => setHistoryOpen(true)} className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 md:hidden" aria-label="Open chat history">
            <History size={17} />
          </button>
          <Sparkles size={15} className="shrink-0 text-violet-300" />
          <h1 className="min-w-0 truncate text-sm font-medium text-slate-100">{activeId ? activeTitle : 'AI Assistant'}</h1>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto">
          {msgLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
              <Spinner /> Loading chat…
            </div>
          ) : msgError && messages.length === 0 ? (
            <ErrorState message={msgError} onRetry={activeId ? () => navigate(0) : undefined} />
          ) : messages.length === 0 ? (
            <EmptyChat firstName={firstName} onPick={(text) => send({ content: text })} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-5 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 xl:max-w-4xl">
              {messages.map((m, i) => (
                <Fragment key={m.id}>
                  <ChatMessage
                    message={m}
                    userName={userName}
                    onRegenerate={
                      i === lastIndex && m.role === 'assistant' && !busy && !m.streaming
                      && (!String(m.id).startsWith('tmp-') || m.canRetry)
                        ? regenerate
                        : undefined
                    }
                  />
                  {m.role === 'user' && (m.jd_report || m.jd_pending || m.resume_report) && (
                    <div className="sm:pl-11">
                      {/* A JD match replaces the general resume score card for that message */}
                      {m.jd_report ? (
                        <JDMatchCard report={m.jd_report} />
                      ) : m.jd_pending ? (
                        <JDMatchPending />
                      ) : (
                        <ResumeReport report={m.resume_report} fileName={m.attachment_name} />
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {showJump && messages.length > 0 && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="chat-fade-in absolute bottom-28 left-1/2 sm:bottom-36 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-700 text-slate-200 shadow-card transition-colors hover:bg-ink-600"
            aria-label="Scroll to latest message"
          >
            <ArrowDown size={16} />
          </button>
        )}

        {msgError && messages.length > 0 && (
          <p role="alert" className="px-4 pb-1 text-center text-xs text-rose-300">{msgError}</p>
        )}

        <ChatComposer
          onSend={send}
          onStop={stop}
          busy={busy}
          autoFocusKey={activeId}
          file={file}
          fileError={fileError}
          onFileSelect={selectFile}
          onFileClear={() => { setFile(null); setFileError(''); }}
        />
      </section>
    </div>
  );
}
