ConTrack Operations Module

The ConTrack Operations Module is the operational control center of the ConTrack logistics management platform. It manages the order lifecycle from order creation and supplier bidding through award communication, shipment monitoring, issue handling, completion, and archiving.

The module is part of the ConTrack monorepo and uses a React/Vite frontend, Node.js/Express backend, and Supabase PostgreSQL database.

1. Module Summary

The Operations Module provides the following main capabilities:

Operations dashboard and operational summaries

Create and manage transport orders

Open, extend, and close supplier bidding

Review submitted supplier bids

Create and finalize supplier shortlists

Select the winning supplier from the finalized shortlist

Notify the winning supplier

Notify unsuccessful suppliers

Monitor driver and shipment progress

Manage operational issues

Archive and restore eligible orders

View Operations notifications

Produce operational reports and status summaries

Important workflow state is persisted in the backend/database rather than relying only on frontend state.

2. Technology Stack

Frontend

React

Vite

JavaScript

Tailwind CSS

Lucide React

Recharts

Backend

Node.js

Express.js

REST API

JWT authentication

Role-based authorization

Database

Supabase

PostgreSQL

Testing

Vitest

Supertest

3. Main Operations Flow

Create Order
    ↓
Open Bidding
    ↓
Receive Supplier Bids
    ↓
Close Bidding
    ↓
Review Bids
    ↓
Shortlist Suppliers
    ↓
Finalize Shortlist
    ↓
Winner Selection Required
    ↓
Operations Selects Winning Supplier
    ↓
Selected Supplier Notice Pending
    ↓
Inform Winner + Unsuccessful Suppliers
    ↓
Award Completed
    ↓
Downstream Driver / Vehicle Assignment
    ↓
Shipment Tracking / Issue Management
    ↓
Order Completion
    ↓
Archive

Operations owns winner selection and award communication.

There is no supplier Accept/Reject step after Operations selects the winner.

4. Order Management

Operations users can create and manage transport orders.

Order information can include:

Order reference

Import/export type

Pickup location

Destination location

Current order status

Bidding information

Selected supplier

Driver information when available from downstream assignment

Tracking status

Operational issue status

Order data should be loaded from the backend/Supabase and should not depend on hardcoded production records in the frontend.

Example order status progression

created
    ↓
open_for_bids
    ↓
bid_accepted
    ↓
driver_assigned
    ↓
in_transit
    ↓
at_freezone / at_port
    ↓
completed

The exact execution states can vary depending on shipment type and downstream operational flow.

5. Bidding Flow

5.1 Open Bidding

Operations can open bidding for an eligible order.

A bidding session can include:

Start time

End time

Current bidding status

Supplier bid submissions

Bid amount

ETA

Supplier rating

Suppliers may choose not to bid. While bidding is open, suppliers may submit, edit, or withdraw their bids according to supplier-side rules.

5.2 Receive and Review Bids

Operations reviews all submitted bids for the selected order.

Typical bid information includes:

Supplier name

Bid amount

ETA

Supplier rating

Bid status

Shortlist status

5.3 Close Bidding

Bidding must be closed before shortlist finalization.

If bidding closes with no bids, the workflow becomes:

no_bids_received

Operations may extend or reopen bidding.

If bids exist and no shortlist has been finalized, the workflow becomes:

shortlisting_required

6. Shortlisting Flow

Operations can select eligible bids and save them as a shortlist draft.

The shortlist remains editable while it is still a draft.

A maximum shortlist size is enforced by backend rules.

The shortlist flow is:

Bidding Closed
    ↓
Shortlisting Required
    ↓
Operations Selects Supplier Bids
    ↓
Save / Edit Draft
    ↓
Finalize Shortlist
    ↓
Winner Selection Required

There is no separate workflow state for “shortlist ready to finalize.”

The database flag used to represent shortlist finalization is:

shortlist_finalized

Once finalized, the shortlist is locked for winner selection.

7. Final Award Workflow

The active award workflow contains exactly five states:

no_bids_received
shortlisting_required
winner_selection_required
selected_supplier_notice_pending
award_completed

The transition is:

Bidding Closed
    ├─ 0 bids
    │    ↓
    │  no_bids_received
    │    ↓
    │  Extend / Reopen Bidding
    │
    └─ bids received
         ↓
       shortlisting_required
         ↓
       Finalize Shortlist
         ↓
       winner_selection_required
         ↓
       Operations Selects Winner
         ↓
       selected_supplier_notice_pending
         ↓
       Complete Required Result Notifications
         ↓
       award_completed

8. Award State Definitions

no_bids_received

Bidding has ended and no supplier bids were received.

Operations may extend or reopen bidding.

shortlisting_required

Bidding has ended and bids exist. Operations must review the bids, prepare the shortlist, and finalize it.

winner_selection_required

The shortlist has been finalized. Operations must select the winning supplier from the finalized shortlist.

selected_supplier_notice_pending

Operations has already selected the winner.

At the exact moment the winner is selected:

The winning bid is recorded as accepted

All other bids are recorded as rejected

The winning shortlist row is marked selected and accepted

Other finalized shortlist rows are marked rejected

The order becomes bid_accepted

Result notifications for losing bidders are prepared

The workflow moves to selected_supplier_notice_pending

The words accepted and rejected here are final database result statuses, not supplier actions.

Operations must then complete the required result communication.

award_completed

The winning supplier notice and all required unsuccessful-supplier result notices have been marked as sent.

No manual sixth stage is required. The database-derived workflow state becomes award_completed automatically.

9. Winner Selection Flow

Winner selection is owned by Operations.

The selected bid must belong to the finalized shortlist.

Current winner-selection endpoint:

POST /api/operations/bids/:orderId/select-winner

Typical request body:

{
  "bid_id": 123
}

The transition is:

winner_selection_required
    ↓
Operations Selects Winner
    ↓
Winning Bid = Accepted
Other Bids = Rejected
Order = bid_accepted
    ↓
selected_supplier_notice_pending

There is no additional supplier confirmation step.

Winner selection is implemented atomically through the database RPC:

select_operations_winner

10. Selected Supplier Notice

After winner selection, Operations informs the selected supplier.

Endpoint:

POST /api/operations/bids/:orderId/selected-notice-sent

The database function used to record the winner notice is:

mark_selected_supplier_notice_sent

Marking the winner notice as sent does not create another workflow stage.

The workflow remains:

selected_supplier_notice_pending

until all required award-result notifications are complete.

If there are no unsuccessful suppliers, marking the winner notice as sent can cause the award to become award_completed immediately.

11. Unsuccessful Supplier Notifications

Every losing bidder must receive the final bidding result.

Notification records are stored in:

bid_outcome_notifications

Typical notification states are:

pending
sent

Endpoint for marking an unsuccessful supplier result as sent:

POST /api/operations/bids/:orderId/outcome-notice-sent

The award reaches:

award_completed

only after:

The selected supplier notice has been marked as sent.

All required unsuccessful-supplier result notifications have been marked as sent.

Opening an email client by itself is not authoritative proof that an email was sent. The corresponding notice must be marked as sent in the application.

12. No Supplier Accept/Reject Stage

The active Operations workflow does not include:

awaiting_supplier_response
supplier_accepted
supplier_rejected
alternate_supplier_selection_required
unsuccessful_supplier_notifications_pending

There is also no active supplier-response endpoint.

Operations selection is the final award decision.

Historical database rows may still contain legacy statuses for audit or migration compatibility, but new workflow logic must not create or depend on those states.

13. Award Attempt Records

The bid_award_attempts table is retained as part of award history and notification-stage tracking.

For the active workflow, a selected winner can have an award record in:

selected_supplier_notice_pending

Historical rows may contain old statuses from earlier workflow versions, but those values are not active workflow stages.

14. Important Database Tables

The Operations workflow uses tables including:

orders
bidding
bids
bid_selection
bid_award_attempts
bid_outcome_notifications
notifications
notification_operations

bid_selection

Important fields include:

selection_id
bid_id
order_id
supplier_id
selection_status
shortlist_finalized
selected
selected_by
reason
selected_at

Current selection statuses:

shortlisted
accepted
rejected

bid_outcome_notifications

Tracks result notifications that must be sent to unsuccessful suppliers.

15. Database Views

The Operations bidding/award workflow uses database views to expose authoritative derived workflow state.

Important views include:

operations_bid_award_state_core
operations_bid_award_state
operations_bidding_order_summary

The outer award-state view returns only the five active workflow states:

no_bids_received
shortlisting_required
winner_selection_required
selected_supplier_notice_pending
award_completed

16. Database RPC Functions

Important Operations shortlist/award functions include:

save_operations_shortlist_draft
select_operations_winner
mark_selected_supplier_notice_sent

save_operations_shortlist_draft

Responsible for validating and persisting the editable shortlist draft.

Typical validations include:

Order exists

Order is in the correct bidding stage

Bidding has ended/closed

Finalized shortlist cannot be edited

Maximum shortlist size

No duplicate bid IDs

Selected bids belong to the correct order

Saving a draft does not create another workflow stage; the state remains:

shortlisting_required

select_operations_winner

Atomically finalizes the award decision:

Accepts the winning bid

Rejects all other bids

Marks the winner selection accepted and selected

Rejects other finalized shortlist selections

Sets the order to bid_accepted

Creates required unsuccessful-result notification records

Moves the award into selected_supplier_notice_pending

mark_selected_supplier_notice_sent

Records completion of the winner communication without introducing a supplier-response stage.

17. Operations Notifications

The Operations notification API is protected by Operations authentication and role authorization.

Current incoming Operations notification support includes:

admin_issue_status_changed

Notification actions include:

GET    /api/operations/notifications
PATCH  /api/operations/notifications/:notificationId/read
PATCH  /api/operations/notifications/read-all
DELETE /api/operations/notifications/read
DELETE /api/operations/notifications/:notificationId

Notifications support read/unread state.

Old self-notifications such as operations_winner_selected and supplier-response events are not part of the active notification flow.

18. Driver Tracking

The Operations tracking interface allows Operations users to monitor the active shipment/order after downstream driver/vehicle assignment has occurred.

Tracking data can include:

Driver

Order reference

Latitude

Longitude

Reverse-geocoded location name

Current shipment stage

Last tracking update

The tracking page should focus on the selected order rather than displaying unrelated order routes together.

Driver tracking updates are supplied through the backend and persisted to the database.

19. Shipment Stage Updates

After award completion, downstream execution can progress through operational stages such as:

driver_assigned
in_transit
at_freezone
at_port
completed

Operations may monitor shipment progress and issue status, while driver/vehicle assignment itself is handled outside the Operations award workflow.

20. Issue Management

Operations can review issues raised during shipment execution.

Issue information can include:

Order

Driver

Issue category

Description

Current status

Admin response

Resolution status

Admin issue-status changes can generate Operations notifications.

21. Archive Management

Completed orders can be archived according to backend business rules.

Archived orders are separated from active operational work.

Eligible archived orders can be restored/unarchived when required.

22. Bidding Frontend Structure

Important bidding frontend files include:

src/Bidding.jsx
src/BiddingOrder.jsx
src/bidding/hooks/useBiddingController.jsx
src/bidding/services/biddingApi.js
src/bidding/utils/biddingUtils.js

Reusable bidding components include:

AwardWorkflowModal.jsx
AwardWorkflowPanel.jsx
BiddingOrdersTable.jsx
InfoMini.jsx
MiniStatusCard.jsx
OrderTableCell.jsx
ScoreDetailsModal.jsx
SummaryCard.jsx
TimerInput.jsx

23. Dedicated Bidding Order Workspace

A dedicated order-level bidding view is available using:

/bidding/:orderId

This workspace allows Operations to focus on one order and its complete bidding/award state.

It can include:

Order details

Bid list

Shortlist

Bidding status

Award workflow state

Winner selection

Winner notice state

Unsuccessful-supplier outcome notification state

Dashboard and Orders-page bidding actions should navigate directly to the selected order workspace instead of opening only the general bidding overview.

24. Workflow Persistence

Important workflow states are persisted through the backend/database.

Refreshing the page should not reset award progress.

Important persistence checkpoints include:

no_bids_received
shortlisting_required
winner_selection_required
selected_supplier_notice_pending
award_completed

The frontend should restore these states from backend/Supabase data after refresh.

25. Authentication and Authorization

Operations API routes use authentication and role-based authorization.

Operations routes are protected by:

verifyToken
authorizeRole('operations')

The Operations notifications router is also protected by the same authentication and role checks.

26. Data Source Rules

Production workflow data should come from the backend and Supabase.

The frontend should not depend on hardcoded operational records for:

Orders

Supplier bids

Shortlists

Award states

Selected supplier information

Tracking data

Notifications

Issues

Archive status

27. Backend Business Rules

Important backend rules include:

Only eligible orders can enter bidding.

Bidding must close before shortlist finalization.

If bidding closes with zero bids, the workflow becomes no_bids_received.

Shortlisted bids must belong to the correct order.

Duplicate shortlist entries are rejected.

Maximum shortlist size is enforced.

A finalized shortlist is locked.

Winner selection is allowed only in winner_selection_required.

The winning bid must belong to the finalized shortlist.

Selecting the winner immediately accepts that bid and rejects all other bids.

Winner selection immediately sets the order to bid_accepted.

There is no supplier Accept/Reject step after winner selection.

All losing bidders must receive their final result notification.

Award completion requires the winner notice and all required unsuccessful-supplier notices to be marked as sent.

Invalid order transitions are rejected by backend validation.

28. Automated Tests

The Operations API includes automated tests for areas such as:

Shortlist rules

Tracking-stage rules

Archive rules

Order-date validation

Archive API behavior

Run the backend test suite with:

cd apps/api-operations
npm test -- --run

Test counts can change as the project evolves, so the latest command output should be treated as authoritative.

29. Backend Syntax Check

Run:

node --check apps/api-operations/src/routes/operations.routes.js
node --check apps/api-operations/src/routes/notification.routes.js

A successful syntax check returns without an error.

30. Frontend Production Build

Run from the repository root:

npm --prefix apps/web-operations run build

A successful Vite build confirms the current frontend compiles.

Warnings should be reviewed separately, but warnings alone do not necessarily indicate a failed build.

31. Recommended End-to-End Award Test

Before deployment or final evaluation, verify the complete award workflow with a multi-bid order:

Close Bidding
    ↓
Shortlist Suppliers
    ↓
Finalize Shortlist
    ↓
Winner Selection Required
    ↓
Select Supplier A
    ↓
Supplier A Bid = Accepted
All Other Bids = Rejected
Order = bid_accepted
    ↓
Selected Supplier Notice Pending
    ↓
Send + Mark Winner Notice Sent
    ↓
Send + Mark All Unsuccessful Result Notices Sent
    ↓
Award Completed

Refresh the page during important stages to confirm persistence.

Recommended refresh checkpoints:

winner_selection_required
selected_supplier_notice_pending
award_completed

Also verify:

Winner selection cannot be repeated for a different supplier after the decision is final.

A winner remains visible after refresh.

All losing bids display rejected status.

Multi-bid outcome notifications can be completed.

A single-bid order reaches award_completed after the winner notice is marked sent.

Dashboard Bidding actions open /bidding/:orderId for the selected order.

32. Current Operations Responsibility Summary

Operations currently owns the following bidding and award responsibilities:

Review Supplier Bids
    ↓
Create Shortlist
    ↓
Finalize Shortlist
    ↓
Select Winning Supplier
    ↓
Inform Winning Supplier
    ↓
Inform Unsuccessful Suppliers
    ↓
Award Completed

There is no Logistics winner-selection handoff and no supplier acceptance/rejection stage in the active award workflow.

33. Deployment Checklist

Before committing, pushing, or deploying Operations changes:

Run backend syntax checks.

Run backend automated tests.

Build the frontend production bundle.

Perform a complete multi-bid award end-to-end test.

Refresh during important award states to verify persistence.

Verify authentication and role middleware are active.

Review git status and git diff.

Confirm no secrets or credentials are committed.

Confirm environment variables are configured for the deployment environment.

Avoid committing temporary notes or unrelated local files.

34. Current Verified Workflow Status

The current Operations bidding/award implementation supports:

Order-based supplier bidding

Supplier bid review

Editable shortlist drafts

Shortlist finalization

Operations-owned final winner selection

Immediate winner acceptance and loser rejection as database result statuses

Selected supplier result communication

Unsuccessful supplier result communication

Automatic award completion after required communications

Persistent five-state award workflow

Dedicated order-level bidding routes

Driver/shipment tracking after downstream assignment

Issue management

Archive management

Operations notifications

Backend workflow validation

Frontend production builds

The active award workflow is intentionally minimal and uses only the five main states:

no_bids_received
shortlisting_required
winner_selection_required
selected_supplier_notice_pending
award_completed