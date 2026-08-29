import pytest
from app.core.deps import RoleChecker
from fastapi import HTTPException

def test_role_checker_doctor_allowed():
    checker = RoleChecker(["DOCTOR"])
    class MockUser:
        role = "DOCTOR"
    user = MockUser()
    assert checker(user) == user

def test_role_checker_admin_rejected_for_doctor_only():
    checker = RoleChecker(["DOCTOR"])
    class MockUser:
        role = "ADMIN"
    user = MockUser()
    with pytest.raises(HTTPException) as exc_info:
        checker(user)
    assert exc_info.value.status_code == 403

def test_role_checker_patient_rejected():
    checker = RoleChecker(["DOCTOR", "ADMIN"])
    class MockUser:
        role = "PATIENT"
    user = MockUser()
    with pytest.raises(HTTPException) as exc_info:
        checker(user)
    assert exc_info.value.status_code == 403
