from fastapi import FastAPI
from app.api.v1.router import api_router
from app.config.database import Base, engine

app = FastAPI(title="Verification Service")

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    # create tables (for demo/simple setups). In production use migrations (Alembic)
    Base.metadata.create_all(bind=engine)
