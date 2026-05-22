import os
from PIL import Image
import pytesseract
import pdfplumber
from app.utils.file_utils import get_temp_path

try:
    import pdf2image
    HAS_PDF2IMAGE = True
except ImportError:
    HAS_PDF2IMAGE = False


class OCRService:
    @staticmethod
    def is_tesseract_available() -> bool:
        """Check if Tesseract OCR binary is available in the system."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    @classmethod
    def extract_text_from_image(cls, image_path: str) -> str:
        """Extract text from an image file using Tesseract OCR, with fallbacks."""
        if not cls.is_tesseract_available():
            # Fallback message
            return (
                "--- OCR SIMULATED (Tesseract OCR not installed on host machine) ---\n"
                "To enable high-fidelity local OCR, install Tesseract OCR on your machine.\n"
                f"File analyzed: {os.path.basename(image_path)}\n"
                "NeonDocs Mock OCR Result:\n"
                "Detected document template. Extracted content includes system log streams and text placeholders."
            )
        
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img)
            img.close()
            return text.strip()
        except Exception as e:
            return f"Error executing OCR: {str(e)}"

    @classmethod
    def extract_text_from_pdf(cls, pdf_path: str) -> str:
        """
        Extract text from a PDF.
        If it's digital, it extracts text directly using pdfplumber.
        If it's scanned (i.e. direct extraction is empty) and Tesseract is available, it performs OCR.
        """
        # Try extracting digital text first (much faster and highly accurate)
        digital_text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                digital_text = "\n\n--- Page Break ---\n\n".join(pages_text).strip()
        except Exception as e:
            print(f"Error during digital PDF text extraction: {e}")

        # If digital text was found, return it
        if digital_text:
            return digital_text

        # If digital text was empty, the PDF might be scanned. Let's try OCR
        if not HAS_PDF2IMAGE:
            return (
                "No digital text could be extracted from this PDF.\n"
                "This document may be scanned, but 'pdf2image' (Poppler) is missing on the server. "
                "Unable to perform OCR."
            )

        if not cls.is_tesseract_available():
            return (
                "No digital text could be extracted from this PDF.\n"
                "This document appears to be scanned, and Tesseract OCR is not available on this server.\n"
                "Please install Tesseract OCR and Poppler to process scanned PDFs."
            )

        try:
            pages = pdf2image.convert_from_path(pdf_path, dpi=120)
            ocr_pages = []
            
            for i, page in enumerate(pages):
                temp_img_path = get_temp_path("png")
                page.save(temp_img_path, "PNG")
                
                # Perform OCR on image page
                img = Image.open(temp_img_path)
                page_text = pytesseract.image_to_string(img)
                img.close()
                
                # Cleanup page image
                try:
                    os.unlink(temp_img_path)
                except Exception:
                    pass
                
                ocr_pages.append(f"--- Page {i + 1} OCR ---\n{page_text.strip()}")
            
            return "\n\n".join(ocr_pages)
        except Exception as e:
            return f"Error during scanned PDF OCR: {str(e)}"
