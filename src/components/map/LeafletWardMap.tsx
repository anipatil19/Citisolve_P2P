import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import L from 'leaflet';
import {
  Globe,
  Layers,
  Loader2,
  LocateFixed,
} from 'lucide-react';
import {SUPPORTED_LANGUAGES} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import type {CivicIssue, SafetySeverity} from '../../types/civic';

interface LeafletWardMapProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  radiusKm: number;
  onChangeRadiusKm: (km: number) => void;
}

const DEFAULT_CENTER = {lat: 12.9716, lng: 77.6412};

function getPinColor(issue: CivicIssue): string {
  if (issue.status === 'resolution_confirmed') return '#16A34A';
  const map: Record<SafetySeverity, string> = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#16A34A',
  };
  return map[issue.safetySeverity];
}

function createTeardropPinIcon(color: string, isSelected: boolean): L.DivIcon {
  const scale = isSelected ? 1.22 : 1;
  const ring = isSelected
    ? `<circle cx="16" cy="14" r="14" fill="none" stroke="#1E293B" stroke-width="2.5"/>`
    : '';
  const svg = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="transform: scale(${scale}); transform-origin: bottom center; filter: drop-shadow(0 3px 5px rgba(15,23,42,0.32));">
      ${ring}
      <path d="M16 1C8.82 1 3 6.82 3 14c0 9.75 13 26 13 26s13-16.25 13-26C29 6.82 23.18 1 16 1z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="14" r="5" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'citisolve-map-pin',
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

function createClusterIcon(count: number, color: string): L.DivIcon {
  const html = `
    <div style="width:36px;height:36px;border-radius:9999px;background:${color};border:3px solid #FFFFFF;color:#FFFFFF;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(15,23,42,0.35);">
      ${count}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'citisolve-cluster-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export const LeafletWardMap: React.FC<LeafletWardMapProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  radiusKm,
  onChangeRadiusKm,
}) => {
  const {currentUser, requestLiveLocationAccess} = useCitiSolve();
  const {lang: currentLang, setLang, t} = useTranslation();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [clusterEnabled, setClusterEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [locating, setLocating] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  const mapCenter = useMemo(() => {
    if (currentUser?.liveCoordinates) {
      return {
        lat: currentUser.liveCoordinates.lat,
        lng: currentUser.liveCoordinates.lng,
        isLive: true,
      };
    }
    return {...DEFAULT_CENTER, isLive: false};
  }, [currentUser?.liveCoordinates]);

  const mappedIssues = useMemo(() => {
    const latOffset = mapCenter.lat - DEFAULT_CENTER.lat;
    const lngOffset = mapCenter.lng - DEFAULT_CENTER.lng;

    return issues
      .filter((i) => radiusKm >= 10 || i.mapPosition.distanceKmFromCenter <= radiusKm)
      .map((issue) => ({
        issue,
        lat: Number((issue.mapPosition.approxLat + latOffset).toFixed(5)),
        lng: Number((issue.mapPosition.approxLng + lngOffset).toFixed(5)),
      }));
  }, [issues, mapCenter, radiusKm]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([mapCenter.lat, mapCenter.lng], map.getZoom(), {animate: true});
  }, [mapCenter.lat, mapCenter.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (radiusKm < 10) {
      L.circle([mapCenter.lat, mapCenter.lng], {
        radius: radiusKm * 1000,
        color: '#4F46E5',
        weight: 1.5,
        dashArray: '6 5',
        fillColor: '#4F46E5',
        fillOpacity: 0.06,
      }).addTo(group);
    }

    const userDot = L.circleMarker([mapCenter.lat, mapCenter.lng], {
      radius: 7,
      color: '#FFFFFF',
      weight: 2.5,
      fillColor: '#4F46E5',
      fillOpacity: 1,
    }).bindTooltip(
      mapCenter.isLive ? 'Your Approximate Area' : 'Bengaluru Ward 80 Center (Demo)',
      {direction: 'top'}
    );
    userDot.addTo(group);

    const shouldCluster = clusterEnabled && zoomLevel <= 12;

    if (!shouldCluster) {
      for (const item of mappedIssues) {
        const color = getPinColor(item.issue);
        const isSelected = item.issue.id === selectedIssueId;
        const marker = L.marker([item.lat, item.lng], {
          icon: createTeardropPinIcon(color, isSelected),
        });
        marker.on('click', () => {
          onSelectIssue(item.issue.id);
        });
        marker.bindTooltip(
          `${item.issue.title} (${item.issue.mapPosition.distanceKmFromCenter} km)`,
          {direction: 'top', offset: [0, -34]}
        );
        marker.addTo(group);
      }
      return;
    }

    // Simple distance-based clustering when zoomed out
    const clusters: Array<{
      lat: number;
      lng: number;
      items: typeof mappedIssues;
    }> = [];
    const degThreshold = 0.012;

    for (const item of mappedIssues) {
      const target = clusters.find(
        (c) => Math.hypot(c.lat - item.lat, c.lng - item.lng) < degThreshold
      );
      if (target) {
        target.items.push(item);
        target.lat =
          target.items.reduce((s, x) => s + x.lat, 0) / target.items.length;
        target.lng =
          target.items.reduce((s, x) => s + x.lng, 0) / target.items.length;
      } else {
        clusters.push({lat: item.lat, lng: item.lng, items: [item]});
      }
    }

    for (const c of clusters) {
      if (c.items.length === 1) {
        const only = c.items[0];
        const marker = L.marker([only.lat, only.lng], {
          icon: createTeardropPinIcon(
            getPinColor(only.issue),
            only.issue.id === selectedIssueId
          ),
        });
        marker.on('click', () => onSelectIssue(only.issue.id));
        marker.bindTooltip(
          `${only.issue.title} (${only.issue.mapPosition.distanceKmFromCenter} km)`,
          {direction: 'top', offset: [0, -34]}
        );
        marker.addTo(group);
      } else {
        const hasCritical = c.items.some(
          (x) => x.issue.safetySeverity === 'critical'
        );
        const clusterColor = hasCritical ? '#DC2626' : '#EA580C';
        const marker = L.marker([c.lat, c.lng], {
          icon: createClusterIcon(c.items.length, clusterColor),
        });
        marker.on('click', () => {
          map.setView([c.lat, c.lng], 14, {animate: true});
        });
        marker.addTo(group);
      }
    }
  }, [mappedIssues, selectedIssueId, clusterEnabled, zoomLevel, radiusKm, mapCenter]);

  const handleRecenterLiveLocation = async () => {
    setLocating(true);
    setGpsFeedback(null);
    const res = await requestLiveLocationAccess();
    setLocating(false);
    setGpsFeedback(res.message);
    window.setTimeout(() => setGpsFeedback(null), 4000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Map search radius"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs"
          >
            {[
              {km: 2, label: t('map.radius2km')},
              {km: 5, label: t('map.radius5km')},
              {km: 15, label: t('map.radiusAll')},
            ].map((opt) => (
              <button
                key={opt.km}
                type="button"
                onClick={() => onChangeRadiusKm(opt.km)}
                className={`min-h-9 rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  radiusKm === opt.km
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setClusterEnabled((c) => !c)}
            aria-pressed={clusterEnabled}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              clusterEnabled
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t('map.cluster')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenterLiveLocation}
          disabled={locating}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer whitespace-nowrap"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          <span>{mapCenter.isLive ? t('map.updateGps') : t('map.useMyLocation')}</span>
        </button>
      </div>

      {gpsFeedback && (
        <div className="border-b border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-medium text-indigo-900">
          {gpsFeedback}
        </div>
      )}

      <div className="relative h-72 sm:h-84 w-full">
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-label={t('common.selectLanguage')}
              onClick={() => setLangMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-xs hover:bg-white cursor-pointer"
            >
              <Globe className="h-4 w-4 text-indigo-600" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                {SUPPORTED_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                      currentLang === item.code
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span>{item.nativeLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/profile"
            aria-label={t('nav.profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-indigo-600 font-display text-sm font-bold text-white shadow-md"
          >
            {(currentUser?.name ?? 'C').charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3.5 py-2.5 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
            {t('map.legendCritical')}
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-600" aria-hidden="true" />
            {t('map.legendHighMed')}
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
            {t('map.legendLowResolved')}
          </span>
        </div>
        <span className="text-slate-500">
          {t('map.osmCitizenFooter', {
            place: mapCenter.isLive ? t('map.yourGps') : t('map.bengaluru'),
          })}
        </span>
      </div>
    </div>
  );
};
