import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leafletのデフォルトアイコンの問題を修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// カスタムアイコンを作成
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// ジャンル別の色分け
const getMarkerColor = (genre) => {
  const colors = {
    '居酒屋': '#f97316',
    '焼肉': '#dc2626',
    'スナック': '#9333ea',
    'ダイナー': '#2563eb',
    'バー': '#374151',
    'カフェバー': '#059669',
    'ダイニング': '#16a34a',
    '高級クラブ': '#dc2626',
    'ナイトスポット': '#7c3aed',
    'ラーメン・居酒屋': '#ea580c',
    '飲食店': '#6b7280'
  };
  return colors[genre] || '#6b7280';
};

const RestaurantMap = ({ restaurants, selectedRestaurant, onRestaurantSelect, center }) => {
  const mapRef = useRef();

  useEffect(() => {
    if (selectedRestaurant && mapRef.current) {
      const map = mapRef.current;
      map.setView([selectedRestaurant.latitude, selectedRestaurant.longitude], 16);
    }
  }, [selectedRestaurant]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={createCustomIcon(getMarkerColor(restaurant.genre))}
            eventHandlers={{
              click: () => onRestaurantSelect(restaurant)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">{restaurant.name}</h3>
                <p className="text-xs text-gray-600">{restaurant.genre}</p>
                <p className="text-xs">{restaurant.openingHours}</p>
                <p className="text-xs">{restaurant.priceRangeDinner}</p>
                <button 
                  className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  onClick={() => onRestaurantSelect(restaurant)}
                >
                  詳細を見る
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
