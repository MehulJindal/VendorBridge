import { useState } from "react";
import { Briefcase, Users, DollarSign, Building2, Layers, Shield, Zap, Target, Eye, LogIn } from "lucide-react";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("procurement_officer");
  const [email, setEmail] = useState("vikram@vendorbridge.in");
  const [password, setPassword] = useState("Demo@1234");
  const [showPass, setShowPass] = useState(false);

  const roles = [
    { id: "procurement_officer", label: "Procurement Officer", icon: Briefcase, color: "indigo" },
    { id: "purchase_manager", label: "Purchase Manager", icon: Users, color: "emerald" },
    { id: "cfo", label: "CFO / Finance Head", icon: DollarSign, color: "amber" },
    { id: "vendor", label: "External Vendor", icon: Building2, color: "rose" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute border border-slate-400 rounded-full" style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">VendorBridge</span>
          </div>
          <p className="text-slate-500 text-sm">Procurement & Vendor ERP Platform</p>
        </div>
        <div className="relative z-10 space-y-8">
          {[
            { icon: Shield, title: "End-to-End Procurement", desc: "From RFQ creation to PO issuance — one unified platform." },
            { icon: Zap, title: "Real-Time Bid Comparison", desc: "Side-by-side vendor quotation analytics with cost intelligence." },
            { icon: Target, title: "Multi-Level Approvals", desc: "Configurable approval chains with complete audit trails." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2024 VendorBridge Corp. Enterprise Edition v4.2.1</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Layers size={18} className="text-white" /></div>
            <span className="text-white text-lg font-bold">VendorBridge</span>
          </div>

          {mode === "login" && (
            <>
              <h1 className="text-white text-2xl font-bold mb-1">Welcome back</h1>
              <p className="text-slate-400 text-sm mb-8">Sign in to your procurement workspace</p>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="you@company.in" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors pr-10" />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <Eye size={16} />
                    </button>
                  </div>
                  <button onClick={() => setMode("reset")} className="text-indigo-400 text-xs mt-2 hover:text-indigo-300">Forgot password?</button>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Login Role (Demo)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(({ id, label, icon: Icon }) => (
                      <button key={id} onClick={() => setRole(id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${role === id ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                        <Icon size={14} />{label.split(" ")[0]} {label.split(" ").slice(1, 2).join(" ")}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => onLogin(role)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <LogIn size={16} />Sign In to Dashboard
                </button>
                <p className="text-center text-slate-500 text-xs">Don't have an account? <button onClick={() => setMode("signup")} className="text-indigo-400 hover:text-indigo-300">Request Access</button></p>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <h1 className="text-white text-2xl font-bold mb-1">Request Access</h1>
              <p className="text-slate-400 text-sm mb-8">Submit your details for admin approval</p>
              <div className="space-y-4">
                {[["Full Name", "text", "Suresh Kumar"], ["Work Email", "email", "suresh@company.in"], ["Company / Organization", "text", "ABC Enterprises"], ["Mobile Number", "tel", "+91 98765 43210"]].map(([label, type, placeholder]) => (
                  <div key={label}>
                    <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">{label}</label>
                    <input type={type} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder={placeholder} />
                  </div>
                ))}
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors">Submit Access Request</button>
                <p className="text-center text-slate-500 text-xs">Back to <button onClick={() => setMode("login")} className="text-indigo-400 hover:text-indigo-300">Sign In</button></p>
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1 className="text-white text-2xl font-bold mb-1">Reset Password</h1>
              <p className="text-slate-400 text-sm mb-8">We'll email you a secure reset link</p>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Registered Email</label>
                  <input type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="your@email.com" />
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-xs">A one-time reset link will be sent to the registered email. Link expires in 30 minutes.</p>
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors">Send Reset Link</button>
                <p className="text-center text-slate-500 text-xs">Remembered it? <button onClick={() => setMode("login")} className="text-indigo-400 hover:text-indigo-300">Sign In</button></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}