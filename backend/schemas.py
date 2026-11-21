
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
