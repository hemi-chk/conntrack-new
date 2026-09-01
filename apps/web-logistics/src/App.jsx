import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";

import Layout from "./layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Issues from "./pages/issues/Issues";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import BidSelectionPage from "./pages/orderDetails/BidSelectionPage";
import DocumentsPage from "./pages/orderDetails/DocumentsPage";
import OrderDetails from "./pages/orderDetails/OrderDetails";
import OrdersPage from "./pages/orders/Orders";
import Profile from "./pages/profile/Profile";
import Reports from "./pages/reports/Reports";


// =========================================================
// LOGISTICS APP ROUTES
// ---------------------------------------------------------
// This router defines the logistics-only screens used in the portal.
// All routes here belong to the logistics interface, not admin or supplier apps.
// =========================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Main Pages */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<OrdersPage title="Import Orders" type="import" />} />
          <Route path="/export" element={<OrdersPage title="Export Orders" type="export" />} />

          <Route path="/issues" element={<Issues />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders/:id/bids" element={<BidSelectionPage />} />
          <Route path="/orders/:id/documents" element={<DocumentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter >

  );
}
