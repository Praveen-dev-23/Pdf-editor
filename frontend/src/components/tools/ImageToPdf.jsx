import { useState } from "react";
import { FileImage, Download, RefreshCw, FileText } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_BASE}/pdf/convert/image-to-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during conversion.");
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ["#5c8fcc", "#e16b5a", "#31a39d", "#f3bf57"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to convert images to PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    window.location.href = `${API_BASE}/download/${result.download_id}`;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    return (bytes / (k * k)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6 text-black">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <FileImage className="w-5 h-5 text-black" />
          <span>IMAGE TO PDF CONVERTER</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: COMPOSE_IMAGE_STREAM // ACCEPTS: JPG, PNG, WEBP
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".jpg,.jpeg,.png,.webp"
            description="Drag & drop images here, or click to upload"
            multiple={true}
          />

          {files.length > 0 && (
            <button
              onClick={handleConvert}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#5c8fcc] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>COMPILE TO PDF</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-[#e16b5a] text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-black bg-white rounded-md p-6 text-center space-y-6 brutal-shadow-black max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-center">
            <div className="relative p-4 bg-[#5c8fcc]/10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="w-12 h-12 text-black" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-black rounded-full animate-ping" />
            </div>
          </div>

          <div>
            <h4 className="font-sans font-black text-black tracking-tight text-sm truncate mb-1">
              {result.filename}
            </h4>
            <p className="font-mono text-xs text-black/60 font-bold">
              FILE SIZE: {formatSize(result.size)}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-[#31a39d] text-white font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD EXPORT</span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-[#e16b5a] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>CONVERT ANOTHER</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="COMPILING IMAGES TO PDF" />
    </div>
  );
}
