import { useDashboard } from '../../hooks/useDashboard';
export const Dashboard = () => {
  const { stats } = useDashboard();
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Active Jobs: {stats?.activeJobs || 'Loading...'}</p>
    </div>
  );
};