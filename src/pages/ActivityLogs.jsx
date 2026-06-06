import { useState } from "react";
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, X, Activity, Lock, Download } from "lucide-react";
import { Card } from "../components/SharedUI";
import { MOCK_ACTIVITY_LOGS } from "../utils/mockData";

export default function ActivityLogs() {
  const [moduleFilter, setModuleFilter] = useState("all");
  const severityIcon = { success: CheckCircle, info: Info, warning: AlertTriangle, error: XCircle };
  const severityColor = { success: "text-emerald-400", info: "text-blue-400", warning: "text-amber-400", error: "text-red-400" };

  const filtered = MOCK_ACTIVITY_LOGS.filter(l => moduleFilter === "all" || l.module.toLowerCase() === moduleFilter.toLowerCase());

  const alerts = [
    { type: "error", title: "Login Failure Alert", desc: "Vendor V007 (BuildRight) failed login 3 times — account locked at 08:15, Nov 13", time: "2 days ago" },
    { type: "warning", title: "Approval SLA Breach", desc: "APR-0087 has been pending Manager approval for 18+ hours. SLA is 24hrs.", time: "1 hour ago" },
    { type: "info", title: "RFQ Deadline Tomorrow", desc: "RFQ-2024-0088 bidding window closes Nov 21 at 23:59. Only 3 vendors responded.", time: "Just now" },
    { type: "success", title: "PO Delivered", desc: "Delivery confirmation received for PO-2024-0062 from TechSupplies India", time: "3 days ago" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Activity Logs & Alerts</h1>
        <p className="text-slate-400 text-sm mt-1">System notifications · Immutable audit trail</p>
      </div>

      {/* Alerts Section */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Bell size={16} className="text-amber-400" />Active Notifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alerts.map(({ type, title, desc, time }) => {
            const Icon = severityIcon[type];
            return (
              <div key={title} className={`flex gap-3 p-4 rounded-xl border ${type === "error" ? "bg-red-500/5 border-red-500/20" : type === "warning" ? "bg-amber-500/5 border-amber-500/20" : type === "success" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                <Icon size={16} className={`${severityColor[type]} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  <p className="text-slate-600 text-xs mt-1">{time}</p>
                </div>
                <button className="text-slate-600 hover:text-slate-400 flex-shrink-0"><X size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Trail */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" />
            <span className="text-white font-semibold">Audit Trail</span>
            <span className="text-slate-500 text-xs">— immutable, tamper-proof log</span>
          </div>
          <div className="sm:ml-auto flex gap-2 flex-wrap">
            {["all", "RFQ", "Quotation", "Approval", "System", "Auth"].map(m => (
              <button key={m} onClick={() => setModuleFilter(m)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${moduleFilter === m ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Severity", "User / Role", "Action Performed", "Module", "Timestamp"].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filtered.map(log => {
                const Icon = severityIcon[log.severity];
                return (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <Icon size={14} className={severityColor[log.severity]} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{log.user}</p>
                      <p className="text-slate-500 text-xs">{log.role}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm max-w-sm">{log.action}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs font-mono">{log.module}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">{log.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 text-xs flex items-center gap-2"><Lock size={12} />Logs are cryptographically signed and immutable</span>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"><Download size={12} />Export CSV</button>
        </div>
      </Card>
    </div>
  );
}