
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
