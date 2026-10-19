import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// marker = { color, emoji }
const pinIcon = (c, active) => {
  return L.divIcon({
    className: `shusei-pin${active ? ' is-active' : ''}`,
    html: `<div style="background:${c.color}"><span>${c.emoji}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    tooltipAnchor: [0, -30],
  });
};

const hasSize = (map) => {
  const { x, y } = map.getSize();
  return x > 0 && y > 0;
};

const fitTo = (map, items) => {
  if (items.length === 0 || !hasSize(map)) return;
  const bounds = L.latLngBounds(items.map((r) => [r.latitude, r.longitude]));
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
};

// 絞り込み結果が全部入るように表示範囲を合わせる。
// スマホでは地図が非表示（サイズ0）の間に描画されるので、表示された時点で合わせ直す。
const FitBounds = ({ items }) => {
  const map = useMap();
  const latest = useRef(items);
  latest.current = items;
  const key = items.map((r) => r.id).join(',');

  useEffect(() => {
    fitTo(map, latest.current);
  }, [key, map]);

  useEffect(() => {
    let wasVisible = hasSize(map);
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      const visible = hasSize(map);
      if (visible && !wasVisible) fitTo(map, latest.current);
      wasVisible = visible;
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const FlyToSelected = ({ selected }) => {
  const map = useMap();
  useEffect(() => {
    if (selected && hasSize(map)) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 17), { duration: 0.6 });
    }
  }, [selected, map]);
  return null;
};

// items: { id, name, latitude, longitude } の配列。markerOf(item) でピンの色と絵文字を決める
const MapView = ({ items, selected, onSelect, markerOf, center, userLocation }) => {
  const icons = useMemo(() => ({}), []);
  const iconFor = (item, active) => {
    const m = markerOf(item);
    const k = `${m.color}-${m.emoji}-${active}`;
    return (icons[k] ??= pinIcon(m, active));
  };

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds items={items} />
      <FlyToSelected selected={selected} />

      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{ color: '#1A1A1A', weight: 3, fillColor: '#FFD600', fillOpacity: 1 }}
        >
          <Tooltip>現在地</Tooltip>
        </CircleMarker>
      )}

      {items.map((item) => {
        const active = selected?.id === item.id;
        return (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={iconFor(item, active)}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(item) }}
          >
            <Tooltip direction="top">
              <strong>{item.name}</strong>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
