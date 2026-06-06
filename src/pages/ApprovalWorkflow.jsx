import { useState } from "react";
import { Check, Clock, Minus, CheckCircle, X, RefreshCw, AlertCircle } from "lucide-react";
import { Card, StatusBadge, fmt } from "../components/SharedUI";
import { MOCK_APPROVALS } from "../utils/mockData";

export default function ApprovalWorkflow() {
  const apr = MOCK_APPROVALS[0];
  const [comments, setComments] = useState({});
  const [approved, setApproved] = useState(false);

  const handleAction = (action) => {
    if (action === "approve") setApproved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Approval Workflow</h1>
        <p className="text-slate-400 text-sm mt-1">Procurement authorization & sign-off tracker</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">{apr.rfqTitle}</h2>
                <p className="text-slate-400 text-sm">{apr.id} · {apr.rfqId} · Requested by {apr.requestedBy}</p>
              </div>
              <StatusBadge status="pending_approval" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[["Request Date", apr.requestedAt], ["Selected Vendor", apr.selectedVendor], ["Order Value", fmt(apr.amount)], ["Approval Level", "L2 – Manager"]].map(([l, v]) => (
                <div key={l} className="bg-slate-900 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">{l}</p>
                  <p className="text-white text-sm font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-6">Approval Timeline</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800" />
              <div className="space-y-0">
                {apr.steps.map((step, idx) => {
                  const isCurrentPending = step.status === "pending";
                  return (
                    <div key={step.step} className="relative flex gap-6 pb-8 last:pb-0">
                      <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.status === "completed" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : step.status === "pending" ? "bg-amber-500/10 border-amber-500 text-amber-400 animate-pulse" : "bg-slate-900 border-slate-700 text-slate-600"}`}>
                        {step.status === "completed" ? <Check size={16} /> : step.status === "pending" ? <Clock size={16} /> : <Minus size={16} />}
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold text-sm">{step.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{step.role} · {step.actor}</p>
                            {step.timestamp && <p className="text-slate-600 text-xs mt-0.5">{step.timestamp}</p>}
                          </div>
                          <StatusBadge status={step.status} />
                        </div>
                        {step.comment && (
                          <div className="mt-2 bg-slate-900 border border-slate-800 rounded-lg p-3">
                            <p className="text-slate-300 text-xs">{step.comment}</p>
                          </div>
                        )}
                        {isCurrentPending && !approved && (
                          <div className="mt-3 space-y-3">
                            <textarea rows={2} value={comments[step.step] || ""} onChange={e => setComments({ ...comments, [step.step]: e.target.value })} placeholder="Add approval comment or rejection reason..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => handleAction("approve")} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                                <Check size={12} />Approve
                              </button>
                              <button className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                                <X size={12} />Reject
                              </button>
                              <button className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                                <RefreshCw size={12} />Request Revision
                              </button>
                            </div>
                          </div>
                        )}
                        {isCurrentPending && approved && (
                          <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-medium">Approved — Forwarded to CFO for final sign-off</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4">Pending Approvals Queue</h2>
            <div className="space-y-2">
              {[
                { id: "APR-0087", title: "Laptop Procurement Q4", amount: "₹32.6L", level: "L2", urgent: true },
                { id: "APR-0086", title: "Safety Equipment Annual", amount: "₹8.9L", level: "L1", urgent: false },
                { id: "APR-0084", title: "Server Infrastructure", amount: "₹1.2Cr", level: "L3", urgent: true },
              ].map(item => (
                <div key={item.id} className={`p-3 rounded-lg border cursor-pointer hover:border-slate-600 transition-colors ${item.id === "APR-0087" ? "bg-indigo-500/5 border-indigo-500/30" : "bg-slate-900 border-slate-800"}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-indigo-400 text-xs font-mono">{item.id}</span>
                    {item.urgent && <span className="text-amber-400 text-xs flex items-center gap-1"><AlertCircle size={10} />Urgent</span>}
                  </div>
                  <p className="text-white text-xs font-medium">{item.title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500 text-xs">{item.amount}</span>
                    <span className="text-slate-500 text-xs">{item.level} Approval</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4">Approval Statistics</h2>
            <div className="space-y-3">
              {[["Approved (30d)", "23", "text-emerald-400"], ["Rejected (30d)", "4", "text-red-400"], ["Avg. Approval Time", "1.8 Days", "text-indigo-400"], ["Pending Right Now", "4", "text-amber-400"]].map(([label, val, cls]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className={`font-bold text-sm ${cls}`}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}