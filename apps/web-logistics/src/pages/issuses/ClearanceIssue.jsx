import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Search, Upload } from "lucide-react";

// Shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ClearanceIssues() {
    const [search, setSearch] = useState("");
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [file, setFile] = useState(null);

    const [issues, setIssues] = useState([
        {
            id: "ISS-001",
            orderId: "ORD-001",
            description: "Driver license expired",
            status: "FAILED",
            document: null,
        },
        {
            id: "ISS-002",
            orderId: "ORD-002",
            description: "Missing insurance document",
            status: "RE_SUBMITTED",
            document: "insurance.pdf",
        },
    ]);

    const filtered = issues.filter((issue) =>
        issue.orderId.toLowerCase().includes(search.toLowerCase())
    );

    // ✅ Upload logic
    const handleUpload = () => {
        if (!file || !selectedIssue) return;

        setIssues((prev) =>
            prev.map((issue) =>
                issue.id === selectedIssue.id
                    ? {
                        ...issue,
                        document: file.name,
                        status: "RE_SUBMITTED",
                    }
                    : issue
            )
        );

        setFile(null);
        setSelectedIssue(null);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "FAILED":
                return <Badge className="bg-red-100 text-red-600">Failed</Badge>;
            case "RE_SUBMITTED":
                return <Badge className="bg-orange-100 text-orange-600">Re-Submitted</Badge>;
            case "RESOLVED":
                return <Badge className="bg-green-100 text-green-600">Verified</Badge>;
            default:
                return <Badge>Unknown</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-white">

            {/* Header */}
            <div className="flex justify-between">
                <h1 className="text-2xl font-semibold">Clearance Issues</h1>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        className="pl-9 w-64"
                        placeholder="Search Order ID"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <CardTitle>Document Issues</CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Issue</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Document</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell>{issue.id}</TableCell>
                                    <TableCell>#{issue.orderId}</TableCell>
                                    <TableCell>{issue.description}</TableCell>
                                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                                    <TableCell>{issue.document || "—"}</TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Link to={`/orders/${issue.orderId}`}>
                                            <Button size="sm" variant="outline">
                                                View
                                            </Button>
                                        </Link>

                                        {issue.status === "FAILED" && (
                                            <Button
                                                size="sm"
                                                onClick={() => setSelectedIssue(issue)}
                                                className="bg-[#1E40AF] text-white"
                                            >
                                                <Upload className="h-4 w-4 mr-1" />
                                                Upload
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ✅ Upload Modal */}
            <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Corrected Document</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Order: #{selectedIssue?.orderId}
                        </p>

                        <Input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                        />

                        <Button
                            onClick={handleUpload}
                            className="w-full bg-[#1E40AF] text-white"
                        >
                            Upload & Submit
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}