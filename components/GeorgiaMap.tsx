"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import MapAttributionFix from "./MapAttributionFix";

type RegionMeta = {
  /** matches public/regions/<slug>.png */
  sketch: string;
  /** label shown next to marker */
  label: string;
  /** main city slug for click-through (or null = no link) */
  citySlug: string | null;
  /** count of POI/cities/etc shown as small badge */
  count: number;
};

// shapeISO from geoBoundaries → our metadata
const REGIONS: Record<string, RegionMeta> = {
  "GE-TB": { sketch: "tbilisi", label: "Тбилиси", citySlug: "tbilisi", count: 45 },
  "GE-AJ": { sketch: "adjara", label: "Аджария", citySlug: "batumi", count: 41 },
  "GE-IM": { sketch: "imereti", label: "Имеретия", citySlug: "kutaisi", count: 39 },
  "GE-KA": { sketch: "kakheti", label: "Кахетия", citySlug: "telavi", count: 38 },
  "GE-MM": { sketch: "mtskheta-mtianeti", label: "Мцхета-Мтианетия", citySlug: "mtskheta", count: 36 },
  "GE-SJ": { sketch: "samtskhe-javakheti", label: "Самцхе-Джавахетия", citySlug: "javakheti", count: 30 },
  "GE-SK": { sketch: "shida-kartli", label: "Шида-Картли", citySlug: "gori", count: 30 },
  "GE-SZ": { sketch: "samegrelo-zemo-svaneti", label: "Сванетия", citySlug: "mestia", count: 28 },
  "GE-RL": { sketch: "racha-lechkhumi", label: "Рача-Лечхуми", citySlug: "racha", count: 30 },
  "GE-KK": { sketch: "kvemo-kartli", label: "Квемо-Картли", citySlug: null, count: 0 },
  "GE-GU": { sketch: "guria", label: "Гурия", citySlug: null, count: 0 },
  // GE-AB (Абхазия) — отдельно, не на карте Грузии
};
const HIDDEN_ISO = new Set(["GE-AB"]);

// Approximate Georgia center for fitBounds fallback
const GEORGIA_BOUNDS: L.LatLngBoundsLiteral = [
  [40.95, 39.9], // SW
  [43.6, 46.75], // NE
];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(GEORGIA_BOUNDS, { padding: [20, 20], animate: false });
  }, [map]);
  return null;
}

function makeRegionMarker(meta: RegionMeta) {
  const linkable = !!meta.citySlug;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        cursor:${linkable ? "pointer" : "default"};
        transform:translateY(-32px);
      ">
        <div style="
          width:64px;height:64px;
          background:white;border-radius:14px;
          box-shadow:0 4px 14px rgba(0,0,0,0.18);
          display:flex;align-items:center;justify-content:center;
          padding:6px;
          border:1px solid rgba(0,0,0,0.06);
        ">
          <img src="/regions/${meta.sketch}.png"
            alt="${meta.label}"
            style="width:100%;height:100%;object-fit:contain;"
            onerror="this.style.display='none'"
          />
        </div>
        <div style="
          margin-top:4px;
          background:white;border-radius:10px;
          padding:3px 9px;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
          font-size:11px;font-weight:600;color:#0F172A;
          white-space:nowrap;
          display:flex;align-items:center;gap:6px;
        ">
          <span>${meta.label}</span>
          ${meta.count ? `<span style="background:#E0E7FF;color:#3730A3;padding:1px 6px;border-radius:6px;font-size:10px;">${meta.count}</span>` : ""}
        </div>
      </div>
    `,
    iconSize: [180, 100],
    iconAnchor: [90, 100],
  });
}

function getCentroid(geometry: any): [number, number] | null {
  // For Polygon/MultiPolygon — average of outer-ring vertices.
  let lat = 0;
  let lng = 0;
  let count = 0;
  const eat = (ring: any[]) => {
    for (const [x, y] of ring) {
      lng += x;
      lat += y;
      count++;
    }
  };
  if (geometry.type === "Polygon") {
    eat(geometry.coordinates[0]);
  } else if (geometry.type === "MultiPolygon") {
    // Largest polygon by ring length for better visual placement
    let best: any[] = [];
    for (const poly of geometry.coordinates) {
      if (poly[0].length > best.length) best = poly[0];
    }
    eat(best);
  } else {
    return null;
  }
  return count ? [lat / count, lng / count] : null;
}

export default function GeorgiaMap() {
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch("/geo/georgia-adm1.geojson")
      .then((r) => r.json())
      .then((g) => {
        // Filter out hidden regions (e.g. Abkhazia — handled separately)
        if (g?.features) {
          g.features = g.features.filter(
            (f: any) => !HIDDEN_ISO.has(f.properties?.shapeISO),
          );
        }
        setGeojson(g);
      })
      .catch(() => setGeojson(null));
  }, []);

  const markers = useMemo(() => {
    if (!geojson) return [] as Array<{ iso: string; pos: [number, number]; meta: RegionMeta }>;
    const out: Array<{ iso: string; pos: [number, number]; meta: RegionMeta }> = [];
    for (const f of geojson.features) {
      const iso = f.properties?.shapeISO;
      const meta = REGIONS[iso];
      if (!meta) continue;
      const pos = getCentroid(f.geometry);
      if (pos) out.push({ iso, pos, meta });
    }
    return out;
  }, [geojson]);

  return (
    <div className="relative w-full" style={{ height: "min(70vh, 560px)", minHeight: 360 }}>
      <MapContainer
        bounds={GEORGIA_BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "#F1ECDF" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=6J7pYibiqlRiksixjccO&lang=ru"
        />
        {geojson && (
          <GeoJSON
            data={geojson}
            style={() => ({
              color: "#92400e",
              weight: 1.2,
              opacity: 0.55,
              fillColor: "#FEF3C7",
              fillOpacity: 0.18,
            })}
            onEachFeature={(feature, layer) => {
              const iso = feature.properties?.shapeISO;
              const meta = REGIONS[iso];
              const name = meta?.label || feature.properties?.shapeName;
              if (name) layer.bindTooltip(name, { sticky: true, direction: "top" });
              if (meta?.citySlug) {
                layer.on("click", () => {
                  window.location.href = `/cities/${meta.citySlug}`;
                });
              }
              layer.on("mouseover", function (e: any) {
                e.target.setStyle({ fillOpacity: 0.45, weight: 2 });
              });
              layer.on("mouseout", function (e: any) {
                e.target.setStyle({ fillOpacity: 0.18, weight: 1.2 });
              });
            }}
          />
        )}
        {markers.map(({ iso, pos, meta }) => (
          <Marker
            key={iso}
            position={pos}
            icon={makeRegionMarker(meta)}
            eventHandlers={
              meta.citySlug
                ? {
                    click: () => {
                      window.location.href = `/cities/${meta.citySlug}`;
                    },
                  }
                : undefined
            }
          />
        ))}
        <FitBounds />
        <MapAttributionFix />
      </MapContainer>
    </div>
  );
}
