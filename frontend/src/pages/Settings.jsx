import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Cpu, HardDrive, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../config";

export default function Settings() {
  const [pingStatus, setPingStatus] = useState("idle"); // idle, testing, online, offline
  const [latency, setLatency] = useState(0);
  const [diagnostics, setDiagnostics] = useState({
    tesseract_ocr: "LOADING",
    poppler_pdf2image: "LOADING",
  });

  // Safe localStorage helper
  const safeGetItem = (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [llmProvider, setLlmProvider] = useState(() => safeGetItem("neondocs_llm_provider", "openai"));
  const [llmKey, setLlmKey] = useState(() => safeGetItem("neondocs_llm_key", ""));
  const [llmModel, setLlmModel] = useState(() => safeGetItem("neondocs_llm_model", "gpt-4o"));
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const response = await fetch(`${API_BASE}/`);
        if (response.ok) {
          const data = await response.json();
          setDiagnostics(data.system_diagnostics);
        } else {
          throw new Error();
        }
      } catch {
        setDiagnostics({
          tesseract_ocr: "UNKNOWN",
          poppler_pdf2image: "UNKNOWN",
        });
      }
    };

    fetchDiagnostics();
  }, []);

  const handlePingTest = async () => {
    setPingStatus("testing");
    const startTime = performance.now();
    try {
      const response = await fetch(`${API_BASE}/`);
      if (response.ok) {
        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));
        setPingStatus("online");
        // refresh diagnostics too
        const data = await response.json();
        setDiagnostics(data.system_diagnostics);
      } else {
        setPingStatus("offline");
      }
    } catch {
      setPingStatus("offline");
    }
  };

  const handleSaveLLM = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("neondocs_llm_provider", llmProvider);
      localStorage.setItem("neondocs_llm_key", llmKey);
      localStorage.setItem("neondocs_llm_model", llmModel);
    } catch (err) {
      console.warn("localStorage is sandboxed or unavailable:", err);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
    } catch (err) {
      console.warn("localStorage clear failed:", err);
    }
    setLlmProvider("openai");
    setLlmKey("");
    setLlmModel("gpt-4o");
    alert("Application client-cache flushed successfully.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-[fadeIn_0.2s_ease-out] text-black">
      <div>
        <h2 className="font-sans font-black text-2xl text-black mb-1 flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-black" />
          <span>SYSTEM SETTINGS & DIAGNOSTICS</span>
        </h2>
        <p className="text-xs text-black/60 font-mono font-bold">
          ENDPOINT: CLIENT_HARDWARE_INTERFACE // CONNECTIVITY AND AI MODEL PROVIDERS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dependency diagnostics */}
        <div className="border-2 border-black bg-white p-5 rounded-md brutal-shadow-black flex flex-col gap-4">
          <h3 className="font-sans text-xs font-black text-black tracking-widest flex items-center gap-2 border-b-2 border-black/20 pb-2">
            <Cpu className="w-4 h-4 text-black" /> DEPENDENCY SCANNER
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center bg-cyber-dark p-2.5 border-2 border-black rounded-xs">
              <span className="text-black/80 font-bold">TESSERACT OCR CORE:</span>
              <span
                className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
                  diagnostics?.tesseract_ocr === "AVAILABLE"
                    ? "bg-neon-green text-black"
                    : diagnostics?.tesseract_ocr === "LOADING"
                    ? "bg-neon-purple text-black"
                    : "bg-neon-pink text-black"
                } rounded-xs`}
              >
                {diagnostics?.tesseract_ocr || "UNKNOWN"}
              </span>
            </div>

            <div className="flex justify-between items-center bg-cyber-dark p-2.5 border-2 border-black rounded-xs">
              <span className="text-black/80 font-bold">POPPLER BINARY CORE:</span>
              <span
                className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
                  diagnostics?.poppler_pdf2image === "AVAILABLE"
                    ? "bg-neon-green text-black"
                    : diagnostics?.poppler_pdf2image === "LOADING"
                    ? "bg-neon-purple text-black"
                    : "bg-neon-pink text-black"
                } rounded-xs`}
              >
                {diagnostics?.poppler_pdf2image || "UNKNOWN"}
              </span>
            </div>

            <div className="flex justify-between items-center bg-cyber-dark p-2.5 border-2 border-black rounded-xs">
              <span className="text-black/80 font-bold">CORE API CONNECTION:</span>
              {pingStatus === "idle" && (
                <span className="text-[10px] text-black font-black">READY</span>
              )}
              {pingStatus === "testing" && (
                <span className="text-[10px] text-neon-cyan font-black animate-pulse">TESTING...</span>
              )}
              {pingStatus === "online" && (
                <span className="text-[10px] text-neon-green font-black flex items-center gap-1">
                  ONLINE ({latency}ms)
                </span>
              )}
              {pingStatus === "offline" && (
                <span className="text-[10px] text-neon-pink font-black">DISCONNECTED</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePingTest}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black bg-neon-cyan hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] text-black font-mono text-xs font-black transition-all cursor-pointer rounded-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === "testing" ? "animate-spin" : ""}`} />
              <span>TEST CORE LATENCY</span>
            </button>
          </div>
        </div>

        {/* AI LLM Settings */}
        <div className="border-2 border-black bg-white p-5 rounded-md brutal-shadow-black flex flex-col gap-4">
          <h3 className="font-sans text-xs font-black text-black tracking-widest flex items-center gap-2 border-b-2 border-black/20 pb-2">
            <Sparkles className="w-4 h-4 text-black" /> PRODUCTION AI CRADLE
          </h3>

          <form onSubmit={handleSaveLLM} className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="block text-[9px] text-black/70 uppercase tracking-widest font-black">Model Provider:</label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:bg-neon-purple/5 font-bold rounded-xs cursor-pointer"
              >
                <option value="openai">OpenAI Api Core</option>
                <option value="gemini">Google Gemini Developer Core</option>
                <option value="anthropic">Anthropic Claude Engines</option>
                <option value="custom">Custom RAG Loop</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-black/70 uppercase tracking-widest font-black">Target Model:</label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="e.g. gpt-4o"
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:bg-neon-purple/5 font-bold rounded-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] text-black/70 uppercase tracking-widest font-black">API Secret Key:</label>
              <input
                type="password"
                value={llmKey}
                onChange={(e) => setLlmKey(e.target.value)}
                placeholder="sk-••••••••••••••••••••"
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:bg-neon-purple/5 font-bold rounded-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-black bg-neon-purple hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all text-black font-sans font-black tracking-wider cursor-pointer rounded-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <span>SAVE CONFIG</span>
              </button>
              {saveSuccess && (
                <span className="text-[10px] text-neon-green font-black flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> APPLIED
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Global cache operations */}
        <div className="border-2 border-black bg-white p-5 rounded-md brutal-shadow-black flex flex-col gap-4 md:col-span-2">
          <h3 className="font-sans text-xs font-black text-black tracking-widest flex items-center gap-2 border-b-2 border-black/20 pb-2">
            <HardDrive className="w-4 h-4 text-black" /> MEMORY & SPACE OPTIMIZATION
          </h3>
          <p className="text-xs text-black/80 font-sans font-bold leading-relaxed">
            The NeonDocs Cybernetic Core caches settings, models, and metadata on the client-side. Trigger a memory
            flush to clean local files, reset mock keys, and clear diagnostic flags.
          </p>
          <div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-black bg-neon-pink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] text-black font-mono text-xs font-black transition-all cursor-pointer rounded-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>FLUSH SYSTEM SPACE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
