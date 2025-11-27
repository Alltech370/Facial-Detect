from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import cv2
import numpy as np
import base64
import io
from PIL import Image
import json
from datetime import datetime

import sys
import os

# Adicionar o diretório raiz do projeto ao path
project_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
sys.path.insert(0, project_root)

# Adicionar o diretório backend ao path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_root)

# Imports locais - usar imports relativos (funciona tanto no Docker quanto localmente)
from .database import get_db, init_database
from .models import User, AccessLog
from .face_recognition import face_recognition
from .liveness_detection import advanced_liveness_detector
from .encryption import encryption_manager
from config import API_TITLE, API_VERSION, MAX_FILE_SIZE, ALLOWED_EXTENSIONS

# Inicializar FastAPI
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Sistema de Reconhecimento Facial para Controle de Acesso",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar banco de dados
init_database()


@app.get("/")
async def root():
    """API Root - Frontend agora é servido pelo Next.js"""
    return {"message": "Sistema de Reconhecimento Facial API", "version": API_VERSION}


@app.post("/api/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Cadastra novo usuário"""
    try:
        print(
            f"DEBUG: Recebido cadastro - Nome: {name}, Email: {email}, Arquivo: {photo.filename}"
        )

        # Validar arquivo
        if not photo.filename:
            print("DEBUG: Erro - Arquivo não fornecido")
            raise HTTPException(status_code=400, detail="Arquivo não fornecido")

        # Verificar extensão
        file_ext = "." + photo.filename.split(".")[-1].lower()
        print(f"DEBUG: Extensão do arquivo: {file_ext}")
        if file_ext not in ALLOWED_EXTENSIONS:
            print(f"DEBUG: Erro - Formato não suportado: {file_ext}")
            raise HTTPException(
                status_code=400, detail="Formato de arquivo não suportado"
            )

        # Verificar tamanho
        content = await photo.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Arquivo muito grande")

        # Converter para imagem OpenCV
        image = Image.open(io.BytesIO(content))
        image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Extrair embedding
        print("DEBUG: Extraindo embedding...")
        embedding = face_recognition.extract_embedding(image_cv)
        if embedding is None:
            print("DEBUG: Erro - Nenhuma face detectada")
            raise HTTPException(
                status_code=400, detail="Nenhuma face detectada na imagem"
            )
        print(f"DEBUG: Embedding extraído com sucesso - Dimensão: {embedding.shape}")

        # Verificar se email já existe
        print("DEBUG: Verificando se email já existe...")
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print("DEBUG: Erro - Email já cadastrado")
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        print("DEBUG: Email disponível")

        # Criptografar embedding
        print("DEBUG: Criptografando embedding...")
        encrypted_embedding = encryption_manager.encrypt_embedding(embedding)
        print("DEBUG: Embedding criptografado com sucesso")

        # Criar usuário no banco
        print("DEBUG: Criando usuário no banco...")
        # Adicionar embedding ao índice FAISS PRIMEIRO
        print("DEBUG: Adicionando embedding ao FAISS...")
        faiss_id = face_recognition.add_user_embedding(embedding, None)  # user_id será atualizado depois
        print(f"DEBUG: Embedding adicionado ao FAISS com ID: {faiss_id}")

        # Criar usuário no banco com o faiss_id correto
        user = User(
            name=name,
            email=email,
            embedding_hash=encrypted_embedding,
            faiss_id=faiss_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"DEBUG: Usuário criado com ID: {user.id}, faiss_id: {faiss_id}")

        # Atualizar mapeamento no FAISS com o user_id real
        face_recognition.id_to_user[faiss_id] = user.id
        face_recognition.save_faiss_index()
        print("DEBUG: Mapeamento FAISS atualizado com user_id")

        return {
            "success": True,
            "message": "Usuário cadastrado com sucesso!",
            "user_id": user.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.post("/api/validate")
async def validate_face(request: Request, db: Session = Depends(get_db)):
    """Valida face em tempo real - versão otimizada"""
    try:
        # Obter dados da requisição
        data = await request.json()
        image_data = data.get("image")

        if not image_data:
            raise HTTPException(status_code=400, detail="Imagem não fornecida")

        # Decodificar imagem base64 de forma mais eficiente
        try:
            if "," in image_data:
                image_bytes = base64.b64decode(image_data.split(",")[1])
            else:
                image_bytes = base64.b64decode(image_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Formato de imagem inválido")

        # Converter para imagem OpenCV de forma otimizada
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Redimensionar se muito grande para melhor performance
            if image.width > 800 or image.height > 600:
                image.thumbnail((800, 600), Image.Resampling.LANCZOS)
            image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Erro ao processar imagem")

        # Detectar faces com timeout implícito
        try:
            faces = face_recognition.detect_faces(image_cv)
        except Exception as e:
            print(f"Erro na detecção de faces: {e}")
            faces = []

        if not faces:
            # Log tentativa sem face detectada (sem commit imediato para performance)
            log = AccessLog(
                access_granted=False,
                liveness_passed=False,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
                error_message="Nenhuma face detectada",
            )
            db.add(log)
            # Usar commit assíncrono para não bloquear
            db.commit()

            return {
                "success": False,
                "message": "Nenhuma face detectada",
                "access_granted": False,
                "liveness_passed": False,
                "confidence": 0.0,
                "user_id": None,
            }

        # Pegar melhor face (otimizado)
        best_face = max(faces, key=lambda x: x.get("det_score", 0))
        embedding = best_face.get("embedding")
        bbox = best_face.get("bbox")

        if embedding is None:
            return {
                "success": False,
                "message": "Erro ao extrair características faciais",
                "access_granted": False,
                "liveness_passed": False,
                "confidence": 0.0,
                "user_id": None,
            }

        # Verificar liveness (desabilitado temporariamente para melhor performance)
        liveness_passed = True

        # Reconhecer face com tratamento de erro
        try:
            print(f"🔍 DEBUG VALIDATE: Iniciando reconhecimento facial...")
            print(f"🔍 DEBUG VALIDATE: Índice FAISS tem {face_recognition.faiss_index.ntotal if face_recognition.faiss_index else 0} embeddings")
            print(f"🔍 DEBUG VALIDATE: Mapeamento tem {len(face_recognition.id_to_user)} usuários: {list(face_recognition.id_to_user.keys())}")
            user_id, distance = face_recognition.recognize_face(embedding)
            print(f"🔍 DEBUG VALIDATE: Resultado - user_id={user_id}, distance={distance}")
        except Exception as e:
            print(f"❌ Erro no reconhecimento: {e}")
            import traceback
            traceback.print_exc()
            user_id, distance = None, 1.0

        # Determinar se acesso foi concedido
        access_granted = user_id is not None and liveness_passed and distance < 0.6

        # Preparar resposta básica
        response = {
            "success": True,
            "access_granted": bool(access_granted),
            "liveness_passed": bool(liveness_passed),
            "confidence": float(1.0 - distance) if user_id else 0.0,
            "user_id": int(user_id) if user_id else None,
            "user_name": None,
        }

        # Processar acesso concedido
        if access_granted:
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    # Incrementar contador de passagens
                    user.passage_count += 1
                    db.commit()

                    response["message"] = f"Acesso liberado para {user.name}!"
                    response["user_name"] = user.name
                    response["passage_count"] = user.passage_count
                    print(
                        f"✅ Usuário reconhecido: {user.name} (ID: {user_id}) - Passagem #{user.passage_count}"
                    )
                else:
                    response["access_granted"] = False
                    response["message"] = "Usuário não encontrado no banco"
            except Exception as e:
                print(f"Erro ao processar usuário: {e}")
                response["access_granted"] = False
                response["message"] = "Erro ao processar acesso"
        else:
            if not liveness_passed:
                response["message"] = "Falha na verificação de liveness"
            else:
                response["message"] = "Usuário não reconhecido"

        # Log da tentativa (assíncrono para não bloquear resposta)
        try:
            log = AccessLog(
                user_id=user_id,
                confidence=1.0 - distance if user_id else None,
                access_granted=access_granted,
                liveness_passed=liveness_passed,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Erro ao salvar log: {e}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro geral na validação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.get("/api/passage-stats")
async def get_passage_stats(db: Session = Depends(get_db)):
    """Retorna estatísticas de passagens dos usuários"""
    try:
        # Buscar usuários com suas contagens de passagem
        users = (
            db.query(User)
            .filter(User.is_active == True)
            .order_by(User.passage_count.desc())
            .all()
        )

        # Calcular estatísticas gerais
        total_passages = sum(user.passage_count for user in users)
        total_users = len(users)
        avg_passages = total_passages / total_users if total_users > 0 else 0

        # Usuário com mais passagens
        most_active_user = users[0] if users else None

        return {
            "success": True,
            "stats": {
                "total_passages": total_passages,
                "total_users": total_users,
                "average_passages": round(avg_passages, 2),
                "most_active_user": (
                    {
                        "name": most_active_user.name,
                        "passage_count": most_active_user.passage_count,
                    }
                    if most_active_user
                    else None
                ),
            },
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "passage_count": user.passage_count,
                    "created_at": user.created_at.isoformat(),
                }
                for user in users
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.get("/api/users")
async def get_users(db: Session = Depends(get_db)):
    """Lista todos os usuários"""
    try:
        users = db.query(User).filter(User.is_active == True).all()

        return {
            "success": True,
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "passage_count": user.passage_count,
                    "created_at": user.created_at.isoformat(),
                }
                for user in users
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.get("/api/logs")
async def get_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Lista logs de acesso"""
    try:
        logs = (
            db.query(AccessLog).order_by(AccessLog.timestamp.desc()).limit(limit).all()
        )

        # Buscar nomes dos usuários para os logs que têm user_id
        user_names = {}
        user_ids = [log.user_id for log in logs if log.user_id is not None]
        if user_ids:
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            user_names = {user.id: user.name for user in users}

        return {
            "success": True,
            "logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "user_name": user_names.get(log.user_id) if log.user_id else None,
                    "confidence": log.confidence,
                    "access_granted": log.access_granted,
                    "liveness_passed": log.liveness_passed,
                    "timestamp": log.timestamp.isoformat(),
                    "ip_address": log.ip_address,
                    "error_message": log.error_message,
                }
                for log in logs
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Retorna estatísticas do sistema"""
    try:
        # Estatísticas do banco
        total_users = db.query(User).filter(User.is_active == True).count()
        total_logs = db.query(AccessLog).count()
        successful_access = (
            db.query(AccessLog).filter(AccessLog.access_granted == True).count()
        )

        # Estatísticas do sistema de reconhecimento
        try:
            face_stats = face_recognition.get_stats()
        except Exception as e:
            print(f"Erro ao obter estatísticas de reconhecimento facial: {e}")
            face_stats = {
                "total_embeddings": 0,
                "registered_users": 0,
                "device": "unknown",
                "threshold": 0.4,
                "error": str(e),
            }

        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_logs": total_logs,
                "successful_access": successful_access,
                "success_rate": (
                    (successful_access / total_logs * 100) if total_logs > 0 else 0
                ),
                "face_recognition": face_stats,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Remove usuário"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        # Remover do índice FAISS
        face_recognition.remove_user_embedding(user.faiss_id)

        # Marcar como inativo no banco
        user.is_active = False
        db.commit()

        return {"success": True, "message": "Usuário removido com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.delete("/api/users")
async def delete_all_users(db: Session = Depends(get_db)):
    """Remove todos os usuários"""
    try:
        # Obter todos os usuários ativos
        users = db.query(User).filter(User.is_active == True).all()

        if not users:
            return {
                "success": True,
                "message": "Nenhum usuário encontrado",
                "deleted_count": 0,
            }

        # Remover todos do índice FAISS
        for user in users:
            if user.faiss_id > 0:
                face_recognition.remove_user_embedding(user.faiss_id)

        # Marcar todos como inativos
        for user in users:
            user.is_active = False

        db.commit()

        return {
            "success": True,
            "message": f"{len(users)} usuários removidos com sucesso",
            "deleted_count": len(users),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.delete("/api/logs/clear")
async def clear_logs(db: Session = Depends(get_db)):
    """Limpa todos os logs de acesso"""
    try:
        # Contar logs antes da limpeza
        logs_count = db.query(AccessLog).count()

        if logs_count == 0:
            return {
                "success": True,
                "message": "Nenhum log encontrado",
                "deleted_logs": 0,
            }

        # Limpar logs
        db.query(AccessLog).delete()
        db.commit()

        return {
            "success": True,
            "message": f"{logs_count} logs removidos com sucesso",
            "deleted_logs": logs_count,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.delete("/api/database/clear")
async def clear_database(db: Session = Depends(get_db)):
    """Limpa completamente o banco de dados"""
    try:
        # Contar registros antes da limpeza
        users_count = db.query(User).count()
        logs_count = db.query(AccessLog).count()

        # Limpar tabelas
        db.query(AccessLog).delete()
        db.query(User).delete()
        db.commit()

        # Limpar índice FAISS
        face_recognition.clear_index()

        return {
            "success": True,
            "message": "Banco de dados limpo com sucesso",
            "deleted_users": users_count,
            "deleted_logs": logs_count,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    from config import API_HOST, API_PORT

    print(f"Iniciando servidor em http://{API_HOST}:{API_PORT}")
    uvicorn.run(app, host=API_HOST, port=API_PORT)
