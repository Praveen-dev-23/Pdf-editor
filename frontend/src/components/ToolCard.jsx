import { ArrowRight } from "lucide-react";

export default function ToolCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  serial = "ND-XX", 
  status = "ONLINE",
  shadowColor = "cyan" // Maps to different block background colors
}) {
  
  // Resolve card background color block
  const getBgColor = () => {
    switch (shadowColor) {
      case "pink": return "bg-neon-pink";   // Vibrant Hot Pink
      case "green": return "bg-neon-green";  // Vibrant Green
      case "purple": return "bg-neon-purple"; // Vibrant Yellow
      case "cyan": return "bg-neon-cyan";   // Vibrant Sky Blue
      default: return "bg-white";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative w-full p-5 cursor-pointer text-left
        rounded-md border-2 border-black
        flex flex-col justify-between h-56
        group select-none brutal-shadow-black text-black
        ${getBgColor()}
      `}
    >
      {/* Header Details */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-black/30">
        <span className="terminal-tag font-black text-[10px] text-black/70">
          {serial} // SYS
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-black bg-black animate-pulse" />
          <span className="terminal-tag text-[9px] font-black text-black/75">{status}</span>
        </div>
      </div>

      {/* Main Core Icon & Content */}
      <div className="my-3 flex items-start gap-4">
        {Icon && (
          <div className="p-2.5 bg-white border-2 border-black rounded-xs shrink-0 transition-transform duration-300 group-hover:rotate-6 shadow-[2px_2px_0px_0px_#000]">
            <Icon className="w-5 h-5 text-black" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-black tracking-tight text-black truncate mb-1">
            {title}
          </h3>
          <p className="text-xs text-black/90 font-sans leading-relaxed line-clamp-3 font-bold">
            {description}
          </p>
        </div>
      </div>

      {/* Footer link indicators */}
      <div className="flex justify-between items-center pt-2 border-t-2 border-black/30">
        <span className="terminal-tag text-[9px] text-black/60 font-bold">SYS_EXEC_MODULE_OK</span>
        <div className="flex items-center gap-1 text-xs font-black font-mono transition-transform duration-200 group-hover:translate-x-1 text-black">
          <span className="text-[10px] terminal-tag">EXECUTE</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
