import { FileText } from "lucide-react";
import { Card, StatusBadge, fmt } from "../components/SharedUI";
import { MOCK_RFQS } from "../utils/mockData";

export default function RFQList() {
  return (
    <div className="space-y-4">
      <h1 className="text-white text-2xl font-bold">RFQ Management</h1>
      <div className="grid gap-3">
        {MOCK_RFQS.map(rfq => (
          <Card key={rfq.id} className="p-4 hover:border-slate-700 transition-colors cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center"><FileText size={16} className="text-indigo-400" /></div>
                <div>
                  <p className="text-white font-semibold">{rfq.title}</p>
                  <p className="text-slate-500 text-xs">{rfq.id} · {rfq.category} · Deadline: {rfq.deadline}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Responses</p>
                  <p className="text-white font-semibold">{rfq.responses} / {rfq.vendors}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Est. Value</p>
                  <p className="text-emerald-400 font-semibold">{fmt(rfq.estimatedValue)}</p>
                </div>
                <StatusBadge status={rfq.status} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}