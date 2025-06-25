
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HelpRequest } from '@/pages/Index';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  helpRequests: HelpRequest[];
  onMapClick: (coordinates: [number, number]) => void;
  selectedLocation: [number, number] | null;
  isVolunteer: boolean;
  onAcceptRequest: (requestId: string) => void;
  isSelectingLocation?: boolean;
  mapIsInteractive?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  helpRequests,
  onMapClick,
  selectedLocation,
  isVolunteer,
  onAcceptRequest,
  isSelectingLocation = false,
  mapIsInteractive = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const selectedMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Nairobi
    map.current = L.map(mapContainer.current).setView([-1.2921, 36.8219], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    // Handle map clicks
    map.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('Map click event:', lat, lng);
      onMapClick([lat, lng]);
    });

    return () => {
      map.current?.remove();
    };
  }, [onMapClick]);

  // Update selected location marker
  useEffect(() => {
    if (!map.current) return;

    // Remove previous selected marker
    if (selectedMarkerRef.current) {
      map.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    // Add new selected marker
    if (selectedLocation) {
      selectedMarkerRef.current = L.marker(selectedLocation, {
        icon: L.divIcon({
          className: 'selected-location-marker',
          html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(map.current);
    }
  }, [selectedLocation]);

  // Update help request markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => {
      map.current?.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers for help requests
    helpRequests.forEach(request => {
      const color = request.type === 'Medical' ? 'red' : 
                   request.type === 'Legal' ? 'blue' : 'green';
      
      const marker = L.marker(request.location, {
        icon: L.divIcon({
          className: 'help-request-marker',
          html: `<div class="w-6 h-6 bg-${color}-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });

      // Add popup for volunteers
      if (isVolunteer) {
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold">${request.type} Help Needed</h3>
            <p class="text-sm text-gray-600 mb-2">${new Date(request.timestamp).toLocaleTimeString()}</p>
            <button 
              onclick="window.acceptRequest('${request.id}')" 
              class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Accept Request
            </button>
          </div>
        `);
      } else {
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold">${request.type} Help Request</h3>
            <p class="text-sm text-gray-600">Help is on the way</p>
          </div>
        `);
      }

      marker.addTo(map.current!);
      markersRef.current[request.id] = marker;
    });

    // Global function for popup button clicks
    (window as any).acceptRequest = onAcceptRequest;

  }, [helpRequests, isVolunteer, onAcceptRequest]);

  useEffect(() => {
    if (map.current) {
      if (mapIsInteractive) {
        map.current.keyboard?.enable();
        // You might need to enable other interactions if you disable more than keyboard
        // e.g., map.current.dragging.enable(), map.current.touchZoom.enable(), etc.
      } else {
        map.current.keyboard?.disable();
        // e.g., map.current.dragging.disable(), map.current.touchZoom.disable(), etc.
      }
    }
  }, [mapIsInteractive]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800">SOS Nairobi</h2>
        <p className="text-sm text-gray-600">Live Emergency Response Map</p>
      </div>
      
      {isSelectingLocation && (
        <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
          <p className="text-sm">📍 Click anywhere on the map to select your location</p>
        </div>
      )}
      
      {selectedLocation && !isSelectingLocation && (
        <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-sm">📍 Location selected. Choose help type →</p>
        </div>
      )}
    </div>
  );
};
