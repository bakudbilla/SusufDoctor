from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class RadiologistRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    license_number: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if len(v) > 72:
            raise ValueError('Password must be less than 72 characters')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()

class RadiologistLogin(BaseModel):
    email: EmailStr
    password: str
    

class AdminCreate(BaseModel):
    """Model for admin account creation (simpler validation)"""
    email: EmailStr
    password: str
    full_name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters')
        return v.strip()