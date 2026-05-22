import os
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.services.ocr_service import OCRService
from app.utils.file_utils import get_temp_path, save_upload_file, cleanup_files

router = APIRouter(prefix="/ocr", tags=["OCR Utilities"])

@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Extract text from images or PDFs (handles digital text extraction and scanned OCR fallback)."""
    ext = os.path.splitext(file.filename)[1].lower()
    temp_path = get_temp_path(ext)
    
    try:
        await save_upload_file(file, temp_path)
        
        # Determine file type and extract text
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            text = OCRService.extract_text_from_image(temp_path)
        elif ext == ".pdf":
            text = OCRService.extract_text_from_pdf(temp_path)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format for OCR: {ext}. Only PDF, JPG, PNG, and WEBP are supported."
            )
            
        if background_tasks:
            background_tasks.add_task(cleanup_files, [temp_path])
        else:
            cleanup_files([temp_path])
            
        return {
            "filename": file.filename,
            "text": text,
            "char_count": len(text)
        }
        
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")
