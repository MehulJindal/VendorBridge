import { DollarSign, FileText, Clock, TrendingDown, ChevronRight, Plus, Users, CheckCircle, ShoppingCart, TrendingUp, AlertCircle, Target, FileCheck, BarChart2 } from "lucide-react";
import StatCard from "../components/StatCard";
import { Card, StatusBadge, fmt } from "../components/SharedUI";
import { MOCK_RFQS, MOCK_VENDORS } from "../utils/mockData";

export default function Dashboard({ role, navigate }) {
  const quickActions = [
    { label: "New RFQ", icon: Plus, screen: "rfq_create", color: "bg-indigo-600 hover:bg-indigo-500" },
    { label: "Add Vendor", icon: Users, screen: "vendors", color: "bg-slate-700 hover:bg-slate-600" },
    { label: "View Quotes", icon: FileText, screen: "quotations", color: "bg-slate-700 hover:bg-slate-600" },
    { label: "Approvals", icon: CheckCircle, screen: "approvals", color: "bg-amber-600/80 hover:bg-amber-600" },
    { label: "Generate PO", icon: ShoppingCart, screen: "po_invoice", color: "bg-slate-700 hover:bg-slate-600" },
    { label: "Analytics", icon: TrendingUp, screen: "analytics", color: "bg-slate-700 hover:bg-slate-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Procurement Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Financial Year 2024-25 · November Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Spend (YTD)" value="₹2.84 Cr" sub="vs ₹2.41 Cr last year" color="indigo" trend={17.8} />
        <StatCard icon={FileText} label="Active RFQs" value="12" sub="3 closing this week" color="amber" />
        <StatCard icon={Clock} label="Pending Approvals" value="4" sub="2 overdue by 1 day" color="rose" />
        <StatCard icon={TrendingDown} label="Cost Savings (YTD)" value="₹18.3 L" sub="vs negotiated baseline" color="emerald" trend={6.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent RFQ Activity</h2>
            <button onClick={() => navigate("rfq_list")} className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1">View All <ChevronRight size={14} /></button>
          </div>
          <div className="space-y-2">
            {MOCK_RFQS.slice(0, 4).map(rfq => (
              <div key={rfq.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => navigate("rfq_list")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center"><FileText size={14} className="text-indigo-400" /></div>
                  <div>
                    <p className="text-white text-sm font-medium">{rfq.title}</p>
                    <p className="text-slate-500 text-xs">{rfq.id} · {rfq.responses}/{rfq.vendors} responses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs hidden sm:block">{fmt(rfq.estimatedValue)}</span>
                  <StatusBadge status={rfq.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ label, icon: Icon, screen, color }) => (
              <button key={label} onClick={() => navigate(screen)} className={`${color} text-white rounded-lg p-3 flex flex-col items-center gap-2 transition-colors text-xs font-medium`}>
                <Icon size={18} />{label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4">Top Vendors by Spend</h2>
          <div className="space-y-3">
            {MOCK_VENDORS.filter(v => v.status === "active").sort((a, b) => b.spend - a.spend).slice(0, 4).map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-xs font-medium">{v.name.split(" ").slice(0, 3).join(" ")}</span>
                    <span className="text-emerald-400 text-xs font-medium">{fmt(v.spend)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(v.spend / 3210000) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4">Pending Actions</h2>
          <div className="space-y-2">
            {[
              { text: "APR-0087 awaiting your review", urgency: "high", icon: AlertCircle },
              { text: "RFQ-2024-0085 — select winning vendor", urgency: "medium", icon: Target },
              { text: "3 vendor KYC documents pending", urgency: "low", icon: FileCheck },
              { text: "Q3 spend report due Nov 20", urgency: "low", icon: BarChart2 },
            ].map(({ text, urgency, icon: Icon }) => (
              <div key={text} className={`flex items-center gap-3 p-3 rounded-lg border ${urgency === "high" ? "bg-red-500/5 border-red-500/20" : urgency === "medium" ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-900 border-slate-800"}`}>
                <Icon size={14} className={urgency === "high" ? "text-red-400" : urgency === "medium" ? "text-amber-400" : "text-slate-500"} />
                <span className="text-slate-300 text-xs">{text}</span>
                <ChevronRight size={12} className="text-slate-600 ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}