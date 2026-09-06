export const BIDDING_ORDERS_PER_PAGE = 6;

export const AWARD_STATUS_PROCESS_ORDER = [
  "No Bids Received",
  "Shortlisting Required",
  "Shortlist Ready - Finalize",
  "Winner Selection Required",
  "Selected Supplier Notice Pending",
  "Awaiting Supplier Response",
  "Alternate Winner Selection Required",
  "Unsuccessful Supplier Notifications Pending",
  "Award Completed",
];

export const AWARD_WORKFLOW_LABELS = {
  bidding_closed_no_bids: "No Bids Received",
  shortlisting_required: "Shortlisting Required",
  shortlist_ready_to_send: "Shortlist Ready - Finalize",

  // Old DB value kept for compatibility.
  // Winner selection is now handled by Operations.
  awaiting_logistics_selection: "Winner Selection Required",

  selected_supplier_notice_pending:
    "Selected Supplier Notice Pending",

  awaiting_supplier_response:
    "Awaiting Supplier Response",

  alternate_supplier_selection_required:
    "Alternate Winner Selection Required",

  unsuccessful_supplier_notifications_pending:
    "Unsuccessful Supplier Notifications Pending",

  award_completed: "Award Completed",
};