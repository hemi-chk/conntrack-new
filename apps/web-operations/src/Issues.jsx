import { useState } from "react";
import {
  Search,
  User,
  Phone,
} from "lucide-react";

function Issues() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);

  const issues = [
    {
      orderId: "EXP-1023",
      type: "Damaged Cargo",
      supplier: "Prime Freight",
      assignedTo: "Ahmed Sharif",
      priority: "High",
      status: "Open",
      reported: "26 Feb 2026",
      updated: "2 hours ago",
      description:
        "Container XYZ7789 is severely damaged on the left side. Goods inside appear intact, but external damage needs assessment. Port Pass issue.",
    },
    {
      orderId: "IMP-2014",
      type: "Delivery Delay",
      supplier: "Horizon",
      assignedTo: "Santiago Ramos",
      priority: "Medium",
      status: "Escalated",
      reported: "25 Feb 2026",
      updated: "30 mins ago",
      description:
        "Shipment delayed due to customs clearance issue at origin port.",
    },
    {
      orderId: "EXP-1088",
      type: "Location Mismatch",
      supplier: "OceanLink Carriers",
      assignedTo: "Carter Wilson",
      priority: "Medium",
      status: "Resolved",
      reported: "24 Feb 2026",
      updated: "1 day ago",
      description:
        "Delivery address mismatch between order form and supplier manifest.",
    },
  ];

  const filtered = issues.filter((issue) => {
    const matchTab =
      tab === "All" ||
      issue.status.toLowerCase() === tab.toLowerCase();

    const matchSearch = issue.orderId
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchTab && matchSearch;
  });

  const priorityBadge = (priority) => {
    if (priority === "High") {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-[#DC2626]">
          High
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs rounded-full bg-orange-100 text-[#EA580C]">
        Medium
      </span>
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-6 bg-[#EFF6FF] min-h-full">
      {/* FILTER + SEARCH */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-3 flex-wrap">
          {["All", "Open", "Escalated", "Resolved"].map((t) => (
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

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-[#1E293B] bg-transparent"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#EFF6FF] border-b border-slate-200">
            <tr className="text-sm text-[#1E293B]">
              <th className="p-4">Order ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Assigned To</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Reported</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((issue, index) => (
              <tr key={index} className="border-b border-slate-200 hover:bg-gray-50">
                <td className="p-4 font-medium text-[#1E293B]">{issue.orderId}</td>
                <td className="p-4 text-[#1E293B]">{issue.type}</td>
                <td className="p-4 text-[#1E293B]">{issue.supplier}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-[#1E293B]">
                    <User size={16} className="text-slate-400" />
                    {issue.assignedTo}
                  </div>
                </td>
                <td className="p-4">{priorityBadge(issue.priority)}</td>
                <td className="p-4 text-[#1E293B]">{issue.status}</td>
                <td className="p-4 text-[#1E293B]">{issue.reported}</td>
                <td className="p-4 text-slate-500">{issue.updated}</td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedIssue(issue)}
                    className="px-4 py-1 bg-[#1E40AF] text-white rounded-md text-sm hover:bg-[#1E3A8A]"
                  >
                    Open ›
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILS PANEL */}
      {selectedIssue && (
        <div className="bg-white rounded-xl shadow p-8">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-[#1E293B]">
              {selectedIssue.orderId} — {selectedIssue.type}
            </h2>

            <div className="flex gap-3 flex-wrap">
              <button className="bg-[#1E40AF] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1E3A8A]">
                Send Update
              </button>
              <button className="bg-slate-200 text-[#1E293B] px-4 py-2 rounded-md text-sm hover:bg-slate-300">
                Request Escalation
              </button>
              <button className="bg-[#16A34A] text-white px-4 py-2 rounded-md text-sm hover:opacity-90">
                View Tracking
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 mb-6"></div>

          {/* BODY */}
          <div className="flex gap-10 flex-col lg:flex-row">
            {/* LEFT */}
            <div className="flex-1">
              <h3 className="font-semibold mb-3 text-[#1E293B]">Details</h3>

              <p className="text-slate-600 mb-6">
                {selectedIssue.description}
              </p>

              <div className="bg-white border border-slate-200 rounded-lg p-5 flex justify-between flex-col md:flex-row gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B]">
                      {selectedIssue.assignedTo}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedIssue.supplier}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <Phone size={16} />
                      123-456-7890
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-1 text-[#1E293B]">Contact</p>
                  <p className="text-sm text-slate-500">
                    {selectedIssue.supplier}
                  </p>
                  <p className="text-sm mt-2 text-[#1E293B]">123-456-7890</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="w-full lg:w-80 border-l-0 lg:border-l border-slate-200 lg:pl-8">
              <h3 className="font-semibold mb-4 text-[#1E293B]">History</h3>

              <div className="space-y-6">
                <div className="flex gap-3">
                  <User size={16} className="text-slate-400 mt-1" />
                  <div>
                    <p className="font-semibold text-[#1E293B]">
                      {selectedIssue.assignedTo}
                    </p>
                    <p className="text-sm text-slate-500">
                      Reported by {selectedIssue.assignedTo} • {selectedIssue.updated}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                <div className="flex gap-3">
                  <User size={16} className="text-slate-400 mt-1" />
                  <div>
                    <p className="font-semibold text-[#1E293B]">
                      {selectedIssue.assignedTo}
                    </p>
                    <p className="text-sm text-slate-500">
                      Reported by {selectedIssue.assignedTo} • {selectedIssue.updated}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Issues;