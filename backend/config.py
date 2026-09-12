"""
WasteLoop Configuration Module
Loads settings and database URI from environment variables (PostgreSQL / MySQL).
"""
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load .env file from the current directory
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'), override=True)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'wasteloop_dev_fallback_secret_2026')

    # PostgreSQL configuration settings
    PG_HOST = os.getenv('PG_HOST') or os.getenv('POSTGRES_HOST') or 'localhost'
    PG_PORT = os.getenv('PG_PORT') or os.getenv('POSTGRES_PORT') or '5432'
    PG_USER = os.getenv('PG_USER') or os.getenv('POSTGRES_USER') or 'postgres'
    PG_PASSWORD = os.getenv('PG_PASSWORD') or os.getenv('POSTGRES_PASSWORD') or ''
    PG_DATABASE = os.getenv('PG_DATABASE') or os.getenv('POSTGRES_DATABASE') or 'wasteloop'

    # MySQL fallback settings
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'wasteloop')

    # Determine database URI
    raw_db_url = os.getenv('DATABASE_URL')
    if raw_db_url:
        if raw_db_url.startswith('postgres://'):
            raw_db_url = raw_db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif raw_db_url.startswith('postgresql://'):
            raw_db_url = raw_db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        db_type = os.getenv('DB_TYPE', 'postgresql').lower()
        if db_type == 'postgresql' or os.getenv('PG_HOST') or os.getenv('POSTGRES_HOST') or os.getenv('PG_DATABASE'):
            escaped_pass = quote_plus(PG_PASSWORD) if PG_PASSWORD else ''
            if escaped_pass:
                SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{PG_USER}:{escaped_pass}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"
            else:
                SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{PG_USER}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"
        else:
            escaped_my_pass = quote_plus(MYSQL_PASSWORD) if MYSQL_PASSWORD else ''
            if escaped_my_pass:
                SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{escaped_my_pass}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
            else:
                SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
    }

    # Session cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # Set True in production with HTTPS
