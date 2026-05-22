import os
import zipfile
import base64
from typing import List, Dict, Optional
from PIL import Image
import PyPDF2
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from app.utils.file_utils import get_temp_path

# Try importing pdf2image to convert PDF to image and for compression.
try:
    import pdf2image
    HAS_PDF2IMAGE = True
except ImportError:
    HAS_PDF2IMAGE = False


class PDFService:
    @staticmethod
    def image_to_pdf(image_paths: List[str], output_path: str):
        """Convert a list of images to a single PDF file."""
        if not image_paths:
            raise ValueError("No images provided for conversion.")

        images = []
        for path in image_paths:
            img = Image.open(path)
            if img.mode != "RGB":
                img = img.convert("RGB")
            images.append(img)

        # Save first image and append the rest
        images[0].save(output_path, save_all=True, append_images=images[1:])
        
        # Close image handles
        for img in images:
            img.close()

    @staticmethod
    def merge_pdfs(pdf_paths: List[str], output_path: str):
        """Merge multiple PDF files into one."""
        merger = PyPDF2.PdfMerger()
        for path in pdf_paths:
            merger.append(path)
        merger.write(output_path)
        merger.close()

    @staticmethod
    def split_pdf(pdf_path: str, split_type: str, ranges: Optional[str], parity: Optional[str], output_dir: str) -> List[str]:
        """
        Split a PDF by page ranges, individual pages, or parity (odd/even).
        Returns a list of generated file paths.
        """
        reader = PyPDF2.PdfReader(pdf_path)
        total_pages = len(reader.pages)
        generated_paths = []

        if split_type == "individual":
            for i in range(total_pages):
                writer = PyPDF2.PdfWriter()
                writer.add_page(reader.pages[i])
                split_file_path = os.path.join(output_dir, f"page_{i + 1}.pdf")
                with open(split_file_path, "wb") as f:
                    writer.write(f)
                generated_paths.append(split_file_path)

        elif split_type == "parity":
            odd_writer = PyPDF2.PdfWriter()
            even_writer = PyPDF2.PdfWriter()
            has_odd = False
            has_even = False

            for i in range(total_pages):
                page_num = i + 1
                if page_num % 2 != 0:
                    odd_writer.add_page(reader.pages[i])
                    has_odd = True
                else:
                    even_writer.add_page(reader.pages[i])
                    has_even = True

            if parity in ("odd", "both") and has_odd:
                odd_path = os.path.join(output_dir, "odd_pages.pdf")
                with open(odd_path, "wb") as f:
                    odd_writer.write(f)
                generated_paths.append(odd_path)
            
            if parity in ("even", "both") and has_even:
                even_path = os.path.join(output_dir, "even_pages.pdf")
                with open(even_path, "wb") as f:
                    even_writer.write(f)
                generated_paths.append(even_path)

        elif split_type == "ranges":
            if not ranges:
                raise ValueError("Ranges parameter is required for ranges split.")
            
            # ranges format: "1-3, 5-8" or "1, 3, 5-7"
            parts = [p.strip() for p in ranges.split(",")]
            for part_idx, part in enumerate(parts):
                writer = PyPDF2.PdfWriter()
                pages_to_add = []
                
                if "-" in part:
                    start_str, end_str = part.split("-")
                    start = int(start_str.strip())
                    end = int(end_str.strip())
                    pages_to_add = list(range(start, end + 1))
                else:
                    pages_to_add = [int(part.strip())]

                added_count = 0
                for p in pages_to_add:
                    if 1 <= p <= total_pages:
                        writer.add_page(reader.pages[p - 1])
                        added_count += 1
                
                if added_count > 0:
                    range_path = os.path.join(output_dir, f"split_range_{part.replace(' ', '')}.pdf")
                    with open(range_path, "wb") as f:
                        writer.write(f)
                    generated_paths.append(range_path)
        else:
            raise ValueError(f"Invalid split type: {split_type}")

        return generated_paths

    @staticmethod
    def compress_pdf(pdf_path: str, level: str, output_path: str):
        """
        Compress a PDF.
        For 'low': uses standard compression of content streams.
        For 'medium' or 'high': converts pages to images, compresses them, and merges them.
        """
        level = level.lower()
        if not HAS_PDF2IMAGE or level == "low":
            # Fallback/standard PyPDF2 compression
            reader = PyPDF2.PdfReader(pdf_path)
            writer = PyPDF2.PdfWriter()
            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)
            with open(output_path, "wb") as f:
                writer.write(f)
            return

        # Downscale compression using pdf2image and Pillow
        # Set quality and DPI depending on level
        if level == "high":
            dpi = 75
            quality = 40
        else:  # medium
            dpi = 130
            quality = 65

        try:
            pages = pdf2image.convert_from_path(pdf_path, dpi=dpi)
            compressed_images = []
            
            for page in pages:
                temp_img_path = get_temp_path("jpg")
                page.save(temp_img_path, "JPEG", quality=quality)
                
                img = Image.open(temp_img_path)
                if img.mode != "RGB":
                    img = img.convert("RGB")
                compressed_images.append((img, temp_img_path))

            # Compile back to PDF
            imgs = [ci[0] for ci in compressed_images]
            imgs[0].save(output_path, save_all=True, append_images=imgs[1:])
            
            # Clean up temporary images
            for img, path in compressed_images:
                img.close()
                try:
                    os.unlink(path)
                except Exception:
                    pass
        except Exception as e:
            # Final fallback if poppler or conversion fails
            print(f"Error compressing PDF via image downscaling: {e}. Falling back to standard PyPDF2 compression.")
            reader = PyPDF2.PdfReader(pdf_path)
            writer = PyPDF2.PdfWriter()
            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)
            with open(output_path, "wb") as f:
                writer.write(f)

    @staticmethod
    def pdf_to_image(pdf_path: str, output_dir: str, image_format: str = "PNG") -> List[str]:
        """Convert all PDF pages into images."""
        if not HAS_PDF2IMAGE:
            raise RuntimeError("Poppler is required on the system to convert PDF to images.")
        
        pages = pdf2image.convert_from_path(pdf_path, dpi=150)
        image_paths = []
        for i, page in enumerate(pages):
            img_path = os.path.join(output_dir, f"page_{i + 1}.{image_format.lower()}")
            page.save(img_path, image_format)
            image_paths.append(img_path)
        return image_paths

    @staticmethod
    def edit_pdf(pdf_path: str, edit_config: Dict, output_path: str):
        """
        Applies watermarks, rotating, page deletion, adding page numbers, 
        and text elements overlay.
        """
        reader = PyPDF2.PdfReader(pdf_path)
        writer = PyPDF2.PdfWriter()
        total_pages = len(reader.pages)
        
        pages_to_delete = edit_config.get("pages_to_delete", [])
        rotations = edit_config.get("rotations", {})
        watermark_text = edit_config.get("watermark_text")
        text_elements = edit_config.get("text_elements", [])
        add_page_numbers = edit_config.get("add_page_numbers", False)

        # First pass: Filter, rotate and prepare basic pages
        temp_pages = []
        for i in range(total_pages):
            page_num = i + 1
            if page_num in pages_to_delete:
                continue
            
            page = reader.pages[i]
            
            # Apply rotation if specified (rotations keys are page number strings)
            rot_angle = rotations.get(str(page_num))
            if rot_angle:
                page.rotate(rot_angle)
            
            temp_pages.append((page, page_num))

        # Second pass: Overlay elements (watermark, page numbers, text elements)
        final_temp_paths = []
        
        for idx, (page, orig_page_num) in enumerate(temp_pages):
            media_box = page.mediabox
            width = float(media_box.width)
            height = float(media_box.height)

            # Generate overlay using reportlab
            overlay_path = get_temp_path("pdf")
            c = canvas.Canvas(overlay_path, pagesize=(width, height))
            
            has_overlay = False

            # Draw Watermark (diagonal semi-transparent text)
            if watermark_text:
                c.saveState()
                c.setFont("Helvetica-Bold", 48)
                c.setFillColor(HexColor("#FF007F"), alpha=0.15)
                # Translate to center and rotate
                c.translate(width / 2.0, height / 2.0)
                c.rotate(45)
                c.drawCentredString(0, 0, watermark_text)
                c.restoreState()
                has_overlay = True

            # Draw Page Numbers (footer)
            if add_page_numbers:
                c.saveState()
                c.setFont("Helvetica-Oblique", 9)
                c.setFillColor(HexColor("#888888"))
                text = f"Page {idx + 1} of {len(temp_pages)}"
                c.drawRightString(width - 36, 20, text)
                c.restoreState()
                has_overlay = True

            # Draw Custom Text Elements
            # Element fields: text, x_pct, y_pct, font_size, color, page (1-indexed based on original)
            for elem in text_elements:
                # If text element page matches current original page number
                if elem.get("page") == orig_page_num:
                    c.saveState()
                    c.setFont("Helvetica-Bold", elem.get("font_size", 12))
                    c.setFillColor(HexColor(elem.get("color", "#000000")))
                    
                    x = (elem.get("x_pct", 0) / 100.0) * width
                    # Convert y from top-left percentage to bottom-left coordinate
                    y = height - ((elem.get("y_pct", 0) + 2) / 100.0) * height  # Adding minor offset for text baseline
                    
                    c.drawString(x, y, elem.get("text", ""))
                    c.restoreState()
                    has_overlay = True

            c.save()

            if has_overlay:
                # Merge overlay PDF onto the page
                overlay_reader = PyPDF2.PdfReader(overlay_path)
                overlay_page = overlay_reader.pages[0]
                page.merge_page(overlay_page)
                final_temp_paths.append(overlay_path)

            writer.add_page(page)

        # Write final pdf
        with open(output_path, "wb") as f:
            writer.write(f)

        # Clean up overlays
        for path in final_temp_paths:
            try:
                os.unlink(path)
            except Exception:
                pass

    @staticmethod
    def apply_signature(pdf_path: str, signature_image_path: str, placement: Dict, output_path: str):
        """
        Places a signature image on a specific page of a PDF.
        placement schema: { page: int, x_pct: float, y_pct: float, width_pct: float, height_pct: float }
        """
        reader = PyPDF2.PdfReader(pdf_path)
        writer = PyPDF2.PdfWriter()
        total_pages = len(reader.pages)
        
        target_page_num = placement.get("page", 1)

        temp_overlay_paths = []

        for i in range(total_pages):
            page = reader.pages[i]
            page_num = i + 1

            if page_num == target_page_num:
                # Retrieve dimensions
                media_box = page.mediabox
                width = float(media_box.width)
                height = float(media_box.height)

                # Map percentages
                x_pct = placement.get("x_pct", 0)
                y_pct = placement.get("y_pct", 0)
                w_pct = placement.get("width_pct", 15)
                h_pct = placement.get("height_pct", 8)

                x = (x_pct / 100.0) * width
                w = (w_pct / 100.0) * width
                h = (h_pct / 100.0) * height
                # reportlab coordinates start at bottom-left:
                y = height - ((y_pct + h_pct) / 100.0) * height

                # Generate overlay with signature image
                overlay_path = get_temp_path("pdf")
                c = canvas.Canvas(overlay_path, pagesize=(width, height))
                c.drawImage(signature_image_path, x, y, width=w, height=h, mask='auto')
                c.save()

                overlay_reader = PyPDF2.PdfReader(overlay_path)
                page.merge_page(overlay_reader.pages[0])
                temp_overlay_paths.append(overlay_path)

            writer.add_page(page)

        with open(output_path, "wb") as f:
            writer.write(f)

        # Cleanup
        for path in temp_overlay_paths:
            try:
                os.unlink(path)
            except Exception:
                pass
