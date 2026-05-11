import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Package,
  Map,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DocumentsSection from "./DocumentsSection";
import OrderSummary from "./OrderSummary";

import api from "../../config/api";

export default function DocumentsPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  // STATES

  const [order, setOrder] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  // DOCUMENT FLOW

  const documentFlows = {

    // IMPORT:
    // PORT → FREEZONE → BOI → YARD

    import: [
      "port",
      "freezone",
      "boi_gate",
      "yard"
    ],

    // EXPORT:
    // YARD → BOI → FREEZONE → PORT

    export: [
      "yard",
      "boi_gate",
      "freezone",
      "port"
    ]
  };

  // FETCH ORDER


  const fetchOrderDetails = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        `/logistics/orders/${id}`
      );

      setOrder(response.data);

    } catch (err) {

      console.error("Fetch Error:", err);

      setError(
        err.response?.data?.message ||
        err.message
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      // 1. Instantly update UI by filtering out the deleted doc
      setOrder(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.document_id !== docId)
      }));

      // 2. Call backend to delete for real
      await api.delete(`/logistics/documents/${docId}`);

      // 3. Optional: Silent refresh in background
      fetchOrderDetails(true);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
      // If failed, refresh to restore the list
      fetchOrderDetails(true);
    }
  };

  // INITIAL FETCH

  useEffect(() => {

    if (id) {
      fetchOrderDetails();
    }

  }, [id]);

  // LOADING

  if (loading) {

    return (

      <div className="flex h-screen items-center justify-center bg-slate-50">

        <Loader2
          size={40}
          className="animate-spin text-[#1E40AF]"
        />

      </div>
    );
  }

  // ERROR

  if (error || !order) {

    return (

      <div className="p-20 text-center">

        <h2 className="text-xl font-bold text-red-600">
          Order not found
        </h2>

        <Button
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>

      </div>
    );
  }

  // CURRENT FLOW


  const stages =
    documentFlows[
    order.order_type
    ] || documentFlows.import;

  // =========================================
  // ASSIGNMENT STATUS
  // =========================================

  const orderAssignment =
    order.order_assignments?.[0];

  const hasSupplier =
    !!orderAssignment?.supplier_id;

  const hasDriver =
    !!orderAssignment?.driver_id;

  const assignmentReady =
    hasSupplier && hasDriver;

  // =========================================
  // TRACKING STATUS
  // =========================================

  const isTrackable = [
    "bid_accepted",
    "driver_assigned",
    "in_transit",
    "at_port",
    "completed"
  ].includes(order.current_status);

  // =========================================
  // FORMAT LABEL
  // =========================================

  const formatStageName = (stage) => {

    const labels = {
      port: "PORT",
      freezone: "FREE ZONE",
      boi_gate: "BOI GATE",
      yard: "YARD"
    };

    return labels[stage] || stage;
  };

  // =========================================
  // UPLOAD HANDLER
  // =========================================

  const handleDocumentUpload = async (
    stage,
    files
  ) => {

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

      // Replace with logged user id later
      /* 
      formData.append(
        "uploaded_by",
        "temp-user-id"
      );
      */

      // Append files
      files.forEach((file) => {

        formData.append(
          "files",
          file.rawFile
        );

      });

      // =====================================
      // API CALL
      // =====================================

      await api.post(
        "/logistics/documents/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

      alert(
        `${formatStageName(stage)} documents uploaded successfully`
      );

      // Refresh order documents
      await fetchOrderDetails(true);

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Upload failed"
      );
    }
  };

  // =========================================
  // UI
  // =========================================

  return (

    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ===================================== */}
      {/* TOP NAVBAR */}
      {/* ===================================== */}

      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">

        <div className="flex items-center gap-4">

          {/* BACK BUTTON */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          <div className="h-5 w-px bg-slate-200" />

          {/* ORDER INFO */}
          <div className="flex items-center gap-3">

            <div className="bg-[#1E40AF] text-white p-2 rounded-xl">

              <Package size={18} />

            </div>

            <div>

              <p className="text-sm font-bold text-slate-800">

                {order.order_reference ||
                  `Order #${order.order_id}`}

              </p>

              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">
                Clearance Documents
              </p>

            </div>

          </div>

          {/* ORDER TYPE */}
          <Badge
            variant="outline"
            className="capitalize bg-white"
          >
            {order.order_type}
          </Badge>

          {/* REFRESHING */}
          {refreshing && (

            <div className="flex items-center gap-2 text-xs text-slate-400">

              <Loader2
                size={12}
                className="animate-spin"
              />

              Refreshing...

            </div>

          )}

          {/* TRACK BUTTON */}
          {isTrackable && (

            <Button
              size="sm"
              variant="outline"
              className="ml-auto border-blue-200 text-[#1E40AF] hover:bg-blue-50"
              onClick={() =>
                navigate(
                  `/tracking/${order.order_id}`
                )
              }
            >
              <Map
                size={14}
                className="mr-1"
              />

              Live Track

            </Button>

          )}

        </div>

      </div>

      {/* ===================================== */}
      {/* PAGE CONTENT */}
      {/* ===================================== */}

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===================================== */}
        {/* LEFT SIDE */}
        {/* ===================================== */}

        <div className="lg:col-span-2 space-y-6">

          {/* ===================================== */}
          {/* WARNING */}
          {/* ===================================== */}

          {!assignmentReady ? (

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">

              <div className="flex items-start gap-3">

                <div className="bg-amber-100 p-2 rounded-xl">

                  <AlertTriangle
                    size={18}
                    className="text-amber-700"
                  />

                </div>

                <div>

                  <h3 className="font-bold text-amber-800">

                    Don't upload documents before assigning a supplier and driver for the order


                  </h3>

                </div>

              </div>

            </div>

          ) : (

            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">

              <div className="flex items-start gap-3">

                <div className="bg-green-100 p-2 rounded-xl">

                  <CheckCircle2
                    size={18}
                    className="text-green-700"
                  />

                </div>

                <div>

                  <h3 className="font-bold text-green-800">

                    Upload Ready

                  </h3>

                  <p className="text-sm text-green-700 mt-1">

                    Supplier and driver assigned successfully.
                    Clearance document uploads are now available.

                  </p>

                </div>

              </div>

            </div>

          )}

          {/* ===================================== */}
          {/* DOCUMENT FLOW */}
          {/* ===================================== */}

          <div className="space-y-6">

            {stages.map((stage, index) => (

              <div key={stage}>

                {/* STEP INDICATOR */}
                <div className="flex items-center gap-3 mb-3">

                  <div className="
                    w-7 h-7 rounded-full
                    bg-[#1E40AF]
                    text-white
                    text-xs
                    font-bold
                    flex items-center justify-center
                  ">

                    {index + 1}

                  </div>

                  <div>

                    <p className="text-sm font-bold text-slate-700">

                      {formatStageName(stage)}

                    </p>

                    <p className="text-xs text-slate-400">

                      Document Upload Stage

                    </p>

                  </div>

                </div>

                <DocumentsSection

                  stageName={
                    formatStageName(stage)
                  }

                  disabled={false}
                  showWarning={false}



                  existingFiles={
                    order.documents?.filter((doc) => {

                      const stageName = doc?.current_location;
                      return stageName === stage;

                    }) || []
                  }

                  onFinishUpload={(files) =>
                    handleDocumentUpload(
                      stage,
                      files
                    )
                  }
                  onDelete={handleDeleteDocument}

                />

              </div>

            ))}

          </div>

        </div>

        {/* ===================================== */}
        {/* RIGHT SIDE */}
        {/* ===================================== */}

        <div>

          <OrderSummary order={order} />

        </div>

      </div>

    </div>
  );
}