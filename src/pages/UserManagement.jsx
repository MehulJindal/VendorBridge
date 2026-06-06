import { useState } from "react";
import {
  ChevronRight,
  Users,
  Mail,
  Phone,
  Shield,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
} from "lucide-react";
import { Card, StatusBadge } from "../components/SharedUI";

const MOCK_USERS = [
  {
    id: 1,
    name: "Vikram Tiwari",
    email: "vikram@vendorbridge.in",
    role: "procurement_officer",
    status: "active",
    phone: "+91-9876543210",
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Sunita Kapoor",
    email: "sunita@vendorbridge.in",
    role: "purchase_manager",
    status: "active",
    phone: "+91-9876543211",
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@vendorbridge.in",
    role: "admin",
    status: "active",
    phone: "+91-9876543212",
    joinDate: "2024-01-01",
  },
  {
    id: 4,
    name: "Rajesh Kumar",
    email: "rajesh@vendorbridge.in",
    role: "procurement_officer",
    status: "inactive",
    phone: "+91-9876543213",
    joinDate: "2024-03-10",
  },
  {
    id: 5,
    name: "Priya Singh",
    email: "priya@vendorbridge.in",
    role: "purchase_manager",
    status: "active",
    phone: "+91-9876543214",
    joinDate: "2024-04-05",
  },
];

const ROLE_LABELS = {
  procurement_officer: "Procurement Officer",
  purchase_manager: "Purchase Manager",
  admin: "Admin",
  vendor: "Vendor",
};

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = MOCK_USERS.filter(
    (u) =>
      (filter === "all" || u.status === filter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  if (selected && !showForm) {
    const u = selected;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to Users
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Users size={28} className="text-indigo-400" />
              </div>
              <h2 className="text-white font-bold text-lg">{u.name}</h2>
              <p className="text-slate-400 text-sm">{ROLE_LABELS[u.role]}</p>
              <StatusBadge status={u.status} />
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-800 pt-6">
              {[
                [Mail, u.email],
                [Phone, u.phone],
                [Shield, ROLE_LABELS[u.role]],
              ].map(([Icon, val], i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Icon size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300 truncate">{val}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-4">User Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["User ID", u.id],
                  ["Role", ROLE_LABELS[u.role]],
                  ["Email", u.email],
                  ["Phone", u.phone],
                  ["Join Date", u.joinDate],
                  ["Status", u.status.toUpperCase()],
                ].map(([l, val]) => (
                  <div key={l}>
                    <p className="text-slate-500 text-xs mb-1">{l}</p>
                    <p className="text-white font-medium">{val}</p>
                  </div>
                ))}
              </div>
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
          <h1 className="text-white text-2xl font-bold">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {MOCK_USERS.length} registered users
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add New User
        </button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {[
                  "User ID",
                  "Name & Email",
                  "Role",
                  "Join Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-slate-500 text-xs font-medium uppercase tracking-wider px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-indigo-400 text-sm font-mono">
                    #{u.id}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 text-sm">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {u.joinDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(u)}
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="text-slate-500 hover:text-amber-400 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            Showing {filtered.length} of {MOCK_USERS.length} users
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">
              1
            </button>
            <button className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
