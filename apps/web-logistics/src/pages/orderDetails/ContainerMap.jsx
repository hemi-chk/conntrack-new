import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Radio } from 'lucide-react';
import { Card, CardContent } from "@/ui";
import { io } from 'socket.io-client';

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

// Helper component to smoothly center map view when coordinates update via Socket.io
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
    status: initialStatus || "in_transit"
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Establish Socket.io real-time connection to logistics API server
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log(`[Socket.io Client] Connected to server: ${socket.id}`);
      setIsConnected(true);

      // Join order-specific tracking room
      if (orderId) {
        socket.emit('join_order_tracking', orderId);
      }
    });

    // Listen for live location updates from backend Socket.io server
    socket.on('location_update', (data) => {
      console.log('[Socket.io Client] Received real-time location update:', data);
      if (data && data.latitude && data.longitude) {
        setLocationData({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          current_location: data.current_location || initialLocation || "In Transit",
          status: data.status || initialStatus || "in_transit"
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io Client] Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const lat = locationData.latitude;
  const lng = locationData.longitude;
  const isValidCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  if (!isValidCoords) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white mt-6">
        <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live GPS Location Map</span>
          </div>
        </div>
        <CardContent className="p-8 text-center text-slate-500 text-sm">
          Connecting to Socket.io coordinates for Order #{orderId}...
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Map Location</span>
        </div>
        <span className="text-xs font-mono text-slate-500 font-semibold">
          Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
        </span>
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
