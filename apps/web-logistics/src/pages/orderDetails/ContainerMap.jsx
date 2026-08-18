import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from "@/ui";

// Fix standard Leaflet default marker icon issue in React/Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Container / Truck Marker Icon
const customIcon = new L.DivIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 50%; display: flex; align-[#center]; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); color: white; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const ContainerMap = ({ latitude, longitude, locationName, status }) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const isValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

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
          No valid coordinates (latitude/longitude) available to display map location.
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Container Map Location</span>
        </div>
        <span className="text-xs font-medium text-slate-500">
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
            <Marker position={position} icon={customIcon}>
              <Popup>
                <div className="text-xs font-sans p-1">
                  <p className="font-bold text-slate-800 text-sm mb-1">{locationName || "Current Location"}</p>
                  <p className="text-slate-600 capitalize"><strong>Status:</strong> {status ? status.replace('_', ' ') : 'N/A'}</p>
                  <p className="text-slate-500 text-[11px] mt-1">Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
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
