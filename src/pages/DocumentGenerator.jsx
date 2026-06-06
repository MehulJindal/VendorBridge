import { Printer, Send, Layers } from "lucide-react";
import { Card, StatusBadge, fmt, fmtN } from "../components/SharedUI";
import { MOCK_PO } from "../utils/mockData";

export default function DocumentGenerator() {
  const po = MOCK_PO;
  const computedItems = po.items.map(item => {
    const subtotal = item.qty * item.rate;
    const gst = subtotal * (item.gstRate / 100);
    return { ...item, subtotal, gst, total: subtotal + gst };
  });
  const grandSubtotal = computedItems.reduce((s, i) => s + i.subtotal, 0);
  const grandGST = computedItems.reduce((s, i) => s + i.gst, 0);
  const grandTotal = grandSubtotal + grandGST;
  const cgst = grandGST / 2;
  const sgst = grandGST / 2;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>PO-${po.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { color: #4f46e5; } table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
        td { padding: 10px; border: 1px solid #ddd; font-size: 12px; }
        .total-row { font-weight: bold; background: #f9fafb; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 20px; } .label { color: #6b7280; font-size: 11px; }
      </style></head><body>
      <div class="header"><div><h1>PURCHASE ORDER</h1><h2>${po.id}</h2><p class="label">Date: ${po.date}</p></div><div style="text-align:right"><h2>VendorBridge</h2><p class="label">${po.buyer.gst}</p><p>${po.buyer.address}</p></div></div>
      <div style="display:flex;gap:40px;margin-bottom:20px">
        <div class="section"><h3>Vendor Details</h3><p><b>${po.vendor.name}</b></p><p class="label">GST: ${po.vendor.gst}</p><p>${po.vendor.address}</p></div>
        <div class="section"><h3>Delivery Details</h3><p>Delivery Date: <b>${po.deliveryDate}</b></p><p>Payment Terms: ${po.paymentTerms}</p></div>
      </div>
      <table><tr>${["#","Description","Qty","Unit","Rate (₹)","Subtotal","GST%","GST Amt","Total"].map(h=>`<th>${h}</th>`).join("")}</tr>
      ${computedItems.map((item, i) => `<tr><td>${i+1}</td><td>${item.desc}</td><td>${item.qty}</td><td>${item.unit}</td><td>${fmtN(item.rate)}</td><td>${fmtN(item.subtotal)}</td><td>${item.gstRate}%</td><td>${fmtN(Math.round(item.gst))}</td><td>${fmtN(Math.round(item.total))}</td></tr>`).join("")}
      <tr class="total-row"><td colspan="5">TOTALS</td><td>${fmtN(Math.round(grandSubtotal))}</td><td></td><td>${fmtN(Math.round(grandGST))}</td><td>${fmtN(Math.round(grandTotal))}</td></tr></table>
      <div style="text-align:right;border-top:2px solid #4f46e5;padding-top:15px">
        <p>Subtotal: ₹${fmtN(Math.round(grandSubtotal))}</p>
        <p>CGST: ₹${fmtN(Math.round(cgst))}</p><p>SGST: ₹${fmtN(Math.round(sgst))}</p>
        <h2 style="color:#059669">GRAND TOTAL: ₹${fmtN(Math.round(grandTotal))}</h2>
      </div>
      <p style="margin-top:40px;font-size:11px;color:#6b7280">This is a computer-generated document. Authorized by VendorBridge Procurement System.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">PO & Invoice Generator</h1>
          <p className="text-slate-400 text-sm mt-1">Purchase Order · Auto-computed GST</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Printer size={16} />Print / Download
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Send size={16} />Email to Vendor
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* PO Header */}
        <div className="bg-gradient-to-r from-indigo-950/80 to-slate-950 p-6 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Layers size={18} className="text-white" /></div>
                <div>
                  <p className="text-white font-bold text-lg">VendorBridge Corp Pvt. Ltd.</p>
                  <p className="text-slate-400 text-xs">GST: {po.buyer.gst}</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-xs">{po.buyer.address}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-400 text-2xl font-bold font-mono">PURCHASE ORDER</p>
              <p className="text-white text-xl font-bold mt-1">{po.id}</p>
              <p className="text-slate-400 text-sm mt-1">Date: {po.date}</p>
              <StatusBadge status="approved" />
            </div>
          </div>
        </div>

        {/* Vendor & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-b border-slate-800">
          {[
            { title: "Bill To (Vendor)", lines: [po.vendor.name, `GST: ${po.vendor.gst}`, po.vendor.address, po.vendor.contact, po.vendor.email] },
            { title: "Ship To (Buyer)", lines: [po.buyer.name, `GST: ${po.buyer.gst}`, po.buyer.address] },
            { title: "Order Terms", lines: [`Delivery: ${po.deliveryDate}`, `Payment: ${po.paymentTerms}`, `Ship To: ${po.deliveryAddress}`, `Raised By: ${po.buyer.contact}`] },
          ].map(({ title, lines }, i) => (
            <div key={title} className={`p-5 ${i < 2 ? "border-b sm:border-b-0 sm:border-r border-slate-800" : ""}`}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">{title}</p>
              {lines.map((l, j) => <p key={j} className={`text-xs ${j === 0 ? "text-white font-semibold" : "text-slate-400"} ${j > 0 ? "mt-1" : ""}`}>{l}</p>)}
            </div>
          ))}
        </div>

        {/* Line Items Table */}
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 rounded-lg">
                  {["#", "Item Description", "Qty", "Unit", "Rate (₹)", "Subtotal (₹)", "GST %", "GST Amt (₹)", "Total (₹)"].map(h => (
                    <th key={h} className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-3 py-3 first:rounded-l-lg last:rounded-r-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {computedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-3 py-3 text-slate-500 text-sm">{idx + 1}</td>
                    <td className="px-3 py-3 text-white text-sm font-medium max-w-xs">{item.desc}</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{item.qty}</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{item.unit}</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{fmtN(item.rate)}</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{fmtN(item.subtotal)}</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{item.gstRate}%</td>
                    <td className="px-3 py-3 text-slate-300 text-sm">{fmtN(Math.round(item.gst))}</td>
                    <td className="px-3 py-3 text-white font-semibold text-sm">{fmtN(Math.round(item.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-800 p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Amount in Words</p>
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                <p className="text-white text-sm font-medium italic">Rupees One Lakh Fourteen Thousand Two Hundred Fifty Only</p>
              </div>
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p>• Subject to jurisdiction of Mumbai courts</p>
                <p>• E&OE — Errors & Omissions Excepted</p>
                <p>• Goods once dispatched not returnable without prior written consent</p>
              </div>
            </div>
            <div className="sm:w-72">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {[["Subtotal", fmt(Math.round(grandSubtotal)), "text-white"], ["CGST", fmt(Math.round(cgst)), "text-white"], ["SGST", fmt(Math.round(sgst)), "text-white"], ["Total GST", fmt(Math.round(grandGST)), "text-white"]].map(([label, val, cls]) => (
                  <div key={label} className="flex justify-between px-4 py-2.5 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span className={`text-sm font-medium ${cls}`}>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-4 bg-indigo-600/10">
                  <span className="text-white font-bold">GRAND TOTAL</span>
                  <span className="text-emerald-400 font-bold text-lg">{fmt(Math.round(grandTotal))}</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="border-t border-slate-700 pt-4 mt-8">
                  <p className="text-slate-500 text-xs">Authorized Signatory</p>
                  <p className="text-white text-sm font-semibold mt-1">VendorBridge Corp Pvt. Ltd.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 px-5 py-3 bg-slate-900/30 flex items-center justify-between">
          <p className="text-slate-600 text-xs">This is a computer-generated Purchase Order. No physical signature required. · System ID: VB-ERP-4.2.1</p>
          <div className="flex gap-2">
            <span className="text-slate-600 text-xs">Ref: {po.rfqId}</span>
          </div>
        </div>
      </Card>

      {/* PO List */}
      <Card className="p-5">
        <h2 className="text-white font-semibold mb-4">Recent Purchase Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["PO Number", "Vendor", "RFQ Ref", "Date", "Amount", "Status"].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[{ id: "PO-2024-0064", vendor: "SafeGuard Equipment Ltd.", rfq: "RFQ-2024-0086", date: "2024-11-14", amount: 114250, status: "approved" }, { id: "PO-2024-0063", vendor: "Prime Logistics Network", rfq: "RFQ-2024-0082", date: "2024-11-10", amount: 285000, status: "approved" }, { id: "PO-2024-0062", vendor: "TechSupplies India", rfq: "RFQ-2024-0079", date: "2024-11-05", amount: 1620000, status: "delivered" }, { id: "PO-2024-0061", vendor: "OfficeWorks Solutions", rfq: "RFQ-2024-0077", date: "2024-10-28", amount: 89000, status: "closed" }].map(row => (
                <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-3 py-3 text-indigo-400 text-sm font-mono">{row.id}</td>
                  <td className="px-3 py-3 text-white text-sm">{row.vendor}</td>
                  <td className="px-3 py-3 text-slate-400 text-sm font-mono">{row.rfq}</td>
                  <td className="px-3 py-3 text-slate-400 text-sm">{row.date}</td>
                  <td className="px-3 py-3 text-emerald-400 text-sm font-medium">{fmt(row.amount)}</td>
                  <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}