import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapHotspotData } from '@/pages/Index'; // New type

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  hotspots: MapHotspotData[]; // New prop
  onMapClick: (coordinates: [number, number]) => void;
  selectedLocation: [number, number] | null;
  isVolunteer: boolean;
  onAcceptRequest: (requestId: string) => void;
  isSelectingLocation?: boolean;
  mapIsInteractive?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  hotspots, // New prop
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
    map.current = L.map(mapContainer.current).setView([-1.2921, 36.8219], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);
    map.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('Map click event:', lat, lng);
      onMapClick([lat, lng]);
    });
    return () => {
      map.current?.remove();
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!map.current) return;
    if (selectedMarkerRef.current) {
      map.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
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

  // Update help request markers (now hotspots)
  useEffect(() => {
    if (!map.current) return;

    Object.values(markersRef.current).forEach(marker => {
      map.current?.removeLayer(marker);
    });
    markersRef.current = {};

    hotspots.forEach(hotspot => {
      const color = hotspot.request_type === 'Medical' ? 'red' :
                    hotspot.request_type === 'Legal' ? 'blue' : 'green';
      
      const markerLocation: [number, number] = [hotspot.coordinates.lat, hotspot.coordinates.lng];

      const marker = L.marker(markerLocation, {
        icon: L.divIcon({
          className: 'help-request-marker',
          html: `<div class="w-6 h-6 bg-${color}-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });

      if (isVolunteer) {
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold">${hotspot.request_type} Help Needed</h3>
            <p class="text-sm text-gray-600 mb-2">${new Date(hotspot.timestamp).toLocaleTimeString()}</p>
            <button 
              onclick="window.acceptRequest('${hotspot.id}')"
              class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Accept Request
            </button>
          </div>
        `);
      } else {
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold">${hotspot.request_type} Help Request</h3>
            <p class="text-sm text-gray-600">Location marked</p>
          </div>
        `);
      }

      marker.addTo(map.current!);
      markersRef.current[hotspot.id] = marker;
    });

    (window as any).acceptRequest = onAcceptRequest;

  }, [hotspots, isVolunteer, onAcceptRequest]);

  useEffect(() => {
    if (map.current) {
      if (mapIsInteractive) {
        map.current.keyboard?.enable();
        map.current.dragging?.enable();
        map.current.touchZoom?.enable();
        map.current.doubleClickZoom?.enable();
        map.current.scrollWheelZoom?.enable();
        map.current.boxZoom?.enable();
      } else {
        map.current.keyboard?.disable();
        map.current.dragging?.disable();
        map.current.touchZoom?.disable();
        map.current.doubleClickZoom?.disable();
        map.current.scrollWheelZoom?.disable();
        map.current.boxZoom?.disable();
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
