"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMap } from "react-leaflet";
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
  /** manual lat/lng offset (deg) to nudge marker off a dense centroid cluster */
  offset?: [number, number];
};

// shapeISO from geoBoundaries → our metadata
const REGIONS: Record<string, RegionMeta> = {
  "GE-TB": { sketch: "tbilisi", label: "Тбилиси", citySlug: "tbilisi", count: 45 },
  "GE-AJ": { sketch: "adjara", label: "Аджария", citySlug: "batumi", count: 41 },
  "GE-IM": { sketch: "imereti", label: "Имеретия", citySlug: "kutaisi", count: 39 },
  "GE-KA": { sketch: "kakheti", label: "Кахетия", citySlug: "telavi", count: 38, offset: [0, 0.15] },
  "GE-MM": { sketch: "mtskheta-mtianeti", label: "Мцхета-Мтианетия", citySlug: "mtskheta", count: 36, offset: [0.25, -0.05] },
  "GE-SJ": { sketch: "samtskhe-javakheti", label: "Самцхе-Джавахетия", citySlug: "javakheti", count: 30, offset: [-0.1, 0] },
  "GE-SK": { sketch: "shida-kartli", label: "Шида-Картли", citySlug: "gori", count: 30, offset: [0, -0.2] },
  "GE-SZ": { sketch: "samegrelo-zemo-svaneti", label: "Сванетия", citySlug: "mestia", count: 28 },
  "GE-RL": { sketch: "racha-lechkhumi", label: "Рача-Лечхуми", citySlug: "racha", count: 30, offset: [0.15, 0] },
  "GE-KK": { sketch: "kvemo-kartli", label: "Квемо-Картли", citySlug: null, count: 0, offset: [-0.15, 0.1] },
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
    className: "scout-region-marker",
    html: `
      <div style="
        position:relative;
        width:56px;height:56px;
        background:white;border-radius:14px;
        box-shadow:0 4px 14px rgba(0,0,0,0.18);
        display:flex;align-items:center;justify-content:center;
        padding:5px;
        border:1px solid rgba(0,0,0,0.06);
        cursor:${linkable ? "pointer" : "default"};
      ">
        <img src="/regions/${meta.sketch}.png"
          alt="${meta.label}"
          style="width:100%;height:100%;object-fit:contain;"
          onerror="this.style.display='none'"
        />
        ${meta.count ? `<span style="
          position:absolute;top:-6px;right:-6px;
          background:#3730A3;color:white;
          font-size:10px;font-weight:700;
          padding:2px 6px;border-radius:10px;
          box-shadow:0 2px 4px rgba(0,0,0,0.2);
          line-height:1;min-width:18px;text-align:center;
        ">${meta.count}</span>` : ""}
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
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
      const c = getCentroid(f.geometry);
      if (!c) continue;
      const pos: [number, number] = meta.offset
        ? [c[0] + meta.offset[0], c[1] + meta.offset[1]]
        : c;
      out.push({ iso, pos, meta });
    }
    return out;
  }, [geojson]);

  return (
    <div className="relative w-full" style={{ height: "min(70vh, 560px)", minHeight: 360 }}>
      {/* Smooth hover transitions for region polygons */}
      <style>{`
        .leaflet-overlay-pane svg path.leaflet-interactive {
          transition: fill-opacity 0.35s ease-out, stroke-width 0.35s ease-out, stroke-opacity 0.35s ease-out, fill 0.35s ease-out;
          cursor: pointer;
        }
      `}</style>
      <MapContainer
        bounds={GEORGIA_BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%", background: "#F1ECDF" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {geojson && (
          <GeoJSON
            data={geojson}
            style={() => ({
              color: "#92400e",
              weight: 2,
              opacity: 0.55,
              fillColor: "#FEF3C7",
              fillOpacity: 0.35,
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
                e.target.setStyle({
                  fillOpacity: 0.6,
                  weight: 2.5,
                  color: "#7C2D12",
                  fillColor: "#FBBF24",
                });
                if (e.target.bringToFront) e.target.bringToFront();
              });
              layer.on("mouseout", function (e: any) {
                e.target.setStyle({
                  fillOpacity: 0.35,
                  weight: 2,
                  color: "#92400e",
                  fillColor: "#FEF3C7",
                });
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
          >
            <Tooltip direction="top" offset={[0, -32]} opacity={1} permanent={false}>
              <span style={{ fontWeight: 600 }}>{meta.label}</span>
              {meta.count ? <span style={{ marginLeft: 6, color: "#3730A3" }}>· {meta.count}</span> : null}
            </Tooltip>
          </Marker>
        ))}
        <FitBounds />
        <MapAttributionFix />
      </MapContainer>
    </div>
  );
}
