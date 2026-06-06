import { Menu, Search, Bell, User } from "lucide-react";
import { SCREENS } from "./Sidebar";

export default function Navbar({ currentScreen, setSidebarOpen }) {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white p-1">
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-white text-sm font-semibold">{SCREENS.find(s => s.id === currentScreen)?.label || "Dashboard"}</h2>
          <p className="text-slate-500 text-xs hidden sm:block">VendorBridge · FY 2024-25</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
          <Search size={14} className="text-slate-500" />
          <input placeholder="Quick search..." className="bg-transparent text-slate-300 text-sm focus:outline-none w-40 placeholder:text-slate-600" />
        </div>
        <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <User size={14} className="text-indigo-400" />
        </div>
      </div>
    </header>
  );
}