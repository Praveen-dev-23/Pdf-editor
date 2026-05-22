import { 
  FileImage, 
  Combine, 
  Scissors, 
  Zap, 
  Images, 
  ScanText, 
  Edit3, 
  PenTool, 
  BrainCircuit,
  Activity,
  Cpu,
  Clock,
  Sparkles
} from "lucide-react";
import ToolCard from "../components/ToolCard";

export default function Dashboard({ setActiveTab, setSelectedTool }) {
  const tools = [
    {
      id: "image-to-pdf",
      title: "IMAGE TO PDF",
      description: "Compile multiple JPG, PNG, or WEBP images into a single high-quality PDF. Rearrange page orders before export.",
      icon: FileImage,
      serial: "ND-01",
      shadowColor: "cyan"
    },
    {
      id: "pdf-merger",
      title: "PDF MERGER",
      description: "Merge multiple PDF documents into a single consolidated file. Reorder pages and customize file composition.",
      icon: Combine,
      serial: "ND-02",
      shadowColor: "pink"
    },
    {
      id: "pdf-splitter",
      title: "PDF SPLITTER",
      description: "Extract specific page ranges, split into individual single-page documents, or filter by odd/even pages.",
      icon: Scissors,
      serial: "ND-03",
      shadowColor: "green"
    },
    {
      id: "pdf-compressor",
      title: "PDF COMPRESSOR",
      description: "Shrink PDF document size using variable compression ratios (Low, Med, High) with image downscale algorithms.",
      icon: Zap,
      serial: "ND-04",
      shadowColor: "purple"
    },
    {
      id: "pdf-to-image",
      title: "PDF TO IMAGE",
      description: "Extract PDF pages and convert them to PNG or JPG images. Downloads all pages packaged in a single ZIP file.",
      icon: Images,
      serial: "ND-05",
      shadowColor: "cyan"
    },
    {
      id: "ocr-extractor",
      title: "OCR TEXT EXTRACTOR",
      description: "Perform optical character recognition on scanned PDFs or images via local Tesseract pipelines. Copy or export raw text.",
      icon: ScanText,
      serial: "ND-06",
      shadowColor: "pink"
    },
    {
      id: "pdf-editor",
      title: "PDF EDITOR",
      description: "Modify PDF page orientations, delete specific pages, inject watermarks, custom overlay text elements, and page numbers.",
      icon: Edit3,
      serial: "ND-07",
      shadowColor: "green"
    },
    {
      id: "e-signature",
      title: "E-SIGNATURE TOOL",
      description: "Draw a signature or upload a transparent png, and interactively place and size it onto any PDF page location.",
      icon: PenTool,
      serial: "ND-08",
      shadowColor: "purple"
    },
    {
      id: "ai-summarizer",
      title: "AI PDF CO-PILOT",
      description: "Upload a document to extract insights, generate structured summaries, and converse with a RAG-powered document assistant.",
      icon: BrainCircuit,
      serial: "ND-09",
      shadowColor: "cyan",
      isAi: true
    }
  ];

  const handleToolClick = (tool) => {
    if (tool.isAi) {
      setActiveTab("ai-assistant");
    } else {
      setActiveTab("tools");
      setSelectedTool(tool.id);
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Title Header with block badges */}
      <div className="relative border-2 border-black bg-white rounded-md p-6 brutal-shadow-black text-black flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-black" />
            <span className="terminal-tag text-[9px] text-black font-black tracking-widest">SYSTEM STATUS: FULLY_OPERATIONAL</span>
          </div>
          <h2 className="font-sans font-black text-2xl md:text-3xl text-black tracking-tight m-0 flex items-center flex-wrap gap-1">
            WELCOME TO <span className="text-black bg-neon-purple px-2 ml-1 border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-[22px] md:text-[26px]">NEON</span>DOCS
          </h2>
          <p className="text-xs text-zinc-700 font-mono mt-2 font-bold">
            Futuristic document operator console. Select a utility sub-routine below to begin.
          </p>
        </div>
        
        {/* Decorative corner box */}
        <div className="text-left md:text-right font-mono text-[10px] text-black/75 border-l-2 border-black/25 pl-4 shrink-0 font-bold">
          <div>LOC_NODE: 127.0.0.1 // LOCAL</div>
          <div>PROTOCOL: SECURE_HTTPS</div>
          <div>UI_THEME: CYBER_BRUTALIST_V2</div>
        </div>
      </div>

      {/* HUD Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "SYS_CORE_TEMP", value: "38.2 °C", icon: Cpu },
          { label: "MEMORY_ALLOC", value: "142.1 MB", icon: Activity },
          { label: "ACTIVE_PIPELINES", value: "9 ONLINE", icon: Sparkles },
          { label: "UPTIME", value: "100.00%", icon: Clock }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="border-2 border-black bg-white rounded-md p-4 flex items-center justify-between brutal-shadow-black text-black">
              <div>
                <span className="terminal-tag text-[9px] text-black/75 font-black block mb-1">{stat.label}</span>
                <span className="font-sans text-sm font-black text-black">{stat.value}</span>
              </div>
              <div className="p-1.5 border-2 border-black bg-white rounded-xs shadow-[1.5px_1.5px_0px_0px_#000]">
                <Icon className="w-4 h-4 text-black shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of Tool Cards */}
      <div className="space-y-4">
        <h3 className="font-sans text-xs font-black text-black tracking-widest flex items-center gap-2">
          <span>&gt; AVAILABLE_CORE_MODULES</span>
          <span className="h-[2px] bg-black/10 flex-1" />
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              serial={tool.serial}
              shadowColor={tool.shadowColor}
              onClick={() => handleToolClick(tool)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
