import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Biddings } from './pages/biddings/Biddings';
import { Vehicles } from './pages/vehicle-management/Vehicles';
import { Drivers } from './pages/driver-management/Drivers';
import { AssignedJobs } from './pages/assigned-jobs/AssignedJobs';
import { Tracking } from './pages/tracking/Tracking';
import { MyBids } from './pages/my-bids/MyBids';
import { Profile } from './pages/profile/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/biddings" element={<Biddings />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/assigned-jobs" element={<AssignedJobs />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}