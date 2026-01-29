"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
import os

# IMPORTANT:
# You already created tables in Supabase. Also, if DB/DNS is temporarily down,
# calling create_all() at import-time will crash the whole API.
#
# If you ever want to auto-create tables locally, you can opt-in via:
#   AUTO_CREATE_TABLES=true
if os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true":
    Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="AI Counsellor API",
    description="Backend API for AI Counsellor - Study Abroad Guidance Platform",
    version="1.0.0"
)

# CORS middleware (allow frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Counsellor API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Database health check"""
    try:
        # Test database connection
        from .database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


# Import and include routers
from .auth import router as auth_router
from .onboarding import router as onboarding_router
from .dashboard import router as dashboard_router
from .universities import router as universities_router
from .tasks import router as tasks_router
from .ai_counsellor import router as ai_counsellor_router

# Include routers with proper prefixes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(onboarding_router, prefix="/api", tags=["Onboarding"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(universities_router, prefix="/api", tags=["Universities"])
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
app.include_router(ai_counsellor_router, prefix="/api", tags=["AI Counsellor"])


# Optional: Add a route to list all available endpoints
@app.get("/api/routes")
async def list_routes():
    """List all available API routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return {"routes": routes}