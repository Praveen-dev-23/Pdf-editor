import { useState, useRef } from "react";
import { PenTool, Download, RefreshCw, Upload, FileText } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function ESigner() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // E-Signature type: 'draw' or 'upload'
  const [sigType, setSigType] = useState("draw");
  const [sigImage, setSigImage] = useState(null); // DataURL
  const [sigUploadFile, setSigUploadFile] = useState(null);

  // Positioning
  const [page, setPage] = useState(1);
  const [xPct, setXPct] = useState(60);
  const [yPct, setYPct] = useState(80);
  const [widthPct, setWidthPct] = useState(25);
  const [heightPct, setHeightPct] = useState(10);

  // Drawing Canvas references
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync drawing canvas to state
  const saveCanvasSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // Check if canvas is blank
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      setSigImage(null);
      return;
    }
    setSigImage(canvas.toDataURL());
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000"; // solid black signature ink

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigImage(null);
  };

  // Handle local file upload for signature image
  const handleSigUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSigUploadFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSigImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to percentage
    const x_p = Math.min(Math.max(((x / rect.width) * 100) - (widthPct / 2), 0), 100 - widthPct);
    const y_p = Math.min(Math.max(((y / rect.height) * 100) - (heightPct / 2), 0), 100 - heightPct);

    setXPct(Math.round(x_p));
    setYPct(Math.round(y_p));
  };

  const handleSign = async () => {
    if (files.length === 0 || !sigImage) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("page", page);
    formData.append("x_pct", xPct);
    formData.append("y_pct", yPct);
    formData.append("width_pct", widthPct);
    formData.append("height_pct", heightPct);

    if (sigType === "draw") {
      formData.append("signature_data_url", sigImage);
    } else if (sigUploadFile) {
      formData.append("signature_file", sigUploadFile);
    } else {
      // Fallback if dataURL is loaded but file isn't present
      formData.append("signature_data_url", sigImage);
    }

    try {
      const response = await fetch(`${API_BASE}/pdf/sign-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during PDF signing.");
      }

      const data = await response.json();
      setResult(data);
      confetti({
        particleCount: 100,
        spread: 70,
        colors: ["#00f0ff", "#ff007f", "#39ff14"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to inject digital signature.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    window.location.href = `${API_BASE}/download/${result.download_id}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    return (bytes / (k * k)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-black" />
          <span>E-SIGNATURE COMPOSER</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: SIG_PLACEMENT_ENGINE // DRAW OR UPLOAD AND PLACE INTERACTIVELY
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Drag & drop your PDF here to sign"
            multiple={false}
          />

          {files.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-[fadeIn_0.3s_ease-out]">
              
              {/* Left Side: Signature Creation Panel (Col 5) */}
              <div className="lg:col-span-5 space-y-4 border-2 border-black bg-white p-4 rounded-md brutal-shadow-black">
                <div className="border-b-2 border-black/10 pb-2">
                  <h4 className="font-sans text-xs font-black text-black tracking-widest uppercase">
                    1. Create Signature
                  </h4>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSigType("draw");
                      setSigImage(null);
                    }}
                    className={`py-1.5 font-mono text-[10px] uppercase border-2 border-black transition-all cursor-pointer rounded-sm shadow-[2px_2px_0px_0px_#000] ${
                      sigType === "draw"
                        ? "bg-black text-white font-bold"
                        : "bg-white text-black/70 hover:text-black hover:bg-[#faf7f2]"
                    }`}
                  >
                    Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSigType("upload");
                      setSigImage(null);
                    }}
                    className={`py-1.5 font-mono text-[10px] uppercase border-2 border-black transition-all cursor-pointer rounded-sm shadow-[2px_2px_0px_0px_#000] ${
                      sigType === "upload"
                        ? "bg-black text-white font-bold"
                        : "bg-white text-black/70 hover:text-black hover:bg-[#faf7f2]"
                    }`}
                  >
                    Upload Image
                  </button>
                </div>

                {/* Creator area */}
                {sigType === "draw" ? (
                  <div className="space-y-2">
                    <div className="relative border-2 border-black bg-white rounded-sm overflow-hidden h-36">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={144}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair touch-none bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="w-full py-1.5 border-2 border-black bg-[#faf7f2] text-black font-mono text-[10px] hover:bg-neon-pink transition-all cursor-pointer rounded-sm shadow-[1.5px_1.5px_0px_0px_#000]"
                    >
                      CLEAR CANVAS
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-[#faf7f2] rounded-sm h-36 cursor-pointer hover:bg-white transition-all p-4">
                      <Upload className="w-6 h-6 text-black mb-2" />
                      <span className="text-[10px] font-mono text-black/60 text-center">
                        {sigUploadFile ? sigUploadFile.name : "Select transparent signature PNG"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleSigUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Placement parameters */}
                <div className="pt-4 border-t-2 border-black/10 space-y-3">
                  <div className="border-b-2 border-black/10 pb-1">
                    <h5 className="font-sans text-[10px] text-black font-black tracking-wider uppercase">
                      2. Signature Size
                    </h5>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-black/60">
                        <span>WIDTH:</span>
                        <span className="text-black font-black">{widthPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={widthPct}
                        onChange={(e) => setWidthPct(parseInt(e.target.value))}
                        className="w-full h-2 bg-white border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-black/60">
                        <span>HEIGHT:</span>
                        <span className="text-black font-black">{heightPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="25"
                        value={heightPct}
                        onChange={(e) => setHeightPct(parseInt(e.target.value))}
                        className="w-full h-2 bg-white border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border-b-2 border-black/10 pb-1">
                    <h5 className="font-sans text-[10px] text-black font-black tracking-wider uppercase">
                      3. Target Page
                    </h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-mono text-black/60">PAGE INDEX:</label>
                    <input
                      type="number"
                      min="1"
                      value={page}
                      onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-white border-2 border-black px-2 py-1 text-black font-mono text-xs focus:outline-none focus:bg-[#faf7f2] rounded-sm text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Positioning Page Canvas (Col 7) */}
              <div className="lg:col-span-7 space-y-4 border-2 border-black bg-white p-4 rounded-md brutal-shadow-black flex flex-col items-center">
                <div className="border-b-2 border-black/10 pb-2 w-full text-left">
                  <h4 className="font-sans text-xs font-black text-black tracking-widest uppercase">
                    4. Position Placement (Click to Place)
                  </h4>
                </div>

                {/* Page representation */}
                <div
                  onClick={handleDocumentClick}
                  className="relative w-64 h-90 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-sm cursor-crosshair overflow-hidden select-none p-4 flex flex-col justify-between"
                  style={{ aspectRatio: "1 / 1.414" }}
                >
                  {/* Decorative dot page watermark */}
                  <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />
                  
                  {/* Mock document layout blocks */}
                  <div className="space-y-3 pointer-events-none">
                    <div className="h-4 bg-black/15 w-2/3 rounded-xs" />
                    <div className="space-y-1.5 pt-2">
                      <div className="h-2 bg-black/10 w-full rounded-xs" />
                      <div className="h-2 bg-black/10 w-full rounded-xs" />
                      <div className="h-2 bg-black/10 w-5/6 rounded-xs" />
                    </div>
                    <div className="space-y-1.5 pt-4">
                      <div className="h-2 bg-black/10 w-full rounded-xs" />
                      <div className="h-2 bg-black/10 w-3/4 rounded-xs" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pointer-events-none self-end w-1/2">
                    <div className="h-2 bg-black/10 w-full rounded-xs" />
                    <div className="h-2 bg-black/10 w-2/3 rounded-xs" />
                  </div>

                  {/* Absolute Signature Box overlay */}
                  <div
                    className={`absolute border-2 border-dashed border-black bg-black/5 flex items-center justify-center transition-all duration-75 pointer-events-none`}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                  >
                    {sigImage ? (
                      <img
                        src={sigImage}
                        alt="Signature Overlay"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[7px] font-mono text-black font-black tracking-tighter uppercase text-center p-0.5">
                        NO SIG
                      </span>
                    )}
                  </div>

                  {/* Header / Footer mock indicators */}
                  <div className="flex justify-between text-[7px] font-mono text-black/50 pointer-events-none uppercase">
                    <span>DOCUMENT STREAM // PREVIEW</span>
                    <span>PAGE {page}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-black/60">
                      <span>X OFFSET (LEFT):</span>
                      <span className="text-black font-black">{xPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, 100 - widthPct)}
                      value={xPct}
                      onChange={(e) => setXPct(parseInt(e.target.value))}
                      className="w-full h-2 bg-white border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-black/60">
                      <span>Y OFFSET (TOP):</span>
                      <span className="text-black font-black">{yPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, 100 - heightPct)}
                      value={yPct}
                      onChange={(e) => setYPct(parseInt(e.target.value))}
                      className="w-full h-2 bg-white border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <button
              type="button"
              onClick={handleSign}
              disabled={!sigImage}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black font-sans font-black tracking-wider transition-all cursor-pointer ${
                sigImage
                  ? "bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-neon-purple)] active:translate-x-[2px] active:translate-y-[2px]"
                  : "bg-black/10 text-black/40 border-black/20 cursor-not-allowed"
              }`}
            >
              <span>INJECT DIGITAL SIGNATURE</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-neon-pink text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000] animate-[fadeIn_0.2s_ease-out]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-black bg-white rounded-md p-6 text-center space-y-6 brutal-shadow-black max-w-md mx-auto animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-center">
            <div className="relative p-4 bg-[#faf7f2] border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="w-12 h-12 text-black" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full animate-ping" />
            </div>
          </div>

          <div>
            <h4 className="font-sans font-black text-black tracking-wide text-sm truncate mb-1">
              {result.filename}
            </h4>
            <p className="font-mono text-xs text-black/60">
              FILE SIZE: {formatSize(result.size)}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-neon-cyan text-black font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD SIGNED PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setFiles([]);
                setSigImage(null);
                setSigUploadFile(null);
                setXPct(60);
                setYPct(80);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs hover:bg-neon-pink transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SIGN ANOTHER FILE</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="COMPILING DIGITAL SIGNATURE TO PDF" />
    </div>
  );
}
