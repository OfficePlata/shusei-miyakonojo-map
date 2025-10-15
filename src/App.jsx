import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Search, MapPin, Clock, Users, Phone, Map } from 'lucide-react';
import { restaurants, venues, cityCenter } from './data/restaurants.js'
import RestaurantMap from './components/RestaurantMap.jsx'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showMap, setShowMap] = useState(false)

  // ジャンルの一覧を取得
  const genres = [...new Set(restaurants.map(r => r.genre))]
  
  // 価格帯の一覧を取得
  const priceRanges = [...new Set(restaurants.map(r => r.priceRangeDinner).filter(Boolean))]

  // フィルタリングされたレストラン
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === 'all' || restaurant.genre === selectedGenre
      const matchesPriceRange = selectedPriceRange === 'all' || restaurant.priceRangeDinner === selectedPriceRange
      
      return matchesSearch && matchesGenre && matchesPriceRange
    })
  }, [searchTerm, selectedGenre, selectedPriceRange])

  // ジャンル別の色分け
  const getGenreColor = (genre) => {
    const colors = {
      '居酒屋': 'bg-orange-100 text-orange-800',
      '焼肉': 'bg-red-100 text-red-800',
      'スナック': 'bg-purple-100 text-purple-800',
      'ダイナー': 'bg-blue-100 text-blue-800',
      'バー': 'bg-gray-100 text-gray-800',
      'ダイニング': 'bg-green-100 text-green-800'
    }
    return colors[genre] || 'bg-gray-100 text-gray-800'
  }

  // 価格帯別の色分け
  const getPriceColor = (priceRange) => {
    if (!priceRange) return 'bg-gray-100 text-gray-800'
    if (priceRange.includes('3,000')) return 'bg-green-100 text-green-800'
    if (priceRange.includes('4,000')) return 'bg-yellow-100 text-yellow-800'
    if (priceRange.includes('5,000')) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">守成クラブ都城会場</h1>
              <p className="text-red-100 mt-1">会員店舗 三部会マップ</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-100">22時以降営業 会員店舗</p>
              <p className="text-lg font-semibold">信頼でつなぐ商売繁盛の絆</p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="店名・説明で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="すべてのジャンル" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのジャンル</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="すべての価格帯" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての価格帯</SelectItem>
                {priceRanges.map(range => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">{filteredRestaurants.length}件の会員店舗が見つかりました</p>
          <Button
            variant={showMap ? "default" : "outline"}
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            {showMap ? "リスト表示" : "マップ表示"}
          </Button>
        </div>

        {/* マップ表示 */}
        {showMap && (
          <div className="mb-8">
            <RestaurantMap
              restaurants={filteredRestaurants}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={setSelectedRestaurant}
              center={cityCenter}
            />
          </div>
        )}

        {/* 店舗一覧 */}
        {!showMap && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <Card key={restaurant.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => setSelectedRestaurant(restaurant)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getGenreColor(restaurant.genre)}>
                    {restaurant.genre}
                  </Badge>
                  <Badge className={getPriceColor(restaurant.priceRangeDinner)}>
                    {restaurant.priceRangeDinner}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <CardDescription className="text-sm">
                  {restaurant.description}
                </CardDescription>
                
                <div className="space-y-2 mt-3">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-red-600 mb-2">
                    <span className="bg-red-100 px-2 py-1 rounded text-xs font-medium">
                      {restaurant.memberType}
                    </span>
                  </div>                
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.openingHours}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>最大{restaurant.capacity}名</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (restaurant.phoneNumber) {
                          window.open(`tel:${restaurant.phoneNumber}`, '_self');
                        } else {
                          alert('電話番号が登録されていません。直接お店にお問い合わせください。');
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      電話予約
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* モーダル */}
        {selectedRestaurant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
               onClick={() => setSelectedRestaurant(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedRestaurant.description}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRestaurant(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={selectedRestaurant.imageUrl} 
                      alt={selectedRestaurant.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getGenreColor(selectedRestaurant.genre)}>
                        {selectedRestaurant.genre}
                      </Badge>
                      <Badge className={getPriceColor(selectedRestaurant.priceRangeDinner)}>
                        {selectedRestaurant.priceRangeDinner}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedRestaurant.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{selectedRestaurant.openingHours}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>最大{selectedRestaurant.capacity}名</span>
                      </div>
                      
                      {selectedRestaurant.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedRestaurant.phoneNumber}</span>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium">価格帯</p>
                        <p className="text-sm text-gray-600">ディナー: {selectedRestaurant.priceRangeDinner}</p>
                        {selectedRestaurant.priceRangeLunch && (
                          <p className="text-sm text-gray-600">ランチ: {selectedRestaurant.priceRangeLunch}</p>
                        )}
                      </div>
                      
                      {selectedRestaurant.closingDay && (
                        <div>
                          <p className="font-medium">定休日</p>
                          <p className="text-gray-600">{selectedRestaurant.closingDay}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (selectedRestaurant.phoneNumber) {
                        window.open(`tel:${selectedRestaurant.phoneNumber}`, '_self');
                      } else {
                        alert('電話番号が登録されていません。直接お店にお問い合わせください。');
                      }
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    電話で予約・問い合わせ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">守成クラブ都城会場</h3>
            <p className="text-gray-300 mb-4">信頼でつなぐ商売繁盛の絆</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>例会: 毎月第4木曜日 18:00～21:00</p>
              <p>会場: グランドパティオ都城・ロイヤルホテル</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
