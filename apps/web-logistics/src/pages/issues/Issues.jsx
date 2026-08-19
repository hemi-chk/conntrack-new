import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Filter, 
    Loader2, 
    Plus, 
    RefreshCw, 
    Search, 
    Send, 
    ShieldAlert, 
    UserCheck, 
    XCircle,
    FileText,
    ChevronDown,
    Building2,
    Truck,
    Hash
} from 'lucide-react';
import api from "../../config/api";
import { Button } from "@/ui";

const Issues = () => {
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'report'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const [formData, setFormData] = useState({
        order_id: '',
        supplier_id: '',
        driver_id: '',
        issue_type: 'Operational Delay',
        priority: 'medium',
        description: '',
    });

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/logistics/issues');
            if (response.data && response.data.success) {
                setIssues(response.data.data || []);
            } else if (Array.isArray(response.data)) {
                setIssues(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch issues history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await api.post('/logistics/issues', formData);

            if (response.data && response.data.success) {
                setStatusMessage({ 
                    type: 'success', 
                    text: 'Issue successfully reported to Admin and logged into system database.' 
                });
                setFormData({
                    order_id: '',
                    supplier_id: '',
                    driver_id: '',
                    issue_type: 'Operational Delay',
                    priority: 'medium',
                    description: '',
                });
                fetchIssues();
                setTimeout(() => setActiveTab('list'), 1500);
            } else {
                throw new Error(response.data?.error || 'Failed to report issue');
            }
        } catch (error) {
            console.error('Submission Error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to submit issue to Admin.';
            setStatusMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredIssues = issues.filter(issue => {
        const matchesSearch = 
            (issue.issue_reference && issue.issue_reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (issue.issue_type && issue.issue_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (issue.order_id && String(issue.order_id).includes(searchQuery)) ||
            (issue.orders?.order_reference && issue.orders.order_reference.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical':
                return <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200 uppercase tracking-wider">Critical</span>;
            case 'high':
                return <span className="px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-full border border-orange-200 uppercase tracking-wider">High</span>;
            case 'medium':
                return <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200 uppercase tracking-wider">Medium</span>;
            case 'low':
                return <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200 uppercase tracking-wider">Low</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-full uppercase tracking-wider">{priority || 'Normal'}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        <CheckCircle2 size={12} />
                        Resolved
                    </span>
                );
            case 'escalated':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                        <ShieldAlert size={12} />
                        Escalated to Admin
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        <Clock size={12} />
                        Open
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-[#1E40AF] rounded-xl border border-blue-100">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics Issue Incident Center</h1>
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">Admin Escalation</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Log logistics incidents directly to Admin & view past reported issues database</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'list'
                                ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <FileText size={16} />
                        Past Reported Issues ({issues.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'report'
                                ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Plus size={16} />
                        Report Incident to Admin
                    </button>
                </div>
            </div>

            {/* TAB 1: PAST ISSUES TABLE */}
            {activeTab === 'list' && (
                <div className="space-y-4">
                    {/* Controls & Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by ref, order #, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="escalated">Escalated</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                            >
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <button
                                onClick={fetchIssues}
                                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
                                title="Refresh"
                            >
                                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF]" />
                                <p className="text-xs font-bold uppercase tracking-wider">Loading Issues Table Database...</p>
                            </div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 space-y-3">
                                <AlertTriangle className="w-10 h-10 mx-auto text-slate-300" />
                                <p className="text-sm font-bold text-slate-700">No issues found</p>
                                <p className="text-xs text-slate-400">No reported incidents match your search or filter options.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="py-3.5 px-4">Issue Ref</th>
                                            <th className="py-3.5 px-4">Order ID</th>
                                            <th className="py-3.5 px-4">Category</th>
                                            <th className="py-3.5 px-4">Stakeholders</th>
                                            <th className="py-3.5 px-4">Priority</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4">Description</th>
                                            <th className="py-3.5 px-4 text-right">Reported Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                        {filteredIssues.map((issue) => (
                                            <tr key={issue.issue_id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-4 px-4 font-bold text-blue-900 font-mono">
                                                    {issue.issue_reference || `#ISS-${issue.issue_id}`}
                                                </td>
                                                <td className="py-4 px-4 font-semibold text-slate-900">
                                                    {issue.orders?.order_reference || (issue.order_id ? `#ORD-${issue.order_id}` : 'N/A')}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-800">
                                                    {issue.issue_type || 'General Issue'}
                                                </td>
                                                <td className="py-4 px-4 space-y-1">
                                                    {issue.suppliers?.company_name && (
                                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                                            <Building2 size={12} className="text-slate-400" />
                                                            {issue.suppliers.company_name}
                                                        </div>
                                                    )}
                                                    {issue.drivers && (
                                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                                            <Truck size={12} className="text-slate-400" />
                                                            {issue.drivers.first_name} {issue.drivers.last_name}
                                                        </div>
                                                    )}
                                                    {!issue.suppliers?.company_name && !issue.drivers && (
                                                        <span className="text-slate-400 font-mono text-[11px]">Supplier: #{issue.supplier_id || '-'} / Driver: #{issue.driver_id || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getPriorityBadge(issue.priority)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(issue.status)}
                                                </td>
                                                <td className="py-4 px-4 max-w-xs truncate text-slate-600" title={issue.description}>
                                                    {issue.description}
                                                </td>
                                                <td className="py-4 px-4 text-right text-slate-400 font-mono text-[11px]">
                                                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : 'Recently'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: REPORT NEW ISSUE FORM */}
            {activeTab === 'report' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-1.5 w-full bg-[#1E40AF]" />

                        <div className="p-8">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-900">Log Logistics Incident to Admin</h2>
                                <p className="text-xs font-semibold text-slate-500">
                                    Submissions are stored directly in public.issues table and auto-trigger reference code generation for Admin review.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {statusMessage.text && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                        statusMessage.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                        {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        <span className="text-xs font-bold">{statusMessage.text}</span>
                                    </div>
                                )}

                                {/* Section 1: Core Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Reference Order ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="order_id"
                                            value={formData.order_id}
                                            placeholder="Numeric Order ID (e.g. 1, 2)"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-xs text-slate-700"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Issue Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="issue_type"
                                            value={formData.issue_type}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-xs text-slate-700"
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="Mechanical Breakdown">Mechanical Breakdown</option>
                                            <option value="Traffic/Route Delay">Traffic/Route Delay</option>
                                            <option value="Documentation Issue">Documentation Issue</option>
                                            <option value="Cargo Damage">Cargo Damage</option>
                                            <option value="Operational Delay">Operational Delay</option>
                                            <option value="Other">Other Operational Issue</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Section 2: Stakeholders */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Supplier ID (Optional)</label>
                                        <input
                                            type="number"
                                            name="supplier_id"
                                            value={formData.supplier_id}
                                            placeholder="e.g. 5"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-xs text-slate-700"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver ID (Optional)</label>
                                        <input
                                            type="number"
                                            name="driver_id"
                                            value={formData.driver_id}
                                            placeholder="e.g. 12"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-xs text-slate-700"
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Priority Selection */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Severity Level</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['low', 'medium', 'high', 'critical'].map((p) => (
                                            <label key={p} className="relative flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value={p}
                                                    checked={formData.priority === p}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <div className={`
                                                    w-full py-3 text-center text-xs font-black uppercase tracking-tighter rounded-xl border-2 transition-all
                                                    ${formData.priority === p
                                                        ? 'bg-[#1E40AF] border-[#1E40AF] text-white shadow-md shadow-blue-200 scale-[1.02]'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                                                `}>
                                                    {p}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 4: Description */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                        Incident Breakdown <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        rows="4"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-xs text-slate-700 resize-none leading-relaxed"
                                        placeholder="Detailed description of the operational incident to report to Admin..."
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('list')}
                                        className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-11 px-8 bg-[#1E40AF] hover:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-2 text-xs"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send size={15} />
                                                Submit to Admin
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Issues;

