"use client";

import dynamic from "next/dynamic";

const WorldMapHome = dynamic(() => import("@/components/WorldMapHome"), { ssr: false });

export default function HomePage() {
  return <WorldMapHome />;
}
