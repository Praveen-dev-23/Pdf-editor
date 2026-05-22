from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class SplitRequest(BaseModel):
    # 'ranges', 'individual', 'parity'
    split_type: str = Field(..., description="Type of split: ranges, individual, parity")
    # e.g., "1-3, 5-8" for ranges
    ranges: Optional[str] = Field(None, description="Comma-separated ranges, e.g. '1-3, 5-8'")
    # 'odd' or 'even' for parity
    parity: Optional[str] = Field(None, description="Odd or Even pages for parity split")

class CompressRequest(BaseModel):
    # 'low', 'medium', 'high'
    level: str = Field("medium", description="Compression level: low, medium, high")

class TextElement(BaseModel):
    text: str
    x_pct: float = Field(..., description="X coordinate as percentage of page width (0 to 100)")
    y_pct: float = Field(..., description="Y coordinate as percentage of page height (0 to 100)")
    page: int = Field(..., description="1-indexed page number")
    font_size: int = 12
    color: str = "#000000"

class EditRequest(BaseModel):
    watermark_text: Optional[str] = None
    text_elements: Optional[List[TextElement]] = []
    # Dict of {page_num_str: rotation_angle} (e.g. {"1": 90, "2": 180})
    rotations: Optional[Dict[str, int]] = {}
    pages_to_delete: Optional[List[int]] = []
    add_page_numbers: Optional[bool] = False

class SignaturePlacement(BaseModel):
    page: int = Field(..., description="1-indexed page number")
    x_pct: float = Field(..., description="X coordinate as percentage of page width (0 to 100)")
    y_pct: float = Field(..., description="Y coordinate as percentage of page height (0 to 100)")
    width_pct: float = Field(..., description="Width as percentage of page width (0 to 100)")
    height_pct: float = Field(..., description="Height as percentage of page height (0 to 100)")

class SignRequest(BaseModel):
    signature_data_url: Optional[str] = Field(None, description="Base64 data URL for drawn signature")
    placement: SignaturePlacement

class ChatRequest(BaseModel):
    question: str
    pdf_id: str

class SummaryRequest(BaseModel):
    pdf_id: str
