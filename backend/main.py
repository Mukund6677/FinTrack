from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import date, datetime
from decimal import Decimal
from auth import (
    SECRET_KEY,
    ALGORITHM,
    hash_password,
    verify_password,
    create_access_token
)
from database import get_db
from models import User, Income, Expense, Budget, IncomeAllocation, AuditLog, SplitBill, SplitParticipant, Settlement, Card, CardBenefit
from schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    IncomeCreate,
    ExpenseCreate,
    BudgetCreate,
    IncomeAllocationCreate,
    SplitBillCreate,
    SettlementCreate,
    CardCreate,
    CardBenefitCreate
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user


def require_developer(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "DEVELOPER":
        raise HTTPException(
            status_code=403,
            detail="Developer access required"
        )

    return current_user
app = FastAPI(title="FinTrack API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "FinTrack API is running"
    }


@app.get("/db-test")
def db_test():
    try:
        from database import engine

        with engine.connect():
            return {
                "message": "MySQL database connected successfully"
            }

    except Exception as e:
        return {
            "message": "Database connection failed",
            "error": str(e)
        }


@app.post("/register", response_model=UserResponse)
def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="USER"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "user_id": user.user_id,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@app.get("/developer-test")
def developer_test(
    current_user: User = Depends(require_developer)
):
    return {
        "message": "Developer access granted",
        "user": current_user.name,
        "role": current_user.role
    }


@app.post("/income")
def add_income(
    income_data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    income = Income(
        user_id=current_user.user_id,
        amount=income_data.amount,
        source=income_data.source,
        income_date=income_data.income_date,
        description=income_data.description,
        source_type=income_data.source_type
    )

    db.add(income)
    db.commit()
    db.refresh(income)

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATED",
        entity_type="INCOME",
        entity_id=income.income_id
    )

    db.add(audit)
    db.commit()

    return {
        "message": "Income added successfully",
        "income_id": income.income_id,
        "amount": income.amount
    }


@app.get("/income")
def get_income(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Income).filter(
        Income.user_id == current_user.user_id
    ).order_by(
        Income.income_date.desc()
    ).all()


@app.post("/expense")
def add_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = Expense(
        user_id=current_user.user_id,
        amount=expense_data.amount,
        category=expense_data.category,
        merchant=expense_data.merchant,
        expense_date=expense_data.expense_date,
        description=expense_data.description,
        payment_method=expense_data.payment_method,
        source=expense_data.source
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATED",
        entity_type="EXPENSE",
        entity_id=expense.expense_id
    )

    db.add(audit)
    db.commit()

    return {
        "message": "Expense added successfully",
        "expense_id": expense.expense_id,
        "amount": expense.amount
    }


@app.get("/expenses")
def get_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    ).order_by(
        Expense.expense_date.desc()
    ).all()

@app.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_income = db.query(Income).filter(
        Income.user_id == current_user.user_id
    ).with_entities(
        func.coalesce(func.sum(Income.amount), 0)
    ).scalar()

    total_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    ).with_entities(
        func.coalesce(func.sum(Expense.amount), 0)
    ).scalar()

    balance = total_income - total_expenses

    transaction_count = (
        db.query(Income).filter(Income.user_id == current_user.user_id).count()
        +
        db.query(Expense).filter(Expense.user_id == current_user.user_id).count()
    )

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "transaction_count": transaction_count
    }


@app.get("/dashboard-filtered")
def get_filtered_dashboard(
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_income = db.query(
        func.coalesce(func.sum(Income.amount), 0)
    ).filter(
        Income.user_id == current_user.user_id,
        Income.income_date >= start_date,
        Income.income_date <= end_date
    ).scalar()

    
    regular_expenses = db.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).scalar()

    split_expenses = db.query(
        func.coalesce(func.sum(SplitParticipant.share_amount), 0)
    ).join(
        SplitBill,
        SplitParticipant.split_bill_id == SplitBill.split_bill_id
    ).filter(
        SplitParticipant.user_id == current_user.user_id,
        SplitBill.bill_date >= start_date,
        SplitBill.bill_date <= end_date
    ).scalar()

    total_expenses = float(regular_expenses or 0) + float(split_expenses or 0)


    balance = float(total_income or 0) - total_expenses

    income_count = db.query(Income).filter(
        Income.user_id == current_user.user_id,
        Income.income_date >= start_date,
        Income.income_date <= end_date
    ).count()

    expense_count = db.query(Expense).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).count()

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "transaction_count": income_count + expense_count
    }

@app.get("/monthly-analytics")
def get_monthly_analytics(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    if year < 1:
        raise HTTPException(
            status_code=400,
            detail="Year must be greater than 0"
        )

    start_date = date(year, month, 1)

    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    total_income = db.query(
        func.coalesce(func.sum(Income.amount), 0)
    ).filter(
        Income.user_id == current_user.user_id,
        Income.income_date >= start_date,
        Income.income_date < end_date
    ).scalar()

    regular_expenses = db.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).scalar()

    split_expenses = db.query(
        func.coalesce(func.sum(SplitParticipant.share_amount), 0)
    ).join(
        SplitBill,
        SplitParticipant.split_bill_id == SplitBill.split_bill_id
    ).filter(
        SplitParticipant.user_id == current_user.user_id,
        SplitBill.bill_date >= start_date,
        SplitBill.bill_date < end_date
    ).scalar()

    income = float(total_income or 0)
    regular = float(regular_expenses or 0)
    split = float(split_expenses or 0)

    total_expenses = regular + split
    balance = income - total_expenses

    savings_rate = (
        (balance / income) * 100
        if income > 0
        else None
    )

    return {
        "year": year,
        "month": month,
        "total_income": round(income, 2),
        "regular_expenses": round(regular, 2),
        "split_bill_expenses": round(split, 2),
        "total_expenses": round(total_expenses, 2),
        "balance": round(balance, 2),
        "savings_rate_percent": (
            round(savings_rate, 2)
            if savings_rate is not None
            else None
        )
    }


@app.get("/monthly-comparison")
def get_monthly_comparison(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    if year < 1:
        raise HTTPException(
            status_code=400,
            detail="Year must be greater than 0"
        )

    current_start = date(year, month, 1)

    if month == 12:
        next_start = date(year + 1, 1, 1)
    else:
        next_start = date(year, month + 1, 1)

    previous_start = date(year, month - 1, 1) if month > 1 else date(year - 1, 12, 1)

    # Avoid constructing year 0 when comparing January of year 1.
    if year == 1 and month == 1:
        raise HTTPException(
            status_code=400,
            detail="Previous-month comparison is unavailable for January of year 1"
        )

    def get_totals(start_date, end_date):
        income = db.query(
            func.coalesce(func.sum(Income.amount), 0)
        ).filter(
            Income.user_id == current_user.user_id,
            Income.income_date >= start_date,
            Income.income_date < end_date
        ).scalar()

        regular_expenses = db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.user_id == current_user.user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar()

        split_expenses = db.query(
            func.coalesce(func.sum(SplitParticipant.share_amount), 0)
        ).join(
            SplitBill,
            SplitParticipant.split_bill_id == SplitBill.split_bill_id
        ).filter(
            SplitParticipant.user_id == current_user.user_id,
            SplitBill.bill_date >= start_date,
            SplitBill.bill_date < end_date
        ).scalar()

        total_income = float(income or 0)
        total_expenses = (
            float(regular_expenses or 0)
            + float(split_expenses or 0)
        )

        return {
            "income": round(total_income, 2),
            "expenses": round(total_expenses, 2),
            "balance": round(total_income - total_expenses, 2)
        }

    current = get_totals(current_start, next_start)
    previous = get_totals(previous_start, current_start)

    def calculate_change(current_value, previous_value):
        difference = round(current_value - previous_value, 2)

        percentage = (
            round((difference / abs(previous_value)) * 100, 2)
            if previous_value != 0
            else None
        )

        return {
            "difference": difference,
            "percentage_change": percentage
        }

    return {
        "current_month": {
            "year": year,
            "month": month,
            **current
        },
        "previous_month": {
            "year": previous_start.year,
            "month": previous_start.month,
            **previous
        },
        "comparison": {
            "income": calculate_change(
                current["income"], previous["income"]
            ),
            "expenses": calculate_change(
                current["expenses"], previous["expenses"]
            ),
            "balance": calculate_change(
                current["balance"], previous["balance"]
            )
        }
    }


@app.get("/monthly-category-analysis")
def get_monthly_category_analysis(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Month must be between 1 and 12"
        )

    if year < 1:
        raise HTTPException(
            status_code=400,
            detail="Year must be greater than 0"
        )

    start_date = date(year, month, 1)

    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    category_totals = {}

    # Regular expenses grouped by category
    regular_summary = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total_amount")
    ).filter(
        Expense.user_id == current_user.user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(
        Expense.category
    ).all()

    for category, amount in regular_summary:
        category_name = category or "Uncategorized"
        category_totals[category_name] = (
            category_totals.get(category_name, 0)
            + float(amount or 0)
        )

    # Linked split-bill shares for this user
    split_total = db.query(
        func.coalesce(
            func.sum(SplitParticipant.share_amount), 0
        )
    ).join(
        SplitBill,
        SplitParticipant.split_bill_id == SplitBill.split_bill_id
    ).filter(
        SplitParticipant.user_id == current_user.user_id,
        SplitBill.bill_date >= start_date,
        SplitBill.bill_date < end_date
    ).scalar()

    if float(split_total or 0) > 0:
        category_totals["Split Bills"] = (
            category_totals.get("Split Bills", 0)
            + float(split_total)
        )

    total_expenses = sum(category_totals.values())

    categories = [
        {
            "category": category,
            "amount": round(amount, 2),
            "percentage": round(
                (amount / total_expenses) * 100, 2
            ) if total_expenses > 0 else 0
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]

    return {
        "year": year,
        "month": month,
        "total_expenses": round(total_expenses, 2),
        "category_count": len(categories),
        "categories": categories
    }


@app.post("/budget")
def add_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Prevent duplicate budgets for the same user,
    # category, and date range.
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.user_id,
        Budget.category == budget_data.category,
        Budget.start_date == budget_data.start_date,
        Budget.end_date == budget_data.end_date
    ).first()

    if existing_budget:
        raise HTTPException(
            status_code=409,
            detail=(
                "A budget already exists for this category "
                "and date range."
            )
        )

    budget = Budget(
        user_id=current_user.user_id,
        category=budget_data.category,
        limit_amount=budget_data.limit_amount,
        period=budget_data.period,
        start_date=budget_data.start_date,
        end_date=budget_data.end_date
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATED",
        entity_type="BUDGET",
        entity_id=budget.budget_id
    )

    db.add(audit)
    db.commit()

    return {
        "message": "Budget added successfully",
        "budget_id": budget.budget_id,
        "category": budget.category,
        "limit_amount": budget.limit_amount,
        "period": budget.period
    }

@app.get("/budgets")
def get_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.user_id
    ).order_by(
        Budget.start_date.desc()
    ).all()

    return budgets

@app.post("/allocation")
def add_income_allocation(
    allocation_data: IncomeAllocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allocation = IncomeAllocation(
        user_id=current_user.user_id,
        title=allocation_data.title,
        category=allocation_data.category,
        planned_amount=allocation_data.planned_amount,
        due_date=allocation_data.due_date,
        description=allocation_data.description
    )

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATED",
        entity_type="INCOME_ALLOCATION",
        entity_id=allocation.allocation_id
    )

    db.add(audit)
    db.commit()

    return {
        "message": "Income allocation added successfully",
        "allocation_id": allocation.allocation_id,
        "title": allocation.title,
        "category": allocation.category,
        "planned_amount": allocation.planned_amount,
        "actual_amount": allocation.actual_amount,
        "due_date": allocation.due_date,
        "status": allocation.status
    }   
@app.get("/allocations")
def get_income_allocations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allocations = (
        db.query(IncomeAllocation)
        .filter(IncomeAllocation.user_id == current_user.user_id)
        .order_by(IncomeAllocation.due_date.asc())
        .all()
    )

    return allocations

@app.patch("/allocations/{allocation_id}")
def update_income_allocation(
    allocation_id: int,
    actual_amount: Decimal,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allocation = db.query(IncomeAllocation).filter(
        IncomeAllocation.allocation_id == allocation_id,
        IncomeAllocation.user_id == current_user.user_id
    ).first()

    if allocation is None:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    if actual_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Actual amount cannot be negative"
        )

    if status not in ["PENDING", "COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid allocation status"
        )

    allocation.actual_amount = actual_amount
    allocation.status = status

    if status == "COMPLETED":
        allocation.completed_at = datetime.now()

    db.commit()
    db.refresh(allocation)

    return {
        "message": "Allocation updated successfully",
        "allocation_id": allocation.allocation_id,
        "actual_amount": allocation.actual_amount,
        "status": allocation.status
    }


@app.post("/split-bills")
def create_split_bill(
    data: SplitBillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.participants:
        raise HTTPException(
            status_code=400,
            detail="At least one participant is required"
        )

    if data.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Bill total must be greater than zero"
        )

    if any(p.share_amount <= 0 for p in data.participants):
        raise HTTPException(
            status_code=400,
            detail="Each participant share must be greater than zero"
        )

    total_shares = sum(
        (p.share_amount for p in data.participants),
        Decimal("0.00")
    )

    if total_shares != data.total_amount:
        raise HTTPException(
            status_code=400,
            detail="Participant shares must add up to the bill total"
        )

    bill = SplitBill(
        user_id=current_user.user_id,
        title=data.title,
        total_amount=data.total_amount,
        bill_date=data.bill_date,
        description=data.description
    )

    db.add(bill)
    db.flush()

    participants = []

    for person in data.participants:
        participant = SplitParticipant(
            split_bill_id=bill.split_bill_id,
            user_id=person.user_id,
            name=person.name,
            share_amount=person.share_amount,
            amount_paid=Decimal("0.00"),
            status="PENDING"
        )
        db.add(participant)
        participants.append(participant)

    db.commit()
    db.refresh(bill)

    return {
        "message": "Split bill created successfully",
        "split_bill_id": bill.split_bill_id,
        "title": bill.title,
        "total_amount": str(bill.total_amount),
        "participants": [
            {
                "participant_id": p.participant_id,
                "name": p.name,
                "share_amount": str(p.share_amount),
                "amount_paid": str(p.amount_paid),
                "status": p.status
            }
            for p in participants
        ]
    }



@app.get("/split-bills")
def get_split_bills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bills = (
        db.query(SplitBill)
        .filter(SplitBill.user_id == current_user.user_id)
        .order_by(SplitBill.bill_date.desc())
        .all()
    )

    result = []

    for bill in bills:
        participants = (
            db.query(SplitParticipant)
            .filter(SplitParticipant.split_bill_id == bill.split_bill_id)
            .all()
        )

        result.append({
            "split_bill_id": bill.split_bill_id,
            "title": bill.title,
            "total_amount": str(bill.total_amount),
            "bill_date": str(bill.bill_date),
            "description": bill.description,
            "participants": [
                {
                    "participant_id": p.participant_id,
                    "name": p.name,
                    "share_amount": str(p.share_amount),
                    "amount_paid": str(p.amount_paid),
                    "status": p.status
                }
                for p in participants
            ]
        })

    return result



@app.post("/split-bills/{split_bill_id}/settlements")
def create_settlement(
    split_bill_id: int,
    data: SettlementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bill = (
        db.query(SplitBill)
        .filter(
            SplitBill.split_bill_id == split_bill_id,
            SplitBill.user_id == current_user.user_id
        )
        .first()
    )

    if bill is None:
        raise HTTPException(status_code=404, detail="Split bill not found")

    participant = (
        db.query(SplitParticipant)
        .filter(
            SplitParticipant.participant_id == data.participant_id,
            SplitParticipant.split_bill_id == split_bill_id
        )
        .first()
    )

    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")

    if data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Settlement amount must be greater than zero"
        )

    outstanding = (
        Decimal(str(participant.share_amount))
        - Decimal(str(participant.amount_paid or 0))
    )

    if data.amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail="Settlement exceeds the participant's outstanding balance"
        )

    try:
        settlement = Settlement(
            split_bill_id=split_bill_id,
            participant_id=participant.participant_id,
            amount=data.amount,
            settlement_date=data.settlement_date,
            status="PAID"
        )

        participant.amount_paid = (
            Decimal(str(participant.amount_paid or 0)) + data.amount
        )

        if participant.amount_paid >= participant.share_amount:
            participant.status = "PAID"
        elif participant.amount_paid > 0:
            participant.status = "PARTIAL"
        else:
            participant.status = "PENDING"

        db.add(settlement)
        db.commit()
        db.refresh(settlement)

        return {
            "message": "Settlement recorded successfully",
            "settlement_id": settlement.settlement_id,
            "participant_id": participant.participant_id,
            "amount_paid": str(participant.amount_paid),
            "outstanding_amount": str(
                Decimal(str(participant.share_amount))
                - Decimal(str(participant.amount_paid))
            ),
            "participant_status": participant.status,
            "settlement_status": settlement.status
        }

    except Exception:
        db.rollback()
        raise



@app.get("/budget-summary")
def get_budget_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.user_id
    ).all()

    result = []

    for budget in budgets:
        total_spent = db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.user_id == current_user.user_id,
            Expense.category == budget.category,
            Expense.expense_date >= budget.start_date,
            Expense.expense_date <= budget.end_date
        ).scalar()

        # Include the user's linked split-bill shares
        # when the budget category is "Split Bills".
        if budget.category == "Split Bills":
            split_spent = db.query(
                func.coalesce(
                    func.sum(SplitParticipant.share_amount), 0
                )
            ).join(
                SplitBill,
                SplitParticipant.split_bill_id == SplitBill.split_bill_id
            ).filter(
                SplitParticipant.user_id == current_user.user_id,
                SplitBill.bill_date >= budget.start_date,
                SplitBill.bill_date <= budget.end_date
            ).scalar()

            total_spent = (
                float(total_spent or 0)
                + float(split_spent or 0)
            )

        total_spent = float(total_spent or 0)
        budget_limit = float(budget.limit_amount or 0)

        remaining = budget_limit - total_spent

        utilization = (
            (total_spent / budget_limit) * 100
            if budget_limit > 0
            else 0
        )

        result.append({
            "budget_id": budget.budget_id,
            "category": budget.category,
            "budget_limit": round(budget_limit, 2),
            "spent": round(total_spent, 2),
            "remaining": round(remaining, 2),
            "utilization_percentage": round(utilization, 2),
            "period": budget.period,
            "start_date": budget.start_date,
            "end_date": budget.end_date
        })

    return result




@app.get("/budget-alerts")
def get_budget_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.user_id
    ).all()

    alerts = []

    for budget in budgets:
        total_spent = db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.user_id == current_user.user_id,
            Expense.category == budget.category,
            Expense.expense_date >= budget.start_date,
            Expense.expense_date <= budget.end_date
        ).scalar()

        spent = float(total_spent or 0)

        # Include linked split-bill shares in the Split Bills budget.
        if budget.category == "Split Bills":
            split_spent = db.query(
                func.coalesce(
                    func.sum(SplitParticipant.share_amount), 0
                )
            ).join(
                SplitBill,
                SplitParticipant.split_bill_id == SplitBill.split_bill_id
            ).filter(
                SplitParticipant.user_id == current_user.user_id,
                SplitBill.bill_date >= budget.start_date,
                SplitBill.bill_date <= budget.end_date
            ).scalar()

            spent += float(split_spent or 0)

        budget_limit = float(budget.limit_amount or 0)

        utilization = (
            (spent / budget_limit) * 100
            if budget_limit > 0
            else 0
        )

        if budget_limit > 0 and spent > budget_limit:
            status = "OVER_BUDGET"
            message = "You have exceeded your budget."
        elif budget_limit > 0 and utilization >= 90:
            status = "NEAR_LIMIT"
            message = "You have used at least 90% of your budget."
        else:
            status = "WITHIN_BUDGET"
            message = "Your spending is within the budget limit."

        alerts.append({
            "budget_id": budget.budget_id,
            "category": budget.category,
            "budget_limit": round(budget_limit, 2),
            "spent": round(spent, 2),
            "remaining": round(budget_limit - spent, 2),
            "utilization_percentage": round(utilization, 2),
            "status": status,
            "message": message
        })

    return alerts


@app.get("/users/lookup")
def lookup_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User.user_id, User.name)
        .filter(User.role == "USER")
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "user_id": user_id,
            "name": name
        }
        for user_id, name in users
    ]


@app.get("/expense-summary")
def get_expense_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    regular_summary = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total_amount")
    ).filter(
        Expense.user_id == current_user.user_id
    ).group_by(
        Expense.category
    ).all()

    totals = {}

    for category, total_amount in regular_summary:
        totals[category] = totals.get(category, Decimal("0.00")) + Decimal(
            str(total_amount or 0)
        )

    split_summary = db.query(
        func.sum(SplitParticipant.share_amount).label("total_amount")
    ).join(
        SplitBill,
        SplitParticipant.split_bill_id == SplitBill.split_bill_id
    ).filter(
        SplitParticipant.user_id == current_user.user_id
    ).scalar()

    if split_summary:
        totals["Split Bills"] = totals.get(
            "Split Bills", Decimal("0.00")
        ) + Decimal(str(split_summary))

    return [
        {
            "category": category,
            "total_amount": float(total_amount)
        }
        for category, total_amount in sorted(
            totals.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]



@app.get("/transactions")
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incomes = db.query(Income).filter(
        Income.user_id == current_user.user_id
    ).all()

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    ).all()

    transactions = []

    for income in incomes:
        transactions.append({
            "type": "INCOME",
            "id": income.income_id,
            "amount": income.amount,
            "category": income.source,
            "date": income.income_date,
            "description": income.description,
            "source": income.source_type
        })

    for expense in expenses:
        transactions.append({
            "type": "EXPENSE",
            "id": expense.expense_id,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.expense_date,
            "description": expense.description,
            "source": expense.source
        })

    transactions.sort(
        key=lambda x: x["date"],
        reverse=True
    )

    return transactions


@app.get("/developer/stats")
def developer_stats(
    current_user: User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()

    total_income = db.query(Income).count()

    total_expenses = db.query(Expense).count()

    total_budgets = db.query(Budget).count()

    return {
        "total_users": total_users,
        "total_income_records": total_income,
        "total_expense_records": total_expenses,
        "total_budgets": total_budgets
    }


@app.get("/developer/audit-logs")
def get_audit_logs(
    current_user: User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(
        AuditLog.timestamp.desc()
    ).all()

    return logs



@app.post("/cards")
def add_card(
    card_data: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate card metadata
    if card_data.last_four_digits is not None:
        if (
            len(card_data.last_four_digits) != 4
            or not card_data.last_four_digits.isdigit()
        ):
            raise HTTPException(
                status_code=400,
                detail="Last four digits must contain exactly 4 numbers"
            )

    if card_data.expiry_month is not None:
        if not 1 <= card_data.expiry_month <= 12:
            raise HTTPException(
                status_code=400,
                detail="Expiry month must be between 1 and 12"
            )

    if card_data.expiry_year is not None:
        if card_data.expiry_year < 2000:
            raise HTTPException(
                status_code=400,
                detail="Expiry year is invalid"
            )

    card = Card(
        user_id=current_user.user_id,
        card_name=card_data.card_name,
        issuer=card_data.issuer,
        card_type=card_data.card_type,
        network=card_data.network,
        last_four_digits=card_data.last_four_digits,
        expiry_month=card_data.expiry_month,
        expiry_year=card_data.expiry_year
    )

    db.add(card)
    db.commit()
    db.refresh(card)

    return {
        "message": "Card added successfully",
        "card_id": card.card_id,
        "card_name": card.card_name,
        "issuer": card.issuer,
        "card_type": card.card_type,
        "network": card.network,
        "last_four_digits": card.last_four_digits,
        "expiry_month": card.expiry_month,
        "expiry_year": card.expiry_year
    }


@app.get("/cards")
def get_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cards = db.query(Card).filter(
        Card.user_id == current_user.user_id
    ).order_by(
        Card.card_id.desc()
    ).all()

    return [
        {
            "card_id": card.card_id,
            "card_name": card.card_name,
            "issuer": card.issuer,
            "card_type": card.card_type,
            "network": card.network,
            "last_four_digits": card.last_four_digits,
            "expiry_month": card.expiry_month,
            "expiry_year": card.expiry_year,
            "created_at": card.created_at
        }
        for card in cards
    ]



@app.post("/cards/{card_id}/benefits")
def add_card_benefit(
    card_id: int,
    benefit_data: CardBenefitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Card).filter(
        Card.card_id == card_id,
        Card.user_id == current_user.user_id
    ).first()

    if not card:
        raise HTTPException(
            status_code=404,
            detail="Card not found"
        )

    benefit = CardBenefit(
        card_id=card_id,
        category=benefit_data.category,
        benefit_type=benefit_data.benefit_type,
        benefit_value=benefit_data.benefit_value,
        conditions=benefit_data.conditions
    )

    db.add(benefit)
    db.commit()
    db.refresh(benefit)

    return {
        "message": "Card benefit added successfully",
        "benefit_id": benefit.benefit_id,
        "card_id": benefit.card_id,
        "category": benefit.category,
        "benefit_type": benefit.benefit_type,
        "benefit_value": float(benefit.benefit_value),
        "conditions": benefit.conditions
    }


@app.get("/cards/{card_id}/benefits")
def get_card_benefits(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Card).filter(
        Card.card_id == card_id,
        Card.user_id == current_user.user_id
    ).first()

    if not card:
        raise HTTPException(
            status_code=404,
            detail="Card not found"
        )

    benefits = db.query(CardBenefit).filter(
        CardBenefit.card_id == card_id
    ).order_by(
        CardBenefit.benefit_id.desc()
    ).all()

    return [
        {
            "benefit_id": benefit.benefit_id,
            "card_id": benefit.card_id,
            "category": benefit.category,
            "benefit_type": benefit.benefit_type,
            "benefit_value": float(benefit.benefit_value),
            "conditions": benefit.conditions
        }
        for benefit in benefits
    ]
