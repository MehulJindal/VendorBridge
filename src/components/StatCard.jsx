import { Card } from "./SharedUI";

export default function StatCard({ icon: Icon, label, value, sub, color = "indigo", trend }) {
  const colors = { 
    indigo: "text-indigo-400 bg-indigo-500/10", 
    emerald: "text-emerald-400 bg-emerald-500/10", 
    amber: "text-amber-400 bg-amber-500/10", 
    rose: "text-rose-400 bg-rose-500/10" 
  };
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}><Icon size={20} className={colors[color].split(" ")[0]} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
      {trend && <span className={`text-xs font-semibold ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>{trend > 0 ? "+" : ""}{trend}%</span>}
    </Card>
  );
}