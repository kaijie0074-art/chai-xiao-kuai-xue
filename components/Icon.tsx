import React from "react";

export const Icon = {
  Logo: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="2 2" />
      <rect x="8" y="8" width="11" height="11" rx="2.5" fill="var(--accent)" />
    </svg>
  ),
  Sun: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Moon: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  ),
  Github: () => (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.51v-1.79c-2.93.64-3.55-1.41-3.55-1.41-.48-1.22-1.17-1.54-1.17-1.54-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.69.37-1.15.67-1.42-2.34-.27-4.8-1.17-4.8-5.2 0-1.15.41-2.09 1.08-2.83-.11-.27-.47-1.34.1-2.79 0 0 .89-.28 2.91 1.08a10.1 10.1 0 0 1 5.3 0c2.02-1.36 2.91-1.08 2.91-1.08.57 1.45.21 2.52.1 2.79.67.74 1.08 1.68 1.08 2.83 0 4.04-2.47 4.93-4.82 5.19.38.33.71.97.71 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z" fill="currentColor" />
    </svg>
  ),
  Lock: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Sparkle: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
      <path d="m6 6 3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </svg>
  ),
  Copy: () => (
    <svg className="ic-sm" viewBox="0 0 24 24">
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  Scissors: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.12 8.12 20 20" />
      <path d="M14 14 20 4" />
      <path d="M8.12 15.88 11 13" />
    </svg>
  ),
  Play: () => (
    <svg className="ic-sm" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Stop: () => (
    <svg className="ic-sm" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ),
  Download: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M12 3v13M6 10l6 6 6-6M4 21h16" />
    </svg>
  ),
  Refresh: () => (
    <svg className="ic-sm" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  Eye: () => (
    <svg className="ic-sm" viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="ic-sm" viewBox="0 0 24 24">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.5 5.1A10 10 0 0 1 22 12c-.6 1.2-1.5 2.5-2.7 3.7M6.3 6.3C4 8 2.5 10.4 2 12c1.5 3 5 7 10 7 1.5 0 2.9-.3 4.2-.9" />
    </svg>
  ),
  Folder: () => (
    <svg className="ic" viewBox="0 0 24 24">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  ),
  Check: () => (
    <svg className="ic-sm" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" /></svg>
  ),
  Close: () => (
    <svg className="ic-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
  ),
  Magnify: () => (
    <svg className="ic-lg" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
};
