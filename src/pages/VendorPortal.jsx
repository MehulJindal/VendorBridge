import { useState } from "react";
import { CheckCircle, Info, Building2, Package, Upload, Send } from "lucide-react";
import { Card, fmt } from "../components/SharedUI";

export default function VendorPortal() {
  const [submitted, setSubmitted] = useState(false);
  const [items] = useState([
    { id: 1, desc: "Laptop 15.6\" (i7, 16GB, 512GB SSD)", qty: 50, unit: "Nos", specs: "BIS Certified, Win11 Pro" },
    { id: 2, desc: "Laptop Bag 15.6\"", qty: 50, unit: "Nos", specs: "Waterproof, 1 Year Warranty" },
    { id: 3, desc: "Optical Mouse (USB/BT)", qty: 50, unit: "Nos", specs: "Wireless, 1200DPI+" },
  ]);
  const [prices, setPrices] = useState({ 1: 68500, 2: 850, 3: 650 });

  const subtotal = items.reduce((sum, i) => sum + (prices[i.id] || 0) * i.qty, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-white text-xl font-bold">Quotation Submitted</h2>
      <p className="text-slate-400 text-sm">Your quotation for RFQ-2024-0087 has been received</p>
      <p className="text-slate-500 text-xs">Reference: Q-{Date.now().toString().slice(-6)}</p>
      <button onClick={() => setSubmitted(false)} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">Submit Another Quote</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-indigo-300 text-sm font-medium">Vendor Quotation Submission Portal</p>
          <p className="text-slate-400 text-xs mt-0.5">RFQ-2024-0087 · Laptop Procurement Q4 · Deadline: Nov 22, 2024 · Buyer: VendorBridge Corp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Building2 size={16} className="text-indigo-400" />Vendor Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[["Company Name", "TechSupplies India Pvt. Ltd."], ["Contact Person", "Raj Sharma"], ["Email Address", "raj@techsupplies.in"], ["Mobile", "+91 98201 45678"], ["GST Number", "27AABCT1234D1Z5"], ["City / Location", "Mumbai"]].map(([label, val]) => (
                <div key={label}>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">{label}</label>
                  <input defaultValue={val} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Package size={16} className="text-indigo-400" />Price Quotation</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider pb-3">Item Description</th>
                    <th className="text-center text-slate-500 text-xs font-medium uppercase tracking-wider pb-3">Qty</th>
                    <th className="text-center text-slate-500 text-xs font-medium uppercase tracking-wider pb-3">Unit Price (₹)</th>
                    <th className="text-right text-slate-500 text-xs font-medium uppercase tracking-wider pb-3">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <p className="text-white text-sm font-medium">{item.desc}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{item.specs}</p>
                      </td>
                      <td className="py-4 text-center text-slate-300 text-sm">{item.qty} {item.unit}</td>
                      <td className="py-4 px-2">
                        <input type="number" value={prices[item.id] || ""} onChange={e => setPrices({ ...prices, [item.id]: parseFloat(e.target.value) || 0 })} className="w-28 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-indigo-500 mx-auto block" />
                      </td>
                      <td className="py-4 text-right text-emerald-400 text-sm font-medium">{fmt((prices[item.id] || 0) * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-800 mt-2 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">GST (18%)</span><span className="text-white">{fmt(gst)}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800"><span className="text-white">Grand Total</span><span className="text-emerald-400">{fmt(total)}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4">Additional Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Delivery Lead Time (Days)</label>
                <input type="number" defaultValue="7" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Warranty / AMC Period</label>
                <input defaultValue="3 Years Onsite" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Payment Terms</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {["Net 30 Days", "Net 15 Days", "50% Advance + 50% on Delivery", "100% Advance"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Validity of Quote (Days)</label>
                <input type="number" defaultValue="30" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Remarks / Comments</label>
              <textarea rows={3} defaultValue="Bulk discount of 2% applied on total order. All units are brand new, sealed, with valid BIS/ISI certification. On-site warranty support available across 120+ cities." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div className="mt-4">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Supporting Documents</label>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                <Upload size={20} className="text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Drag & drop or click to upload</p>
                <p className="text-slate-600 text-xs mt-1">Product catalogue, certifications, GST certificate (Max 10MB)</p>
              </div>
            </div>
            <button onClick={() => setSubmitted(true)} className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              <Send size={16} />Submit Quotation
            </button>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4">RFQ Details</h2>
            <div className="space-y-3 text-sm">
              {[["RFQ Number", "RFQ-2024-0087"], ["Title", "Laptop Procurement Q4"], ["Issued By", "VendorBridge Corp"], ["Issue Date", "Nov 15, 2024"], ["Deadline", "Nov 22, 2024"], ["Delivery Required", "Dec 5, 2024"], ["Items", "3 line items"], ["Category", "Electronics"]].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-slate-500 flex-shrink-0">{l}</span>
                  <span className="text-white text-right">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-2"><CheckCircle size={14} />Quote Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">GST @18%</span><span className="text-white">{fmt(gst)}</span></div>
              <div className="flex justify-between font-bold border-t border-emerald-500/20 pt-2"><span className="text-white">Grand Total</span><span className="text-emerald-400">{fmt(total)}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}