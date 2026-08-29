from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.consultations import router as consultations_router
from app.api.v1.documents import router as documents_router
from app.api.v1.prescriptions import router as prescriptions_router
from app.api.v1.templates import router as templates_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router
from app.api.v1.search import router as search_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(consultations_router)
api_router.include_router(documents_router)
api_router.include_router(prescriptions_router)
api_router.include_router(templates_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)
api_router.include_router(search_router)
