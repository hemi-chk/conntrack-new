import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Tracking from "./pages/tracking/Tracking";
import OrderDetails from "./pages/orderDetails/OrderDetails";
import OrdersPage from "./pages/orders/Orders";
import ClearanceIssues from "./pages/issuses/ClearanceIssue";
import Reports from "./pages/reports/Reports";
import Profile from "./pages/profile/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Main Pages */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<OrdersPage title="Import Orders" type="import" />} />
          <Route path="/export" element={<OrdersPage title="Export Orders" type="export" />} />

          <Route path="/clearance" element={<ClearanceIssues />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/tracking/:id" element={<Tracking />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}