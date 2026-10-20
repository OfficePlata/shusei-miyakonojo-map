// 守成クラブ都城会場の会員の飲食・ナイトのお店（守成MAPS に載っていない店も含めた土台）。
// 載せるのは出どころを確かめられる項目だけ：店名・業態・住所・座標・店主。
// 写真・営業時間・定休日・電話・紹介文は守成MAPS（店主が入力。shuseiMaps.js）から重ねる。
// 料金・席数・評価・最寄り駅・手書きの紹介文は出どころが分からないため 2026-10-21 に削除した。
//
// 座標は住所を国土地理院の住所検索で引いた値（番・号の代表点）。手で座標を書かないこと。
// 店を足したら npm run check:locations で住所とピンのずれを確かめる。
// 店主がセワニンジャ・ポータルにいない店は表示しない（taxonomy.js の buildStores で外す）。
// aliases：守成MAPS で表記が違う店名（カタカナ・英字など）
export const restaurants = [
  {id: 1, name: "炭焼き大衆酒場 いち", genre: "居酒屋", address: "宮崎県都城市牟田町20-5 スターラインビル2階", latitude: 31.727043, longitude: 131.063629, owner: "嶋田 真紀"},
  {id: 2, name: "コットンクラブ", aliases: ["CottonClub"], genre: "スナック", address: "宮崎県都城市中町2-3", latitude: 31.725895, longitude: 131.063309, owner: "中村 昌代"},
  {id: 3, name: "ナイトスポット・ちゃくら", genre: "ナイトスポット", address: "宮崎県都城市中町4-15 サンヤマコビル", latitude: 31.727152, longitude: 131.063766, owner: "福田 千鶴"},
  {id: 4, name: "Snack Muse", genre: "スナック", address: "宮崎県都城市牟田町9-5 ナカムラセブンビル1F", latitude: 31.725945, longitude: 131.062912, owner: "森高 海奈"},
  {id: 8, name: "月の華", genre: "スナック", address: "宮崎県都城市牟田町19-11 ギンザハウスビル2F", latitude: 31.727058, longitude: 131.062469, owner: "降旗 あけみ"},
  {id: 9, name: "スナックMOMO", genre: "スナック", address: "宮崎県都城市牟田町20-4 プルーンビルB6", latitude: 31.727137, longitude: 131.063538, owner: "柏木 桃子"},
  {id: 10, name: "スナックレスト・IKEMENスナック", genre: "スナック", address: "宮崎県都城市牟田町19-5 セゾンビル3F", latitude: 31.727282, longitude: 131.062805, owner: "長瀬 美樹"},
  {id: 11, name: "スナックPretty Channel", genre: "スナック", address: "宮崎県都城市牟田町11-7 第2木野田ビル101号", latitude: 31.726202, longitude: 131.062988, owner: "枇杷木 由香理"},
  {id: 12, name: "bar Kai nalu", genre: "バー", address: "宮崎県都城市牟田町１１−５ ABC88ビル 3階", latitude: 31.7264, longitude: 131.063202, owner: "原田 英治"},
  {id: 13, name: "BAR OK ROCK", genre: "バー", address: "宮崎県都城市牟田町11-12 コラージュビル2F-1", latitude: 31.726706, longitude: 131.062759, owner: "神坂 春貴"},
  {id: 14, name: "炭火焼肉牛輝", genre: "焼肉", address: "宮崎県北諸県郡三股町稗田11-1", latitude: 31.732471, longitude: 131.111435, owner: "西村 一輝"},
  {id: 15, name: "焼肉　shin shin", genre: "焼肉", address: "宮崎県都城市牟田町10-11 アレザビル1F-G", latitude: 31.726028, longitude: 131.062164, owner: "深江 真"},
  {id: 16, name: "ワッキーズ'ダイナー", genre: "ダイナー", address: "宮崎県都城市上町4-9", latitude: 31.723745, longitude: 131.061615, owner: "脇田 友一"},
  {id: 17, name: "牡蠣Diningちぇけ", genre: "ダイニング", address: "宮崎県都城市年見町32-1", latitude: 31.732668, longitude: 131.089142, owner: "梅原 里美"},
  {id: 18, name: "屋台骨 都城分店", genre: "ラーメン", address: "宮崎県都城市志比田町5325-10", latitude: 31.7383217, longitude: 131.0579965, owner: "道久 高太郎"},
  {id: 19, name: "La Ville", genre: "スナック", address: "宮崎県都城市牟田町9-5 ナカムラセブンビル２Ｆ", latitude: 31.725945, longitude: 131.062912, owner: "前畑 祐之介"},
  {id: 20, name: "辛麺屋 物語", genre: "ラーメン", address: "宮崎県都城市中町５−１５ 第二中元ビル １F", latitude: 31.726494, longitude: 131.063782, owner: "神坂 春貴"},
  {id: 21, name: "BAR D-BULL", genre: "バー", address: "宮崎県都城市牟田町７-７ セントレアビル２F", latitude: 31.725866, longitude: 131.062073, owner: "深江 真"},
]

// 都市中心の座標
export const cityCenter = {latitude: 31.722, longitude: 131.057}

export const venues = []
