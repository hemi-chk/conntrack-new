import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus, Inbox } from 'lucide-react';
import { useVehicles } from '../../hooks/useVehicles';
import { useProfile } from '../../hooks/useProfile';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleViewModal } from './VehicleViewModal';
import { EditVehicleModal } from './EditVehicleModal';
import { DeleteVehicleModal } from './DeleteVehicleModal';
import { addVehicle, updateVehicle, deleteVehicle } from '../../services/vehicleService';

export const Vehicles = () => {
  const { profileData } = useProfile();
  const { vehicles, isLoading, error, refreshVehicles } = useVehicles();
  const [filterType, setFilterType] = useState('all');
  // ... rest of state
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
      console.log("Vehicles Page: Sending data to service...", newVehicleData);
      await addVehicle(newVehicleData);
      alert("Vehicle Added Successfully!");
      setIsAddModalOpen(false);
      refreshVehicles();
    } catch (err) {
      console.error("Vehicles Page: Save failed", err);
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

      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Manage Vehicles</h1>
      </div>

      {/* Action Row */}
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow flex items-center gap-2"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 items-center px-4 py-3 bg-blue-50 rounded-lg border border-primary text-primary">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4">VEHICLE NO</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">INSURANCE</th>
                <th className="px-6 py-4">PORT PASS</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading vehicles...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col gap-3 items-center">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <p className="text-lg font-bold tracking-tight text-gray-500">No vehicles found</p>
                        <p className="max-w-xs text-sm text-center text-gray-400">Add a new vehicle or try changing your filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_number} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-dark">
                    {vehicle.vehicle_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">
                    {vehicle.type || vehicle.vehicle_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                        ${(vehicle.availability_status || vehicle.status)?.toLowerCase() === 'available' ? 'bg-success/10 text-success' :
                          (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'on_trip' ? 'bg-warning/10  text-warning' :
                            'bg-error/10 text-error'}
                      `}
                    >
                      {vehicle.availability_status || vehicle.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenViewModal(vehicle)}
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