from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    Text,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    embedding_hash = Column(Text, nullable=False)  # Embedding criptografado
    faiss_id = Column(Integer, nullable=False)  # ID no índice FAISS
    passage_count = Column(Integer, default=0)  # Contador de passagens
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # None se não reconhecido
    confidence = Column(Float, nullable=True)  # Confiança do reconhecimento
    access_granted = Column(Boolean, nullable=False)
    liveness_passed = Column(Boolean, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    error_message = Column(String(500), nullable=True)


# Criar tabelas
def create_tables():
    Base.metadata.create_all(bind=engine)


# Dependency para obter sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
