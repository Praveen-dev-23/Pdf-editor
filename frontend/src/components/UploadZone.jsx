import { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";

export default function UploadZone({ 
  onFilesSelected, 
  files, 
  setFiles, 
  accept = "*", 
  multiple = true, 
  description = "Drag & drop files here, or click to upload" 
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    
    // Simple verification helper
    const filtered = newFiles.filter(file => {
      if (accept === "*") return true;
      
      const fileType = file.type;
      const fileExt = "." + file.name.split(".").pop().toLowerCase();
      
      const acceptedTypes = accept.split(",").map(t => t.trim());
      
      return acceptedTypes.some(acc => {
        if (acc.endsWith("/*")) {
          // e.g., image/*
          const group = acc.split("/")[0];
          return fileType.startsWith(group + "/");
        }
        return fileExt === acc.toLowerCase();
      });
    });

    if (filtered.length === 0) {
      alert(`Invalid file type. Please upload: ${accept}`);
      return;
    }

    if (multiple) {
      setFiles(prev => [...prev, ...filtered]);
      if (onFilesSelected) onFilesSelected([...files, ...filtered]);
    } else {
      setFiles([filtered[0]]);
      if (onFilesSelected) onFilesSelected([filtered[0]]);
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, idx) => idx !== index);
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  const moveFile = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === files.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...files];
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`
          relative border-2 border-dashed border-black rounded-md p-8 cursor-pointer
          flex flex-col items-center justify-center text-center text-black
          transition-all duration-200 group bg-white brutal-shadow-black
          ${isDragOver 
            ? "bg-[#faf7f2] translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_#000]" 
            : "hover:bg-[#faf7f2]/40"
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />

        <UploadCloud className={`
          w-12 h-12 mb-3 text-black transition-transform duration-300
          ${isDragOver ? "scale-110" : "group-hover:scale-105"}
        `} />
        
        <p className="font-sans font-black text-sm tracking-wide mb-1">
          {description}
        </p>
        <p className="text-xs text-black/60 font-mono font-bold">
          ACCEPTED: {accept === "*" ? "ALL FILES" : accept.toUpperCase()}
        </p>

        {/* Decorative corner block badges */}
        <div className="absolute top-[-3px] left-[-3px] w-2 h-2 bg-black border border-black" />
        <div className="absolute top-[-3px] right-[-3px] w-2 h-2 bg-black border border-black" />
        <div className="absolute bottom-[-3px] left-[-3px] w-2 h-2 bg-black border border-black" />
        <div className="absolute bottom-[-3px] right-[-3px] w-2 h-2 bg-black border border-black" />
      </div>

      {/* Selected files preview / queue list */}
      {files.length > 0 && (
        <div className="border-2 border-black bg-white rounded-md p-4 space-y-2 brutal-shadow-black text-black">
          <div className="flex justify-between items-center pb-2 border-b-2 border-black/20">
            <span className="terminal-tag text-[10px] text-black font-black">QUEUE LIST ({files.length} ITEMS)</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setFiles([]); if (onFilesSelected) onFilesSelected([]); }}
              className="text-xs text-[#e16b5a] hover:underline font-mono font-black cursor-pointer"
            >
              CLEAR ALL
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto divide-y-2 divide-black/10 pr-1">
            {files.map((file, index) => {
              const isImage = file.type.startsWith("image/");
              
              return (
                <div key={index} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs text-black/55 font-bold">#{index + 1}</span>
                    {isImage ? (
                      <ImageIcon className="w-5 h-5 text-black shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-black shrink-0" />
                    )}
                    <div className="truncate pr-4">
                      <p className="font-sans text-xs font-black text-black truncate">{file.name}</p>
                      <p className="font-mono text-[10px] text-black/60 font-bold">{formatSize(file.size)}</p>
                    </div>
                  </div>

                  {/* Actions (reorder & delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {multiple && (
                      <>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); moveFile(index, "up"); }}
                          className="p-1 border-2 border-black bg-white hover:bg-[#5c8fcc] disabled:opacity-30 transition-all text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === files.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveFile(index, "down"); }}
                          className="p-1 border-2 border-black bg-white hover:bg-[#5c8fcc] disabled:opacity-30 transition-all text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="p-1 border-2 border-black bg-white hover:bg-[#e16b5a] transition-all text-black ml-1 cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
