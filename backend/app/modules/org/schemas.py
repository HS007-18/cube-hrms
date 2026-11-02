from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str | None = Field(default=None, max_length=40)
    parent_id: int | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    code: str | None = Field(default=None, max_length=40)


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None
    parent_id: int | None


class DesignationCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    level: int = Field(default=1, ge=0, le=20)


class DesignationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    level: int | None = Field(default=None, ge=0, le=20)


class DesignationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    level: int
