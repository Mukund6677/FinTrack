from datetime import date
from decimal import Decimal
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str


class IncomeCreate(BaseModel):
    amount: Decimal
    source: str
    income_date: date
    description: str | None = None
    source_type: str | None = "MANUAL"


class ExpenseCreate(BaseModel):
    amount: Decimal
    category: str
    merchant: str | None = None
    expense_date: date
    description: str | None = None
    payment_method: str | None = None
    source: str = "MANUAL"

class BudgetCreate(BaseModel):
    category: str
    limit_amount: Decimal
    period: str
    start_date: date
    end_date: date


class IncomeAllocationCreate(BaseModel):
    title: str
    category: str | None = None
    planned_amount: Decimal
    due_date: date | None = None
    description: str | None = None



class SplitParticipantCreate(BaseModel):
    name: str
    user_id: int | None = None
    share_amount: Decimal


class SplitBillCreate(BaseModel):
    title: str
    total_amount: Decimal
    bill_date: date
    description: str | None = None
    participants: list[SplitParticipantCreate]


class SettlementCreate(BaseModel):
    participant_id: int
    amount: Decimal
    settlement_date: date | None = None


class CardCreate(BaseModel):
    card_name: str
    issuer: str
    card_type: Literal["DEBIT", "CREDIT"]
    network: Optional[str] = None
    last_four_digits: Optional[str] = None
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None

class CardBenefitCreate(BaseModel):
    category: str
    benefit_type: str
    benefit_value: Decimal
    conditions: Optional[str] = None