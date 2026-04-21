import { useState } from "react";
import { Printer, FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ReportsPage() {
    const [fromDate] = useState("2026-04-01");
    const [toDate] = useState("2026-04-20");

    const handlePrint = () => window.print();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 bg-white">

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* 1. FORCE HIDE EVERYTHING */
                    body * {
                        visibility: hidden;
                    }

                    /* 2. ONLY SHOW THE REPORT CONTENT */
                    .printable-report, .printable-report * {
                        visibility: visible;
                    }

                    /* 3. RESET POSITIONING SO IT SITS AT THE TOP-LEFT */
                    .printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: visible !important;
                    }

                    /* 4. HIDE SPECIFIC UI ELEMENTS INSIDE THE REPORT */
                    .no-print {
                        display: none !important;
                    }

                    /* 5. PAGE SETTINGS */
                    @page {
                        size: A4;
                        margin: 20mm;
                    }

                    /* Fix for broken borders/colors on some printers */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />

            {/* Added 'printable-report' class to the main wrapper */}
            <div className="printable-report space-y-6">

                {/* --- FORMAL PRINT HEADER (Visible only on print) --- */}
                <div className="hidden print:flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">CONNTRACK LOGISTICS</h1>
                        <p className="text-sm uppercase tracking-[0.2em] font-bold text-slate-500">Official Operations Report</p>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-600">
                        <p>GENERATED: {new Date().toLocaleDateString()}</p>
                        <p>REF: REPT-2026-001</p>
                    </div>
                </div>

                {/* --- APP HEADER (Added 'no-print' class) --- */}
                <div className="flex items-center justify-between no-print mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#1E40AF] p-2 rounded-lg text-white">
                            <FileBarChart size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                            <p className="text-slate-500 text-sm">Review performance</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="no-print">
                            <Download className="mr-2 h-4 w-4" /> CSV
                        </Button>
                        <Button onClick={handlePrint} className="bg-[#1E40AF] text-white font-bold px-6 no-print">
                            <Printer className="mr-2 h-4 w-4" /> Print Report
                        </Button>
                    </div>
                </div>

                {/* --- DATA SUMMARY --- */}
                <div className="grid grid-cols-4 gap-4 print:gap-4">
                    <div className="p-6 border-2 border-slate-100 rounded-2xl print:border-slate-300 bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">24</h2>
                    </div>
                    <div className="p-6 border-2 border-slate-100 rounded-2xl print:border-slate-300 bg-slate-50/30">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                        <h2 className="text-4xl font-black text-emerald-600 tracking-tight">15</h2>
                    </div>
                    <div className="p-6 border-2 border-slate-100 rounded-2xl print:border-slate-300 col-span-2 hidden print:flex flex-col justify-center text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporting Period</p>
                        <p className="text-xl font-bold text-slate-700 tracking-tight">{fromDate} — {toDate}</p>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden print:border-slate-300">
                    <Table className="w-full">
                        <TableHeader className="bg-slate-50 print:bg-slate-100 border-b-2 border-slate-100 print:border-slate-300">
                            <TableRow>
                                <TableHead className="font-bold text-slate-800 h-12 px-6 uppercase text-[10px]">Order ID</TableHead>
                                <TableHead className="font-bold text-slate-800 h-12 px-6 uppercase text-[10px]">Type</TableHead>
                                <TableHead className="font-bold text-slate-800 h-12 px-6 text-right uppercase text-[10px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b border-slate-50 print:border-slate-100 h-14">
                                <TableCell className="font-bold text-[#1E40AF] px-6">#ORD-001</TableCell>
                                <TableCell className="px-6 font-medium">Import</TableCell>
                                <TableCell className="text-right font-black text-emerald-600 px-6">Completed</TableCell>
                            </TableRow>
                            <TableRow className="border-b border-slate-50 print:border-slate-100 h-14">
                                <TableCell className="font-bold text-[#1E40AF] px-6">#ORD-002</TableCell>
                                <TableCell className="px-6 font-medium">Export</TableCell>
                                <TableCell className="text-right font-black text-blue-600 px-6">In Progress</TableCell>
                            </TableRow>
                            <TableRow className="h-14">
                                <TableCell className="font-bold text-[#1E40AF] px-6">#ORD-003</TableCell>
                                <TableCell className="px-6 font-medium">Import</TableCell>
                                <TableCell className="text-right font-black text-red-600 px-6">Failed</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* --- SIGNATURE BLOCK --- */}
                <div className="hidden print:grid grid-cols-2 gap-20 mt-24">
                    <div className="border-t-4 border-slate-900 pt-4">
                        <p className="text-sm font-black uppercase text-slate-900 tracking-tight">Authorized Signature</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">ConnTrack Operations Manager</p>
                    </div>
                    <div className="border-t-4 border-slate-900 pt-4 text-right">
                        <p className="text-sm font-black uppercase text-slate-900 tracking-tight">Official Stamp</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">Date of Review</p>
                    </div>
                </div>

                <p className="hidden print:block text-center text-[10px] font-bold text-slate-300 pt-20 uppercase tracking-widest">
                    Generated via ConnTrack Logistics Secure Portal
                </p>
            </div>
        </div>
    );
}