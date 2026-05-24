import { useState, useRef, useEffect } from "react";
import { Brain, Send, MessageSquare, ListFilter, Sparkles, RefreshCw } from "lucide-react";
import UploadZone from "../UploadZone";
import LoadingOverlay from "../LoadingOverlay";
import { API_BASE } from "../../config";
import confetti from "canvas-confetti";

export default function AIAssistant() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);

  // Chatbot states
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  const handleSummarize = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setSummaryData(null);
    setMessages([]);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch(`${API_BASE}/ai/summarize`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Server error occurred during AI analysis.");
      }

      const data = await response.json();
      setSummaryData(data);
      
      // Initialize chat history with introductory greeting
      setMessages([
        {
          sender: "system",
          text: `SECURE NEURAL CHANNEL ESTABLISHED. I have analyzed "${data.filename}" (${data.word_count} words). Ask me anything about its contents.`,
        },
      ]);

      confetti({
        particleCount: 100,
        spread: 70,
        colors: ["#9d4edd", "#ff007f", "#00f0ff"],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to analyze document.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || chatLoading || !summaryData) return;

    const userText = query.trim();
    setQuery("");
    
    // Add user message to stack
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatLoading(true);

    const formData = new FormData();
    formData.append("question", userText);
    // Send full document text retrieved during summarization
    formData.append("document_text", summaryData.document_text_sample || "");

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI chat engine.");
      }

      const data = await response.json();
      
      // Add response message to stack
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: `[CHNL ERR]: Failed to extract details for query. Details: ${err.message}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div>
        <h3 className="font-sans font-black text-lg text-black mb-1 flex items-center gap-2">
          <Brain className="w-5 h-5 text-black" />
          <span>AI DOCUMENT CO-PILOT</span>
        </h3>
        <p className="text-xs text-black/60 font-mono font-bold">
          MODULE: NEURAL_SUMMARIZATION_RAG // INTERACTIVE CO-PILOT PIPELINE
        </p>
      </div>

      {!summaryData ? (
        <div className="space-y-4">
          <UploadZone
            files={files}
            setFiles={setFiles}
            accept=".pdf"
            description="Drag & drop your PDF file to start AI analysis"
            multiple={false}
          />

          {files.length > 0 && (
            <button
              onClick={handleSummarize}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white text-sm font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--color-neon-purple)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>EXECUTE NEURAL ANALYZER</span>
            </button>
          )}

          {error && (
            <div className="border-2 border-black bg-neon-pink text-black p-3 font-mono text-xs font-bold rounded-xs shadow-[2px_2px_0px_0px_#000] animate-[fadeIn_0.2s_ease-out]">
              [CRITICAL ERROR]: {error}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-[fadeIn_0.3s_ease-out]">
          
          {/* Left Column: Summary Dashboard (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4 border-2 border-black bg-white p-5 rounded-md brutal-shadow-black h-[600px] overflow-y-auto text-black">
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
              <div>
                <h4 className="font-sans font-black text-black tracking-tight text-sm truncate max-w-[200px]">
                  {summaryData.filename}
                </h4>
                <span className="font-mono text-[9px] text-black bg-neon-purple border border-black px-1.5 py-0.5 font-black tracking-widest uppercase">
                  NEURAL SCAN COMPLETED
                </span>
              </div>
              <button
                onClick={() => {
                  setSummaryData(null);
                  setFiles([]);
                  setMessages([]);
                }}
                className="p-1.5 border-2 border-black bg-[#faf7f2] text-black hover:bg-neon-pink hover:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer rounded-sm shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                title="Analyze another file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-2 bg-[#faf7f2] border-2 border-black p-2.5 rounded-xs">
              <div className="text-center">
                <span className="block text-[8px] font-mono text-black/60 font-bold uppercase">Words</span>
                <span className="text-xs font-sans font-black text-black">{summaryData.word_count}</span>
              </div>
              <div className="text-center border-x-2 border-black">
                <span className="block text-[8px] font-mono text-black/60 font-bold uppercase">Chars</span>
                <span className="text-xs font-sans font-black text-black">{summaryData.char_count}</span>
              </div>
              <div className="text-center flex flex-col items-center justify-center">
                <span className="block text-[8px] font-mono text-black/60 font-bold uppercase">Sentiment</span>
                <span className="text-[9px] font-mono font-black text-black bg-neon-purple border border-black px-1 py-0.5 rounded-xs truncate block max-w-full">
                  {summaryData.summary.sentiment}
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-black/70 font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black" /> Overview
              </span>
              <p className="text-xs text-black font-mono leading-relaxed bg-[#faf7f2] p-3 border-2 border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {summaryData.summary.overview}
              </p>
            </div>

            {/* Topics */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-black/70 font-black uppercase tracking-widest flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-black" /> Key Vectors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {summaryData.summary.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono font-black tracking-widest px-2.5 py-1 border-2 border-black bg-neon-purple text-black rounded-sm shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bullet points */}
            <div className="space-y-2 pt-2 border-t-2 border-black/10">
              <span className="text-[10px] font-mono text-black/70 font-black uppercase tracking-widest">
                Key Insights
              </span>
              <ul className="space-y-2">
                {summaryData.summary.bullet_points.map((bp, idx) => (
                  <li key={idx} className="flex gap-2.5 text-xs text-black font-mono leading-relaxed items-start">
                    <span className="text-black font-black select-none mt-0.5">&gt;</span>
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Chatbot (Col 7) */}
          <div className="lg:col-span-7 flex flex-col border-2 border-black bg-white rounded-md brutal-shadow-black h-[600px] overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-[#faf7f2] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-black" />
              <span className="font-sans font-black text-xs text-black tracking-widest">
                AI DOCUMENT QUERY CHAT
              </span>
            </div>

            {/* Message Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f5]/50 bg-cyber-grid">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <span className="text-[8px] font-mono text-black/60 font-bold uppercase tracking-widest mb-0.5">
                    {m.sender === "user" ? "User" : m.sender === "system" ? "Syslog" : "NeonDocs AI"}
                  </span>
                  
                  <div
                    className={`p-3 text-xs font-mono rounded-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-neon-cyan text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                        : m.sender === "system"
                        ? "bg-neon-pink text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                        : "bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                    }`}
                  >
                    {m.text}

                    {/* Show sources if present */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-black/20">
                        <span className="block text-[8px] text-black/60 uppercase font-black tracking-wider mb-1">
                          Matched context:
                        </span>
                        {m.sources.map((s, sIdx) => (
                          <p key={sIdx} className="text-[10px] text-black/70 italic border-l-2 border-black/20 pl-2 mt-1">
                            "{s}"
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Chat loading bubble */}
              {chatLoading && (
                <div className="mr-auto items-start max-w-[85%] animate-pulse">
                  <span className="text-[8px] font-mono text-black/60 font-bold tracking-widest uppercase mb-0.5">
                    NeonDocs AI
                  </span>
                  <div className="p-3 text-xs font-mono rounded-sm bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <span className="inline-block animate-bounce mr-0.5">.</span>
                    <span className="inline-block animate-bounce [animation-delay:0.2s] mr-0.5">.</span>
                    <span className="inline-block animate-bounce [animation-delay:0.4s]">.</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-black bg-[#faf7f2] flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={chatLoading}
                className="flex-1 bg-white border-2 border-black px-4 py-2.5 text-black font-mono text-xs focus:outline-none focus:bg-[#faf7f2] rounded-sm"
              />
              <button
                type="submit"
                disabled={chatLoading || !query.trim()}
                className={`px-4 flex items-center justify-center border-2 border-black bg-black text-white hover:bg-neon-purple hover:text-black transition-all rounded-sm cursor-pointer ${
                  chatLoading || !query.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <LoadingOverlay loading={loading} title="RETRIEVING NEURAL DOCUMENT ANALYTICS" />
    </div>
  );
}
