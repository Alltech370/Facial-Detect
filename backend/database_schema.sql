-- Schema do banco de dados PostgreSQL para Sistema de Reconhecimento Facial
-- Execute este script no SQL Editor do Neon para criar as tabelas

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    embedding_hash TEXT NOT NULL,
    faiss_id INTEGER NOT NULL,
    passage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Criar índice no email para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Criar índice no faiss_id
CREATE INDEX IF NOT EXISTS idx_users_faiss_id ON users(faiss_id);

-- Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    confidence FLOAT,
    access_granted BOOLEAN NOT NULL,
    liveness_passed BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_granted ON access_logs(access_granted);

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela de usuários cadastrados no sistema';
COMMENT ON TABLE access_logs IS 'Logs de tentativas de acesso ao sistema';

COMMENT ON COLUMN users.embedding_hash IS 'Embedding facial criptografado';
COMMENT ON COLUMN users.faiss_id IS 'ID correspondente no índice FAISS';
COMMENT ON COLUMN users.passage_count IS 'Contador de passagens bem-sucedidas';

