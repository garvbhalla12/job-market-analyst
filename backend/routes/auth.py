from dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from datetime import datetime, timezone
from database import get_db
from models import User, RefreshToken
from schemas import UserCreate, UserResponse, UserLogin, RefreshTokenRequest
from security import (hash_password, verify_password, create_access_token, create_refresh_token, hash_refresh_token, get_refresh_token_expiry)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):

    # Check whether email already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password
    )

    # Save user
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user




@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    # Generate tokens
    access_token = create_access_token({
        "sub": str(user.id)
    })

    refresh_token = create_refresh_token()

    # Store only the hashed refresh token
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=get_refresh_token_expiry()
    )

    db.add(token_record)
    db.commit()

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }




@router.post("/refresh")
def refresh_access_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    # 1. Hash the incoming refresh token
    incoming_hash = hash_refresh_token(token_data.refresh_token)

    # 2. Find the token in database
    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == incoming_hash
    ).first()

    # 3. Validate token existence and revocation
    if stored_token is None or stored_token.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or revoked refresh token"
        )

    # 4. Check expiration (stored timestamps are naive UTC)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if stored_token.expires_at <= now:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has expired"
        )

    # 5. Find the associated user
    user = db.query(User).filter(
        User.id == stored_token.user_id
    ).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User is unavailable"
        )

    # 6. Revoke the old refresh token
    stored_token.revoked_at = now

    # 7. Generate a new token pair
    new_access_token = create_access_token({
        "sub": str(user.id)
    })

    new_refresh_token = create_refresh_token()

    # 8. Store the new refresh token hash
    new_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=get_refresh_token_expiry()
    )

    db.add(new_token_record)
    db.commit()

    return {
        "message": "Token refreshed successfully",
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }




@router.post("/logout")
def logout(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    # Hash the incoming refresh token
    incoming_hash = hash_refresh_token(token_data.refresh_token)

    # Find the token
    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == incoming_hash
    ).first()

    # Revoke it if it exists and is not already revoked
    if stored_token and stored_token.revoked_at is None:
        stored_token.revoked_at = (
            datetime.now(timezone.utc).replace(tzinfo=None)
        )
        db.commit()

    return {
        "message": "Logout successful"
    }
