from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Signup request
class UserCreate(BaseModel):

    full_name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    password: str = Field(min_length=8, max_length=128)


# User response
class UserResponse(BaseModel):

    id: int
    full_name: str
    email: EmailStr
    is_active: bool

    model_config = ConfigDict(from_attributes=True)



class UserLogin(BaseModel):

    email: EmailStr

    password: str



class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=20)



# ---------- AI chat ----------

class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=120)


class ConversationRename(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    attachment_name: str | None = None
    resume_report: dict | None = None
    is_jd: bool = False
    jd_report: dict | None = None
    jd_pending: bool = False
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetail(ConversationResponse):
    messages: list[MessageResponse] = []
