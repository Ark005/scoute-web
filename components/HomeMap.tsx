"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteListItem } from "@/lib/types";

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Route type → emoji
function routeEmoji(route: RouteListItem): string {
  const tags = (route.tags ?? []).join(" ").toLowerCase();
  const region = route.region.toLowerCase();
  if (tags.includes("природа") || tags.includes("nature") || tags.includes("треккинг")) return "🌿";
  if (tags.includes("море") || tags.includes("пляж")) return "🌊";
  if (tags.includes("горы") || region.includes("кавказ") || region.includes("алтай")) return "⛰️";
  if (tags.includes("история") || tags.includes("юнеско")) return "🏛️";
  if (tags.includes("гастро") || tags.includes("вино") || region.includes("груз")) return "🍷";
  if (region.includes("европ") || region.includes("europe")) return "🗺️";
  if (region.includes("сибирь") || region.includes("карел")) return "🌲";
  if (region.includes("байкал")) return "💧";
  return "🚗";
}

// Roadtrippers-style circular marker
function makeCircleIcon(emoji: string, active: boolean) {
  const size = active ? 48 : 40;
  const bg = active ? "#FF6B1B" : "#22C55E";
  const border = active ? "#fff" : "#fff";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:3px solid ${border};
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:${active ? 22 : 18}px;
      cursor:pointer;
      transition:all 0.15s;
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function FitAll({ routes }: { routes: RouteListItem[] }) {
  const map = useMap();
  const coords = useMemo(() => {
    const pts: [number, number][] = [];
    for (const r of routes) {
      const wp = r.waypoints_preview?.[0];
      if (wp?.latitude && wp?.longitude) pts.push([wp.latitude, wp.longitude]);
    }
    return pts;
  }, [routes]);

  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });
  }, [coords, map]);
  return null;
}

interface Props {
  routes: RouteListItem[];
  activeRoute: RouteListItem | null;
  onSelect?: (slug: string | null) => void;
}

export default function HomeMap({ routes, activeRoute, onSelect }: Props) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[52, 30]}
        zoom={4}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitAll routes={routes} />

        {/* Custom zoom control (bottom right) */}
        {routes.map((route) => {
          const wp = route.waypoints_preview?.[0];
          if (!wp?.latitude || !wp?.longitude) return null;
          const isActive = activeRoute?.slug === route.slug;
          const emoji = routeEmoji(route);

          return (
            <Marker
              key={route.slug}
              position={[wp.latitude, wp.longitude]}
              icon={makeCircleIcon(emoji, isActive)}
              eventHandlers={{
                click: () => onSelect?.(isActive ? null : route.slug),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, padding: "2px 0" }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: "#111827" }}>{route.title}</p>
                  <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>
                    {route.distance_km} км · {route.duration_days} дн. · {route.waypoints_preview?.length ?? 0} точек
                  </p>
                  <a
                    href={`/routes/${route.slug}`}
                    style={{
                      display: "block", textAlign: "center",
                      padding: "6px 12px", borderRadius: 8,
                      background: "#FF6B1B", color: "white",
                      fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}
                  >
                    Открыть →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Sticky active route bar at bottom of map */}
      {activeRoute && (
        <div
          className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center gap-3 p-3 rounded-2xl shadow-xl"
          style={{ background: "white", border: "2px solid #FF6B1B" }}
        >
          <div
            className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: "#FFF7ED" }}
          >
            {routeEmoji(activeRoute)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight line-clamp-1" style={{ color: "#111827" }}>
              {activeRoute.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              {activeRoute.distance_km} км · {activeRoute.duration_days} дн. · {activeRoute.waypoints_preview?.length ?? 0} точек
            </p>
          </div>
          <a
            href={`/routes/${activeRoute.slug}`}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: "#FF6B1B" }}
          >
            Открыть
          </a>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-20 right-4 z-[1000] flex flex-col rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <button
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition"
          style={{ background: "white", color: "#374151", borderBottom: "1px solid #e5e7eb" }}
          onClick={() => {
            const map = document.querySelector(".leaflet-container") as any;
            if (map && map._leaflet_map) map._leaflet_map.zoomIn();
          }}
        >+</button>
        <button
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition"
          style={{ background: "white", color: "#374151" }}
          onClick={() => {
            const map = document.querySelector(".leaflet-container") as any;
            if (map && map._leaflet_map) map._leaflet_map.zoomOut();
          }}
        >−</button>
      </div>
    </div>
  );
}
