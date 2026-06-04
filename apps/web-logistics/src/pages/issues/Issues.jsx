import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send, XCircle, ChevronRight } from 'lucide-react';
import api from "../../config/api";
import { Button } from "@conntrack/ui";

const Issues = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        order_id: '',
        supplier_id: '',
        driver_id: '',
        issue_type: '',
        priority: 'medium',
        description: '',
    });

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

            if (response.data.success) {
                setStatusMessage({ type: 'success', text: 'Issue reported successfully and queued for review.' });
                setFormData({
                    order_id: '',
                    supplier_id: '',
                    driver_id: '',
                    issue_type: '',
                    priority: 'medium',
                    description: '',
                });
            }
        } catch (error) {
            console.error('Submission Error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to connect to logistics server.';
            setStatusMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header Section (Consistent with Dashboard/Reports) */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report Logistics Issue</h1>
                        <p className="text-sm text-slate-500 font-medium">Log an incident or delay for operational review</p>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Visual Status Indicator */}
                    <div className="h-1.5 w-full bg-amber-500" />

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Feedback Messages */}
                            {statusMessage.text && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${statusMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    <span className="text-sm font-semibold">{statusMessage.text}</span>
                                </div>
                            )}

                            {/* Section 1: Core Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference Order ID</label>
                                    <input
                                        type="number"
                                        name="order_id"
                                        value={formData.order_id}
                                        placeholder="Enter Order Number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Category</label>
                                    <select
                                        name="issue_type"
                                        value={formData.issue_type}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-slate-700 appearance-none"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Mechanical Breakdown">Mechanical Breakdown</option>
                                        <option value="Traffic/Route Delay">Traffic/Route Delay</option>
                                        <option value="Documentation Issue">Documentation Issue</option>
                                        <option value="Cargo Damage">Cargo Damage</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section 2: Stakeholders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Supplier ID (Optional)</label>
                                    <input
                                        type="number"
                                        name="supplier_id"
                                        value={formData.supplier_id}
                                        placeholder="Supplier #"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver ID (Optional)</label>
                                    <input
                                        type="number"
                                        name="driver_id"
                                        value={formData.driver_id}
                                        placeholder="Driver #"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-semibold text-slate-700"
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
                                                className="sr-only peer"
                                            />
                                            <div className={`
                                                w-full py-3 text-center text-xs font-black uppercase tracking-tighter rounded-xl border-2 transition-all
                                                ${formData.priority === p
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}
                                            `}>
                                                {p}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Description */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Incident Breakdown</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    rows="5"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 resize-none leading-relaxed"
                                    placeholder="Describe the exact situation, location, and impact..."
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            order_id: '',
                                            supplier_id: '',
                                            driver_id: '',
                                            issue_type: '',
                                            priority: 'medium',
                                            description: '',
                                        });
                                        setStatusMessage({ type: '', text: '' });
                                    }}
                                    className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                                    disabled={isSubmitting}
                                >
                                    Reset Form
                                </button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-12 px-10 bg-[#1E40AF] hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Submit Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                

                </div>

            </div>
        
    );
};

export default Issues;