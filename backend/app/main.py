from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_user
from app.routers import auth_routes, candidate_routes, recruiter_routes, admin_routes
from app.routers import proctoring_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — camera threads start lazily on first client connection
    yield
    # Shutdown — stop camera threads gracefully
    proctoring_routes.stop_camera()


app = FastAPI(title="Beyond-Hiring API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_routes.router)
app.include_router(candidate_routes.router)
app.include_router(recruiter_routes.router)
app.include_router(admin_routes.router)
app.include_router(proctoring_routes.router)


@app.get("/")
async def root():
    return {"message": "Beyond-Hiring API", "version": "1.0.0"}


@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)):
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "resume_url": user.get("resume_url"),
        "experience_years": user.get("experience_years", 0),
        "skills": user.get("skills", []),
    }
