import { BASE_URL } from './api';

export const getDashboardStats = async () => {
  // Stubbing connection to supplier.routes.js backend
  // const res = await fetch(`${BASE_URL}/supplier/dashboard`);
  // return res.json();
  return new Promise((resolve) => setTimeout(() => resolve({}), 500));
};