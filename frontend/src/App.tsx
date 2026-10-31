import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { ChatPage } from "./pages/ChatPage";
import { PredictionPage } from "./pages/PredictionPage";
import { DatasetPage } from "./pages/DatasetPage";
import { TrendsPage } from "./pages/TrendsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AboutPage } from "./pages/AboutPage";
import { ComparePage } from "./pages/ComparePage";

const MainLayout: React.FC = () => {
  const { activePage } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "chat":
        return <ChatPage />;
      case "compare":
        return <ComparePage />;
      case "predict":
        return <PredictionPage />;
      case "datasets":
        return <DatasetPage />;
      case "trends":
        return <TrendsPage />;
      case "reports":
        return <ReportsPage />;
      case "history":
        return <HistoryPage />;
      case "about":
        return <AboutPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d0a] text-gray-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-b from-[#070d0a] via-[#09130e] to-[#070d0a]">
          <div className="mx-auto max-w-7xl">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
