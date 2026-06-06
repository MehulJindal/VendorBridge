import { useState } from "react";
import { ChevronRight, Building2, Star, Mail, Phone, MapPin, Hash, DollarSign, CheckCircle, Package, Plus, Search, Eye } from "lucide-react";
import { Card, StatusBadge, fmt, fmtN } from "../components/SharedUI";
import StatCard from "../components/StatCard";
import { MOCK_VENDORS } from "../utils/mockData";

export default function VendorManagement() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = MOCK_VENDORS.filter(v =>
    (filter === "all" || v.status === filter) &&
    (v.name.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase()))
  );

  if (selected) {
    const v = selected;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm"><ChevronRight size={16} className="rotate-180" />Back to Vendors</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Building2 size={28} className="text-indigo-400" />
              </div>
              <h2 className="text-white font-bold text-lg">{v.name}</h2>
              <p className="text-slate-400 text-sm">{v.category}</p>
              <StatusBadge status={v.status} />
              <div className="flex items-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < Math.floor(v.rating) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />)}
                <span className="text-slate-400 text-xs ml-1">{v.rating}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-800 pt-6">
              {[
                [Mail, v.email], [Phone, v.phone], [MapPin, v.city + ", India"], [Hash, "GST: " + v.gst]
              ].map(([Icon, val], i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Icon size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300 truncate">{val}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={DollarSign} label="Total Spend" value={fmt(v.spend)} color="indigo" />
              <StatCard icon={CheckCircle} label="On-Time %" value={v.onTime + "%"} color={v.onTime >= 90 ? "emerald" : "amber"} />
              <StatCard icon={Package} label="Total Orders" value={fmtN(v.orders)} color="indigo" />
            </div>
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-4">Vendor Profile Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[["Vendor ID", v.id], ["Category", v.category], ["Primary Contact", v.contact], ["GST Number", v.gst], ["City", v.city + ", India"], ["Status", v.status.toUpperCase()]].map(([l, val]) => (
                  <div key={l}>
                    <p className="text-slate-500 text-xs mb-1">{l}</p>
                    <p className="text-white font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-3">Performance Metrics</h3>
              {[["Quality Score", 87, "indigo"], ["Delivery Reliability", v.onTime, v.onTime >= 90 ? "emerald" : "amber"], ["Price Competitiveness", 74, "indigo"], ["Documentation Compliance", 95, "emerald"]].map(([label, val, color]) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between mb-1"><span className="text-slate-400 text-xs">{label}</span><span className="text-white text-xs font-medium">{val}%</span></div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color === "emerald" ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Vendor Database</h1>
          <p className="text-slate-400 text-sm mt-1">{MOCK_VENDORS.length} registered suppliers</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />Add New Vendor
        </button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors by name or ID..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{f}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Vendor ID", "Name & Contact", "Category", "GST Number", "Rating", "On-Time %", "Total Spend", "Status", ""].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 text-indigo-400 text-sm font-mono">{v.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">{v.name}</p>
                    <p className="text-slate-500 text-xs">{v.contact} · {v.city}</p>
                  </td>
                  <td className="px-4 py-3"><span className="text-slate-300 text-sm">{v.category}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{v.gst}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-white text-sm font-medium">{v.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${v.onTime >= 90 ? "text-emerald-400" : v.onTime >= 75 ? "text-amber-400" : "text-red-400"}`}>{v.onTime}%</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{fmt(v.spend)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(v)} className="text-slate-500 hover:text-indigo-400 transition-colors"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 text-xs">Showing {filtered.length} of {MOCK_VENDORS.length} vendors</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700">Previous</button>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">1</button>
            <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}