import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VendorManagement from "./pages/VendorManagement";
import UserManagement from "./pages/UserManagement";
import CreateRFQ from "./pages/CreateRFQ";
import RFQList from "./pages/RFQList";
import VendorPortal from "./pages/VendorPortal";
import QuoteComparison from "./pages/QuoteComparison";
import ApprovalWorkflow from "./pages/ApprovalWorkflow";
import DocumentGenerator from "./pages/DocumentGenerator";
import ActivityLogs from "./pages/ActivityLogs";
import AnalyticsReports from "./pages/AnalyticsReports";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [currentRole, setCurrentRole] = useState("procurement_officer");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (role) => {
    setCurrentRole(role);
    setLoggedIn(true);
    if (role === "vendor") setCurrentScreen("quotations");
    if (role === "admin") setCurrentScreen("dashboard");
  };

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <Dashboard role={currentRole} navigate={setCurrentScreen} />;
      case "vendors":
        return <VendorManagement />;
      case "users":
        return <UserManagement />;
      case "rfq_create":
        return <CreateRFQ />;
      case "rfq_list":
        return <RFQList />;
      case "quotations":
        return <VendorPortal />;
      case "comparison":
        return <QuoteComparison />;
      case "approvals":
        return <ApprovalWorkflow />;
      case "po_invoice":
        return <DocumentGenerator />;
      case "activity_logs":
        return <ActivityLogs />;
      case "analytics":
        return <AnalyticsReports />;
      default:
        return <Dashboard role={currentRole} navigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setLoggedIn={setLoggedIn}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar currentScreen={currentScreen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
