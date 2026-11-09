import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def database_path() -> Path:
    path = Path(os.getenv("DATABASE_PATH", "data/stock.db"))
    return path if path.is_absolute() else BACKEND_DIR / path


@dataclass(frozen=True)
class Settings:
    database_path: Path = field(default_factory=database_path)
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
            if origin.strip()
        )
    )
    busy_timeout_ms: int = 5000
