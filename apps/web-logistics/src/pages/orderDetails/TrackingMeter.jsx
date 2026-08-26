import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, Card, CardContent } from "@/ui";
import api from "../../config/api";

const TrackingMeter = ({ orderId, orderType }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // =========================================
  // TRACKING FLOWS
  // =========================================

  const flows = {
    export: ["yard", "boi_gate", "freezone", "port"],
    import: ["port", "freezone", "boi_gate", "yard"],
  };

  // =========================================
  // STATUS NORMALIZATION
  // =========================================

  const statusMap = {
    yard: "yard",
    loading: "yard",

    boi_gate: "boi_gate",
    departed: "boi_gate",
    in_transit: "boi_gate",

    freezone: "freezone",
    at_freezone: "freezone",

    port: "port",
    at_port: "port",

    delivered: "yard",
  };

  // =========================================
  // LABELS
  // =========================================

  const labels = {
    yard: "Yard",
    boi_gate: "BOI Gate",
    freezone: "Free Zone",
    port: "Port",
  };

  // =========================================
  // FETCH TRACKING
  // =========================================

  const fetchTracking = async (isRefresh = false) => {
    if (!orderId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(false);

      const res = await api.get(
        `/logistics/tracking/order/${orderId}`
      );

      if (res.data?.trackingAvailable) {
        setTrackingData(res.data);
      } else {
        setTrackingData(null);
      }
    } catch (err) {
      console.error(
        "Error fetching tracking meter data:",
        err
      );

      setError(true);
      setTrackingData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================
  // INITIAL FETCH
  // =========================================

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-10">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2
                size={21}
                className="animate-spin text-[#1E40AF]"
              />
            </div>

            <p className="text-sm font-semibold">
              Loading tracking status...
            </p>

            <p className="text-xs text-slate-400">
              Retrieving the latest container location
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =========================================
  // ORDER TYPE / FLOW
  // =========================================

  const currentType = (
    orderType ||
    trackingData?.order_details?.order_type ||
    "export"
  ).toLowerCase();

  const currentFlow =
    flows[currentType] || flows.export;

  // =========================================
  // CURRENT STATUS
  // =========================================

  const currentStatusRaw =
    trackingData?.tracking_details?.status || "";

  const normalizedStatus =
    statusMap[currentStatusRaw] || currentStatusRaw;

  const currentIdx =
    currentFlow.indexOf(normalizedStatus);

  const currentLabel =
    labels[normalizedStatus] ||
    currentStatusRaw ||
    "Not available";

  // =========================================
  // PROGRESS
  // =========================================

  const progress =
    currentIdx >= 0 && currentFlow.length > 1
      ? (currentIdx / (currentFlow.length - 1)) * 100
      : 0;

  // =========================================
  // TRACKING DETAILS
  // =========================================

  const currentLocation =
    trackingData?.tracking_details?.location ||
    currentLabel ||
    "Unknown Location";

  const timestamp =
    trackingData?.tracking_details?.timestamp;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  // =========================================
  // ERROR STATE
  // =========================================

  if (error) {
    return (
      <Card className="border-red-200 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle
                size={22}
                className="text-red-600"
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Unable to load tracking
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                We couldn't retrieve the latest container
                tracking information.
              </p>
            </div>

            <Button
              onClick={() => fetchTracking(true)}
              disabled={refreshing}
              variant="outline"
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="bg-slate-50/80 px-5 md:px-6 py-4 border-b border-slate-200">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Navigation
                size={17}
                className="text-[#1E40AF]"
              />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Container Tracking
              </h2>

              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Real-time shipment progress
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <Badge
              variant="outline"
              className="bg-blue-50 text-[#1E40AF] border-blue-200 text-[10px] font-bold uppercase"
            >
              {currentType} Flow
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchTracking(true)}
              disabled={refreshing}
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#1E40AF] hover:bg-blue-50"
              title="Refresh tracking"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </Button>

          </div>

        </div>
      </div>

      {/* =========================================
          CONTENT
      ========================================= */}

      <CardContent className="p-5 md:p-7">

        {!trackingData ? (
          <div className="flex flex-col items-center justify-center text-center py-8">

            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
              <Package
                size={21}
                className="text-amber-600"
              />
            </div>

            <h3 className="text-sm font-bold text-slate-800">
              Tracking Not Available
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No container tracking data has been
              recorded for this order yet.
            </p>

          </div>
        ) : (
          <div className="space-y-7">

            {/* =====================================
                CURRENT STATUS
            ===================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Current Status
                </p>

                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {currentLabel}
                </h3>
              </div>

              {currentIdx >= 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">

                  <CheckCircle2
                    size={15}
                    className="text-emerald-600"
                  />

                  <span className="text-xs font-bold text-emerald-700">
                    Step {currentIdx + 1} of{" "}
                    {currentFlow.length}
                  </span>

                </div>
              )}

            </div>

            {/* =====================================
                TRACKING STEPPER
            ===================================== */}

            <div className="relative px-2 sm:px-6 pt-3 pb-2">

              {/* Background line */}

              <div className="absolute top-[30px] left-[12%] right-[12%] h-1 bg-slate-100 rounded-full" />

              {/* Active line */}

              <div
                className="absolute top-[30px] left-[12%] h-1 bg-[#1E40AF] rounded-full transition-all duration-700"
                style={{
                  width: `${progress * 0.76}%`,
                }}
              />

              {/* Steps */}

              <div className="relative z-10 flex justify-between">

                {currentFlow.map(
                  (stepKey, idx) => {
                    const isDone =
                      currentIdx >= 0 &&
                      idx <= currentIdx;

                    const isActive =
                      currentIdx === idx;

                    return (
                      <div
                        key={stepKey}
                        className="flex flex-col items-center min-w-0"
                      >

                        {/* Circle */}

                        <div
                          className={`
                            w-9 h-9 sm:w-11 sm:h-11
                            rounded-full
                            border-4
                            flex items-center justify-center
                            transition-all duration-300
                            shadow-sm
                            ${
                              isDone
                                ? "bg-[#1E40AF] border-blue-100 text-white"
                                : "bg-white border-slate-200 text-slate-300"
                            }
                            ${
                              isActive
                                ? "ring-4 ring-blue-100 scale-110"
                                : ""
                            }
                          `}
                        >
                          {isDone ? (
                            <CheckCircle2
                              size={17}
                            />
                          ) : (
                            <span className="text-[10px] font-bold">
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Label */}

                        <p
                          className={`
                            text-[10px] sm:text-xs
                            mt-3
                            font-bold
                            text-center
                            leading-tight
                            max-w-[70px]
                            ${
                              isDone
                                ? "text-slate-800"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {labels[stepKey] ||
                            stepKey}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>
            </div>

            {/* =====================================
                LOCATION / LAST UPDATE
            ===================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Location */}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                <div className="flex items-center gap-2 mb-2">

                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin
                      size={15}
                      className="text-[#1E40AF]"
                    />
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Current Location
                  </p>

                </div>

                <p className="text-sm font-extrabold text-slate-800">
                  {currentLocation}
                </p>

              </div>

              {/* Last Update */}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                <div className="flex items-center gap-2 mb-2">

                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Clock
                      size={15}
                      className="text-slate-600"
                    />
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Last Updated
                  </p>

                </div>

                <p className="text-sm font-extrabold text-slate-800">
                  {formattedTime}
                </p>

                {formattedDate && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formattedDate}
                  </p>
                )}

              </div>

            </div>

            {/* =====================================
                LIVE STATUS MESSAGE
            ===================================== */}

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">

              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Navigation
                  size={15}
                  className="text-[#1E40AF]"
                />
              </div>

              <div>

                <p className="text-xs font-bold text-[#052659]">
                  Shipment is currently at{" "}
                  {currentLocation}
                </p>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tracking information is updated
                  whenever a new movement is recorded.
                </p>

              </div>

            </div>

          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default TrackingMeter;