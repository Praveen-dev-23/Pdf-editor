import { useState } from "react";
import { Zap, Download, RefreshCw, Scale } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function PdfCompressor() {
  const [files, setFiles] = useState([]);
  const [level, setLevel] = useState("medium"); // 'low', 'medium', 'high'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCompress = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("level", level);

    try {
      const response = await fetch(`${API_BASE}/pdf/compress-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during compression.");
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 110,
        spread: 80,
        colors: ["#9d4edd", "#00f0ff", "#ff007f", "#39ff14"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to compress PDF.");
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
    if (bytes < k * k) return (bytes / k).toFixed(1) + " KB";
    return (bytes / (k * k)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6 text-black">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5 text-black" />
          <span>PDF COMPRESSOR GATEWAY</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: DOWNRES_BYTE_STREAMS // ACCEPTS: SINGLE PDF
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Upload single PDF to compress"
            multiple={false}
          />

          {files.length > 0 && (
            <div className="border-2 border-black bg-white rounded-md p-4 space-y-4 shadow-[3px_3px_0px_0px_#000]">
              <span className="terminal-tag text-[9px] text-black font-black block border-b-2 border-black/10 pb-1.5">
                COMPRESSION_LEVEL_SETTINGS
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "low", label: "LOW COMPRESSION", desc: "No image downscaling (stream only)" },
                  { id: "medium", label: "MEDIUM OPTIMAL", desc: "Optimal quality/size ratio (130 DPI)" },
                  { id: "high", label: "HIGH COMPACT", desc: "Maximum compression (75 DPI)" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevel(opt.id)}
                    className={`
                      px-3 py-2 border-2 border-black text-xs font-mono font-black tracking-wider cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[70px]
                      ${level === opt.id 
                        ? "bg-[#facc15] text-black shadow-[2.5px_2.5px_0px_0px_#000]" 
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
              onClick={handleCompress}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#facc15] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>RUN COMPRESSION ALGORITHM</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-[#ff3366] text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-black bg-white rounded-md p-6 text-center space-y-6 brutal-shadow-black max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-center">
            <div className="relative p-4 bg-[#facc15]/10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Scale className="w-12 h-12 text-black" />
              <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-black rounded-full animate-ping" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-sans font-black text-black tracking-tight text-sm truncate mb-1">
              COMPRESSION REPORT
            </h4>
            
            {/* Compression Gauge Comparison */}
            <div className="border-2 border-black bg-[#faf7f2] rounded-md p-4 space-y-3 font-mono text-xs text-left text-black">
              <div className="flex justify-between">
                <span className="text-black/60 font-bold">ORIGINAL SIZE:</span>
                <span className="text-black font-black">{formatSize(result.original_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60 font-bold">COMPRESSED SIZE:</span>
                <span className="text-black font-black bg-[#38bdf8] px-1 border border-black">{formatSize(result.compressed_size)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-black font-bold">
                <span className="text-black/60 font-bold">BYTES DELETED:</span>
                <span className="text-black font-black bg-[#22c55e] px-1 border border-black">
                  {formatSize(result.original_size - result.compressed_size)} ({result.ratio}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-[#facc15] text-black font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD COMPRESSED</span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-[#ff3366] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>COMPRESS ANOTHER</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="COMPRESSING DOCUMENT STREAM" />
    </div>
  );
}
