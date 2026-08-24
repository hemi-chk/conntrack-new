import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, Button } from "@/ui";
import api from '../../config/api';

// Fix standard Leaflet default marker icon issue in React/Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Container / Truck Marker Icon with Pulse ring
const customIcon = new L.DivIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="position: relative;">
          <div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(37,99,235,0.4); color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Helper component to smoothly center map view when coordinates update
function MapViewUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [position, map]);
  return null;
}

const ContainerMap = ({ orderId, latitude: initialLat, longitude: initialLng, locationName: initialLocation, status: initialStatus }) => {
  const [locationData, setLocationData] = useState({
    latitude: parseFloat(initialLat) || null,
    longitude: parseFloat(initialLng) || null,
    current_location: initialLocation || "Logistics Hub",
    status: initialStatus || "in_transit",
    timestamp: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchContainerTrackingLocation = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(false);
      const res = await api.get(`/logistics/tracking/order/${orderId}`);
      
      if (res.data && res.data.trackingAvailable && res.data.tracking_details) {
        const details = res.data.tracking_details;
        setLocationData({
          latitude: parseFloat(details.latitude),
          longitude: parseFloat(details.longitude),
          current_location: details.location || initialLocation || "Logistics Hub",
          status: details.status || initialStatus || "in_transit",
          timestamp: details.timestamp || null
        });
      } else if (initialLat && initialLng) {
        setLocationData({
          latitude: parseFloat(initialLat),
          longitude: parseFloat(initialLng),
          current_location: initialLocation || "Logistics Hub",
          status: initialStatus || "in_transit",
          timestamp: null
        });
      } else {
        setLocationData(prev => ({ ...prev, latitude: null, longitude: null }));
      }
    } catch (err) {
      console.error("[ContainerMap] Error fetching location from container_tracking table:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainerTrackingLocation();
  }, [orderId]);

  const lat = locationData.latitude;
  const lng = locationData.longitude;
  const isValidCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white mt-6">
        <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Container Map Location</span>
          </div>
        </div>
        <CardContent className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-blue-600" size={18} />
          Fetching container tracking location...
        </CardContent>
      </Card>
    );
  }

  if (!isValidCoords) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white mt-6">
        <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Container Map Location</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchContainerTrackingLocation} className="h-8 gap-1.5 text-xs text-slate-600">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
        <CardContent className="p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
          <AlertCircle className="text-amber-500" size={24} />
          <span>No GPS coordinates found in container tracking table for Order #{orderId}</span>
        </CardContent>
      </Card>
    );
  }

  const position = [lat, lng];

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white mt-6">
      {/* Header */}
      <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#1E40AF]">
          <Navigation size={16} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Container Map Location</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 font-semibold">
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
          </span>
          <Button variant="ghost" size="sm" onClick={fetchContainerTrackingLocation} className="h-7 px-2 text-xs text-slate-600 hover:text-blue-600">
            <RefreshCw size={13} />
          </Button>
        </div>
      </div>

      <CardContent className="p-0 relative">
        <div className="h-[350px] w-full z-0">
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewUpdater position={position} />
            <Marker position={position} icon={customIcon}>
              <Popup>
                <div className="text-xs font-sans p-1">
                  <p className="font-bold text-slate-800 text-sm mb-1">{locationData.current_location}</p>
                  <p className="text-slate-600 capitalize"><strong>Status:</strong> {locationData.status ? locationData.status.replace('_', ' ') : 'N/A'}</p>
                  {locationData.timestamp && (
                    <p className="text-slate-500 text-[11px] mt-1">
                      <strong>Last sync:</strong> {new Date(locationData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">GPS Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContainerMap;

