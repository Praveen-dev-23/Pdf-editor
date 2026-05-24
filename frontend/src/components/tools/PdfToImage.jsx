import { useState } from "react";
import { Images, Download, RefreshCw } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function PdfToImage() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("PNG"); // 'PNG', 'JPG'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("image_format", format);

    try {
      const response = await fetch(`${API_BASE}/pdf/convert/pdf-to-image`, {
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
        particleCount: 110,
        spread: 75,
        colors: ["#00f0ff", "#9d4edd", "#39ff14", "#ff007f"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to convert PDF to images. Ensure Poppler is installed.");
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
          <Images className="w-5 h-5 text-black" />
          <span>PDF TO IMAGE MODULE</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: PDF_TO_IMAGE_CONVERTER // ACCEPTS: SINGLE PDF
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Upload single PDF to convert to images"
            multiple={false}
          />

          {files.length > 0 && (
            <div className="border-2 border-black bg-white rounded-md p-4 space-y-4 shadow-[3px_3px_0px_0px_#000]">
              <span className="terminal-tag text-[9px] text-black font-black block border-b-2 border-black/10 pb-1.5">
                IMAGE_EXPORT_SETTINGS
              </span>

              <div className="flex gap-4">
                {[
                  { id: "PNG", label: "PNG FORMAT", desc: "Lossless quality with transparent support" },
                  { id: "JPG", label: "JPG FORMAT", desc: "Compressed photographic formatting" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`
                      flex-1 px-3 py-2 border-2 border-black text-xs font-mono font-black tracking-wider cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[60px]
                      ${format === opt.id 
                        ? "bg-neon-cyan text-black shadow-[2.5px_2.5px_0px_0px_#000]" 
                        : "bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-black/5"
                      }
                    `}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[8px] opacity-75 font-normal tracking-normal">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleConvert}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-neon-cyan)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>RUN CONVERSION TO IMAGES</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-neon-pink text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-black bg-white rounded-md p-6 text-center space-y-6 brutal-shadow-black max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-center">
            <div className="relative p-4 bg-neon-cyan/10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Images className="w-12 h-12 text-black" />
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

          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-neon-cyan text-black font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD ZIP BUNDLE</span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-neon-pink transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>CONVERT ANOTHER PDF</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="RENDERING PDF TO IMAGES" />
    </div>
  );
}
