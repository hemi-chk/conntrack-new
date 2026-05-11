import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ClipboardList, Send, XCircle } from 'lucide-react';
import api from "../../config/api";

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
            // Using your configured Axios instance
            const response = await api.post('/logistics/issues', formData);

            if (response.data.success) {
                setStatusMessage({ type: 'success', text: 'Issue reported and synced with fleet management.' });
                // Reset form on success
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
        <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Section */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Logistics Issues</h2>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Feedback Messages */}
                    {statusMessage.text && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${statusMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* Reference IDs Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Order ID</label>
                            <input
                                type="number"
                                name="order_id"
                                value={formData.order_id}
                                placeholder="10XXX"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Issue Category</label>
                            <input
                                type="text"
                                name="issue_type"
                                value={formData.issue_type}
                                placeholder="e.g. Damage, Delay"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                required
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Stakeholders Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Supplier ID</label>
                            <input
                                type="number"
                                name="supplier_id"
                                value={formData.supplier_id}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Driver ID</label>
                            <input
                                type="number"
                                name="driver_id"
                                value={formData.driver_id}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Priority Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Priority Level</label>
                        <div className="flex flex-wrap gap-3">
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
                                    <div className="px-5 py-2 text-sm font-bold capitalize rounded-lg border border-slate-200 peer-checked:bg-[#1E40AF] peer-checked:text-white peer-checked:border-[#1E40AF] peer-checked:shadow-md transition-all hover:bg-slate-100 text-slate-600">
                                        {p}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Incident Details</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            rows="4"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium resize-none"
                            placeholder="Provide a comprehensive breakdown of the incident..."
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setStatusMessage({ type: '', text: '' })}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            disabled={isSubmitting}
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-[#1E40AF] rounded-lg hover:bg-blue-800 shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Issues;