import { 
  LayoutDashboard, 
  Wrench, 
  MessageSquare, 
  Settings as SettingsIcon,
  FileText
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const menuItems = [
    { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, color: "var(--color-neon-pink)" },      // terracotta
    { id: "tools", label: "UTILITIES", icon: Wrench, color: "var(--color-neon-cyan)" },        // slate blue
    { id: "ai-assistant", label: "AI CO-PILOT", icon: MessageSquare, color: "var(--color-neon-purple)" }, // sand yellow
    { id: "settings", label: "SYSTEM STATUS", icon: SettingsIcon, color: "var(--color-neon-green)" },    // teal
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        h-screen w-64
        bg-white
        border-r-2 border-black
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header Logo */}
        <div className="p-6 border-b-2 border-black bg-[#faf6ee]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <FileText className="w-8 h-8 text-black" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#d16b60] border border-black rounded-xs" />
            </div>
            <div>
              <h1 className="font-sans font-black text-lg tracking-tight text-black m-0 flex items-center">
                NEON<span className="text-black bg-[#dfb15b] px-1.5 ml-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[13px] font-bold">DOCS</span>
              </h1>
              <div className="terminal-tag text-[9px] text-black/65 tracking-widest mt-0.5">
                v1.0.0 // HOST_SYS
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 
                  border-2 transition-all duration-150 text-left
                  font-sans text-xs font-black tracking-wider cursor-pointer
                  ${isActive 
                    ? "border-black bg-black text-white shadow-[3.5px_3.5px_0px_0px_#000]" 
                    : "border-black bg-white text-black/75 shadow-[2px_2px_0px_0px_#000] hover:text-black hover:bg-[#faf7f2] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000]"
                  }
                `}
              >
                <Icon 
                  className="w-5 h-5 transition-transform duration-300" 
                  style={{ 
                    color: isActive ? "#ffffff" : "#000000"
                  }} 
                />
                <span>{item.label}</span>
                {isActive && (
                  <span 
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t-2 border-black bg-[#faf6ee] text-center font-mono text-[10px] text-zinc-600">
          <div className="flex justify-center items-center gap-1.5 mb-1 text-neon-green">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green border border-black" />
            <span className="terminal-tag tracking-wider text-[9px] font-black">CORE INTEGRITY: NOMINAL</span>
          </div>
          <div className="font-bold text-black/70">SECURE SANDBOX ACTIVE</div>
        </div>
      </aside>
    </>
  );
}
