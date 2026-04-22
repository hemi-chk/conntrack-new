import { useState } from "react";
import { FileOutput } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("Orders");

  const chartData = [
    { name: "Apr 1-7", Export: 50, Import: 40 },
    { name: "Apr 8-14", Export: 70, Import: 55 },
    { name: "Apr 15-21", Export: 90, Import: 65 },
    { name: "Apr 22-28", Export: 80, Import: 60 },
  ];

  return (
    <div className="bg-[#EFF6FF] p-8 space-y-8 min-h-full">
      {/* TABS */}
      <div className="flex gap-3 flex-wrap">
        {["Orders", "Deliveries", "Supplier Performance", "Driver Performance"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? "bg-[#1E40AF] text-white shadow"
                : "bg-white border border-slate-300 text-[#1E293B] hover:bg-[#EFF6FF]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-wrap gap-8 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1">Date Range</label>
          <select className="border border-slate-300 rounded-md px-4 py-2 text-sm bg-white text-[#1E293B]">
            <option>April 2024</option>
            <option>May 2024</option>
            <option>June 2024</option>
            <option>July 2024</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1">Status</label>
          <select className="border border-slate-300 rounded-md px-4 py-2 text-sm bg-white text-[#1E293B]">
            <option>All</option>
            <option>Open</option>
            <option>Escalated</option>
            <option>Resolved</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1">Type</label>
          <select className="border border-slate-300 rounded-md px-4 py-2 text-sm bg-white text-[#1E293B]">
            <option>Export</option>
            <option>Import</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1">Supplier</label>
          <select className="border border-slate-300 rounded-md px-4 py-2 text-sm bg-white text-[#1E293B]">
            <option>All Suppliers</option>
            <option>Global Trans</option>
            <option>OceanLink Carriers</option>
            <option>Horizon</option>
          </select>
        </div>

        <button className="ml-auto bg-[#1E40AF] text-white px-6 py-2 rounded-md hover:bg-[#1E3A8A] transition">
          Apply Filters
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-slate-500 text-sm">Total Orders</p>
          <h2 className="text-3xl font-bold mt-2 text-[#1E293B]">385</h2>
          <p className="text-[#16A34A] text-sm mt-1">▲ 12.5%</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-slate-500 text-sm">Completed Orders</p>
          <h2 className="text-3xl font-bold mt-2 text-[#1E293B]">342</h2>
          <p className="text-[#16A34A] text-sm mt-1">▲ 10.4%</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-slate-500 text-sm">On-Time Rate</p>
          <h2 className="text-3xl font-bold mt-2 text-[#1E293B]">89.4%</h2>
          <p className="text-[#16A34A] text-sm mt-1">▲ 15.2%</p>
        </div>
      </div>

      {/* ORDERS OVERVIEW */}
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#1E293B]">Orders Overview</h2>

          <button className="flex items-center gap-2 bg-[#EFF6FF] px-4 py-2 rounded-md text-sm text-[#1E293B] hover:bg-slate-200 transition">
            <FileOutput size={16} />
            Export Report
          </button>
        </div>

        {/* CHART */}
        <div className="h-72 bg-[#EFF6FF] rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Export"
                stroke="#1E40AF"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Import"
                stroke="#EA580C"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TABLE */}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-[#1E293B]">
            <tr>
              <th className="py-2">Supplier</th>
              <th>Total Orders</th>
              <th>Completed</th>
              <th>Cancelled</th>
              <th>Avg Delivery %</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 text-[#1E293B]">
              <td className="py-2">Global Trans</td>
              <td>120</td>
              <td>109</td>
              <td>11</td>
              <td className="text-[#16A34A]">92.5%</td>
            </tr>
            <tr className="border-b border-slate-200 text-[#1E293B]">
              <td className="py-2">OceanLink Carriers</td>
              <td>98</td>
              <td>85</td>
              <td>13</td>
              <td className="text-[#16A34A]">86.7%</td>
            </tr>
            <tr className="border-b border-slate-200 text-[#1E293B]">
              <td className="py-2">Horizon</td>
              <td>80</td>
              <td>72</td>
              <td>8</td>
              <td className="text-[#16A34A]">90%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ISSUE IMPACT */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-[#1E293B]">Issue Impact</h2>

          <div className="flex gap-4 text-sm flex-wrap">
            <span className="bg-red-100 text-[#DC2626] px-3 py-1 rounded-full">
              Total Issues: 19
            </span>
            <span className="bg-orange-100 text-[#EA580C] px-3 py-1 rounded-full">
              Escalated: 5
            </span>
            <span className="bg-green-100 text-[#16A34A] px-3 py-1 rounded-full">
              Resolution Rate: 73.7%
            </span>
          </div>
        </div>

        <div className="text-slate-500 text-sm">
          Supplier Impact Summary Placeholder
        </div>
      </div>
    </div>
  );
}