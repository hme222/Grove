"""
File storage on MongoDB Atlas (GridFS), in the same database as the rest of Grove.

Uses a synchronous pymongo client so the put/get helpers stay plain functions, as
callers in server.py expect. Uploads are capped at 10 MB there, so blocking is brief.
"""
import os
import uuid
import logging
from pathlib import Path

import gridfs
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).parent / '.env')

logger = logging.getLogger(__name__)

APP_NAME = "grove-app"
BUCKET_NAME = "files"
_bucket = None


def init_storage():
    global _bucket
    if _bucket is not None:
        return _bucket
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        logger.warning("MONGO_URL not set, storage disabled")
        return None
    db = MongoClient(mongo_url)[os.environ.get('DB_NAME', 'grove_db')]
    _bucket = gridfs.GridFSBucket(db, bucket_name=BUCKET_NAME)
    logger.info("Storage initialized (GridFS)")
    return _bucket


def put_object(path: str, data: bytes, content_type: str) -> dict:
    bucket = init_storage()
    if not bucket:
        raise Exception("Storage not initialized")
    # Paths are unique per upload, but replace any earlier file at the same path.
    for old in bucket.find({"filename": path}):
        bucket.delete(old._id)
    bucket.upload_from_stream(path, data, metadata={"content_type": content_type})
    return {"path": path, "size": len(data)}


def get_object(path: str) -> tuple:
    bucket = init_storage()
    if not bucket:
        raise Exception("Storage not initialized")
    try:
        stream = bucket.open_download_stream_by_name(path)
    except gridfs.errors.NoFile:
        raise FileNotFoundError(path)
    content_type = (stream.metadata or {}).get("content_type", "application/octet-stream")
    return stream.read(), content_type


def generate_storage_path(user_id: str, ext: str = "png") -> str:
    return f"{APP_NAME}/uploads/{user_id}/{uuid.uuid4()}.{ext}"
