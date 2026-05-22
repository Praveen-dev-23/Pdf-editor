import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.routes import pdf, ocr, ai
from app.services.ocr_service import OCRService
from app.services.pdf_service import HAS_PDF2IMAGE
from app.utils.file_utils import TEMP_DIR, ensure_temp_dir

app = FastAPI(
    title="NeonDocs API",
    description="Futuristic document utility service and AI tools API",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp directory exists
ensure_temp_dir()

# Register Routers
app.include_router(pdf.router)
app.include_router(ocr.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    """Health check and diagnostics endpoint."""
    tesseract_ok = OCRService.is_tesseract_available()
    poppler_ok = HAS_PDF2IMAGE
    
    return {
        "status": "online",
        "system_diagnostics": {
            "tesseract_ocr": "AVAILABLE" if tesseract_ok else "NOT_INSTALLED",
            "poppler_pdf2image": "AVAILABLE" if poppler_ok else "NOT_INSTALLED"
        },
        "description": "NeonDocs Cybernetic Core is online."
    }

@app.get("/download/{file_id}")
def download_file(file_id: str):
    """Secure file download from temp directory (protects against path traversal)."""
    # Safeguard against directory traversal attacks
    safe_dir = os.path.realpath(TEMP_DIR)
    file_path = os.path.realpath(os.path.join(TEMP_DIR, file_id))
    
    if not file_path.startswith(safe_dir):
        raise HTTPException(status_code=403, detail="Access denied: Invalid file reference.")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=444, detail="Requested resource has expired or does not exist.")
        
    # Check extension to set content disposition
    ext = os.path.splitext(file_path)[1].lower()
    filename = "neondocs_export" + ext
    
    # Custom filenames based on extensions
    if ext == ".pdf":
        filename = "neondocs_processed.pdf"
    elif ext == ".zip":
        filename = "neondocs_bundle.zip"
        
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=filename
    )
