import { useState } from "react";
import { CheckCircle, Info, Package, Plus, Trash2, FileCheck, Users, Send } from "lucide-react";
import { Card } from "../components/SharedUI";
import { MOCK_VENDORS } from "../utils/mockData";

export default function CreateRFQ() {
  const [items, setItems] = useState([{ id: 1, name: "Laptop 15.6\" (i7, 16GB RAM, 512GB SSD)", qty: 10, unit: "Nos", specs: "Windows 11 Pro, Backlit KB", budget: 70000 }]);
  const [selectedVendors, setSelectedVendors] = useState(["V001", "V002", "V005"]);
  const [submitted, setSubmitted] = useState(false);

  const addItem = () => setItems([...items, { id: Date.now(), name: "", qty: 1, unit: "Nos", specs: "", budget: 0 }]);
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const toggleVendor = (id) => setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>
      <h2 className="text-white text-xl font-bold">RFQ Published Successfully</h2>
      <p className="text-slate-400 text-sm">RFQ-2024-0090 has been created and sent to {selectedVendors.length} vendors</p>
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-indigo-400 font-mono text-lg font-bold">RFQ-2024-0090</p>
        <p className="text-slate-500 text-xs mt-1">Tracking ID · Created Nov 17, 2024</p>
      </div>
      <button onClick={() => setSubmitted(false)} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">Create Another RFQ</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Create New RFQ</h1>
        <p className="text-slate-400 text-sm mt-1">Request for Quotation · Draft saved automatically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Info size={16} className="text-indigo-400" />Basic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[["RFQ Title", "text", "e.g. Laptop Procurement Q4 2024"], ["Category", "text", "Electronics, Furniture, etc."], ["Estimated Value (₹)", "number", "500000"], ["Priority", "text", "Normal / High / Urgent"]].map(([label, type, placeholder]) => (
                <div key={label}>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Submission Deadline</label>
                <input type="date" defaultValue="2024-11-25" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Required Delivery Date</label>
                <input type="date" defaultValue="2024-12-05" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Scope & Special Requirements</label>
              <textarea rows={3} placeholder="Describe scope, compliance requirements, delivery conditions..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none" defaultValue="All equipment must carry valid BIS certification. Vendor must provide 3-year on-site warranty. Delivery to multiple locations across Mumbai, Pune, Bangalore." />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2"><Package size={16} className="text-indigo-400" />Line Items</h2>
              <button onClick={addItem} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium"><Plus size={14} />Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-slate-500 text-xs font-mono">ITEM {String(idx + 1).padStart(2, "0")}</span>
                    {items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-slate-500 text-xs block mb-1">Item Description</label>
                      <input defaultValue={item.name} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">Technical Specs</label>
                      <input defaultValue={item.specs} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">Quantity</label>
                      <input type="number" defaultValue={item.qty} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">Unit</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                        {["Nos", "Kg", "Litre", "Mtr", "Box", "Set"].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs block mb-1">Budget/Unit (₹)</label>
                      <input type="number" defaultValue={item.budget} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-2 flex items-center gap-2"><FileCheck size={16} className="text-indigo-400" />Terms & Conditions</h2>
            <div className="space-y-2 mt-4">
              {["Vendor must provide GST-compliant invoice", "Payment terms: Net-30 from delivery date", "Goods Received Note (GRN) mandatory before payment", "Vendor liable for transit damages", "Price once quoted is binding for 30 days"].map((term, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  <span className="text-slate-300 text-sm">{term}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-400" />Target Vendors</h2>
            <p className="text-slate-400 text-xs mb-3">{selectedVendors.length} selected</p>
            <div className="space-y-2">
              {MOCK_VENDORS.filter(v => v.status === "active").map(v => (
                <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedVendors.includes(v.id) ? "bg-indigo-600/10 border-indigo-500/30" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
                  <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{v.name.split(" ").slice(0, 3).join(" ")}</p>
                    <p className="text-slate-500 text-xs">{v.category} · ⭐{v.rating}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-white font-semibold mb-4">RFQ Summary</h2>
            <div className="space-y-3 text-sm">
              {[["Line Items", items.length], ["Target Vendors", selectedVendors.length], ["Deadline", "Nov 25, 2024"], ["Estimated Value", "₹7,00,000"], ["Created By", "Vikram Tiwari"]].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-medium">{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              <button onClick={() => setSubmitted(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                <Send size={14} />Publish RFQ
              </button>
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg text-sm transition-colors">Save as Draft</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}