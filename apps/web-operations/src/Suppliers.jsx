import { useState } from "react";
import {
  Eye,
  Pencil,
  Mail,
  Ban,
  CheckCircle,
  Clock3,
  XCircle,
  Building2,
  User,
  Phone,
  MapPin,
  MailOpen,
} from "lucide-react";

function Suppliers() {
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState(null);

  const suppliers = [
    {
      id: "SUP-001",
      type: "EXPORT",
      pickup: "Colombo Port",
      destination: "Dubai - Jebel Ali",
      status: "Active",
      company: "Global Trans Logistics",
      contact: "Ahmed Silva",
      phone: "+94 77 123 4567",
      email: "global@logistics.com",
      address: "Colombo 03, Sri Lanka",
    },
    {
      id: "SUP-002",
      type: "IMPORT",
      pickup: "Qatar Port",
      destination: "Colombo Port",
      status: "Pending",
      company: "OceanLink Carriers",
      contact: "Lionel Perera",
      phone: "+94 76 888 3322",
      email: "ocean@carrier.com",
      address: "Doha, Qatar",
    },
    {
      id: "SUP-003",
      type: "EXPORT",
      pickup: "Hambantota Port",
      destination: "Singapore",
      status: "Suspended",
      company: "Prime Freight",
      contact: "Carter Fernando",
      phone: "+94 75 222 8899",
      email: "prime@freight.com",
      address: "Singapore City",
    },
  ];

  const filtered =
    tab === "All"
      ? suppliers
      : suppliers.filter((s) => s.status === tab);

  const statusBadge = (status) => {
    if (status === "Active")
      return (
        <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-green-100 text-[#16A34A]">
          <CheckCircle size={14} /> Active
        </span>
      );

    if (status === "Pending")
      return (
        <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-orange-100 text-[#EA580C]">
          <Clock3 size={14} /> Pending
        </span>
      );

    if (status === "Suspended")
      return (
        <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-red-100 text-[#DC2626]">
          <XCircle size={14} /> Suspended
        </span>
      );

    return null;
  };

  return (
    <div className="bg-[#EFF6FF] p-6 h-full overflow-auto">
      {/* FILTER BUTTONS */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {["All", "Active", "Pending", "Suspended"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t
                ? "bg-[#1E40AF] text-white"
                : "bg-white border border-slate-300 text-[#1E293B] hover:bg-[#EFF6FF]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#EFF6FF] border-b border-slate-200">
            <tr className="text-sm text-[#1E293B]">
              <th className="p-4">Supplier ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Pickup</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-200 hover:bg-gray-50">
                <td className="p-4 text-[#1E293B]">{s.id}</td>
                <td className="p-4 text-[#1E293B]">{s.type}</td>
                <td className="p-4 text-[#1E293B]">{s.pickup}</td>
                <td className="p-4 text-[#1E293B]">{s.destination}</td>

                <td className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelected(s)}
                    className="flex items-center gap-1 text-[#1E40AF] text-sm hover:underline"
                  >
                    <Eye size={16} /> Details
                  </button>
                  {statusBadge(s.status)}
                </td>

                <td className="p-4">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <button className="flex items-center gap-1 text-[#1E40AF] hover:underline">
                      <Pencil size={16} /> Edit
                    </button>

                    <button className="flex items-center gap-1 text-[#16A34A] hover:underline">
                      <Mail size={16} /> Message
                    </button>

                    <button
                      className={`flex items-center gap-1 ${
                        s.status === "Suspended"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#DC2626] hover:underline"
                      }`}
                      disabled={s.status === "Suspended"}
                    >
                      <Ban size={16} /> Suspend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILS SECTION */}
      {selected && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-[#1E293B]">
              Supplier Full Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[#1E293B]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} /> {selected.company}
              </div>
              <div className="flex items-center gap-2">
                <User size={16} /> {selected.contact}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} /> {selected.phone}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MailOpen size={16} /> {selected.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} /> {selected.address}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;