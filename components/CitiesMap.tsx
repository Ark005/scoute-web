"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CityEntry } from "@/lib/cities-data";

delete (L.Icon.Default.prototype as any)._getIconUrl;

function makeCityIcon(emoji: string, active: boolean) {
  const size = active ? 52 : 42;
  const bg = active ? "#3B82F6" : "#1E293B";
  const shadow = active ? "0 4px 16px rgba(59,130,246,0.5)" : "0 3px 10px rgba(0,0,0,0.4)";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:3px solid white;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      font-size:${active ? 24 : 20}px;
      cursor:pointer;
      transform:${active ? "scale(1.1)" : "scale(1)"};
      transition:all 0.2s;
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function FlyTo({ cities, coords, activeSlug }: {
  cities: CityEntry[];
  coords: Record<string, [number, number]>;
  activeSlug: string | null;
}) {
  const map = useMap();

  // Fly to active city
  useEffect(() => {
    if (activeSlug && coords[activeSlug]) {
      map.flyTo(coords[activeSlug], 10, { duration: 1.2 });
    }
  }, [activeSlug, coords, map]);

  // Fit all visible cities
  useEffect(() => {
    const pts = cities
      .map(c => coords[c.slug])
      .filter(Boolean) as [number, number][];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo(pts[0], 8, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8, animate: true });
  }, [cities, coords, map]);

  return null;
}

interface Props {
  cities: CityEntry[];
  coords: Record<string, [number, number]>;
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CitiesMap({ cities, coords, activeSlug, onSelect }: Props) {
  const citiesWithCoords = useMemo(
    () => cities.filter(c => coords[c.slug]),
    [cities, coords]
  );

  return (
    <MapContainer
      center={[48, 30]}
      zoom={4}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyTo cities={citiesWithCoords} coords={coords} activeSlug={activeSlug} />

      {citiesWithCoords.map(city => (
        <Marker
          key={city.slug}
          position={coords[city.slug]}
          icon={makeCityIcon(city.emoji, activeSlug === city.slug)}
          eventHandlers={{
            click: () => onSelect(activeSlug === city.slug ? null : city.slug),
          }}
        >
          <Popup>
            <div style={{ minWidth: 190, padding: "2px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{city.emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", margin: 0 }}>{city.name}</p>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{city.region}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#374151", marginBottom: 8, lineHeight: 1.4 }}>{city.teaser}</p>
              <a
                href={`/cities/${city.slug}`}
                style={{
                  display: "block", textAlign: "center",
                  padding: "7px 14px", borderRadius: 10,
                  background: "#FF6B1B", color: "white",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}
              >
                Открыть гид →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Zoom controls */}
      <div style={{
        position: "absolute", bottom: 80, right: 16, zIndex: 1000,
        display: "flex", flexDirection: "column",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "1px solid #e5e7eb"
      }}>
        <button
          style={{ width: 36, height: 36, background: "white", border: "none", borderBottom: "1px solid #e5e7eb", fontSize: 18, fontWeight: 700, cursor: "pointer", color: "#374151" }}
          onClick={() => {
            const m = document.querySelector(".leaflet-container") as any;
            if (m?._leaflet_map) m._leaflet_map.zoomIn();
          }}
        >+</button>
        <button
          style={{ width: 36, height: 36, background: "white", border: "none", fontSize: 18, fontWeight: 700, cursor: "pointer", color: "#374151" }}
          onClick={() => {
            const m = document.querySelector(".leaflet-container") as any;
            if (m?._leaflet_map) m._leaflet_map.zoomOut();
          }}
        >−</button>
      </div>
    </MapContainer>
  );
}
