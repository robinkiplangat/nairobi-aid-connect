import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapHotspotData } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { ToggleLeft, ToggleRight } from 'lucide-react';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface ZoneStatusData {
  lat: number;
  lng: number;
  status: 'danger' | 'moderate' | 'calm';
  intensity: number;
  name?: string; // Optional: for more detailed popups or labels
}

interface MapComponentProps {
  hotspots: MapHotspotData[];
  onMapClick: (coordinates: [number, number]) => void;
  selectedLocation: [number, number] | null;
  isVolunteer: boolean;
  onAcceptRequest: (requestId: string) => void;
  isSelectingLocation?: boolean;
  mapIsInteractive?: boolean;
  zoneData?: ZoneStatusData[]; // Make zoneData a prop
}

export const MapComponent: React.FC<MapComponentProps> = ({
  hotspots,
  onMapClick,
  selectedLocation,
  isVolunteer,
  onAcceptRequest,
  isSelectingLocation = false,
  mapIsInteractive = true,
  zoneData, // Destructure the new prop
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [showHeatmap, setShowHeatmap] = useState(false);

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

    // Initialize heatmap layer
    heatmapLayerRef.current = L.layerGroup();
    
    return () => {
      map.current?.remove();
    };
  }, [onMapClick]);

  // Create heatmap hexagons
  const createHeatmapLayer = () => {
    if (!map.current || !heatmapLayerRef.current) return;

    // Clear existing heatmap
    heatmapLayerRef.current.clearLayers();

    if (!zoneData || zoneData.length === 0) {
      // If no zoneData or empty, ensure heatmap layer is empty and do nothing further
      return;
    }

    zoneData.forEach((zone) => {
      const hexRadius = 0.008; // Adjust size of hexagons
      const hexPoints = [];
      
      // Create hexagon points
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * (Math.PI / 180);
        const lat = zone.lat + hexRadius * Math.cos(angle);
        const lng = zone.lng + hexRadius * Math.sin(angle);
        hexPoints.push([lat, lng] as [number, number]);
      }

      // Determine color based on status
      let color, fillColor, opacity;
      switch (zone.status) {
        case 'danger':
          color = '#ea580c'; // orange-600
          fillColor = '#f97316'; // orange-500
          opacity = 0.7;
          break;
        case 'moderate':
          color = '#eab308'; // yellow-500
          fillColor = '#facc15'; // yellow-400
          opacity = 0.6;
          break;
        case 'calm':
          color = '#16a34a';
          fillColor = '#22c55e';
          opacity = 0.5;
          break;
        default:
          color = '#6b7280';
          fillColor = '#9ca3af';
          opacity = 0.4;
      }

      const hexagon = L.polygon(hexPoints, {
        color: color,
        fillColor: fillColor,
        fillOpacity: opacity * zone.intensity,
        weight: 1,
        opacity: 0.8
      });

      // Add popup with zone information
      const popupContent = `
        <div class="text-center">
          <h3 class="font-semibold capitalize">${zone.name || zone.status.replace('_', ' ')} Zone</h3>
          <p class="text-sm text-gray-600">Status: ${zone.status}</p>
          <p class="text-sm text-gray-600">Intensity: ${zone.intensity.toFixed(1)}</p>
        </div>
      `;
      hexagon.bindPopup(popupContent);

      heatmapLayerRef.current!.addLayer(hexagon);
    });
  };

  // Toggle heatmap visibility and update on data change
  useEffect(() => {
    if (!map.current || !heatmapLayerRef.current) return;

    if (showHeatmap && zoneData && zoneData.length > 0) {
      createHeatmapLayer(); // Rebuilds with current zoneData
      if (!map.current.hasLayer(heatmapLayerRef.current)) {
        map.current.addLayer(heatmapLayerRef.current);
      }
    } else {
      // If not showing heatmap, or no data, ensure layer is removed
      if (map.current.hasLayer(heatmapLayerRef.current)) {
        map.current.removeLayer(heatmapLayerRef.current);
      }
      // If there's no data but showHeatmap is true, also clear the layer content
      if (showHeatmap && (!zoneData || zoneData.length === 0)) {
        heatmapLayerRef.current.clearLayers();
      }
    }
  }, [showHeatmap, zoneData]); // Add zoneData to dependency array

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
      
      {/* Map Title */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800">SOS Nairobi</h2>
        <p className="text-sm text-gray-600">Live Emergency Response Map</p>
      </div>
      
      {/* Heatmap Toggle and Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
        {/* Toggle Button */}
        <div className="p-3 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center space-x-2 w-full justify-start"
          >
            {showHeatmap ? (
              <ToggleRight className="h-4 w-4 text-blue-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">Zone Status</span>
          </Button>
        </div>
        
        {/* Legend */}
        {showHeatmap && (
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-700">Calm area</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-xs text-gray-700">Moderate concern</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-xs text-gray-700">Danger</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isSelectingLocation && (
        <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
          <p className="text-sm">📍 Click anywhere on the map to select your location</p>
        </div>
      )}
      
      {selectedLocation && !isSelectingLocation && (
        <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-sm">📍 Location selected. Choose help type →</p>
        </div>
      )}
    </div>
  );
};
