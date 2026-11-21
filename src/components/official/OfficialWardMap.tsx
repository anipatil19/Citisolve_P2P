import React, {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import {Layers} from 'lucide-react';
import {useTranslation} from '../../i18n/useTranslation';
import type {CivicIssue, SafetySeverity} from '../../types/civic';

interface OfficialWardMapProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  authorizedWards: string[];
}

const DEFAULT_CENTER = {lat: 12.9716, lng: 77.6412};

function getPinColor(issue: CivicIssue): string {
  if (issue.status === 'resolution_confirmed') return '#16A34A';
  const map: Record<SafetySeverity, string> = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#0F766E',
  };
  return map[issue.safetySeverity];
}

function createPinIcon(color: string, isSelected: boolean): L.DivIcon {
  const scale = isSelected ? 1.2 : 1;
  const ring = isSelected
    ? `<circle cx="16" cy="14" r="14" fill="none" stroke="#0F172A" stroke-width="2.5"/>`
    : '';
  const svg = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="transform: scale(${scale}); transform-origin: bottom center; filter: drop-shadow(0 2px 4px rgba(15,23,42,0.3));">
      ${ring}
      <path d="M16 1C8.82 1 3 6.82 3 14c0 9.75 13 26 13 26s13-16.25 13-26C29 6.82 23.18 1 16 1z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="14" r="4.5" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'citisolve-official-pin',
    iconSize: [32, 42],
    iconAnchor: [16, 40],
  });
}

function createClusterIcon(count: number, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:${color};border:3px solid #FFFFFF;color:#FFFFFF;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(15,23,42,0.3);">${count}</div>`,
    className: 'citisolve-official-cluster',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export const OfficialWardMap: React.FC<OfficialWardMapProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  authorizedWards,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.LayerGroup | null>(null);
  const {t} = useTranslation();

  const [clusterEnabled, setClusterEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(14);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    map.on('zoomend', () => setZoomLevel(map.getZoom()));

    mapRef.current = map;
    groupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      groupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Approximate demonstration jurisdiction zone (not official ULB polygon)
    L.circle([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], {
      radius: 2600,
      color: '#0F766E',
      weight: 1.5,
      dashArray: '6 5',
      fillColor: '#0F766E',
      fillOpacity: 0.04,
    })
      .bindTooltip(
        `Approximate Demo Jurisdiction (${authorizedWards.join(', ')}) — official GIS boundary polygons pending`,
        {sticky: true}
      )
      .addTo(group);

    const shouldCluster = clusterEnabled && zoomLevel <= 13;

    if (!shouldCluster) {
      for (const issue of issues) {
        const marker = L.marker(
          [issue.mapPosition.approxLat, issue.mapPosition.approxLng],
          {
            icon: createPinIcon(
              getPinColor(issue),
              issue.id === selectedIssueId
            ),
          }
        );
        marker.on('click', () => onSelectIssue(issue.id));
        marker.bindTooltip(`${issue.id}: ${issue.title}`, {
          direction: 'top',
          offset: [0, -34],
        });
        marker.addTo(group);
      }
      return;
    }

    const clusters: Array<{lat: number; lng: number; items: CivicIssue[]}> = [];
    for (const issue of issues) {
      const target = clusters.find(
        (c) =>
          Math.hypot(
            c.lat - issue.mapPosition.approxLat,
            c.lng - issue.mapPosition.approxLng
          ) < 0.008
      );
      if (target) {
        target.items.push(issue);
        target.lat =
          target.items.reduce((s, i) => s + i.mapPosition.approxLat, 0) /
          target.items.length;
        target.lng =
          target.items.reduce((s, i) => s + i.mapPosition.approxLng, 0) /
          target.items.length;
      } else {
        clusters.push({
          lat: issue.mapPosition.approxLat,
          lng: issue.mapPosition.approxLng,
          items: [issue],
        });
      }
    }

    for (const c of clusters) {
      if (c.items.length === 1) {
        const item = c.items[0];
        const marker = L.marker(
          [item.mapPosition.approxLat, item.mapPosition.approxLng],
          {
            icon: createPinIcon(
              getPinColor(item),
              item.id === selectedIssueId
            ),
          }
        );
        marker.on('click', () => onSelectIssue(item.id));
        marker.bindTooltip(`${item.id}: ${item.title}`, {
          direction: 'top',
          offset: [0, -34],
        });
        marker.addTo(group);
      } else {
        const hasCritical = c.items.some((i) => i.safetySeverity === 'critical');
        const marker = L.marker([c.lat, c.lng], {
          icon: createClusterIcon(
            c.items.length,
            hasCritical ? '#DC2626' : '#0F766E'
          ),
        });
        marker.on('click', () => map.setView([c.lat, c.lng], 15, {animate: true}));
        marker.addTo(group);
      }
    }
  }, [issues, selectedIssueId, clusterEnabled, zoomLevel, authorizedWards, onSelectIssue]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            {t('map.legendCritical')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
            {t('map.legendHigh')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
            {t('map.legendMedium')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F766E]" />
            {t('map.legendLow')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            {t('map.legendResolved')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setClusterEnabled((c) => !c)}
          aria-pressed={clusterEnabled}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
            clusterEnabled
              ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
              : 'border-[#E2E8F0] bg-white text-slate-700'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{t('map.clusterMarkers')}</span>
        </button>
      </div>

      <div className="h-96 w-full">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-[11px] text-slate-600">
        {t('map.officialFooter')}
      </div>
    </div>
  );
};
