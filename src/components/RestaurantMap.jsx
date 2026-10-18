import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categoryById } from '../data/taxonomy.js';

const pinIcon = (category, active) => {
  const c = categoryById[category];
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

const fitTo = (map, restaurants) => {
  if (restaurants.length === 0 || !hasSize(map)) return;
  const bounds = L.latLngBounds(restaurants.map((r) => [r.latitude, r.longitude]));
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
};

// 絞り込み結果が全部入るように表示範囲を合わせる。
// スマホでは地図が非表示（サイズ0）の間に描画されるので、表示された時点で合わせ直す。
const FitBounds = ({ restaurants }) => {
  const map = useMap();
  const latest = useRef(restaurants);
  latest.current = restaurants;
  const key = restaurants.map((r) => r.id).join(',');

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

const RestaurantMap = ({ restaurants, selectedRestaurant, onRestaurantSelect, center, userLocation }) => {
  const icons = useMemo(() => ({}), []);
  const iconFor = (category, active) => {
    const k = `${category}-${active}`;
    return (icons[k] ??= pinIcon(category, active));
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
      <FitBounds restaurants={restaurants} />
      <FlyToSelected selected={selectedRestaurant} />

      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#DD6420', fillOpacity: 1 }}
        >
          <Tooltip>現在地</Tooltip>
        </CircleMarker>
      )}

      {restaurants.map((restaurant) => {
        const active = selectedRestaurant?.id === restaurant.id;
        return (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={iconFor(restaurant.category, active)}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{ click: () => onRestaurantSelect(restaurant) }}
          >
            <Tooltip direction="top">
              <strong>{restaurant.name}</strong>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default RestaurantMap;
