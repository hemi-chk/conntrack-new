import React, { useState, useMemo } from 'react';
import { useVehicles } from '../../hooks/useVehicles';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleViewModal } from './VehicleViewModal';
import { EditVehicleModal } from './EditVehicleModal';
import { DeleteVehicleModal } from './DeleteVehicleModal';
import { addVehicle, updateVehicle, deleteVehicle } from '../../services/vehicleService';

export const Vehicles = () => {
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
      console.log("Vehicles Page: Sending data to service...", newVehicleData);
      const result = await addVehicle(newVehicleData);
      console.log("Vehicles Page: Save successful!", result);
      
      alert("✅ Vehicle Added Successfully!");
      
      setIsAddModalOpen(false);
      refreshVehicles(); // Reload new data from database into table
    } catch (err) {
      console.error("Vehicles Page: Save failed", err);
      alert("❌ Error saving vehicle: " + err.message);
    }
  };

  const handleUpdateVehicle = async (id, updatedData) => {
    try {
      await updateVehicle(id, updatedData);
      alert("✅ Vehicle Updated Successfully!");
      setIsEditModalOpen(false);
      refreshVehicles();
    } catch (err) {
      alert("❌ Error updating vehicle: " + err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await deleteVehicle(id);
      alert("✅ Vehicle Deleted Successfully!");
      setIsDeleteModalOpen(false);
      refreshVehicles();
    } catch (err) {
      alert("❌ Error deleting vehicle: " + err.message);
    }
  };

  const handleOpenViewModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(false); // Close view modal first
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(false); // Close view modal first
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

      {/* Action Row: 'All' Dropdown Left, 'Add' Button Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {/* Left side: Filter and count */}
        <div className="flex items-center gap-4">
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-dark font-medium outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="container">Container</option>
            <option value="flatbed">Flatbed</option>
            <option value="refrigerated">Refrigerated</option>
          </select>
          
          <span className="text-sm text-gray-500 font-medium">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </span>
        </div>
        
        {/* Right side: Add button */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Add Vehicle
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}
      {!isLoading && vehicles.length === 0 && !error && (
        <div className="bg-blue-50 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3">
          <span className="text-xl">⚠️</span> No data in vehicles table (Supabase Status: Connected)
        </div>
      )}
      {!isLoading && vehicles.length > 0 && filteredVehicles.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-3 rounded-lg flex items-center gap-3">
          No vehicles map to the selected filter "{filterType}".
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold uppercase text-gray-500">
                <th className="px-6 py-4">VEHICLE NO</th>
                <th className="px-6 py-4">TYPE</th>
                <th className="px-6 py-4">INSURANCE EXPIRY</th>
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
              ) : filteredVehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_number} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-dark">
                    {vehicle.vehicle_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {vehicle.type || vehicle.vehicle_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {vehicle.port_pass_expiry ? new Date(vehicle.port_pass_expiry).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${(vehicle.availability_status || vehicle.status)?.toLowerCase() === 'active' ? 'bg-success/10 text-success' : 
                          (vehicle.availability_status || vehicle.status)?.toLowerCase() === 'repair' ? 'bg-error/10 text-error' : 
                          'bg-warning/10 text-warning'}
                      `}
                    >
                      {vehicle.availability_status || vehicle.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleOpenViewModal(vehicle)}
                      className="text-primary hover:underline font-medium text-sm"
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