import { useState } from "react";
import {
  Layers,
  X,
  User,
  Users,
  ChevronUp,
  Check,
  LogOut,
  LayoutDashboard,
  Building2,
  Plus,
  FileText,
  Send,
  BarChart,
  GitBranch,
  ShoppingCart,
  Activity,
  TrendingUp,
} from "lucide-react";

export const SCREENS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vendors", label: "Vendor Database", icon: Building2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "rfq_create", label: "Create RFQ", icon: Plus },
  { id: "rfq_list", label: "RFQ Management", icon: FileText },
  { id: "quotations", label: "Quotation Portal", icon: Send },
  { id: "comparison", label: "Compare Quotes", icon: BarChart },
  { id: "approvals", label: "Approval Workflow", icon: GitBranch },
  { id: "po_invoice", label: "PO & Invoices", icon: ShoppingCart },
  { id: "activity_logs", label: "Activity Logs", icon: Activity },
  { id: "analytics", label: "Analytics & Reports", icon: TrendingUp },
];

export const ROLES = [
  { id: "procurement_officer", label: "Procurement Officer" },
  { id: "purchase_manager", label: "Purchase Manager" },
  { id: "admin", label: "Admin" },
  { id: "vendor", label: "External Vendor" },
];

export default function Sidebar({
  currentScreen,
  setCurrentScreen,
  currentRole,
  setCurrentRole,
  sidebarOpen,
  setSidebarOpen,
  setLoggedIn,
}) {
  const [roleDropOpen, setRoleDropOpen] = useState(false);

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                VendorBridge
              </p>
              <p className="text-slate-500 text-xs">Enterprise ERP</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {SCREENS.map(({ id, label, icon: Icon }) => {
          // Filter screens based on role
          let isAllowed = true;
          if (
            currentRole === "admin" &&
            ![
              "dashboard",
              "vendors",
              "users",
              "analytics",
              "activity_logs",
            ].includes(id)
          ) {
            isAllowed = false;
          }
          if (
            currentRole === "vendor" &&
            !["quotations", "activity_logs"].includes(id)
          ) {
            isAllowed = false;
          }

          if (!isAllowed) return null;

          const active = currentScreen === id;
          return (
            <button
              key={id}
              onClick={() => {
                setCurrentScreen(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30" : "text-slate-400 hover:text-white hover:bg-slate-800/70"}`}
            >
              <Icon size={16} />
              {label}
              {id === "approvals" && (
                <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  4
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="relative">
          <button
            onClick={() => setRoleDropOpen(!roleDropOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <div className="flex items-center gap-2">
              <User size={14} className="text-indigo-400" />
              <div className="text-left">
                <p className="text-white text-xs font-medium leading-tight">
                  {ROLES.find((r) => r.id === currentRole)?.label}
                </p>
                <p className="text-slate-500 text-xs">Simulate Role</p>
              </div>
            </div>
            <ChevronUp
              size={14}
              className={`text-slate-500 transition-transform ${roleDropOpen ? "rotate-180" : ""}`}
            />
          </button>
          {roleDropOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-10">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setCurrentRole(role.id);
                    setRoleDropOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-slate-800 ${currentRole === role.id ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300"}`}
                >
                  {currentRole === role.id && (
                    <Check size={12} className="text-indigo-400" />
                  )}
                  <span className={currentRole === role.id ? "" : "pl-4"}>
                    {role.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setLoggedIn(false)}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-400 text-xs transition-colors rounded-lg hover:bg-red-500/5"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
