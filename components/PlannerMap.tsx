"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Waypoint } from "@/lib/types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIcon(n: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${active ? "#FF6B1B" : "#1B4DFF"};
      color:white;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transform:${active ? "scale(1.3)" : "scale(1)"};
      transition:transform 0.15s;
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ waypoints }: { waypoints: Waypoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length === 0) return;
    const bounds = L.latLngBounds(waypoints.map((w) => [w.latitude, w.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [waypoints, map]);
  return null;
}

interface Props {
  waypoints: Waypoint[];
  hoveredStop: number | null;
}

export default function PlannerMap({ waypoints, hoveredStop }: Props) {
  const center: [number, number] =
    waypoints.length > 0 ? [waypoints[0].latitude, waypoints[0].longitude] : [55.7558, 37.6176];

  const polyline = waypoints.map((w): [number, number] => [w.latitude, w.longitude]);

  return (
    <MapContainer center={center} zoom={10} className="w-full h-full" style={{ minHeight: "224px" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds waypoints={waypoints} />
      {polyline.length > 1 && (
        <Polyline positions={polyline} color="#1B4DFF" weight={3} opacity={0.7} dashArray="6 4" />
      )}
      {waypoints.map((wp, idx) => (
        <Marker
          key={wp.id}
          position={[wp.latitude, wp.longitude]}
          icon={makeIcon(idx + 1, hoveredStop === wp.id)}
        />
      ))}
    </MapContainer>
  );
}
