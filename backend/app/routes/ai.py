import os
import re
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.services.ocr_service import OCRService
from app.utils.file_utils import get_temp_path, save_upload_file, cleanup_files

router = APIRouter(prefix="/ai", tags=["AI Copilot (Prepared)"])

@router.post("/summarize")
async def summarize_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Summarize a PDF.
    Extracts text and runs an algorithmic summarization (topics/word count) 
    packaged in a high-fidelity cyberpunk response format.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported for AI Summarizer.")
        
    temp_path = get_temp_path("pdf")
    try:
        await save_upload_file(file, temp_path)
        
        # Extract text to analyze
        text = OCRService.extract_text_from_pdf(temp_path)
        
        # Cleanup
        if background_tasks:
            background_tasks.add_task(cleanup_files, [temp_path])
        else:
            cleanup_files([temp_path])
            
        # Algorithmic summaries
        words = text.split()
        word_count = len(words)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        # Extract a few key snippets or sentences
        overview = " ".join(sentences[:3]) if sentences else "No readable text content extracted."
        
        # Find some common words for "topics" (excluding common stop words)
        stopwords = {"the", "and", "a", "of", "to", "in", "is", "that", "it", "on", "for", "as", "with", "this", "was", "by"}
        clean_words = [w.lower().strip(".,;:?!()\"'") for w in words if w.lower().strip(".,;:?!()\"'") not in stopwords and len(w) > 4]
        
        # Count frequencies
        freq = {}
        for w in clean_words:
            freq[w] = freq.get(w, 0) + 1
        
        # Get top 5 keywords
        sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        key_topics = [k[0].upper() for k, v in sorted_keywords[:5]] if sorted_keywords else ["GENERAL", "DOCUMENT", "DATA"]

        # Mock structured response representing the AI framework
        return {
            "filename": file.filename,
            "word_count": word_count,
            "char_count": len(text),
            "summary": {
                "overview": overview,
                "bullet_points": [
                    f"Document contains approximately {word_count} words across analyzed regions.",
                    "Primary themes identified: " + ", ".join(key_topics) + ".",
                    "Text extraction completed successfully via local pipeline.",
                    "AI Endpoints are structured for production LLM integration. (To add OpenRouter/OpenAI, configure keys in settings)."
                ],
                "topics": key_topics,
                "sentiment": "NEUTRAL/INFORMATIONAL"
            },
            "document_text_sample": text[:3000] # Pass sample text for chat session reference
        }
        
    except Exception as e:
        cleanup_files([temp_path])
        raise HTTPException(status_code=500, detail=f"Document summarization failed: {str(e)}")


@router.post("/chat")
async def chat_with_pdf(
    question: str = Form(...),
    document_text: str = Form(...) # The text content sent from client (avoiding uploading file repeatedly)
):
    """
    Chat with the PDF text.
    Uses keyword scanning to find the most relevant paragraphs from the document text
    to simulate local vector search and RAG retrieval.
    """
    if not document_text or len(document_text.strip()) < 5:
        return {
            "answer": "I couldn't find any readable text in this document to query. Please ensure the document contains text or has been processed by OCR first.",
            "sources": []
        }

    # Split document text into paragraphs
    paragraphs = [p.strip() for p in document_text.split("\n\n") if len(p.strip()) > 20]
    if not paragraphs:
        # Try splitting by sentences
        paragraphs = re.split(r'(?<=[.!?])\s+', document_text)
        paragraphs = [p.strip() for p in paragraphs if len(p.strip()) > 20]

    # Clean the question to extract keywords
    question_words = re.findall(r'\b\w{4,}\b', question.lower())
    
    best_paragraph = None
    max_matches = 0
    sources = []

    for para in paragraphs:
        matches = sum(1 for w in question_words if w in para.lower())
        if matches > max_matches:
            max_matches = matches
            best_paragraph = para

    # If we found a matching paragraph, format the response around it
    if best_paragraph and max_matches > 0:
        answer = (
            f"Based on your document, here is what I found:\n\n"
            f"\"{best_paragraph}\"\n\n"
            f"[SYSTEM NOTE: RAG matching detected {max_matches} keyword overlaps in this section. "
            f"FastAPI router is ready to pipe this context into standard OpenAI/Gemini chat models.]"
        )
        sources = [best_paragraph[:150] + "..."]
    else:
        # Fallback response
        answer = (
            f"I analyzed the document for your query: '{question}', but couldn't find a direct matching section. "
            f"However, the document text contains information about: "
            f"{', '.join(re.findall(r'\b\w{5,}\b', document_text.lower())[:8])}.\n\n"
            f"[SYSTEM NOTE: LLM route scaffolded. Integrates with langchain / vector store in production.]"
        )
        sources = []

    return {
        "answer": answer,
        "sources": sources
    }
