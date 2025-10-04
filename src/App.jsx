import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { MapPin, Clock, Users, Phone, Star, Filter, Search } from 'lucide-react'
import { restaurants, venues } from './data/restaurants.js'
import './App.css'

function App() {
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants)
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)

  // ジャンルの一覧を取得
  const genres = [...new Set(restaurants.map(r => r.genre))]
  
  // 価格帯の一覧を取得
  const priceRanges = [
    '～￥999',
    '￥1,000～￥1,999',
    '￥2,000～￥2,999',
    '￥3,000～￥3,999',
    '￥4,000～￥4,999',
    '￥5,000～￥5,999',
    '￥15,000～￥19,999'
  ]

  // フィルタリング処理
  useEffect(() => {
    let filtered = restaurants

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(r => r.genre === selectedGenre)
    }

    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter(r => 
        r.priceRangeDinner === selectedPriceRange || 
        r.priceRangeLunch === selectedPriceRange
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRestaurants(filtered)
  }, [selectedGenre, selectedPriceRange, searchTerm])

  const getPriceColor = (price) => {
    if (price.includes('15,000')) return 'bg-purple-100 text-purple-800'
    if (price.includes('5,000')) return 'bg-red-100 text-red-800'
    if (price.includes('3,000') || price.includes('4,000')) return 'bg-orange-100 text-orange-800'
    if (price.includes('2,000')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getGenreColor = (genre) => {
    const colors = {
      '焼肉': 'bg-red-100 text-red-800',
      '居酒屋': 'bg-blue-100 text-blue-800',
      '寿司': 'bg-purple-100 text-purple-800',
      '鳥料理': 'bg-orange-100 text-orange-800',
      'おでん': 'bg-yellow-100 text-yellow-800',
      'うどん': 'bg-green-100 text-green-800'
    }
    return colors[genre] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* ヘッダー */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">守成クラブ都城会場</h1>
              <p className="text-red-100 mt-1">三部会飲食店マップ</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-100">22時以降営業</p>
              <p className="text-lg font-semibold">信頼でつなぐ商売繁盛の絆</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold">お店を探す</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="店名・説明で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="ジャンルを選択" />
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
                <SelectValue placeholder="価格帯を選択" />
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

        {/* 結果表示 */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredRestaurants.length}件のお店が見つかりました
          </p>
        </div>

        {/* 店舗一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <Card key={restaurant.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => setSelectedRestaurant(restaurant)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{restaurant.rating}</span>
                  </div>
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
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.station} {restaurant.walkTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.openingHours}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>最大{restaurant.capacity}名</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {restaurant.tabelogUrl && (
                    <Button variant="outline" size="sm" className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(restaurant.tabelogUrl, '_blank')
                            }}>
                      食べログ
                    </Button>
                  )}
                  {restaurant.hotpepperUrl && (
                    <Button variant="outline" size="sm" className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(restaurant.hotpepperUrl, '_blank')
                            }}>
                      予約する
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 店舗詳細モーダル */}
        {selectedRestaurant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
               onClick={() => setSelectedRestaurant(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                  <Button variant="ghost" onClick={() => setSelectedRestaurant(null)}>
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getGenreColor(selectedRestaurant.genre)}>
                      {selectedRestaurant.genre}
                    </Badge>
                    <Badge className={getPriceColor(selectedRestaurant.priceRangeDinner)}>
                      {selectedRestaurant.priceRangeDinner}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{selectedRestaurant.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">{selectedRestaurant.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">アクセス</p>
                          <p className="text-sm text-gray-600">{selectedRestaurant.station} {selectedRestaurant.walkTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">営業時間</p>
                          <p className="text-sm text-gray-600">{selectedRestaurant.openingHours}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">収容人数</p>
                          <p className="text-sm text-gray-600">最大{selectedRestaurant.capacity}名</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
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
                          <p className="text-sm text-gray-600">{selectedRestaurant.closingDay}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    {selectedRestaurant.tabelogUrl && (
                      <Button className="flex-1" 
                              onClick={() => window.open(selectedRestaurant.tabelogUrl, '_blank')}>
                        食べログで詳細を見る
                      </Button>
                    )}
                    {selectedRestaurant.hotpepperUrl && (
                      <Button className="flex-1 bg-orange-600 hover:bg-orange-700" 
                              onClick={() => window.open(selectedRestaurant.hotpepperUrl, '_blank')}>
                        予約する
                      </Button>
                    )}
                  </div>
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
