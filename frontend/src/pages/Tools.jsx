import { 
  FileImage, 
  Combine, 
  Scissors, 
  Zap, 
  Images, 
  ScanText, 
  Edit3, 
  PenTool,
  ChevronLeft
} from "lucide-react";

// Tool components imports
import ImageToPdf from "../components/tools/ImageToPdf";
import PdfMerger from "../components/tools/PdfMerger";
import PdfSplitter from "../components/tools/PdfSplitter";
import PdfCompressor from "../components/tools/PdfCompressor";
import PdfToImage from "../components/tools/PdfToImage";
import OcrExtractor from "../components/tools/OcrExtractor";
import PdfEditor from "../components/tools/PdfEditor";
import ESigner from "../components/tools/ESigner";

export default function Tools({ selectedTool, setSelectedTool, setActiveTab }) {
  const toolsList = [
    { id: "image-to-pdf", title: "IMAGE TO PDF", icon: FileImage, color: "var(--color-neon-cyan)" },
    { id: "pdf-merger", title: "PDF MERGER", icon: Combine, color: "var(--color-neon-pink)" },
    { id: "pdf-splitter", title: "PDF SPLITTER", icon: Scissors, color: "var(--color-neon-green)" },
    { id: "pdf-compressor", title: "PDF COMPRESSOR", icon: Zap, color: "var(--color-neon-purple)" },
    { id: "pdf-to-image", title: "PDF TO IMAGE", icon: Images, color: "var(--color-neon-cyan)" },
    { id: "ocr-extractor", title: "OCR EXTRACTOR", icon: ScanText, color: "var(--color-neon-pink)" },
    { id: "pdf-editor", title: "PDF EDITOR", icon: Edit3, color: "var(--color-neon-green)" },
    { id: "e-signature", title: "E-SIGNATURE", icon: PenTool, color: "var(--color-neon-purple)" }
  ];

  const renderToolWorkspace = () => {
    switch (selectedTool) {
      case "image-to-pdf":
        return <ImageToPdf />;
      case "pdf-merger":
        return <PdfMerger />;
      case "pdf-splitter":
        return <PdfSplitter />;
      case "pdf-compressor":
        return <PdfCompressor />;
      case "pdf-to-image":
        return <PdfToImage />;
      case "ocr-extractor":
        return <OcrExtractor />;
      case "pdf-editor":
        return <PdfEditor />;
      case "e-signature":
        return <ESigner />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="w-3 h-3 rounded-full bg-black animate-ping mb-4" />
            <p className="font-sans font-black text-sm tracking-wide text-black/60">
              SELECT A UTILITY FROM THE LEFT HUD NAV
            </p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Mini HUD Left Navigation List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Back to Dash */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-black text-white text-xs font-sans font-black tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
          <span>BACK TO DASH</span>
        </button>

        {/* List of tools */}
        <div className="border-2 border-black bg-white rounded-md p-3 space-y-1 brutal-shadow-black text-black">
          <span className="terminal-tag text-[9px] text-black/60 font-black block mb-2 px-2">UTILITY_REGISTRY:</span>
          
          <div className="flex flex-col gap-1.5">
            {toolsList.map((tool, idx) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`
                    flex items-center gap-3 px-3 py-2 shrink-0
                    border-2 border-black text-xs font-mono font-black tracking-wider text-left transition-all cursor-pointer
                    ${isSelected 
                      ? "bg-black text-white" 
                      : "bg-white text-black/70 hover:text-black hover:bg-[#faf7f2]"
                    }
                  `}
                  style={{
                    boxShadow: isSelected ? `2.5px 2.5px 0px 0px ${tool.color}` : "2.5px 2.5px 0px 0px #000000"
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{idx + 1}. {tool.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="lg:col-span-3 min-w-0">
        <div className="relative border-2 border-black bg-white rounded-md p-6 brutal-shadow-black min-h-[500px] text-black">
          {renderToolWorkspace()}
          
          {/* Decorative small borders */}
          <div className="absolute top-2 left-2 text-[9px] font-mono text-black/50 pointer-events-none font-bold">
            [WORKSPACE_ACTIVE // {selectedTool?.toUpperCase()}]
          </div>
        </div>
      </div>
    </div>
  );
}
