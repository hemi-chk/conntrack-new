import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useVehicles } from '../../hooks/useVehicles';
import { useProfile } from '../../hooks/useProfile';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleViewModal } from './VehicleViewModal';
import { EditVehicleModal } from './EditVehicleModal';
import { DeleteVehicleModal } from './DeleteVehicleModal';
import { addVehicle, updateVehicle, deleteVehicle } from '../../services/vehicleService';
import { Table, Button, Badge } from '@conntrack/ui';

export const Vehicles = () => {
  const { profileData } = useProfile();
  const { vehicles, isLoading, error, refreshVehicles } = useVehicles();
  const [filterType, setFilterType] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const filteredVehicles = useMemo(() => {
    if (filterType === 'all') return vehicles;
    return vehicles.filter(v => {
      const type = v.type || v.vehicle_type || '';
      return type.toLowerCase() === filterType.toLowerCase();
    });
  }, [vehicles, filterType]);

  const handleAddVehicle = async (newVehicleData) => {
    try {
      await addVehicle(newVehicleData);
      alert("Vehicle Added Successfully!");
      setIsAddModalOpen(false);
      refreshVehicles();
    } catch (err) {
      alert("Error saving vehicle: " + err.message);
    }
  };

  const handleUpdateVehicle = async (id, updatedData) => {
    try {
      await updateVehicle(id, updatedData);
      alert("Vehicle Updated Successfully!");
      setIsEditModalOpen(false);
      refreshVehicles();
    } catch (err) {
      alert("Error updating vehicle: " + err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      const supplierId = profileData?.id || profileData?.supplier_id;
      await deleteVehicle(id, supplierId);
      alert("Vehicle Deleted Successfully!");
      setIsDeleteModalOpen(false);
      refreshVehicles();
    } catch (err) {
      alert("Error deleting vehicle: " + err.message);
    }
  };

  const handleOpenViewModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const columns = [
    { header: 'VEHICLE NO', accessor: 'vehicle_number', cellClassName: 'font-medium text-dark' },
    { header: 'TYPE', accessor: 'vehicle_type', cellClassName: 'font-semibold text-gray-600' },
    { 
      header: 'INSURANCE', 
      render: (row) => row.insurance_expiry ? new Date(row.insurance_expiry).toLocaleDateString('en-GB') : 'N/A' 
    },
    { 
      header: 'PORT PASS', 
      render: (row) => row.port_pass_expiry ? new Date(row.port_pass_expiry).toLocaleDateString('en-GB') : 'N/A' 
    },
    {
      header: 'STATUS',
      render: (row) => {
        const status = (row.availability_status || row.status)?.toLowerCase();
        const variant = status === 'available' ? 'success' : status === 'on_trip' ? 'warning' : 'error';
        return <Badge variant={variant}>{row.availability_status || row.status || 'Unknown'}</Badge>;
      }
    },
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

  return (
    <div className="flex flex-col gap-6 text-dark">
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddVehicle}
      />

      <VehicleViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        vehicle={selectedVehicle}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
      />

      <EditVehicleModal
        key={selectedVehicle?.vehicle_number + isEditModalOpen}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vehicle={selectedVehicle}
        onUpdate={handleUpdateVehicle}
      />

      <DeleteVehicleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        vehicle={selectedVehicle}
        onDeleteConfirm={handleDeleteVehicle}
      />

      <div>
        <h1 className="text-3xl font-bold text-primary">Manage Vehicles</h1>
      </div>

      <div className="flex flex-col gap-4 justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm sm:flex-row sm:items-center">
        <div className="flex gap-4 items-center">
          <select
            className="px-4 py-2 font-medium bg-white rounded-lg border border-gray-300 cursor-pointer outline-none text-dark focus:ring-2 focus:ring-primary"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="LCV">LCV</option>
            <option value="HCV">HCV</option>
          </select>

          <span className="text-sm font-medium text-gray-500">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </span>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus size={20} />}
        >
          Add Vehicle
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <Table
        columns={columns}
        data={filteredVehicles}
        isLoading={isLoading}
        loadingMessage="Loading vehicles..."
        emptyTitle="No vehicles found"
        emptyMessage="Add a new vehicle or try changing your filters."
        keyField="vehicle_number"
      />
    </div>
  );
};