from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Depends, Header, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import base64
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "bloombuddy"
storage_key = None

# JWT Config
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PASSWORD HASHING ====================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ==================== JWT TOKENS ====================
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== OBJECT STORAGE ====================
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        logger.warning("EMERGENT_LLM_KEY not set, file uploads disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": emergent_key}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ==================== MODELS ====================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    xp: int = 0
    level: int = 1
    user_type: Optional[str] = None
    created_at: Optional[str] = None

class BouquetCreate(BaseModel):
    name: str
    flower_type: str
    photo_url: Optional[str] = None

class JournalEntryCreate(BaseModel):
    bouquet_id: str
    mood: str
    note: str
    photo_id: Optional[str] = None

class TaskUpdate(BaseModel):
    bouquet_id: str
    task_id: str
    completed: bool

class FlowerGenerateRequest(BaseModel):
    flower_type: str
    prompt: Optional[str] = None

class NotificationSubscription(BaseModel):
    endpoint: str
    keys: dict

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "user",
        "xp": 0,
        "level": 1,
        "user_type": None,
        "streak": 0,
        "badges": ["first-bloom"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return UserResponse(id=user_id, email=email, name=user_data.name, role="user", xp=0, level=1)

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return UserResponse(
        id=user_id,
        email=user["email"],
        name=user.get("name", ""),
        role=user.get("role", "user"),
        xp=user.get("xp", 0),
        level=user.get("level", 1),
        user_type=user.get("user_type")
    )

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        name=user.get("name", ""),
        role=user.get("role", "user"),
        xp=user.get("xp", 0),
        level=user.get("level", 1),
        user_type=user.get("user_type")
    )

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== USER DATA ROUTES ====================
@api_router.put("/user/profile")
async def update_profile(request: Request, user_type: str = None, name: str = None):
    user = await get_current_user(request)
    update_data = {}
    if user_type:
        update_data["user_type"] = user_type
        # Unlock bloom expert badge for enthusiasts
        if user_type == "enthusiast":
            await db.users.update_one(
                {"_id": ObjectId(user["_id"])},
                {"$addToSet": {"badges": "bloom-expert"}}
            )
    if name:
        update_data["name"] = name
    
    if update_data:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update_data})
    return {"message": "Profile updated"}

@api_router.post("/user/add-xp")
async def add_xp(request: Request, amount: int):
    user = await get_current_user(request)
    new_xp = user.get("xp", 0) + amount
    new_level = (new_xp // 200) + 1
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"xp": new_xp, "level": new_level}}
    )
    return {"xp": new_xp, "level": new_level}

@api_router.get("/user/data")
async def get_user_data(request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    
    # Get active bouquet
    bouquet = await db.bouquets.find_one(
        {"user_id": user_id, "is_active": True},
        {"_id": 0}
    )
    
    # Get journal entries
    entries = await db.journal_entries.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get today's tasks
    today = datetime.now(timezone.utc).date().isoformat()
    tasks_doc = await db.daily_tasks.find_one(
        {"user_id": user_id, "date": today},
        {"_id": 0}
    )
    
    return {
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user.get("name", ""),
            "xp": user.get("xp", 0),
            "level": user.get("level", 1),
            "streak": user.get("streak", 0),
            "badges": user.get("badges", []),
            "user_type": user.get("user_type")
        },
        "bouquet": bouquet,
        "journal_entries": entries,
        "tasks": tasks_doc.get("tasks", []) if tasks_doc else None
    }

# ==================== BOUQUET ROUTES ====================
@api_router.post("/bouquets")
async def create_bouquet(request: Request, bouquet: BouquetCreate):
    user = await get_current_user(request)
    
    # Deactivate any existing active bouquet
    await db.bouquets.update_many(
        {"user_id": user["_id"], "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    bouquet_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "name": bouquet.name,
        "flower_type": bouquet.flower_type,
        "photo_url": bouquet.photo_url,
        "day_count": 1,
        "health_percent": 100,
        "estimated_life": 12,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bouquets.insert_one(bouquet_doc)
    
    # Update user streak
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"streak": 1}}
    )
    
    bouquet_doc.pop("_id", None)
    return bouquet_doc

@api_router.get("/bouquets/active")
async def get_active_bouquet(request: Request):
    user = await get_current_user(request)
    bouquet = await db.bouquets.find_one(
        {"user_id": user["_id"], "is_active": True},
        {"_id": 0}
    )
    return bouquet

# ==================== JOURNAL ROUTES ====================
@api_router.post("/journal")
async def create_journal_entry(request: Request, entry: JournalEntryCreate):
    user = await get_current_user(request)
    
    bouquet = await db.bouquets.find_one({"id": entry.bouquet_id, "user_id": user["_id"]})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    
    entry_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "bouquet_id": entry.bouquet_id,
        "day": bouquet.get("day_count", 1),
        "mood": entry.mood,
        "note": entry.note,
        "photo_id": entry.photo_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.journal_entries.insert_one(entry_doc)
    
    # Add XP for journal entry
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"xp": 25}}
    )
    
    entry_doc.pop("_id", None)
    return entry_doc

@api_router.get("/journal")
async def get_journal_entries(request: Request, bouquet_id: str = None):
    user = await get_current_user(request)
    query = {"user_id": user["_id"]}
    if bouquet_id:
        query["bouquet_id"] = bouquet_id
    
    entries = await db.journal_entries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return entries

# ==================== TASKS ROUTES ====================
@api_router.get("/tasks/today")
async def get_today_tasks(request: Request):
    user = await get_current_user(request)
    today = datetime.now(timezone.utc).date().isoformat()
    
    tasks_doc = await db.daily_tasks.find_one(
        {"user_id": user["_id"], "date": today},
        {"_id": 0}
    )
    
    if not tasks_doc:
        # Create default tasks for today
        default_tasks = [
            {"id": "water", "label": "Change water", "completed": False},
            {"id": "trim", "label": "Trim stems", "completed": False},
            {"id": "petals", "label": "Remove wilted petals", "completed": False},
            {"id": "placement", "label": "Check placement", "completed": False},
        ]
        tasks_doc = {
            "user_id": user["_id"],
            "date": today,
            "tasks": default_tasks
        }
        await db.daily_tasks.insert_one(tasks_doc)
        tasks_doc.pop("_id", None)
    
    return tasks_doc

@api_router.post("/tasks/toggle")
async def toggle_task(request: Request, task_update: TaskUpdate):
    user = await get_current_user(request)
    today = datetime.now(timezone.utc).date().isoformat()
    
    result = await db.daily_tasks.update_one(
        {"user_id": user["_id"], "date": today, "tasks.id": task_update.task_id},
        {"$set": {"tasks.$.completed": task_update.completed}}
    )
    
    if task_update.completed:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$inc": {"xp": 10}}
        )
    
    # Check if all tasks completed
    tasks_doc = await db.daily_tasks.find_one({"user_id": user["_id"], "date": today})
    if tasks_doc:
        all_completed = all(t["completed"] for t in tasks_doc.get("tasks", []))
        if all_completed:
            await db.users.update_one(
                {"_id": ObjectId(user["_id"])},
                {"$inc": {"xp": 50}}
            )
            return {"all_completed": True, "bonus_xp": 50}
    
    return {"success": True}

# ==================== FILE UPLOAD ROUTES ====================
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    file_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    
    file_doc.pop("_id", None)
    return file_doc

@api_router.get("/files/{file_id}")
async def download_file(file_id: str, request: Request, auth: str = Query(None)):
    # Allow query param auth for img src
    if auth:
        request._cookies = {"access_token": auth}
    
    user = await get_optional_user(request)
    
    file_doc = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(file_doc["storage_path"])
    return Response(content=data, media_type=file_doc.get("content_type", content_type))

# ==================== AI GENERATION ROUTES ====================
@api_router.post("/generate-flower")
async def generate_flower(request: FlowerGenerateRequest):
    try:
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            return {"image_url": get_fallback_image(request.flower_type)}
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        flower_prompts = {
            "roses": "A stunning bouquet of red and pink roses in a clear crystal vase, soft diffused lighting, romantic aesthetic, Y2K glossy style",
            "tulips": "A fresh bouquet of colorful tulips in a modern vase, spring vibes, pastel colors, glossy Y2K aesthetic",
            "sunflowers": "A cheerful arrangement of bright sunflowers in a rustic vase, warm golden lighting, happy botanical style",
            "lilies": "An elegant bouquet of white and pink lilies in a glass vase, soft ethereal lighting, sophisticated floral photography",
            "mixed": "A vibrant mixed flower bouquet with roses, tulips, and wildflowers in a vintage vase, colorful and joyful, Y2K aesthetic",
        }
        
        prompt = request.prompt or flower_prompts.get(request.flower_type, f"A beautiful bouquet of {request.flower_type} flowers")
        
        chat = LlmChat(api_key=api_key, session_id=f"flower-gen-{uuid.uuid4()}", system_message="Generate beautiful flower images")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            img_data = images[0]
            mime_type = img_data.get('mime_type', 'image/png')
            data = img_data.get('data', '')
            return {"image_url": f"data:{mime_type};base64,{data}"}
        
        return {"image_url": get_fallback_image(request.flower_type)}
    except Exception as e:
        logger.error(f"Error generating flower image: {e}")
        return {"image_url": get_fallback_image(request.flower_type), "error": str(e)}

def get_fallback_image(flower_type: str) -> str:
    fallbacks = {
        "roses": "https://images.unsplash.com/photo-1758040559513-166308753585?w=400",
        "tulips": "https://images.unsplash.com/photo-1680441774216-8a86795a687f?w=400",
        "sunflowers": "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400",
        "lilies": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400",
        "mixed": "https://images.unsplash.com/photo-1773724169920-5eb0eb538895?w=400",
    }
    return fallbacks.get(flower_type, fallbacks["mixed"])

# ==================== NOTIFICATION ROUTES ====================
@api_router.post("/notifications/subscribe")
async def subscribe_notifications(request: Request, subscription: NotificationSubscription):
    user = await get_current_user(request)
    
    await db.push_subscriptions.update_one(
        {"user_id": user["_id"]},
        {"$set": {
            "endpoint": subscription.endpoint,
            "keys": subscription.keys,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Subscribed to notifications"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_notifications(request: Request):
    user = await get_current_user(request)
    await db.push_subscriptions.delete_one({"user_id": user["_id"]})
    return {"message": "Unsubscribed from notifications"}

# ==================== EMAIL NOTIFICATION ROUTES (MOCKED) ====================
class EmailPreferences(BaseModel):
    daily_reminders: bool = True
    weekly_summary: bool = True
    badge_notifications: bool = True
    reminder_time: str = "09:00"

@api_router.get("/email/preferences")
async def get_email_preferences(request: Request):
    user = await get_current_user(request)
    prefs = await db.email_preferences.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not prefs:
        prefs = {
            "user_id": user["_id"],
            "daily_reminders": True,
            "weekly_summary": True,
            "badge_notifications": True,
            "reminder_time": "09:00"
        }
    return prefs

@api_router.post("/email/preferences")
async def update_email_preferences(request: Request, prefs: EmailPreferences):
    user = await get_current_user(request)
    await db.email_preferences.update_one(
        {"user_id": user["_id"]},
        {"$set": {
            "daily_reminders": prefs.daily_reminders,
            "weekly_summary": prefs.weekly_summary,
            "badge_notifications": prefs.badge_notifications,
            "reminder_time": prefs.reminder_time,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Preferences updated"}

@api_router.post("/email/send-test")
async def send_test_email(request: Request):
    """MOCKED: Send a test email notification"""
    user = await get_current_user(request)
    
    # Mock email sending - log to console
    email_content = {
        "to": user["email"],
        "subject": "🌸 BloomBuddy Care Reminder",
        "body": f"""
        Hi {user.get('name', 'Bloom Keeper')}!
        
        Time to check on your bouquet! Here are today's care tasks:
        
        💧 Change the water
        ✂️ Trim the stems  
        🌸 Remove wilted petals
        ☀️ Check placement
        
        Keep up the great work! Your flowers will thank you.
        
        Happy blooming! 🌷
        - BloomBuddy Team
        """
    }
    
    logger.info(f"[MOCK EMAIL] Sending to: {email_content['to']}")
    logger.info(f"[MOCK EMAIL] Subject: {email_content['subject']}")
    logger.info(f"[MOCK EMAIL] Body: {email_content['body']}")
    
    return {
        "message": "Test email sent (mocked)",
        "email_preview": email_content,
        "note": "In production, this would send via Resend API"
    }

@api_router.post("/email/send-badge-notification")
async def send_badge_notification(request: Request, badge_name: str, badge_icon: str):
    """MOCKED: Send badge earned notification"""
    user = await get_current_user(request)
    
    email_content = {
        "to": user["email"],
        "subject": f"🎉 You earned a new badge: {badge_name}!",
        "body": f"""
        Congratulations {user.get('name', 'Bloom Keeper')}! {badge_icon}
        
        You just unlocked the "{badge_name}" badge!
        
        Keep caring for your flowers to unlock more achievements.
        
        Happy blooming! 🌷
        - BloomBuddy Team
        """
    }
    
    logger.info(f"[MOCK EMAIL] Badge notification to: {email_content['to']}")
    logger.info(f"[MOCK EMAIL] Badge: {badge_name}")
    
    return {
        "message": "Badge notification sent (mocked)",
        "email_preview": email_content
    }

# ==================== SHARE CARD ROUTES ====================
@api_router.get("/share/bloom-card/{bouquet_id}")
async def get_bloom_card_data(bouquet_id: str, request: Request):
    user = await get_optional_user(request)
    
    bouquet = await db.bouquets.find_one({"id": bouquet_id}, {"_id": 0})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    
    user_id = bouquet.get("user_id")
    user_data = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 0, "password_hash": 0})
    
    entries = await db.journal_entries.find({"bouquet_id": bouquet_id}, {"_id": 0}).to_list(100)
    thriving_days = len([e for e in entries if e.get("mood") == "thriving"])
    
    return {
        "bouquet": bouquet,
        "user_name": user_data.get("name", "Bloom Keeper") if user_data else "Bloom Keeper",
        "stats": {
            "days_alive": bouquet.get("day_count", 1),
            "thriving_days": thriving_days,
            "streak": user_data.get("streak", 0) if user_data else 0,
            "tasks_completed": len(entries) * 4,  # Approximate
            "xp_earned": user_data.get("xp", 0) if user_data else 0
        }
    }

# ==================== BASIC ROUTES ====================
@api_router.get("/")
async def root():
    return {"message": "BloomBuddy API"}

# Include the router
app.include_router(api_router)

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "https://bouquet-keeper.preview.emergentagent.com")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[frontend_url, "http://localhost:3000", "https://bouquet-keeper.preview.emergentagent.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup events
@app.on_event("startup")
async def startup():
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init error: {e}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.bouquets.create_index([("user_id", 1), ("is_active", 1)])
    await db.journal_entries.create_index("user_id")
    await db.daily_tasks.create_index([("user_id", 1), ("date", 1)])
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bloombuddy.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "bloom123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "xp": 1000,
            "level": 5,
            "streak": 10,
            "badges": ["first-bloom", "streak-keeper", "bloom-expert"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    
    # Write test credentials
    try:
        Path("/app/memory").mkdir(exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(f"""# BloomBuddy Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user

## Test User
- Email: test@bloombuddy.com
- Password: test123
""")
    except Exception as e:
        logger.error(f"Failed to write test credentials: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
