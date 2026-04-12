"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Stop } from "@/lib/types";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeNumberedIcon(n: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${active ? "#FF6B1B" : "#1B4DFF"};
      color:white;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transition:all 0.15s;
      transform:${active ? "scale(1.3)" : "scale(1)"};
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [stops, map]);
  return null;
}

interface Props {
  stops: Stop[];
  hoveredStop: number | null;
}

export default function RouteMap({ stops, hoveredStop }: Props) {
  const center: [number, number] =
    stops.length > 0
      ? [stops[0].lat, stops[0].lng]
      : [55.7558, 37.6176];

  const polyline = stops.map((s): [number, number] => [s.lat, s.lng]);

  return (
    <MapContainer
      center={center}
      zoom={10}
      className="w-full h-full"
      style={{ minHeight: "224px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} />
      {polyline.length > 1 && (
        <Polyline positions={polyline} color="#1B4DFF" weight={3} opacity={0.7} />
      )}
      {stops.map((stop, idx) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={makeNumberedIcon(idx + 1, hoveredStop === stop.id)}
        >
          <Popup>
            <strong>{stop.name}</strong>
            {stop.category && <p className="text-xs text-gray-500">{stop.category}</p>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
