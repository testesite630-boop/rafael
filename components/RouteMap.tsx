
import React, { useEffect, useRef } from 'react';
import { Delivery, DeliveryStatus } from '../types';
import { useApp } from '../App';

interface RouteMapProps {
  deliveries: Delivery[];
  motoboyLocation: { lat: number; lng: number } | null;
}

// Declaração para acessar o Leaflet do escopo global
declare const L: any;

const createIcon = (svg: string, className: string = '') => {
  return L.divIcon({
    html: svg,
    className: `relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${className}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Ícones SVG para os marcadores
const pickupSvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path stroke-linecap="round" stroke-linejoin="round" d="M3.27 6.96 12 12.01 20.73 6.96" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 22.08V12" /></svg>`;
const deliverySvg = `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" /></svg>`;
const motoboySvg = `<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>`;


const RouteMap: React.FC<RouteMapProps> = ({ deliveries, motoboyLocation }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const motoboyMarkerRef = useRef<any>(null);
  const { settings } = useApp();

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const isDark = settings.theme === 'dark';
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-23.55, -46.63], 12); // Ponto inicial (São Paulo)

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl).addTo(map);
      mapRef.current = map;
    }
  }, [settings.theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Limpa camadas antigas
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const geocodedDeliveries = deliveries.filter(d => d.lat && d.lng);
    const waypoints = [];

    // Adiciona marcadores de coleta e entrega
    geocodedDeliveries.forEach(d => {
      const isFinalized = d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.FAILED;
      const markerColor = isFinalized ? 'bg-green-500' : 'bg-red-600';

      if (!isFinalized && d.status === DeliveryStatus.IN_ROUTE && d.pickupAddress && d.lat && d.lng) {
        const pickupCoords = [d.lat + 0.005, d.lng + 0.005]; // Simula local de coleta próximo
        waypoints.push(pickupCoords);
        L.marker(pickupCoords, { icon: createIcon(pickupSvg, 'bg-blue-500 border-2 border-white') })
         .addTo(map)
         .bindPopup(`<b>Coleta:</b><br>${d.pickupAddress}`);
      }
      
      waypoints.push([d.lat, d.lng]);
      L.marker([d.lat!, d.lng!], { icon: createIcon(deliverySvg, `${markerColor} border-2 border-white`) })
       .addTo(map)
       .bindPopup(`<b>Entrega:</b><br>${d.address}<br><b>Status:</b> ${d.status}`);
    });

    // Adiciona polilinha da rota apenas para entregas ativas
    const activeWaypoints = geocodedDeliveries
      .filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.FAILED)
      .map(d => [d.lat!, d.lng!]);

    if (activeWaypoints.length > 1) {
      L.polyline(activeWaypoints, { color: '#dc2626', weight: 4, opacity: 0.8, dashArray: '10, 10' }).addTo(map);
    }
    
    // Adiciona ou atualiza marcador do motoboy
    if (motoboyLocation) {
        const motoboyLatLng = [motoboyLocation.lat, motoboyLocation.lng];
        if (!motoboyMarkerRef.current) {
          motoboyMarkerRef.current = L.marker(motoboyLatLng, { 
            icon: createIcon(motoboySvg, 'bg-gray-900 border-4 border-white animate-pulse'),
            zIndexOffset: 1000
          }).addTo(map).bindPopup("<b>Sua Posição</b>");
        } else {
          motoboyMarkerRef.current.setLatLng(motoboyLatLng);
        }
        waypoints.push(motoboyLatLng);
    }
    
    // Ajusta o zoom para mostrar todos os pontos
    if (waypoints.length > 0) {
      map.fitBounds(L.latLngBounds(waypoints), { padding: [80, 80] });
    }

  }, [deliveries, motoboyLocation]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default RouteMap;
