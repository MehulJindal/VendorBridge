export const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const fmtN = (n) => new Intl.NumberFormat("en-IN").format(n);

export const StatusBadge = ({ status }) => {
  const map = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    inactive: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    bidding: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    draft: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    closed: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    submitted: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    waiting: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.info}`}>
      {status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
};

export const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-950 border border-slate-800 rounded-xl ${className}`}>{children}</div>
);