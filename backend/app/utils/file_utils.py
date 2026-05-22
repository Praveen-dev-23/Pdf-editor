import os
import shutil
import uuid
from typing import List
from fastapi import UploadFile

TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "temp")

def ensure_temp_dir():
    """Ensure the temporary directory exists."""
    os.makedirs(TEMP_DIR, exist_ok=True)
    return TEMP_DIR

def get_temp_path(extension: str = "") -> str:
    """Generate a unique temporary file path."""
    ensure_temp_dir()
    ext = f".{extension.lstrip('.')}" if extension else ""
    return os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")

async def save_upload_file(upload_file: UploadFile, dest_path: str) -> str:
    """Save a FastAPI UploadFile to a local destination path."""
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return dest_path

def cleanup_files(paths: List[str]):
    """Clean up a list of file paths or directories."""
    for path in paths:
        if not path:
            continue
        try:
            if os.path.isfile(path) or os.path.islink(path):
                os.unlink(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
        except Exception as e:
            print(f"Error during cleanup of {path}: {e}")
