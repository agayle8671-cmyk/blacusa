import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { TYPE_COLOR } from "@/components/CaseRow";

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div class="case-pin" style="width:18px;height:18px;border-radius:50%;background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });

const popupHtml = (c) => `
  <div style="min-width:180px">
    <p style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8C271E">${c.case_type} &middot; ${c.status}</p>
    <p style="margin:4px 0 0;font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600">${c.name}</p>
    <p style="margin:0;font-size:12px;color:#666">${c.city}, ${c.state} &middot; ${c.date_reported}</p>
    <a href="/cold-cases/${c.case_number}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#8C271E;text-decoration:underline">View case file →</a>
  </div>`;

function ClusterLayer({ cases }) {
  const map = useMap();
  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#1A1A1A;color:#fff;font-family:'JetBrains Mono',monospace;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">${cluster.getChildCount()}</div>`,
          className: "",
          iconSize: [38, 38],
        }),
    });
    cases
      .filter((c) => c.lat && c.lng)
      .forEach((c) => {
        const m = L.marker([c.lat, c.lng], { icon: makeIcon(TYPE_COLOR[c.case_type] || "#666") });
        m.bindPopup(popupHtml(c));
        group.addLayer(m);
      });
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [cases, map]);
  return null;
}

function MapController({ center, radiusMiles }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      const zoom = radiusMiles ? Math.max(5, 9 - Math.log2(radiusMiles / 25 + 1)) : 8;
      map.flyTo(center, Math.round(zoom), { duration: 0.8 });
    }
  }, [center, radiusMiles, map]);
  return null;
}

function AreaEvents({ onMap, onMove }) {
  const map = useMap();
  useEffect(() => { onMap(map); }, [map, onMap]);
  useMapEvents({ moveend: () => onMove() });
  return null;
}

export const CaseMap = ({ cases = [], height = 520, cluster = false, center = null, radiusMiles = null, onSearchArea = null }) => {
  const initialCenter = center || [39.5, -94.5];
  const [mapRef, setMapRef] = useState(null);
  const [moved, setMoved] = useState(false);

  const searchArea = () => {
    if (!mapRef) return;
    const b = mapRef.getBounds();
    onSearchArea({
      min_lat: b.getSouth(),
      max_lat: b.getNorth(),
      min_lng: b.getWest(),
      max_lng: b.getEast(),
    });
    setMoved(false);
  };

  return (
    <div style={{ height }} className="relative w-full border border-border" data-testid="case-map">
      {onSearchArea && moved && (
        <button
          data-testid="search-this-area"
          onClick={searchArea}
          className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-lg transition-colors hover:bg-accent"
        >
          Search this area
        </button>
      )}
      <MapContainer center={initialCenter} zoom={4} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap, &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {center && radiusMiles && (
          <Circle
            center={center}
            radius={radiusMiles * 1609.34}
            pathOptions={{ color: "#8C271E", weight: 1, fillColor: "#8C271E", fillOpacity: 0.06 }}
          />
        )}
        {cluster ? (
          <ClusterLayer cases={cases} />
        ) : (
          cases
            .filter((c) => c.lat && c.lng)
            .map((c) => (
              <Marker key={c.case_number} position={[c.lat, c.lng]} icon={makeIcon(TYPE_COLOR[c.case_type] || "#666")}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: "#8C271E" }}>
                      {c.case_type} &middot; {c.status}
                    </p>
                    <p className="mt-1 text-base font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{c.name}</p>
                    <p className="text-xs text-gray-500">{c.city}, {c.state} &middot; {c.date_reported}</p>
                    <Link to={`/cold-cases/${c.case_number}`} className="mt-2 inline-block text-xs font-medium underline" style={{ color: "#8C271E" }}>
                      View case file →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))
        )}
        <MapController center={center} radiusMiles={radiusMiles} />
        {onSearchArea && <AreaEvents onMap={setMapRef} onMove={() => setMoved(true)} />}
      </MapContainer>
    </div>
  );
};
