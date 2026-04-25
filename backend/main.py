# SQLite override for ChromaDB on cloud providers like Render
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

import os
import shutil
import uuid
import traceback
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

# Disable Chroma telemetry
os.environ["CHROMA_TELEMETRY"] = "False"

load_dotenv()

app = FastAPI(title="Note Mind API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
UPLOAD_DIR = "./uploads"
CHROMA_DIR = "./chroma_db"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

# Auth Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key_change_me_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

USERS_FILE = "users.json"

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)

# In-memory cache for active db objects
_db_cache = {}

class ChatRequest(BaseModel):
    session_id: str
    query: str
    folder_id: Optional[str] = "default"

class ToolRequest(BaseModel):
    session_id: str
    content: Optional[str] = ""

# Lazy-load embeddings to prevent Render timeout on startup
_embeddings_cache = None

def get_embeddings():
    global _embeddings_cache
    if _embeddings_cache is None:
        _embeddings_cache = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_cache

def get_db(session_id: str):
    sid = session_id.strip()
    if sid in _db_cache:
        return _db_cache[sid]
    
    session_path = os.path.join(CHROMA_DIR, sid)
    _db_cache[sid] = Chroma(
        persist_directory=session_path,
        embedding_function=get_embeddings(),
        collection_name="notes"
    )
    return _db_cache[sid]

class UserRegister(BaseModel):
    username: str
    password: str

@app.post("/auth/register")
async def register(user: UserRegister):
    users = load_users()
    if user.username in users:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = pwd_context.hash(user.password)
    users[user.username] = {
        "username": user.username,
        "password": hashed_password
    }
    save_users(users)
    return {"message": "User registered successfully"}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = load_users()
    user_dict = users.get(form_data.username)
    
    if not user_dict or not pwd_context.verify(form_data.password, user_dict["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + access_token_expires
    to_encode = {"sub": form_data.username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer", "username": form_data.username}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    session_id: str = Form(...),
    folder_id: str = Form("default")
):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if file.filename.lower().endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file.filename.lower().endswith(".txt"):
            loader = TextLoader(file_path)
        elif file.filename.lower().endswith(".md"):
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            return {"error": "Unsupported file type"}
            
        docs = loader.load()
        for doc in docs:
            doc.metadata["filename"] = file.filename
            doc.metadata["folder_id"] = folder_id
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        if not splits:
            return {"error": "No readable text found"}
            
        db = get_db(session_id)
        ids = [f"{file.filename}_{i}_{uuid.uuid4()}" for i in range(len(splits))]
        db.add_documents(splits, ids=ids)
        
        return {"filename": file.filename, "status": "indexed"}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/chat")
async def chat(request: ChatRequest):
    db = get_db(request.session_id)
    if not db or db._collection.count() == 0:
        raise HTTPException(status_code=400, detail="No documents found")
    
    llm = ChatOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", model_name="llama-3.3-70b-versatile")
    
    template = "Context: {context}\nQuestion: {question}\nAnswer:"
    prompt = PromptTemplate(template=template, input_variables=["context", "question"])
    
    search_kwargs = {"k": 4}
    if request.folder_id and request.folder_id != "default":
        search_kwargs["filter"] = {"folder_id": request.folder_id}
        
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm, chain_type="stuff",
        retriever=db.as_retriever(search_kwargs=search_kwargs),
        chain_type_kwargs={"prompt": prompt}
    )
    
    response = qa_chain.invoke({"query": request.query})
    return {"answer": response["result"]}

@app.post("/tools/evaluate-answer")
async def evaluate_answer(request: dict):
    llm = ChatOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", model_name="llama-3.3-70b-versatile")
    prompt = PromptTemplate.from_template("Question: {question}\nAnswer: {answer}\nEvaluate the answer. Return JSON: {{ 'evaluation': 'good'|'needs-work', 'feedback': '...' }}")
    chain = prompt | llm
    response = chain.invoke({"question": request.get("question"), "answer": request.get("answer")})
    try:
        return json.loads(response.content.replace("```json", "").replace("```", "").strip())
    except:
        return {"evaluation": "needs-work", "feedback": "Please explain more."}

@app.post("/tools/teach-me")
async def teach_me(request: ToolRequest):
    db = get_db(request.session_id)
    if not db or db._collection.count() == 0:
        return {"question": "Please upload some documents first!", "importance_score": 0}
            
    llm = ChatOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", model_name="llama-3.3-70b-versatile")
    docs = db.similarity_search("core concepts", k=6)
    context = "\n".join([doc.page_content for doc in docs])
    
    prompt = PromptTemplate.from_template("Context: {context}\nAsk a challenging question and give importance (0-100). Return JSON: {{ 'question': '...', 'importance_score': 75 }}")
    chain = prompt | llm
    response = chain.invoke({"context": context})
    try:
        return json.loads(response.content.replace("```json", "").replace("```", "").strip())
    except:
        return {"question": "What is the primary theme?", "importance_score": 50}

@app.post("/tools/blind-spot")
async def blind_spot(request: ToolRequest):
    db = get_db(request.session_id)
    if not db or db._collection.count() == 0:
        return {"results": []}

    llm = ChatOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", model_name="llama-3.3-70b-versatile")
    docs = db.similarity_search("arguments and logic", k=8)
    content = "\n".join([doc.page_content for doc in docs])
    
    prompt = PromptTemplate.from_template("Text: {content}\nIdentify 3 logical gaps. Return JSON array: [{{ 'type': '...', 'issue': '...', 'explanation': '...', 'suggestion': '...' }}]")
    chain = prompt | llm
    response = chain.invoke({"content": content})
    try:
        return {"results": json.loads(response.content.replace("```json", "").replace("```", "").strip())}
    except:
        return {"results": []}

@app.post("/tools/time-capsule")
async def time_capsule(request: ToolRequest):
    try:
        db = get_db(request.session_id)
        if not db or db._collection.count() == 0:
            return {"status": "No data"}
        
        llm = ChatOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", model_name="llama-3.3-70b-versatile")
        
        # Get documents - use a more general search or just peek at the collection
        docs = db.similarity_search("knowledge and concepts", k=10)
        if not docs:
            # Try a fallback to get anything
            docs = db._collection.peek(limit=5)
            content = "\n".join([doc['document'] for doc in docs]) if docs and 'document' in docs else ""
        else:
            content = "\n".join([doc.page_content[:1000] for doc in docs])
            
        print(f"Time Capsule Content Length: {len(content)}")
        
        if not content.strip():
            return {"status": "No content found in docs"}

        prompt = PromptTemplate.from_template("""
            Based on the following content, generate a 'Time Capsule' knowledge evolution report.
            1. V1 (The Past): A very brief, high-level summary of the foundational concepts.
            2. V4 (The Present): A detailed, sophisticated summary showing mastery.
            3. Identify 3 specific advanced 'growth' keywords or phrases from the text.
            
            Content: {content}
            
            Return ONLY a valid JSON object:
            {{
                "v1": {{ "date": "Early Session", "label": "Foundational Phase", "content": "..." }},
                "v4": {{ "date": "Present", "label": "Expert Mastery", "content": "..." }},
                "growth": ["phrase1", "phrase2", "phrase3"]
            }}
        """)
        
        chain = prompt | llm
        response = chain.invoke({"content": content})
        
        try:
            cleaned_content = response.content.strip()
            if "```json" in cleaned_content:
                cleaned_content = cleaned_content.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned_content:
                cleaned_content = cleaned_content.split("```")[1].strip()
                
            data = json.loads(cleaned_content)
            print("Time Capsule JSON parsed successfully")
            return data
        except Exception as json_err:
            print(f"JSON Parse Error: {json_err}")
            print(f"Raw LLM Response: {response.content}")
            raise json_err
            
    except Exception as e:
        print(f"Time Capsule Error: {e}")
        traceback.print_exc()
        return {
            "v1": {"date": "Phase 1", "label": "Initial Understanding", "content": "Gathering core concepts from the documents."},
            "v4": {"date": "Present", "label": "Comprehensive Mastery", "content": "Full integration of document details and logical structures."},
            "growth": ["Core Architecture", "Dynamic Scaling", "Security Protocols"]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
