import { ArrowLeft, Gavel } from "lucide-react";
import { useEffect, useState } from "react";

import Bidding from "./Bidding";

function BiddingOrder({ orderId, onNavigate }) {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `${API_BASE_URL}/api/operations/orders`
        );

        const responseText = await response.text();
        let result = [];

        try {
          result = responseText
            ? JSON.parse(responseText)
            : [];
        } catch {
          throw new Error(
            `Orders API returned an invalid response. Status: ${response.status}`
          );
        }

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Failed to load the selected order."
          );
        }

        if (!Array.isArray(result)) {
          throw new Error(
            "Invalid orders response from backend."
          );
        }

        const normalizedTarget = String(
          orderId || ""
        )
          .trim()
          .toLowerCase();

        const matchedOrder = result.find((item) => {
          const candidates = [
            item?.order_id,
            item?.orderId,
            item?.dbId,
            item?.order_reference,
            item?.orderReference,
            item?.id,
          ];

          return candidates.some(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value)
                .trim()
                .toLowerCase() ===
                normalizedTarget
          );
        });

        if (!matchedOrder) {
          throw new Error(
            `Order ${orderId} was not found.`
          );
        }

        if (!cancelled) {
          setOrder(matchedOrder);
        }
      } catch (error) {
        if (!cancelled) {
          setOrder(null);
          setErrorMessage(
            error.message ||
              "Failed to load the selected bidding order."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, orderId]);

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#EBF4FF] p-5">
        <div className="mx-auto max-w-[1500px]">
          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate("/bidding")
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#052659] hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Bidding
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#052659]">
              <Gavel
                size={22}
                className="text-white"
              />
            </div>

            <h2 className="text-lg font-semibold text-[#1E293B]">
              Loading bidding workspace...
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Loading order {orderId}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="min-h-full bg-[#EBF4FF] p-5">
        <div className="mx-auto max-w-[1500px]">
          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate("/bidding")
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#052659] hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Bidding
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to open bidding workspace
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {errorMessage ||
                "The selected order could not be loaded."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const orderKey =
    order?.order_id ||
    order?.order_reference ||
    orderId;

  return (
    <Bidding
      key={String(orderKey)}
      detailMode
      initialOrder={order}
      onNavigate={onNavigate}
    />
  );
}

export default BiddingOrder;
