from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from database import engine, Base
import models

from routes.auth import router as auth_router

from routes.analytics_routes import router as analytics_router


app = FastAPI(
    title="Job Market Analyst API",
    description="Authentication and Job Market Analytics",
    version="1.0.0"
)

# Allow the Vite dev server (React frontend) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register authentication routes
app.include_router(auth_router)

# Register analytics routes
app.include_router(analytics_router)


@app.get("/")
def home():

    return {
        "message": "Job Market Analyst API is running!"
    }
