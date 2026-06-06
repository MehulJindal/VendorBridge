import { DollarSign, TrendingDown, Users, FileCheck, BarChart2, TrendingUp, AlertCircle, Clock, Target, Download } from "lucide-react";
import { Card, fmt } from "../components/SharedUI";
import StatCard from "../components/StatCard";
import { MOCK_SPEND_MONTHLY } from "../utils/mockData";

export default function AnalyticsReports() {
  const maxSpend = Math.max(...MOCK_SPEND_MONTHLY.map(m => m.value));

  const vendorPerf = [
    { name: "MediCore Pharma", score: 98, onTime: 99, quality: 97, savings: 4.2 },
    { name: "TechSupplies India", score: 94, onTime: 96, quality: 91, savings: 3.8 },
    { name: "Prime Logistics", score: 91, onTime: 97, quality: 87, savings: 2.1 },
    { name: "OfficeWorks Solutions", score: 88, onTime: 94, quality: 84, savings: 5.6 },
    { name: "Industrial Components", score: 79, onTime: 88, quality: 73, savings: 1.2 },
    { name: "SafeGuard Equipment", score: 71, onTime: 79, quality: 68, savings: 0.8 },
  ];

  const catSpend = [
    { cat: "Electronics", pct: 48, value: 13616640, color: "bg-indigo-500" },
    { cat: "Medical", pct: 19, value: 5397720, color: "bg-emerald-500" },
    { cat: "Logistics", pct: 11, value: 3124080, color: "bg-blue-500" },
    { cat: "Mechanical", pct: 10, value: 2840800, color: "bg-violet-500" },
    { cat: "Safety", pct: 7, value: 1988560, color: "bg-amber-500" },
    { cat: "Others", pct: 5, value: 1420400, color: "bg-slate-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Executive Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">FY 2024-25 · Procurement Intelligence Dashboard</p>
        </div>
        <div className="flex gap-2">
          {["Q1", "Q2", "Q3", "YTD"].map((p, i) => (
            <button key={p} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${i === 3 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Spend YTD" value="₹28.4 Cr" sub="Budget: ₹32 Cr" color="indigo" trend={-3.2} />
        <StatCard icon={TrendingDown} label="Cost Savings" value="₹2.18 Cr" sub="vs last FY" color="emerald" trend={12.4} />
        <StatCard icon={Users} label="Active Vendors" value="6" sub="of 8 registered" color="indigo" />
        <StatCard icon={FileCheck} label="POs Issued YTD" value="312" sub="Avg ₹9.1L each" color="amber" />
      </div>

      {/* Monthly Spend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Monthly Procurement Spend</h2>
            <span className="text-slate-500 text-xs flex items-center gap-1"><BarChart2 size={12} />Last 6 Months</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {MOCK_SPEND_MONTHLY.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-slate-400 text-xs">{fmt(m.value).replace("₹", "₹").replace(",00,000", "L").slice(0, 5)}L</span>
                <div className="w-full bg-slate-800 rounded-t-md overflow-hidden relative group" style={{ height: "160px" }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700 ${i === 4 ? "bg-indigo-500" : "bg-indigo-600/50 group-hover:bg-indigo-500/70"}`}
                    style={{ height: `${m.pct}%` }}
                  />
                </div>
                <span className="text-slate-500 text-xs">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
            <span>Peak: Oct (₹52L)</span>
            <span>Average: ₹38.5L/month</span>
            <span>YTD: ₹28.4 Cr</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4">Spend by Category</h2>
          <div className="space-y-3">
            {catSpend.map(({ cat, pct, value, color }) => (
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-slate-300 text-xs">{cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{pct}%</span>
                    <span className="text-white text-xs font-medium">{fmt(value)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Vendor Performance */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Vendor Performance Scorecard</h2>
          <button className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"><Download size={12} />Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Rank", "Vendor", "Overall Score", "On-Time %", "Quality %", "Cost Savings %", "Trend"].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vendorPerf.map((v, i) => (
                <tr key={v.name} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-3 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-slate-600/50 text-slate-300" : "bg-slate-800/50 text-slate-500"}`}>{i + 1}</div>
                  </td>
                  <td className="px-3 py-3 text-white text-sm font-medium">{v.name}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${v.score >= 90 ? "bg-emerald-500" : v.score >= 75 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${v.score}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${v.score >= 90 ? "text-emerald-400" : v.score >= 75 ? "text-indigo-400" : "text-amber-400"}`}>{v.score}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-300 text-sm">{v.onTime}%</td>
                  <td className="px-3 py-3 text-slate-300 text-sm">{v.quality}%</td>
                  <td className="px-3 py-3 text-emerald-400 text-sm font-medium">{v.savings}%</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium ${v.score >= 85 ? "text-emerald-400" : "text-amber-400"} flex items-center gap-1`}>
                      {v.score >= 85 ? <><TrendingUp size={12} />Good</> : <><AlertCircle size={12} />Watch</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Procurement Cycle Time", value: "4.2 Days", sub: "Avg RFQ to PO", icon: Clock, color: "indigo" },
          { label: "3-Quote Compliance", value: "87%", sub: "of RFQs got 3+ bids", icon: Target, color: "emerald" },
          { label: "Contract Utilization", value: "73%", sub: "Contracted vs spot buys", icon: FileCheck, color: "amber" },
          { label: "Vendor Attrition", value: "2", sub: "Inactive this quarter", icon: Users, color: "rose" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <StatCard key={label} icon={Icon} label={label} value={value} sub={sub} color={color} />
        ))}
      </div>
    </div>
  );
}