import { useState } from "react";
import { Scissors, Download, RefreshCw, FileText } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function PdfSplitter() {
  const [files, setFiles] = useState([]);
  const [splitType, setSplitType] = useState("individual"); // 'individual', 'ranges', 'parity'
  const [ranges, setRanges] = useState("");
  const [parity, setParity] = useState("both"); // 'odd', 'even', 'both'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSplit = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("split_type", splitType);
    
    if (splitType === "ranges") {
      if (!ranges.trim()) {
        setError("Ranges cannot be empty. E.g. '1-3, 5-8'");
        setLoading(false);
        return;
      }
      formData.append("ranges", ranges);
    } else if (splitType === "parity") {
      formData.append("parity", parity);
    }

    try {
      const response = await fetch(`${API_BASE}/pdf/split-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during PDF splitting.");
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 100,
        spread: 70,
        colors: ["#31a39d", "#5c8fcc", "#e16b5a", "#f3bf57"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to split PDF.");
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
          <Scissors className="w-5 h-5 text-black" />
          <span>PDF SPLITTER MODULE</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: SEPARATE_STREAMS // ACCEPTS: SINGLE PDF
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Upload single PDF to split"
            multiple={false}
          />

          {files.length > 0 && (
            <div className="border-2 border-black bg-white rounded-md p-4 space-y-4 shadow-[3px_3px_0px_0px_#000]">
              <span className="terminal-tag text-[9px] text-black font-black block border-b-2 border-black/10 pb-1.5">
                SPLIT_CONFIGURATION
              </span>

              {/* Split Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "individual", label: "INDIVIDUAL PAGES" },
                  { id: "ranges", label: "PAGE RANGES" },
                  { id: "parity", label: "ODD / EVEN" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSplitType(opt.id)}
                    className={`
                      px-3 py-2 border-2 border-black text-xs font-mono font-black tracking-wider cursor-pointer transition-all
                      ${splitType === opt.id 
                        ? "bg-[#31a39d] text-white shadow-[2.5px_2.5px_0px_0px_#000]" 
                        : "bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-black/5"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Range Input */}
              {splitType === "ranges" && (
                <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-xs font-mono text-black/60 font-bold uppercase">
                    Define page ranges (comma separated):
                  </label>
                  <input
                    type="text"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="e.g., 1-3, 5-7, 10"
                    className="w-full bg-white border-2 border-black rounded-xs px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-[#faf7f2]"
                  />
                  <p className="text-[10px] text-black/50 font-mono font-bold">
                    Use dash (-) for page sequences, and comma (,) to separate split batches.
                  </p>
                </div>
              )}

              {/* Parity Selector */}
              {splitType === "parity" && (
                <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-xs font-mono text-black/60 font-bold uppercase">
                    Select parity filter:
                  </label>
                  <select
                    value={parity}
                    onChange={(e) => setParity(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-xs px-3 py-2 text-xs font-mono text-black focus:outline-none focus:bg-[#faf7f2]"
                  >
                    <option value="both">EXTRACT BOTH (ZIP FILE)</option>
                    <option value="odd">ODD PAGES ONLY</option>
                    <option value="even">EVEN PAGES ONLY</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleSplit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#31a39d] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>RUN SPLIT OPERATION</span>
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
            <div className="relative p-4 bg-[#31a39d]/10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
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
              <span>DOWNLOAD EXPORTS</span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-[#e16b5a] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SPLIT ANOTHER FILE</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="EXECUTING SPLIT ROUTINE" />
    </div>
  );
}
