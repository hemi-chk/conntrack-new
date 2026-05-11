import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Tracking from "./pages/tracking/Tracking";
import OrderDetails from "./pages/orderDetails/OrderDetails";
import OrdersPage from "./pages/orders/Orders";
import Issues from "./pages/issues/Issues";
import Reports from "./pages/reports/Reports";
import Profile from "./pages/profile/Profile";
import BidSelectionPage from "./pages/orderDetails/BidSelectionPage";
import DocumentsPage from "./pages/orderDetails/DocumentsPage";


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
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/tracking/:id" element={<Tracking />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders/:id/bids" element={<BidSelectionPage />} />
          <Route path="/orders/:id/documents" element={<DocumentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter >

  );
}