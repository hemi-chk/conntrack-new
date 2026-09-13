import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Package,
  Upload
} from "lucide-react";

import { Badge, Button } from "@/ui";

import DocumentsSection from "./DocumentsSection";
import OrderSummary from "./OrderSummary";

import api from "../../config/api";

export default function DocumentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // STATE
    // =========================================================

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // =========================================================
    // DOCUMENT FLOWS
    // =========================================================

    const documentFlows = {
        // IMPORT:
        // PORT → FREEZONE → BOI → YARD
        import: [
            "port",
            "freezone",
            "boi_gate",
            "yard",
        ],

        // EXPORT:
        // YARD → BOI → FREEZONE → PORT
        export: [
            "yard",
            "boi_gate",
            "freezone",
            "port",
        ],
    };

    // =========================================================
    // FETCH ORDER
    // =========================================================

    const fetchOrderDetails = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const response = await api.get(
                `/logistics/orders/${id}`
            );

            setOrder(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);

            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to load order details."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =========================================================
    // INITIAL FETCH
    // =========================================================

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    const handleDeleteDocument = async (docId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmed) return;

        try {
            // Optimistic UI update
            setOrder((prev) => ({
                ...prev,
                documents:
                    prev.documents?.filter(
                        (document) =>
                            document.document_id !== docId
                    ) || [],
            }));

            // Delete from backend
            await api.delete(
                `/logistics/documents/${docId}`
            );

            // Refresh in background
            fetchOrderDetails(true);
        } catch (err) {
            console.error("Delete Error:", err);

            alert(
                err.response?.data?.message ||
                    "Failed to delete document."
            );

            // Restore actual backend state
            fetchOrderDetails(true);
        }
    };

    // =========================================================
    // UPLOAD DOCUMENTS
    // =========================================================

    const handleDocumentUpload = async (stage, files) => {
        try {
            const formData = new FormData();

            formData.append(
                "order_id",
                order.order_id
            );

            formData.append(
                "stage_name",
                stage
            );

            /*
             * Replace this later with the actual
             * logged-in user's ID.
             */

            // formData.append(
            //     "uploaded_by",
            //     "temp-user-id"
            // );

            files.forEach((file) => {
                formData.append(
                    "files",
                    file.rawFile
                );
            });

            await api.post(
                "/logistics/documents/upload",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

            alert(
                `${formatStageName(stage)} documents uploaded successfully.`
            );

            await fetchOrderDetails(true);
        } catch (err) {
            console.error(
                "Document Upload Error:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Document upload failed."
            );
        }
    };

    // =========================================================
    // LOADING STATE
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <div className="mx-auto flex min-h-[600px] max-w-7xl items-center justify-center px-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                            <Loader2
                                size={28}
                                className="animate-spin text-blue-600"
                            />
                        </div>

                        <p className="mt-4 text-sm font-extrabold text-slate-800">
                            Loading documents
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Retrieving shipment documentation...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR STATE
    // =========================================================

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50/60 px-6 py-8">
                <div className="mx-auto flex min-h-[600px] max-w-7xl items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <FileText
                                size={26}
                                className="text-slate-400"
                            />
                        </div>

                        <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                            Documents Not Found
                        </h2>

                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            {error ||
                                "The requested order documents could not be found."}
                        </p>

                        <Button
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="
                                mt-6
                                h-10
                                gap-2
                                rounded-xl
                                bg-slate-900
                                px-5
                                text-xs
                                font-bold
                                text-white
                                hover:bg-slate-800
                            "
                        >
                            <ArrowLeft size={14} />
                            Back to Order
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // DOCUMENT STAGES
    // =========================================================

    const stages =
        documentFlows[order.order_type] ||
        documentFlows.import;

    // =========================================================
    // ASSIGNMENT STATUS
    // =========================================================

    const orderAssignment =
        order.order_assignments?.[0];

    const hasSupplier =
        !!orderAssignment?.supplier_id;

    const hasDriver =
        !!orderAssignment?.driver_id;

    const assignmentReady =
        hasSupplier && hasDriver;

    // =========================================================
    // FORMAT STAGE NAME
    // =========================================================

    const formatStageName = (stage) => {
        const labels = {
            port: "PORT",
            freezone: "FREE ZONE",
            boi_gate: "BOI GATE",
            yard: "YARD",
        };

        return labels[stage] || stage;
    };

    // =========================================================
    // DOCUMENT COUNT
    // =========================================================

    const getStageDocuments = (stage) => {
        return (
            order.documents?.filter(
                (document) =>
                    document?.current_location === stage
            ) || []
        );
    };

    const totalDocuments =
        order.documents?.length || 0;

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-50/60 px-4 py-5 md:px-6 md:py-7">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}

                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left side */}
                    <div className="flex min-w-0 items-center gap-3">

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                text-slate-600
                                shadow-sm
                                transition-all
                                hover:border-slate-300
                                hover:bg-slate-900
                                hover:text-white
                            "
                        >
                            <ArrowLeft size={17} />
                        </button>

                        <div className="min-w-0">

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2">

                                <span className="
                                    text-lg
                                    font-extrabold
                                    tracking-tight
                                    text-slate-900
                                ">
                                    Order Documents
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="shrink-0 text-slate-300"
                                />

                                <span className="
                                    truncate
                                    font-mono
                                    text-xs
                                    font-bold
                                    text-blue-700
                                ">
                                    {order.order_reference ||
                                        `#${order.order_id}`}
                                </span>

                            </div>

                            <p className="
                                mt-0.5
                                text-[11px]
                                font-medium
                                text-slate-400
                            ">
                                Clearance documents and shipment
                                documentation
                            </p>

                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">

                        {refreshing && (
                            <div className="
                                hidden
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-2
                                text-[10px]
                                font-bold
                                text-slate-500
                                sm:flex
                            ">
                                <Loader2
                                    size={12}
                                    className="animate-spin"
                                />

                                Refreshing
                            </div>
                        )}

                        <Badge
                            className="
                                rounded-xl
                                border
                                border-blue-200
                                bg-blue-50
                                px-3
                                py-2
                                text-[10px]
                                font-extrabold
                                uppercase
                                tracking-wider
                                text-blue-700
                            "
                        >
                            {order.order_type}
                        </Badge>

                    </div>
                </header>


                {/* =====================================================
                    ORDER IDENTIFICATION CARD
                ====================================================== */}

                <section className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200/80
                    bg-white
                    shadow-sm
                ">

                    <div className="
                        flex
                        flex-col
                        gap-4
                        p-5
                        md:flex-row
                        md:items-center
                        md:justify-between
                        md:p-6
                    ">

                        <div className="flex items-center gap-4">

                            <div className="
                                flex
                                h-12
                                w-12
                                shrink-0
                                items-center
                                justify-center
                                rounded-2xl
                                bg-blue-50
                            ">
                                <FileText
                                    size={21}
                                    className="text-blue-600"
                                />
                            </div>

                            <div>
                                <p className="
                                    text-[10px]
                                    font-extrabold
                                    uppercase
                                    tracking-[0.16em]
                                    text-slate-400
                                ">
                                    Clearance Documents
                                </p>

                                <h1 className="
                                    mt-1
                                    text-lg
                                    font-extrabold
                                    tracking-tight
                                    text-slate-900
                                    md:text-xl
                                ">
                                    {order.order_reference ||
                                        `Order #${order.order_id}`}
                                </h1>

                                <p className="
                                    mt-1
                                    text-[11px]
                                    font-medium
                                    text-slate-500
                                ">
                                    {order.order_type === "import"
                                        ? "Import documentation flow"
                                        : "Export documentation flow"}
                                </p>
                            </div>

                        </div>

                        {/* Document count */}
                        <div className="
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            px-4
                            py-3
                        ">

                            <div className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                bg-white
                                text-slate-600
                            ">
                                <FileText size={15} />
                            </div>

                            <div>
                                <p className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-400
                                ">
                                    Documents
                                </p>

                                <p className="
                                    mt-0.5
                                    text-sm
                                    font-extrabold
                                    text-slate-800
                                ">
                                    {totalDocuments} Uploaded
                                </p>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <div className="
                    grid
                    grid-cols-1
                    gap-6
                    lg:grid-cols-5
                ">

                    {/* =================================================
                        LEFT COLUMN
                    ================================================= */}

                    <div className="
                        space-y-5
                        lg:col-span-3
                    ">

                        {/* =================================================
                            ASSIGNMENT STATUS
                        ================================================= */}

                        <section className={`
                            rounded-2xl
                            border
                            p-4
                            ${
                                assignmentReady
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-amber-200 bg-amber-50/70"
                            }
                        `}>

                            <div className="flex items-start gap-3">

                                <div className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    ${
                                        assignmentReady
                                            ? "bg-emerald-100"
                                            : "bg-amber-100"
                                    }
                                `}>

                                    {assignmentReady ? (
                                        <CheckCircle2
                                            size={17}
                                            className="text-emerald-700"
                                        />
                                    ) : (
                                        <AlertTriangle
                                            size={17}
                                            className="text-amber-700"
                                        />
                                    )}

                                </div>

                                <div className="min-w-0">

                                    <p className={`
                                        text-xs
                                        font-extrabold
                                        ${
                                            assignmentReady
                                                ? "text-emerald-800"
                                                : "text-amber-800"
                                        }
                                    `}>
                                        {assignmentReady
                                            ? "Document Upload Ready"
                                            : "Assignment Required"}
                                    </p>

                                    <p className={`
                                        mt-1
                                        text-[11px]
                                        font-medium
                                        leading-relaxed
                                        ${
                                            assignmentReady
                                                ? "text-emerald-700"
                                                : "text-amber-700"
                                        }
                                    `}>
                                        {assignmentReady
                                            ? "A supplier and driver have been assigned. Clearance documents can now be uploaded."
                                            : "A supplier and driver must be assigned before clearance documents can be uploaded."}
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* =================================================
                            DOCUMENT FLOW HEADER
                        ================================================== */}

                        <div className="
                            flex
                            items-center
                            justify-between
                            px-1
                        ">

                            <div>
                                <h2 className="
                                    text-sm
                                    font-extrabold
                                    text-slate-900
                                ">
                                    Documentation Flow
                                </h2>

                                <p className="
                                    mt-0.5
                                    text-[10px]
                                    font-medium
                                    text-slate-400
                                ">
                                    Upload documents at each shipment stage
                                </p>
                            </div>

                            <div className="
                                hidden
                                items-center
                                gap-1.5
                                text-[10px]
                                font-bold
                                text-slate-400
                                sm:flex
                            ">
                                <Upload size={12} />
                                {stages.length} Stages
                            </div>

                        </div>


                        {/* =================================================
                            STAGE CARDS
                        ================================================== */}

                        <div className="space-y-4">

                            {stages.map((stage, index) => {

                                const stageDocuments =
                                    getStageDocuments(stage);

                                const documentCount =
                                    stageDocuments.length;

                                const isLastStage =
                                    index ===
                                    stages.length - 1;

                                return (
                                    <section
                                        key={stage}
                                        className="
                                            overflow-hidden
                                            rounded-2xl
                                            border
                                            border-slate-200/80
                                            bg-white
                                            shadow-sm
                                        "
                                    >

                                        {/* Stage Header */}
                                        <div className="
                                            flex
                                            items-center
                                            gap-3
                                            border-b
                                            border-slate-100
                                            px-5
                                            py-4
                                        ">

                                            {/* Step number */}
                                            <div className="
                                                flex
                                                h-9
                                                w-9
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-[#052659]
                                                text-xs
                                                font-extrabold
                                                text-white
                                            ">
                                                {index + 1}
                                            </div>

                                            {/* Stage information */}
                                            <div className="min-w-0">

                                                <div className="flex items-center gap-2">

                                                    <h3 className="
                                                        text-sm
                                                        font-extrabold
                                                        text-slate-900
                                                    ">
                                                        {formatStageName(stage)}
                                                    </h3>

                                                    {documentCount > 0 && (
                                                        <span className="
                                                            rounded-md
                                                            bg-emerald-50
                                                            px-2
                                                            py-0.5
                                                            text-[9px]
                                                            font-extrabold
                                                            uppercase
                                                            tracking-wider
                                                            text-emerald-700
                                                        ">
                                                            Complete
                                                        </span>
                                                    )}

                                                </div>

                                                <p className="
                                                    mt-0.5
                                                    text-[9px]
                                                    font-semibold
                                                    uppercase
                                                    tracking-wider
                                                    text-slate-400
                                                ">
                                                    Stage {index + 1}
                                                    {" "}
                                                    {isLastStage
                                                        ? "• Final Stage"
                                                        : "• Documentation Required"}
                                                </p>

                                            </div>

                                            {/* Count */}
                                            <div className="ml-auto shrink-0">

                                                <span className="
                                                    inline-flex
                                                    items-center
                                                    rounded-lg
                                                    bg-slate-100
                                                    px-2.5
                                                    py-1.5
                                                    text-[10px]
                                                    font-bold
                                                    text-slate-600
                                                ">
                                                    {documentCount}{" "}
                                                    {documentCount === 1
                                                        ? "File"
                                                        : "Files"}
                                                </span>

                                            </div>

                                        </div>


                                        {/* Documents */}
                                        <div className="p-5">

                                            <DocumentsSection
                                                stageName={formatStageName(
                                                    stage
                                                )}
                                                disabled={
                                                    !assignmentReady
                                                }
                                                showWarning={
                                                    !assignmentReady
                                                }
                                                existingFiles={
                                                    stageDocuments
                                                }
                                                onFinishUpload={(
                                                    files
                                                ) =>
                                                    handleDocumentUpload(
                                                        stage,
                                                        files
                                                    )
                                                }
                                                onDelete={
                                                    handleDeleteDocument
                                                }
                                            />

                                        </div>

                                    </section>
                                );
                            })}

                        </div>

                    </div>


                    {/* =================================================
                        RIGHT COLUMN
                    ================================================== */}

                    <div className="lg:col-span-2">

                        <div className="
                            space-y-4
                            lg:sticky
                            lg:top-20
                        ">

                            {/* Summary */}
                            <OrderSummary
                                order={order}
                            />

                            {/* Flow information */}
                            <section className="
                                rounded-2xl
                                border
                                border-slate-200/80
                                bg-white
                                p-5
                                shadow-sm
                            ">

                                <div className="flex items-center gap-3">

                                    <div className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-50
                                    ">
                                        <Package
                                            size={16}
                                            className="text-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="
                                            text-xs
                                            font-extrabold
                                            text-slate-900
                                        ">
                                            Document Flow
                                        </h3>

                                        <p className="
                                            mt-0.5
                                            text-[10px]
                                            font-medium
                                            text-slate-400
                                        ">
                                            {order.order_type === "import"
                                                ? "Import clearance sequence"
                                                : "Export clearance sequence"}
                                        </p>
                                    </div>

                                </div>


                                {/* Flow */}
                                <div className="
                                    mt-5
                                    space-y-2
                                ">

                                    {stages.map(
                                        (stage, index) => {

                                            const count =
                                                getStageDocuments(
                                                    stage
                                                ).length;

                                            return (
                                                <div
                                                    key={stage}
                                                    className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                    "
                                                >

                                                    <div className="
                                                        flex
                                                        h-7
                                                        w-7
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        bg-slate-100
                                                        text-[10px]
                                                        font-extrabold
                                                        text-slate-600
                                                    ">
                                                        {index + 1}
                                                    </div>

                                                    <div className="flex-1">

                                                        <p className="
                                                            text-[11px]
                                                            font-bold
                                                            text-slate-700
                                                        ">
                                                            {formatStageName(
                                                                stage
                                                            )}
                                                        </p>

                                                    </div>

                                                    <span className="
                                                        text-[9px]
                                                        font-bold
                                                        text-slate-400
                                                    ">
                                                        {count}{" "}
                                                        uploaded
                                                    </span>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </section>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}