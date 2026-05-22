import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

// If standard logs are not supplied, generate realistic cyberpunk system logs
const DEFAULT_LOGS = [
  "[SYS] INITIALIZING CONVERSION RUNTIME...",
  "[SYS] MOUNTING TEMPORARY FILE BUFFER...",
  "[SYS] RESOLVING BINARY SUB-PROCESSES...",
  "[SYS] PROCESSING TARGET STREAM STRUCTURE...",
  "[SYS] PERFORMING HEAVY OPERATIONS (BYTE BUFFER)...",
  "[SYS] RENDER PIPELINE: GENERATING PDF BLOB...",
  "[SYS] WRITING METASTREAM HEADER DICTIONARIES...",
  "[SYS] PIPELINE FLUSH: SAVING TO SOLID STATE CACHE...",
  "[SYS] WRITING TEMPORARY DOWNLOAD DISPATCH ID...",
  "[SYS] TASK COMPLETED. RESPONSE DISPATCH CODE: 200 OK"
];

export default function LoadingOverlay({ 
  loading, 
  title = "PROCESSING FILES", 
  logs = [] 
}) {
  const [terminalLogs, setTerminalLogs] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setTerminalLogs([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setTerminalLogs([logs[0] || DEFAULT_LOGS[0]]);
    }, 0);

    let currentIdx = 1;

    const interval = setInterval(() => {
      if (logs.length > 0) {
        if (currentIdx < logs.length) {
          setTerminalLogs(prev => [...prev, logs[currentIdx]]);
          currentIdx++;
        }
      } else {
        if (currentIdx < DEFAULT_LOGS.length) {
          setTerminalLogs(prev => [...prev, DEFAULT_LOGS[currentIdx]]);
          currentIdx++;
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loading, logs]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-lg border-2 border-black bg-cyber-card rounded-md p-6 brutal-shadow-cyan flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
          <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-ping shrink-0" />
          <h2 className="font-sans font-black text-sm tracking-wider text-black m-0">
            {title}
          </h2>
          <span className="terminal-tag font-bold text-[9px] text-zinc-500 ml-auto">
            OP_RUNNING
          </span>
        </div>

        {/* Loader Icon */}
        <div className="flex justify-center py-4">
          <div className="relative w-16 h-16">
            {/* Pulsing ring */}
            <div className="absolute inset-0 border-2 border-dashed border-neon-cyan rounded-full animate-[spin_6s_linear_infinite]" />
            {/* Fast inner spinner */}
            <div className="absolute inset-2 border-2 border-neon-pink rounded-full border-t-transparent animate-[spin_1.5s_linear_infinite]" />
            {/* Center dot */}
            <div className="absolute inset-6 bg-white rounded-full animate-pulse" />
          </div>
        </div>

        {/* Terminal logs */}
        <div className="border-2 border-black bg-[#06070a] rounded-md p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-900 text-zinc-500 font-mono text-[9px]">
            <Terminal className="w-3.5 h-3.5" />
            <span className="terminal-tag tracking-wider font-bold">TERMINAL_STD_LOGSTREAM</span>
          </div>

          <div 
            ref={containerRef}
            className="h-36 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-900"
          >
            {terminalLogs.map((log, idx) => {
              let colorClass = "text-zinc-500";
              if (log.startsWith("[SYS]")) colorClass = "text-zinc-400";
              if (log.includes("COMPLETED") || log.includes("OK") || log.includes("SUCCESS")) colorClass = "text-neon-green glow-green";
              if (log.includes("ERROR") || log.includes("FAIL")) colorClass = "text-neon-pink glow-pink";

              return (
                <div key={idx} className={`leading-relaxed whitespace-pre-wrap ${colorClass}`}>
                  <span className="text-neon-cyan opacity-80">&gt;</span> {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Warning */}
        <p className="text-center font-mono text-[9px] text-zinc-500 m-0">
          DO NOT REFRESH OR NAVIGATE AWAY // STREAM INTEGRITY PROTECTED
        </p>
      </div>
    </div>
  );
}
