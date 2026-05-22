import { useState, useEffect } from "react";
import AnimatedBackground from "./components/AnimatedBackground";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Page Views
import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import AIAssistant from "./components/tools/AIAssistant";
import Settings from "./pages/Settings";

import { API_BASE } from "./config";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTool, setSelectedTool] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  // Poll backend health status
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      } else {
        setBackendStatus(null);
      }
    } catch {
      setBackendStatus(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkBackendHealth();
    }, 0);
    // Poll every 10 seconds to detect server state changes
    const interval = setInterval(checkBackendHealth, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedTool={setSelectedTool}
          />
        );
      case "tools":
        return (
          <Tools
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            setActiveTab={setActiveTab}
          />
        );
      case "ai-assistant":
        return (
          <div className="relative border-2 border-black bg-cyber-card rounded-md p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] min-h-[500px]">
            <AIAssistant />
            <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-700 pointer-events-none">
              [WORKSPACE_ACTIVE // AI_CO_PILOT]
            </div>
          </div>
        );
      case "settings":
        return <Settings />;
      default:
        return (
          <div className="text-center font-mono text-xs text-zinc-500 py-12">
            [SYS_ERR]: INVALID_ROUTE_STATE
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-black font-sans overflow-x-hidden flex relative bg-cyber-dark">
      {/* Background Canvas Particles */}
      <AnimatedBackground />

      {/* Main Sidebar Panel */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        <Navbar
          setSidebarOpen={setSidebarOpen}
          backendStatus={backendStatus}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
