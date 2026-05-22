import { useState } from "react";
import { Edit3, Download, RefreshCw, Trash2, Plus, FileText } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function PdfEditor() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Edit Configuration States
  const [watermark, setWatermark] = useState("");
  const [addPageNumbers, setAddPageNumbers] = useState(false);
  const [pagesToDelete, setPagesToDelete] = useState("");
  
  // Rotations: array of { page: number, angle: 90/180/270 }
  const [rotations, setRotations] = useState([]);
  const [rotPage, setRotPage] = useState("1");
  const [rotAngle, setRotAngle] = useState("90");

  // Text Overlays: array of { text, x_pct, y_pct, font_size, color, page }
  const [textElements, setTextElements] = useState([]);
  const [newText, setNewText] = useState("");
  const [newTextPage, setNewTextPage] = useState("1");
  const [newTextSize, setNewTextSize] = useState(14);
  const [newTextColor, setNewTextColor] = useState("#00f0ff");
  const [newTextX, setNewTextX] = useState(10);
  const [newTextY, setNewTextY] = useState(10);

  const addRotation = () => {
    const pageNum = parseInt(rotPage);
    const angleNum = parseInt(rotAngle);
    if (isNaN(pageNum) || pageNum <= 0) return;
    
    // Remove existing rotation for this page if any
    const filtered = rotations.filter((r) => r.page !== pageNum);
    setRotations([...filtered, { page: pageNum, angle: angleNum }]);
    setRotPage("");
  };

  const removeRotation = (index) => {
    setRotations(rotations.filter((_, i) => i !== index));
  };

  const addTextElement = () => {
    if (!newText.trim()) return;
    const pageNum = parseInt(newTextPage);
    if (isNaN(pageNum) || pageNum <= 0) return;

    setTextElements([
      ...textElements,
      {
        text: newText,
        x_pct: parseFloat(newTextX),
        y_pct: parseFloat(newTextY),
        font_size: parseInt(newTextSize),
        color: newTextColor,
        page: pageNum,
      },
    ]);
    setNewText("");
  };

  const removeTextElement = (index) => {
    setTextElements(textElements.filter((_, i) => i !== index));
  };

  const handleEdit = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // Format rotations as dictionary: { "1": 90, "2": 180 }
    const rotationsDict = {};
    rotations.forEach((r) => {
      rotationsDict[String(r.page)] = r.angle;
    });

    // Format pages to delete as list of ints
    const deleteList = pagesToDelete
      .split(",")
      .map((p) => parseInt(p.trim()))
      .filter((p) => !isNaN(p) && p > 0);

    const editConfig = {
      pages_to_delete: deleteList,
      rotations: rotationsDict,
      watermark_text: watermark.trim() || null,
      text_elements: textElements,
      add_page_numbers: addPageNumbers,
    };

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("edit_config", JSON.stringify(editConfig));

    try {
      const response = await fetch(`${API_BASE}/pdf/edit-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during PDF editing.");
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
      setError(err.message || "Failed to execute PDF edits.");
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
    <div className="space-y-6 text-black">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-black" />
          <span>PDF EDITOR COMMAND</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: PDF_EDIT_COMPOSER // WATERMARKS, ROTATIONS, AND TEXT OVERLAYS
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Drag & drop your PDF file here to begin editing"
            multiple={false}
          />

          {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s_ease-out]">
              {/* Left Column: Metadata & Global Tweaks */}
              <div className="space-y-4 border-2 border-black bg-[#faf7f2] p-4 rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
                <div className="border-b-2 border-black/20 pb-2">
                  <h4 className="font-sans text-xs font-black text-black tracking-widest uppercase">
                    SYSTEM TWEAKS & WATERMARKS
                  </h4>
                </div>

                {/* Watermark */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-black/75 uppercase tracking-wider font-bold">
                    Diagonal Watermark Text:
                  </label>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL"
                    className="w-full bg-white border-2 border-black px-3 py-2 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs"
                  />
                </div>

                {/* Page Deletions */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-black/75 uppercase tracking-wider font-bold">
                    Delete Pages (comma separated):
                  </label>
                  <input
                    type="text"
                    value={pagesToDelete}
                    onChange={(e) => setPagesToDelete(e.target.value)}
                    placeholder="e.g. 2, 4, 7"
                    className="w-full bg-white border-2 border-black px-3 py-2 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs"
                  />
                </div>

                {/* Page Numbers Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="addPageNumbers"
                    checked={addPageNumbers}
                    onChange={(e) => setAddPageNumbers(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-black bg-white text-black focus:ring-0 cursor-pointer accent-black"
                  />
                  <label htmlFor="addPageNumbers" className="text-[11px] font-mono text-black/80 uppercase tracking-wider cursor-pointer select-none font-bold">
                    Overlay Footer Page Numbers (Page X of Y)
                  </label>
                </div>

                {/* Rotations */}
                <div className="pt-2 border-t-2 border-black/15 space-y-3">
                  <label className="block text-[10px] font-mono text-black/75 uppercase tracking-wider font-bold">
                    Configure Page Rotations:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Page #"
                      value={rotPage}
                      onChange={(e) => setRotPage(e.target.value)}
                      className="w-20 bg-white border-2 border-black px-2 py-1.5 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs text-center"
                    />
                    <select
                      value={rotAngle}
                      onChange={(e) => setRotAngle(e.target.value)}
                      className="flex-1 bg-white border-2 border-black px-2 py-1.5 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs"
                    >
                      <option value="90">90° CW</option>
                      <option value="180">180° Flip</option>
                      <option value="270">270° CCW</option>
                    </select>
                    <button
                      type="button"
                      onClick={addRotation}
                      className="px-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-mono text-xs rounded-xs flex items-center gap-1 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000] font-black active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> ADD
                    </button>
                  </div>

                  {rotations.length > 0 && (
                    <div className="border-2 border-black rounded-xs bg-white p-2 max-h-28 overflow-y-auto space-y-1.5">
                      {rotations.map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-mono text-black/80 bg-[#faf7f2] px-2.5 py-1 border border-black/30 rounded-xs">
                          <span className="font-bold">PAGE {r.page} → ROTATE {r.angle}°</span>
                          <button
                            type="button"
                            onClick={() => removeRotation(i)}
                            className="text-[#ff3366] hover:text-red-700 transition-all cursor-pointer font-black"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Custom Text Overlays */}
              <div className="space-y-4 border-2 border-black bg-[#faf7f2] p-4 rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
                <div className="border-b-2 border-black/20 pb-2">
                  <h4 className="font-sans text-xs font-black text-black tracking-widest uppercase">
                    TEXT OVERLAY INJECTORS
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono text-black/60 uppercase font-bold">Text String:</label>
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="e.g. APPROVED BY DEPT // 2026"
                      className="w-full bg-white border-2 border-black px-3 py-1.5 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-black/60 uppercase font-bold">Page:</label>
                      <input
                        type="number"
                        min="1"
                        value={newTextPage}
                        onChange={(e) => setNewTextPage(e.target.value)}
                        className="w-full bg-white border-2 border-black px-2 py-1 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-black/60 uppercase font-bold">Size (pt):</label>
                      <input
                        type="number"
                        min="6"
                        max="72"
                        value={newTextSize}
                        onChange={(e) => setNewTextSize(e.target.value)}
                        className="w-full bg-white border-2 border-black px-2 py-1 text-black font-mono text-xs focus:outline-none focus:bg-neon-cyan/5 rounded-xs text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-black/60 uppercase font-bold">Color:</label>
                      <div className="flex items-center gap-1.5 bg-white border-2 border-black px-2 py-1 rounded-xs">
                        <input
                          type="color"
                          value={newTextColor}
                          onChange={(e) => setNewTextColor(e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 outline-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-black/60 uppercase select-none font-bold">{newTextColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Positioning Sliders */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-black/60 font-bold">
                        <span>X OFFSET:</span>
                        <span className="text-black font-black">{newTextX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newTextX}
                        onChange={(e) => setNewTextX(e.target.value)}
                        className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-black/60 font-bold">
                        <span>Y OFFSET (TOP):</span>
                        <span className="text-black font-black">{newTextY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newTextY}
                        onChange={(e) => setNewTextY(e.target.value)}
                        className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addTextElement}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-mono text-xs font-black transition-all rounded-xs cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1.5px] active:translate-y-[1.5px]"
                  >
                    <Plus className="w-4 h-4" /> ADD TEXT OVERLAY
                  </button>
                </div>

                {textElements.length > 0 && (
                  <div className="border-2 border-black rounded-xs bg-white p-2 max-h-36 overflow-y-auto space-y-1.5">
                    {textElements.map((el, i) => (
                      <div key={i} className="flex justify-between items-start text-[10px] font-mono text-black/80 bg-[#faf7f2] p-2 border border-black/30 rounded-xs">
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="text-black font-black truncate">"{el.text}"</p>
                          <p className="text-black/60 text-[9px] font-bold">
                            PG {el.page} // X:{el.x_pct}% Y:{el.y_pct}% // {el.font_size}pt{" "}
                            <span style={{ color: el.color }} className="font-bold border border-black/20 rounded-full px-0.5 bg-white">●</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTextElement(i)}
                          className="text-[#ff3366] hover:text-red-700 transition-all cursor-pointer mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#38bdf8] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>COMPILE PDF EDITS</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-[#ff3366] text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000] animate-[fadeIn_0.2s_ease-out]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-black bg-white rounded-md p-6 text-center space-y-6 brutal-shadow-black max-w-md mx-auto animate-[fadeIn_0.3s_ease-out] text-black">
          <div className="flex justify-center">
            <div className="relative p-4 bg-[#38bdf8]/10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
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

          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-[#38bdf8] text-black font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD EDITED PDF</span>
            </button>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
                setWatermark("");
                setRotations([]);
                setTextElements([]);
                setAddPageNumbers(false);
                setPagesToDelete("");
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border-2 border-black bg-[#faf7f2] text-black font-mono text-xs font-bold hover:bg-[#ff3366] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>EDIT ANOTHER FILE</span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="APPLYING SYSTEM EDITS TO PDF" />
    </div>
  );
}
