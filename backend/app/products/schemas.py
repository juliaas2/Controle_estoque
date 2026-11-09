from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    sku: str = Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9._-]+$")
    name: str = Field(min_length=1, max_length=120)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.upper()


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sku: str
    name: str
    total_quantity: int
    created_at: str
