import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Tracking from "./pages/Tracking";
import OrderDetails from "./pages/OrderDetails";
import OrdersPage from "./pages/Orders";
import ClearanceIssues from "./pages/ClearanceIssue";
import Reports from "./pages/Reports";
import OperationRequests from "./pages/OperationRequests";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Main Pages */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/operations" element={<OperationRequests />} />
          <Route path="/import" element={<OrdersPage title="Import Orders" type="import" />} />
          <Route path="/export" element={<OrdersPage title="Export Orders" type="export" />} />

          <Route path="/clearance" element={<ClearanceIssues />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}