from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    tenant_id: int | None
    tenant_name: str | None = None
    is_platform_admin: bool
    employee_id: int | None = None


class LoginResult(TokenPair):
    user: UserProfile
