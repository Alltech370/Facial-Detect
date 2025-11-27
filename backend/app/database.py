from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
from config import DATABASE_URL
from app.models import Base, create_tables

# Criar engine do banco de dados PostgreSQL
# Pool de conexões otimizado para produção
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verifica conexões antes de usar
    echo=False  # Setar True para debug SQL
)

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_database():
    """Inicializa o banco de dados criando todas as tabelas"""
    try:
        # Criar todas as tabelas
        create_tables()
        
        # Verificar se a coluna passage_count existe (migração)
        from sqlalchemy import text, inspect
        
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        if "passage_count" not in columns:
            print("🔄 Adicionando coluna passage_count à tabela users...")
            with engine.connect() as conn:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN passage_count INTEGER DEFAULT 0")
                )
                conn.commit()
            print("✅ Coluna passage_count adicionada com sucesso!")

        print("✅ Banco de dados PostgreSQL inicializado com sucesso!")
        return True
    except OperationalError as e:
        print(f"❌ Erro de conexão com o banco de dados: {e}")
        print("💡 Verifique se a variável DATABASE_URL está configurada corretamente.")
        return False
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        return False


def get_db():
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Inicializar banco automaticamente
if __name__ == "__main__":
    init_database()
