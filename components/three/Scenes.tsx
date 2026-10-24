"use client";

import dynamic from "next/dynamic";

export const Backdrop = dynamic(() => import("./Backdrop"), {
  ssr: false,
  loading: () => <div className="bg-fallback" aria-hidden="true" />,
});

export const Hero3D = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="hero-canvas hero-ph" aria-hidden="true" />,
});

export const Sync3D = dynamic(() => import("./SyncScene"), {
  ssr: false,
  loading: () => <div className="sync-canvas sync-ph" aria-hidden="true" />,
});
