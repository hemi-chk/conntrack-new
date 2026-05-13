import React, { useState, useMemo } from 'react';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { useDrivers } from '../../hooks/useDrivers';
import { AddDriverModal } from './AddDriverModal';
import { DriverViewModal } from './DriverViewModal';
import { EditDriverModal } from './EditDriverModal';
import { DeleteDriverModal } from './DeleteDriverModal';
import { addDriver, updateDriver, deleteDriver } from '../../services/driverService';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';

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

  const columns = [
    { header: 'EMP ID', accessor: 'emp_id', cellClassName: 'font-medium text-dark' },
    { header: 'NAME', render: (row) => `${row.first_name} ${row.last_name}` },
    { header: 'NIC', accessor: 'national_id', cellClassName: 'font-mono text-sm' },
    { header: 'LICENSE EXP', render: (row) => row.license_expiry ? new Date(row.license_expiry).toLocaleDateString('en-GB') : 'N/A' },
    {
      header: 'AVAILABILITY',
      render: (row) => {
        const status = row.availability_status?.toLowerCase();
        const variant = status === 'available' ? 'success' : status === 'unavailable' ? 'error' : 'warning';
        return <Badge variant={variant}>{row.availability_status}</Badge>;
      }
    },
    { header: 'CONTACT', accessor: 'contact_number' },
    {
      header: 'ACTION',
      cellClassName: 'text-center',
      render: (row) => (
        <button
          onClick={() => handleOpenViewModal(row)}
          className="text-sm font-medium text-primary hover:underline"
        >
          View
        </button>
      )
    }
  ];

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'on_trip', label: 'On Trip' },
    { value: 'unavailable', label: 'Unavailable' }
  ];

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
          <div className="w-40">
            <Select
              options={filterOptions}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2"
            />
          </div>

          <span className="text-sm font-medium text-gray-500">
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </span>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<UserPlus size={20} />}
        >
          Add Driver
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Component */}
      <Table
        columns={columns}
        data={filteredDrivers}
        isLoading={isLoading}
        loadingMessage="Loading drivers..."
        emptyTitle="No drivers found"
        emptyMessage="Add a new driver or try changing your filters."
        keyField="driver_id"
      />

    </div>
  );
};
