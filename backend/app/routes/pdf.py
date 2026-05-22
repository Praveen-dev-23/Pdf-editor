import os
import json
import base64
import zipfile
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from app.services.pdf_service import PDFService
from app.utils.file_utils import get_temp_path, save_upload_file, cleanup_files, TEMP_DIR

router = APIRouter(prefix="/pdf", tags=["PDF Utilities"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and get a temporary path for caching (optional)."""
    ext = os.path.splitext(file.filename)[1]
    temp_path = get_temp_path(ext)
    await save_upload_file(file, temp_path)
    return {
        "file_id": os.path.basename(temp_path),
        "filename": file.filename,
        "size": os.path.getsize(temp_path)
    }

@router.post("/convert/image-to-pdf")
async def convert_image_to_pdf(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None
):
    """Convert multiple images into a single PDF."""
    temp_img_paths = []
    output_pdf_path = get_temp_path("pdf")
    
    try:
        # Save all uploaded images
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            if ext.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
                raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
            
            temp_path = get_temp_path(ext)
            await save_upload_file(file, temp_path)
            temp_img_paths.append(temp_path)

        # Convert images to PDF
        PDFService.image_to_pdf(temp_img_paths, output_pdf_path)
        
        # Schedule cleanup of temp images
        if background_tasks:
            background_tasks.add_task(cleanup_files, temp_img_paths)
        else:
            cleanup_files(temp_img_paths)
            
        file_id = os.path.basename(output_pdf_path)
        return {
            "download_id": file_id,
            "filename": "converted_images.pdf",
            "size": os.path.getsize(output_pdf_path)
        }
        
    except Exception as e:
        cleanup_files(temp_img_paths + [output_pdf_path])
        raise HTTPException(status_code=500, detail=f"Image to PDF conversion failed: {str(e)}")


@router.post("/merge-pdf")
async def merge_pdf(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None
):
    """Merge multiple PDF files into one."""
    temp_pdf_paths = []
    output_pdf_path = get_temp_path("pdf")
    
    try:
        # Save all uploaded PDFs
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            if ext.lower() != ".pdf":
                raise HTTPException(status_code=400, detail=f"Uploaded file must be a PDF: {file.filename}")
            
            temp_path = get_temp_path(ext)
            await save_upload_file(file, temp_path)
            temp_pdf_paths.append(temp_path)

        # Merge PDFs
        PDFService.merge_pdfs(temp_pdf_paths, output_pdf_path)
        
        # Schedule cleanup of input temp PDFs
        if background_tasks:
            background_tasks.add_task(cleanup_files, temp_pdf_paths)
        else:
            cleanup_files(temp_pdf_paths)
            
        file_id = os.path.basename(output_pdf_path)
        return {
            "download_id": file_id,
            "filename": "merged_document.pdf",
            "size": os.path.getsize(output_pdf_path)
        }
        
    except Exception as e:
        cleanup_files(temp_pdf_paths + [output_pdf_path])
        raise HTTPException(status_code=500, detail=f"PDF merging failed: {str(e)}")


@router.post("/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    split_type: str = Form(...), # 'ranges', 'individual', 'parity'
    ranges: Optional[str] = Form(None),
    parity: Optional[str] = Form(None), # 'odd', 'even', 'both'
    background_tasks: BackgroundTasks = None
):
    """Split a PDF by page ranges, individual pages, or parity."""
    input_pdf_path = get_temp_path("pdf")
    output_dir = get_temp_path("")
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Save input PDF
        await save_upload_file(file, input_pdf_path)
        
        # Execute split
        generated_files = PDFService.split_pdf(input_pdf_path, split_type, ranges, parity, output_dir)
        
        if not generated_files:
            raise HTTPException(status_code=400, detail="No pages were split under the provided parameters.")

        # If only one PDF is generated, we can just return that PDF
        if len(generated_files) == 1:
            dest_pdf_path = get_temp_path("pdf")
            os.rename(generated_files[0], dest_pdf_path)
            
            # Clean up directories
            cleanup_files([input_pdf_path, output_dir])
            
            file_id = os.path.basename(dest_pdf_path)
            return {
                "download_id": file_id,
                "filename": os.path.basename(generated_files[0]),
                "size": os.path.getsize(dest_pdf_path)
            }
        
        # If multiple files are generated, bundle them in a zip
        zip_output_path = get_temp_path("zip")
        with zipfile.ZipFile(zip_output_path, 'w') as zipf:
            for g_file in generated_files:
                zipf.write(g_file, os.path.basename(g_file))

        # Cleanup input files
        cleanup_files([input_pdf_path, output_dir])
        
        file_id = os.path.basename(zip_output_path)
        return {
            "download_id": file_id,
            "filename": "split_pages.zip",
            "size": os.path.getsize(zip_output_path)
        }
        
    except Exception as e:
        cleanup_files([input_pdf_path, output_dir])
        raise HTTPException(status_code=500, detail=f"PDF splitting failed: {str(e)}")


@router.post("/compress-pdf")
async def compress_pdf(
    file: UploadFile = File(...),
    level: str = Form("medium"), # 'low', 'medium', 'high'
    background_tasks: BackgroundTasks = None
):
    """Compress PDF file."""
    input_pdf_path = get_temp_path("pdf")
    output_pdf_path = get_temp_path("pdf")
    
    try:
        # Save input PDF
        await save_upload_file(file, input_pdf_path)
        original_size = os.path.getsize(input_pdf_path)
        
        # Compress PDF
        PDFService.compress_pdf(input_pdf_path, level, output_pdf_path)
        compressed_size = os.path.getsize(output_pdf_path)
        
        # Schedule cleanup of input PDF
        if background_tasks:
            background_tasks.add_task(cleanup_files, [input_pdf_path])
        else:
            cleanup_files([input_pdf_path])
            
        file_id = os.path.basename(output_pdf_path)
        return {
            "download_id": file_id,
            "filename": f"compressed_{file.filename}",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "ratio": round((original_size - compressed_size) / original_size * 100, 2) if original_size > 0 else 0
        }
        
    except Exception as e:
        cleanup_files([input_pdf_path, output_pdf_path])
        raise HTTPException(status_code=500, detail=f"PDF compression failed: {str(e)}")


@router.post("/convert/pdf-to-image")
async def convert_pdf_to_image(
    file: UploadFile = File(...),
    image_format: str = Form("PNG"),
    background_tasks: BackgroundTasks = None
):
    """Convert PDF pages to images, returning a zip file."""
    input_pdf_path = get_temp_path("pdf")
    output_dir = get_temp_path("")
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        await save_upload_file(file, input_pdf_path)
        
        # Convert pages to images
        image_paths = PDFService.pdf_to_image(input_pdf_path, output_dir, image_format)
        
        # Zip images
        zip_output_path = get_temp_path("zip")
        with zipfile.ZipFile(zip_output_path, 'w') as zipf:
            for img_path in image_paths:
                zipf.write(img_path, os.path.basename(img_path))
                
        # Clean up temp images and input PDF
        cleanup_files([input_pdf_path, output_dir])
        
        file_id = os.path.basename(zip_output_path)
        return {
            "download_id": file_id,
            "filename": f"{os.path.splitext(file.filename)[0]}_images.zip",
            "size": os.path.getsize(zip_output_path)
        }
        
    except Exception as e:
        cleanup_files([input_pdf_path, output_dir])
        raise HTTPException(status_code=500, detail=f"PDF to Image conversion failed: {str(e)}")


@router.post("/edit-pdf")
async def edit_pdf(
    file: UploadFile = File(...),
    edit_config: str = Form(...), # JSON string containing the EditRequest schema
    background_tasks: BackgroundTasks = None
):
    """Apply watermarks, rotations, page deletions, page numbers, and custom texts."""
    input_pdf_path = get_temp_path("pdf")
    output_pdf_path = get_temp_path("pdf")
    
    try:
        # Save input PDF
        await save_upload_file(file, input_pdf_path)
        
        # Parse JSON edit config
        config = json.loads(edit_config)
        
        # Process Edit PDF
        PDFService.edit_pdf(input_pdf_path, config, output_pdf_path)
        
        if background_tasks:
            background_tasks.add_task(cleanup_files, [input_pdf_path])
        else:
            cleanup_files([input_pdf_path])
            
        file_id = os.path.basename(output_pdf_path)
        return {
            "download_id": file_id,
            "filename": f"edited_{file.filename}",
            "size": os.path.getsize(output_pdf_path)
        }
        
    except Exception as e:
        cleanup_files([input_pdf_path, output_pdf_path])
        raise HTTPException(status_code=500, detail=f"PDF editing failed: {str(e)}")


@router.post("/sign-pdf")
async def sign_pdf(
    file: UploadFile = File(...),
    signature_data_url: Optional[str] = Form(None),
    signature_file: Optional[UploadFile] = File(None),
    # Placement details sent as form fields:
    page: int = Form(1),
    x_pct: float = Form(...),
    y_pct: float = Form(...),
    width_pct: float = Form(...),
    height_pct: float = Form(...),
    background_tasks: BackgroundTasks = None
):
    """Place a digital signature (drawn or uploaded) onto a PDF page."""
    input_pdf_path = get_temp_path("pdf")
    output_pdf_path = get_temp_path("pdf")
    sig_image_path = get_temp_path("png")
    
    try:
        # Save input PDF
        await save_upload_file(file, input_pdf_path)
        
        # Handle signature source
        if signature_data_url:
            # Base64 signature
            header, encoded = signature_data_url.split(",", 1)
            data = base64.b64decode(encoded)
            with open(sig_image_path, "wb") as f:
                f.write(data)
        elif signature_file:
            # Uploaded file signature
            await save_upload_file(signature_file, sig_image_path)
        else:
            raise HTTPException(status_code=400, detail="Signature is required, either as base64 data URL or uploaded file.")
            
        placement = {
            "page": page,
            "x_pct": x_pct,
            "y_pct": y_pct,
            "width_pct": width_pct,
            "height_pct": height_pct
        }
        
        # Apply signature
        PDFService.apply_signature(input_pdf_path, sig_image_path, placement, output_pdf_path)
        
        # Clean up files
        cleanup_files([input_pdf_path, sig_image_path])
        
        file_id = os.path.basename(output_pdf_path)
        return {
            "download_id": file_id,
            "filename": f"signed_{file.filename}",
            "size": os.path.getsize(output_pdf_path)
        }
        
    except Exception as e:
        cleanup_files([input_pdf_path, output_pdf_path, sig_image_path])
        raise HTTPException(status_code=500, detail=f"PDF signing failed: {str(e)}")
