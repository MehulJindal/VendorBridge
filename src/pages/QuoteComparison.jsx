import { useState } from "react";
import { Download, Award, Building2, TrendingDown, Zap, Check, CheckCircle, ArrowRight } from "lucide-react";
import { Card, fmt } from "../components/SharedUI";
import { MOCK_QUOTATIONS } from "../utils/mockData";

export default function QuoteComparison() {
  const lowestPrice = Math.min(...MOCK_QUOTATIONS.map(q => q.total));
  const fastestDelivery = Math.min(...MOCK_QUOTATIONS.map(q => q.deliveryDays));
  const [winner, setWinner] = useState(null);

  const score = (q) => {
    const priceScore = (1 - (q.total - lowestPrice) / lowestPrice) * 50;
    const delivScore = (1 - (q.deliveryDays - fastestDelivery) / fastestDelivery) * 30;
    const warrantyScore = q.warranty.includes("3") ? 20 : 10;
    return Math.round(priceScore + delivScore + warrantyScore);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Quotation Comparison Matrix</h1>
          <p className="text-slate-400 text-sm mt-1">RFQ-2024-0087 · Laptop Procurement Q4 · 3 quotations received</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Download size={16} />Export Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[["Lowest Price", fmt(lowestPrice), "emerald"], ["Fastest Delivery", fastestDelivery + " Days", "indigo"], ["Avg. Quote Value", fmt(MOCK_QUOTATIONS.reduce((s, q) => s + q.total, 0) / MOCK_QUOTATIONS.length), "slate"]].map(([label, val, color]) => (
          <Card key={label} className={`p-4 ${color === "emerald" ? "border-emerald-500/30 bg-emerald-500/5" : color === "indigo" ? "border-indigo-500/30 bg-indigo-500/5" : ""}`}>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-bold mt-1 ${color === "emerald" ? "text-emerald-400" : color === "indigo" ? "text-indigo-400" : "text-white"}`}>{val}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_QUOTATIONS.map(q => {
          const isLowest = q.total === lowestPrice;
          const isFastest = q.deliveryDays === fastestDelivery;
          const qScore = score(q);
          return (
            <Card key={q.id} className={`p-0 overflow-hidden ${isLowest ? "border-emerald-500/40" : ""}`}>
              {isLowest && <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2 flex items-center gap-2"><Award size={14} className="text-emerald-400" /><span className="text-emerald-400 text-xs font-semibold">LOWEST PRICE — RECOMMENDED</span></div>}
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isLowest ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800 border border-slate-700"}`}>
                      <Building2 size={20} className={isLowest ? "text-emerald-400" : "text-slate-400"} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">{q.vendor}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{q.id} · Submitted {q.submittedAt}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {isLowest && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium"><TrendingDown size={10} />Best Price</span>}
                        {isFastest && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-medium"><Zap size={10} />Fastest Delivery</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {[["Unit Price", fmt(q.unitPrice), isLowest ? "text-emerald-400" : "text-white"], ["Quantity", q.qty + " Nos", "text-white"], ["Total (excl. GST)", fmt(q.total), isLowest ? "text-emerald-400 font-bold" : "text-white"], ["Delivery", q.deliveryDays + " Days", isFastest ? "text-indigo-400" : "text-white"]].map(([label, val, cls]) => (
                      <div key={label} className="bg-slate-900 rounded-lg p-3">
                        <p className="text-slate-500 text-xs mb-1">{label}</p>
                        <p className={`text-sm font-semibold ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Warranty</p>
                    <p className="text-white text-sm font-medium">{q.warranty}</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 sm:col-span-2">
                    <p className="text-slate-500 text-xs mb-1">Vendor Comment</p>
                    <p className="text-slate-300 text-sm">{q.comment}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLowest ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${qScore}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${isLowest ? "text-emerald-400" : "text-indigo-400"}`}>{qScore}/100</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-slate-500 hover:text-slate-300 px-3 py-1.5 bg-slate-800 rounded text-xs transition-colors">View Details</button>
                    <button onClick={() => setWinner(q.vendor)} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${winner === q.vendor ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                      {winner === q.vendor ? <span className="flex items-center gap-1"><Check size={12} />Selected</span> : "Select Winner"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {winner && (
        <Card className="p-5 bg-emerald-500/5 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-400" />
              <div>
                <p className="text-white font-semibold">Winner Selected: {winner}</p>
                <p className="text-slate-400 text-xs">Submit for approval to proceed with PO generation</p>
              </div>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <ArrowRight size={14} />Submit for Approval
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}