import React, { useState, useMemo } from 'react';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { useDrivers } from '../../hooks/useDrivers';
import { AddDriverModal } from './AddDriverModal';
import { DriverViewModal } from './DriverViewModal';
import { EditDriverModal } from './EditDriverModal';
import { DeleteDriverModal } from './DeleteDriverModal';
import { addDriver, updateDriver, deleteDriver } from '../../services/driverService';

export const Drivers = () => {
  const { drivers, isLoading, error, refreshDrivers } = useDrivers();
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const filteredDrivers = useMemo(() => {
    if (filterStatus === 'all') return drivers;
    return drivers.filter(d => d.availability_status?.toLowerCase() === filterStatus.toLowerCase());
  }, [drivers, filterStatus]);

  const handleAddDriver = async (newDriverData) => {
    try {
      await addDriver(newDriverData);
      alert("Driver Added Successfully!");
      setIsAddModalOpen(false);
      refreshDrivers();
    } catch (err) {
      alert("Error saving driver: " + err.message);
    }
  };

  const handleUpdateDriver = async (id, updatedData) => {
    try {
      await updateDriver(id, updatedData);
      alert("Driver Updated Successfully!");
      setIsEditModalOpen(false);
      refreshDrivers();
    } catch (err) {
      alert("Error updating driver: " + err.message);
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      await deleteDriver(id);
      alert("Driver Deleted Successfully!");
      setIsDeleteModalOpen(false);
      refreshDrivers();
    } catch (err) {
      alert("Error deleting driver: " + err.message);
    }
  };

  const handleOpenViewModal = (driver) => {
    setSelectedDriver(driver);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setSelectedDriver(driver);
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (driver) => {
    setSelectedDriver(driver);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 text-dark">

      <AddDriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDriver}
      />

      <DriverViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        driver={selectedDriver}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
      />

      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        driver={selectedDriver}
        onUpdate={handleUpdateDriver}
      />

      <DeleteDriverModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        driver={selectedDriver}
        onDeleteConfirm={handleDeleteDriver}
      />

      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Manage Drivers</h1>
      </div>

      {/* Action Row */}
      <div className="flex flex-col gap-4 justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm sm:flex-row sm:items-center">

        <div className="flex gap-4 items-center">
          <select
            className="px-4 py-2 font-medium bg-white rounded-lg border border-gray-300 cursor-pointer outline-none text-dark focus:ring-2 focus:ring-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="on trip">On Trip</option>
            <option value="off duty">Off Duty</option>
          </select>

          <span className="text-sm font-medium text-gray-500">
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add Driver
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {!isLoading && drivers.length === 0 && !error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
          <AlertTriangle size={18} />
          <span>No data in drivers table (Supabase Status: Connected)</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4">EMP ID</th>
                <th className="px-6 py-4">NAME</th>
                <th className="px-6 py-4">NIC</th>
                <th className="px-6 py-4">LICENSE EXP</th>
                <th className="px-6 py-4">AVAILABILITY</th>
                <th className="px-6 py-4">CONTACT</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading drivers...
                  </td>
                </tr>
              ) : filteredDrivers.map((driver, idx) => (
                <tr key={driver.driver_id || idx} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-dark">
                    {driver.driver_id}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    {driver.nic}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {driver.license_expiry_date ? new Date(driver.license_expiry_date).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${driver.availability_status?.toLowerCase() === 'available' ? 'bg-success/10 text-success' :
                          driver.availability_status?.toLowerCase() === 'off duty' ? 'bg-error/10 text-error' :
                            'bg-warning/10 text-warning'}
                      `}
                    >
                      {driver.availability_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {driver.contact_number}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenViewModal(driver)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};