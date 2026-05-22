import { useState, useEffect } from "react";
import { Menu, Cpu, HardDrive } from "lucide-react";

export default function Navbar({ setSidebarOpen, backendStatus }) {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeStr(
        date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b-2 border-black bg-white/90 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Toggle & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 md:hidden border-2 border-black bg-[#faf6ee] hover:bg-black hover:text-white transition-all text-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 text-black font-mono text-xs font-bold">
          <Cpu className="w-4 h-4 text-black" />
          <span className="terminal-tag tracking-wider text-[10px] font-black">HOST_SYSTEM_DIAGNOSTICS:</span>
        </div>

        {/* Backend status badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {backendStatus ? (
            <>
              <span className={`px-2.5 py-0.5 border-2 border-black font-black shadow-[1px_1px_0px_0px_#000] ${
                backendStatus.system_diagnostics?.tesseract_ocr === "AVAILABLE" 
                  ? "bg-neon-green text-black" 
                  : "bg-neon-pink text-black"
              }`}>
                OCR: {backendStatus.system_diagnostics?.tesseract_ocr || "OFFLINE"}
              </span>
              <span className={`px-2.5 py-0.5 border-2 border-black font-black shadow-[1px_1px_0px_0px_#000] ${
                backendStatus.system_diagnostics?.poppler_pdf2image === "AVAILABLE" 
                  ? "bg-neon-green text-black" 
                  : "bg-neon-pink text-black"
              }`}>
                POPPLER: {backendStatus.system_diagnostics?.poppler_pdf2image || "OFFLINE"}
              </span>
            </>
          ) : (
            <span className="px-2.5 py-0.5 border-2 border-black font-black bg-neon-pink text-black shadow-[1px_1px_0px_0px_#000] animate-pulse">
              BACKEND: OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Clock and extra actions */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="font-mono text-sm font-black text-black border-2 border-black px-3 py-1 bg-neon-purple tracking-wider shadow-[3px_3px_0px_0px_#000]">
          {timeStr || "00:00:00"}
        </div>
        
        <div className="hidden sm:flex items-center gap-1 text-black/85 font-mono text-[10px] font-bold">
          <span className="terminal-tag font-black">TOKYO_NODE</span>
          <HardDrive className="w-3.5 h-3.5 text-black ml-1" />
        </div>
      </div>
    </header>
  );
}
