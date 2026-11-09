from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

Quantity = Annotated[int, Field(strict=True, gt=0, le=1_000_000_000)]


class QuantityInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    quantity: Quantity


class ReservationCreate(QuantityInput):
    request_id: str = Field(min_length=1, max_length=80)


class BlockCreate(QuantityInput):
    request_id: str | None = Field(default=None, min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=240)


class StockRead(BaseModel):
    product_id: int
    total_quantity: int
    available_quantity: int
    reserved_quantity: int
    blocked_quantity: int


class AllocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: int
    quantity: int
    created_at: str
    released_at: str | None


class ReservationRead(AllocationRead):
    request_id: str


class BlockRead(AllocationRead):
    request_id: str | None
    reason: str
