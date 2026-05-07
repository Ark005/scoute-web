"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapAttributionFix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(
      '<a href="https://leafletjs.com/" title="A JavaScript library for interactive maps">Leaflet</a>'
    );
  }, [map]);
  return null;
}
