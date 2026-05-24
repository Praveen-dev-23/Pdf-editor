import { useState } from "react";
import { FileText, Copy, Download, RefreshCw, ClipboardCheck } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function OcrExtractor() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleOcr = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch(`${API_BASE}/ocr/extract-text`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during OCR text extraction.");
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#00f0ff", "#39ff14", "#9d4edd"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to extract text from document.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.filename.split(".")[0]}_extracted.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-black">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-black" />
          <span>OCR TEXT EXTRACTOR</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: SCAN_OCR_ENGINE // ACCEPTS: PDF, JPG, PNG, WEBP
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            description="Drag & drop a document/image here, or click to upload"
            multiple={false}
          />

          {files.length > 0 && (
            <button
              onClick={handleOcr}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-neon-purple)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>EXTRACT TEXT</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-neon-pink text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000] animate-[fadeIn_0.2s_ease-out]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="border-2 border-black bg-white p-5 rounded-md brutal-shadow-black flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
              <div>
                <h4 className="font-sans font-black text-black tracking-tight text-sm truncate max-w-[200px] md:max-w-md">
                  {result.filename}
                </h4>
                <p className="font-mono text-[10px] text-black/60 font-bold mt-0.5">
                  CHARACTER COUNT: {result.char_count} CHR
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  title="Copy to Clipboard"
                  className="p-2 border-2 border-black bg-[#faf7f2] text-black hover:bg-neon-purple hover:shadow-[2px_2px_0px_0px_#000] transition-all rounded-sm cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  {copied ? (
                    <ClipboardCheck className="w-4 h-4 text-black animate-ping-once" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleExportTxt}
                  title="Download as TXT"
                  className="p-2 border-2 border-black bg-[#faf7f2] text-black hover:bg-neon-purple hover:shadow-[2px_2px_0px_0px_#000] transition-all rounded-sm cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-black/60 font-bold uppercase tracking-widest mb-1.5">
                Extracted Payload Stream:
              </label>
              <textarea
                value={result.text || "[No text found or extracted from the selected source]"}
                readOnly
                className="w-full h-80 bg-white border-2 border-black p-4 text-black font-mono text-xs focus:outline-none focus:bg-[#faf7f2] rounded-sm resize-y leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setResult(null);
                  setFiles([]);
                }}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-neon-pink transition-all cursor-pointer rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>PROCESS ANOTHER FILE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="RUNNING SCAN_OCR_ENGINE" />
    </div>
  );
}
