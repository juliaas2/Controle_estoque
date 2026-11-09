import logging
import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from app.config import Settings
from app.database import build_engine, initialize_database
from app.exceptions import BusinessError
from app.inventory.router import router as inventory_router
from app.products.router import router as products_router

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        engine = build_engine(settings.database_path, settings.busy_timeout_ms)
        application.state.engine = engine
        initialize_database(engine)
        yield
        engine.dispose()

    application = FastAPI(
        title="Controle de Estoque",
        version="1.0.0",
        description="Produtos, entradas, saídas, reservas e bloqueios com consistência transacional.",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @application.exception_handler(BusinessError)
    async def business_error(_request: Request, error: BusinessError):
        return JSONResponse(
            status_code=error.status_code,
            content={
                "error": {"code": error.code, "message": error.message},
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, error: RequestValidationError):
        details = [
            {"field": ".".join(str(part) for part in item["loc"]), "message": item["msg"]}
            for item in error.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Confira os campos enviados.",
                    "details": details,
                }
            },
        )

    @application.exception_handler(OperationalError)
    async def database_error(_request: Request, error: OperationalError):
        code = getattr(error.orig, "sqlite_errorcode", 0) & 0xFF
        if code in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED):
            return JSONResponse(
                status_code=503,
                headers={"Retry-After": "1"},
                content={
                    "error": {
                        "code": "database_busy",
                        "message": "Banco ocupado. Aguarde e tente novamente.",
                    }
                },
            )
        logger.error("Erro de banco de dados", exc_info=error)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "database_error",
                    "message": "Não foi possível concluir a operação.",
                }
            },
        )

    @application.exception_handler(IntegrityError)
    async def integrity_error(_request: Request, error: IntegrityError):
        logger.error("Violação de integridade", exc_info=error)
        return JSONResponse(
            status_code=409,
            content={
                "error": {
                    "code": "integrity_error",
                    "message": "A operação viola uma restrição dos dados.",
                }
            },
        )

    @application.get("/api/health", tags=["Saúde"])
    def health():
        return {"status": "ok"}

    application.include_router(products_router, prefix="/api")
    application.include_router(inventory_router, prefix="/api")
    return application


app = create_app()
