"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapAttributionFix from "./MapAttributionFix";

// ── Cluster data ──────────────────────────────────────────────────────────────

const CLUSTERS = [
  {
    id: "europe",
    name: "Европа",
    landmark: "/landmarks/italy.png",
    center: [50.0, 14.0] as [number, number],
    expandZoom: 4.2,
    count: 22,
    countries: [
      { name: "Франция", flag: "🇫🇷", slug: "france", lat: 46.5, lng: 2.5 },
      { name: "Германия", flag: "🇩🇪", slug: "germany", lat: 51.0, lng: 10.0 },
      { name: "Италия", flag: "🇮🇹", slug: "italy", lat: 42.8, lng: 12.5 },
      { name: "Испания", flag: "🇪🇸", slug: "spain", lat: 40.5, lng: -3.7 },
      { name: "Австрия", flag: "🇦🇹", slug: "austria", lat: 47.5, lng: 14.5 },
      { name: "Греция", flag: "🇬🇷", slug: "greece", lat: 39.0, lng: 22.0 },
      { name: "Португалия", flag: "🇵🇹", slug: "portugal", lat: 39.5, lng: -8.0 },
      { name: "Нидерланды", flag: "🇳🇱", slug: "netherlands", lat: 52.3, lng: 5.3 },
      { name: "Великобритания", flag: "🇬🇧", slug: "uk", lat: 52.0, lng: -1.5 },
    ],
  },
  {
    id: "russia_cis",
    name: "Россия и Кавказ",
    landmark: "/landmarks/armenia.png",
    center: [52.0, 47.0] as [number, number],
    expandZoom: 4.2,
    count: 5,
    countries: [
      { name: "Россия", flag: "🇷🇺", slug: "russia", lat: 55.75, lng: 37.6 },
      { name: "Грузия", flag: "🇬🇪", slug: "georgia", lat: 42.7, lng: 43.5 },
      { name: "Армения", flag: "🇦🇲", slug: "armenia", lat: 39.7, lng: 44.8 },
      { name: "Азербайджан", flag: "🇦🇿", slug: "azerbaijan", lat: 40.4, lng: 49.8 },
      { name: "Турция", flag: "🇹🇷", slug: "turkey", lat: 39.0, lng: 35.0 },
    ],
  },
  {
    id: "central_asia",
    name: "Средняя Азия",
    landmark: "/landmarks/uzbekistan.png",
    center: [44.0, 68.0] as [number, number],
    expandZoom: 4.5,
    count: 3,
    countries: [
      { name: "Казахстан", flag: "🇰🇿", slug: "kazakhstan", lat: 48.0, lng: 68.0 },
      { name: "Кыргызстан", flag: "🇰🇬", slug: "kyrgyzstan", lat: 41.5, lng: 75.0 },
      { name: "Узбекистан", flag: "🇺🇿", slug: "uzbekistan", lat: 41.0, lng: 63.0 },
    ],
  },
  {
    id: "mena",
    name: "Ближний Восток",
    landmark: "/landmarks/israel.png",
    center: [28.0, 38.0] as [number, number],
    expandZoom: 4.0,
    count: 3,
    countries: [
      { name: "Израиль", flag: "🇮🇱", slug: "israel", lat: 31.5, lng: 35.0 },
      { name: "ОАЭ", flag: "🇦🇪", slug: "uae", lat: 23.5, lng: 54.0 },
      { name: "Марокко", flag: "🇲🇦", slug: "morocco", lat: 32.0, lng: -5.0 },
    ],
  },
  {
    id: "asia",
    name: "Азия",
    landmark: "/landmarks/india.png",
    center: [23.0, 95.0] as [number, number],
    expandZoom: 3.5,
    count: 3,
    countries: [
      { name: "Япония", flag: "🇯🇵", slug: "japan", lat: 36.0, lng: 138.0 },
      { name: "Таиланд", flag: "🇹🇭", slug: "thailand", lat: 15.0, lng: 101.0 },
      { name: "Индия", flag: "🇮🇳", slug: "india", lat: 20.0, lng: 78.0 },
    ],
  },
];

const CLUSTER_ZOOM_THRESHOLD = 3.5;

// ── Cluster marker icon ───────────────────────────────────────────────────────

function makeClusterIcon(name: string, count: number, landmark: string) {
  const imgSrc = landmark;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        user-select: none;
      ">
        <img
          src="${imgSrc}"
          style="width:72px;height:56px;object-fit:contain;display:block;"
          onerror="this.style.display='none'"
        />
        <div style="height:4px"></div>
        <div style="
          background: white;
          border-radius: 22px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          padding: 5px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          <span style="
            font-size: 11px;
            font-weight: 600;
            color: #111827;
            font-family: -apple-system, sans-serif;
          ">${name}</span>
          <span style="
            background: #F3F4F6;
            border-radius: 9px;
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 700;
            color: #6B7280;
            font-family: -apple-system, sans-serif;
          ">${count}</span>
        </div>
        <div style="width:2px;height:6px;background:#6B7280;margin-top:0px"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#6B7280;margin-top:-1px"></div>
      </div>
    `,
    iconSize: [120, 100],
    iconAnchor: [60, 100],
  });
}

// ── Country marker icon ───────────────────────────────────────────────────────

function makeCountryIcon(flag: string, name: string, landmark: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        user-select: none;
      ">
        <img
          src="${landmark}"
          style="width:56px;height:44px;object-fit:contain;display:block;"
          onerror="this.style.display='none'"
        />
        <div style="height:3px"></div>
        <div style="
          background: white;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          padding: 4px 9px;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        ">
          <span style="font-size: 13px;">${flag}</span>
          <span style="
            font-size: 11px;
            font-weight: 600;
            color: #111827;
            font-family: -apple-system, sans-serif;
          ">${name}</span>
        </div>
        <div style="width:2px;height:5px;background:#6B7280"></div>
        <div style="width:5px;height:5px;border-radius:50%;background:#6B7280;margin-top:-1px"></div>
      </div>
    `,
    iconSize: [120, 90],
    iconAnchor: [60, 90],
  });
}

// ── Country landmark map ──────────────────────────────────────────────────────

const COUNTRY_LANDMARKS: Record<string, string> = {
  france: "/landmarks/france.png",
  germany: "/landmarks/germany.png",
  italy: "/landmarks/italy.png",
  spain: "/landmarks/spain.png",
  austria: "/landmarks/austria.png",
  greece: "/landmarks/greece.png",
  portugal: "/landmarks/portugal.png",
  netherlands: "/landmarks/netherlands.png",
  uk: "/landmarks/uk.png",
  russia: "/landmarks/russia.png",
  georgia: "/landmarks/georgia.png",
  armenia: "/landmarks/armenia.png",
  azerbaijan: "/landmarks/azerbaijan.png",
  turkey: "/landmarks/turkey.png",
  kazakhstan: "/landmarks/kazakhstan.png",
  kyrgyzstan: "/landmarks/kazakhstan.png",
  uzbekistan: "/landmarks/uzbekistan.png",
  israel: "/landmarks/israel.png",
  uae: "/landmarks/israel.png",
  morocco: "/landmarks/israel.png",
  japan: "/landmarks/japan.png",
  thailand: "/landmarks/india.png",
  india: "/landmarks/india.png",
};

// ── Country slug → Next.js route ─────────────────────────────────────────────

function countryHref(slug: string): string {
  if (slug === "georgia") return "/georgia";
  if (slug === "russia") return "/cities";
  return `/cities`;
}

// ── Map layers (zoom-adaptive) ────────────────────────────────────────────────

function MapLayers() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const markersRef = useRef<L.Layer[]>([]);

  useMapEvent("zoom", () => setZoom(map.getZoom()));

  useEffect(() => {
    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (zoom < CLUSTER_ZOOM_THRESHOLD) {
      // Show continent clusters
      CLUSTERS.forEach(cluster => {
        const icon = makeClusterIcon(cluster.name, cluster.count, cluster.landmark);
        const marker = L.marker(cluster.center, { icon });
        marker.on("click", () => {
          map.flyTo(cluster.center, cluster.expandZoom, { duration: 0.8 });
        });
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    } else {
      // Show individual countries
      CLUSTERS.forEach(cluster => {
        cluster.countries.forEach(country => {
          const landmark = COUNTRY_LANDMARKS[country.slug] || cluster.landmark;
          const icon = makeCountryIcon(country.flag, country.name, landmark);
          const marker = L.marker([country.lat, country.lng], { icon });
          marker.on("click", () => {
            window.location.href = countryHref(country.slug);
          });
          marker.addTo(map);
          markersRef.current.push(marker);
        });
      });
    }

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [zoom, map]);

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorldMapHome() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{ height: "calc(100vh - 56px)", width: "100%", position: "relative" }}>
      <MapContainer
        center={[40.0, 40.0]}
        zoom={2.5}
        minZoom={2.0}
        maxZoom={8.0}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        worldCopyJump={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAttributionFix />
        <MapLayers />

        {/* Zoom controls — bottom right */}
        <ZoomButtons />
      </MapContainer>
    </div>
  );
}

function ZoomButtons() {
  const map = useMap();
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        right: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
        border: "1px solid #e5e7eb",
      }}
    >
      <button
        onClick={() => map.zoomIn()}
        style={{
          width: 32, height: 32,
          background: "white", border: "none",
          borderBottom: "1px solid #e5e7eb",
          fontSize: 18, fontWeight: 700,
          cursor: "pointer", color: "#374151",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
      <button
        onClick={() => map.zoomOut()}
        style={{
          width: 32, height: 32,
          background: "white", border: "none",
          fontSize: 18, fontWeight: 700,
          cursor: "pointer", color: "#374151",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>
    </div>
  );
}
