// 守成クラブ都城会場の会員の飲食・ナイトのお店（守成MAPS に載っていない店も含めた土台）。
// 載せるのは出どころを確かめられる項目だけ：店名・業態・住所・座標・店主。
// 写真・営業時間・定休日・電話・紹介文は守成MAPS（店主が入力。shuseiMaps.js）から重ねる。
// 料金・席数・評価・最寄り駅・手書きの紹介文は出どころが分からないため 2026-10-21 に削除した。
//
// 座標は住所を国土地理院の住所検索で引いた値（番・号の代表点）。手で座標を書かないこと。
// 店を足したら npm run check:locations で住所とピンのずれを確かめる。
// 店主がセワニンジャ・ポータルにいない店は表示しない（taxonomy.js の buildStores で外す）。
// aliases：守成MAPS で表記が違う店名（カタカナ・英字など）
// provisional：守成MAPS に未登録の店。登録されるまでの間だけ、以前の写真・営業時間・定休日・電話・紹介文を仮に載せる
//   （笹原の判断 2026-10-21。出どころ不明の手入力の値。料金・席数は戻さない）。
//   守成MAPS に登録されて取り込めば、そちらの値で自動的に上書きされる。上書きされたらこの店の仮の値は消してよい。
export const restaurants = [
  {id: 1, name: "炭焼き大衆酒場 いち", genre: "居酒屋", address: "宮崎県都城市牟田町20-5 スターラインビル2階", latitude: 31.727043, longitude: 131.063629, owner: "嶋田 真紀", imageUrl: "https://lh3.googleusercontent.com/p/AF1QipMM4urajO5RNjiyb6dm22bCR0LrTzw53Lv11RpM=w408-h306-k-no", openingHours: "18:00～24:00", closingDay: "月曜日", phoneNumber: "0986-77-6407", description: "2024年8月8日リニューアルオープン。山崎メガハイボール1,350円が人気！炭焼きメニューが自慢の大衆酒場。", provisional: true},
  {id: 2, name: "コットンクラブ", aliases: ["CottonClub"], genre: "スナック", address: "宮崎県都城市中町2-3", latitude: 31.725895, longitude: 131.063309, owner: "中村 昌代"},
  {id: 3, name: "ナイトスポット・ちゃくら", genre: "ナイトスポット", address: "宮崎県都城市中町4-15 サンヤマコビル", latitude: 31.727152, longitude: 131.063766, owner: "福田 千鶴"},
  {id: 4, name: "Snack Muse", genre: "スナック", address: "宮崎県都城市牟田町9-5 ナカムラセブンビル1F", latitude: 31.725945, longitude: 131.062912, owner: "森高 海奈", imageUrl: "https://scontent-itm1-1.cdninstagram.com/v/t51.2885-19/500075534_18267125251277012_1421963397858355438_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDczLmMyIn0&_nc_ht=scontent-itm1-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QHqEuQzXOXbXDgyNslT8u-ST_tJLkhvSUH75msh5To2tOC0zwMRJ9eBY1IS2adIJd4&_nc_ohc=kACtaTuFKBgQ7kNvwGQ5be7&_nc_gid=BqqvZ5qNRBklLeRyDXFvfw&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_AffgT5quJJ123KmY_ryE2ronaMpycw5TAVl5WRM1VbeC2Q&oe=68FEAB3A&_nc_sid=7d3ac5", openingHours: "20:00～深夜", phoneNumber: "0986-24-3318", description: "森高海奈ママが営むアットホームなスナック。守成クラブ会員同士の交流の場として人気。", provisional: true},
  {id: 8, name: "月の華", genre: "スナック", address: "宮崎県都城市牟田町19-11 ギンザハウスビル2F", latitude: 31.727058, longitude: 131.062469, owner: "降旗 あけみ"},
  {id: 9, name: "スナックMOMO", genre: "スナック", address: "宮崎県都城市牟田町20-4 プルーンビルB6", latitude: 31.727137, longitude: 131.063538, owner: "柏木 桃子"},
  {id: 10, name: "スナックレスト・IKEMENスナック", genre: "スナック", address: "宮崎県都城市牟田町19-5 セゾンビル3F", latitude: 31.727282, longitude: 131.062805, owner: "長瀬 美樹", imageUrl: "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=CKVAjJkDJROYvCCwQi9vNw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=179.60715&pitch=0&thumbfov=100", openingHours: "20:00～深夜", description: "長瀬美樹ママが営む複合スナック。多彩なサービスで様々なニーズに対応。", provisional: true},
  {id: 11, name: "スナックPretty Channel", genre: "スナック", address: "宮崎県都城市牟田町11-7 第2木野田ビル101号", latitude: 31.726202, longitude: 131.062988, owner: "枇杷木 由香理", imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4npCBuxRjnf2kse9fpdDWFGUnwugDWd-Gpklo1oSQqSYSWHYBnAHF87vL3m7qhRIqZCQRc8qQoZb9Z7zF4MoiZJRQuBUPQu5n6YqIgjDji6jTdIHKJ52_bDAIva54qsjRboLku0l=w397-h298-k-no", openingHours: "20:00～深夜", phoneNumber: "0986-21-6136", description: "枇杷木由香理ママが営むスナック。Pretty Channelの名の通り美しい空間。", provisional: true},
  {id: 12, name: "bar Kai nalu", genre: "バー", address: "宮崎県都城市牟田町１１−５ ABC88ビル 3階", latitude: 31.7264, longitude: 131.063202, owner: "原田 英治", imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nriIY-4_GBj_zGKjOwXmuXlsfBACZVA6h470udRaUXk8S84MLkIlQm1oK6N2TcVqzctQhKA-jq1rZXf5u0kcvbq30tm6RVEo9RYR_hFsnYhNMvfUHFbhxvtn5gQ7o_4jlMJd6-m=w408-h544-k-no", openingHours: "20:00～深夜", description: "原田英治マスターが営むバー。落ち着いた雰囲気で大人の時間を楽しめる。", provisional: true},
  {id: 13, name: "BAR OK ROCK", genre: "バー", address: "宮崎県都城市牟田町11-12 コラージュビル2F-1", latitude: 31.726706, longitude: 131.062759, owner: "神坂 春貴"},
  {id: 14, name: "炭火焼肉牛輝", genre: "焼肉", address: "宮崎県北諸県郡三股町稗田11-1", latitude: 31.732471, longitude: 131.111435, owner: "西村 一輝"},
  {id: 15, name: "焼肉　shin shin", genre: "焼肉", address: "宮崎県都城市牟田町10-11 アレザビル1F-G", latitude: 31.726028, longitude: 131.062164, owner: "深江 真"},
  {id: 16, name: "ワッキーズ'ダイナー", genre: "ダイナー", address: "宮崎県都城市上町4-9", latitude: 31.723745, longitude: 131.061615, owner: "脇田 友一"},
  {id: 17, name: "牡蠣Diningちぇけ", genre: "ダイニング", address: "宮崎県都城市年見町32-1", latitude: 31.732668, longitude: 131.089142, owner: "梅原 里美", imageUrl: "https://lh3.googleusercontent.com/p/AF1QipNtN5ijrvIsDKWYEmporJuWrfrwjwNCVGzKHNuI=w298-h298-k-no", openingHours: "18:00～23:00", closingDay: "不定休", phoneNumber: "090-2960-7022", description: "新鮮な牡蠣料理が自慢のダイニング。季節の牡蠣を使った創作料理が楽しめる。", provisional: true},
  {id: 18, name: "屋台骨 都城分店", genre: "ラーメン", address: "宮崎県都城市志比田町5325-10", latitude: 31.7383217, longitude: 131.0579965, owner: "道久 高太郎"},
  {id: 19, name: "La Ville", genre: "スナック", address: "宮崎県都城市牟田町9-5 ナカムラセブンビル２Ｆ", latitude: 31.725945, longitude: 131.062912, owner: "前畑 祐之介"},
  {id: 20, name: "辛麺屋 物語", genre: "ラーメン", address: "宮崎県都城市中町５−１５ 第二中元ビル １F", latitude: 31.726494, longitude: 131.063782, owner: "神坂 春貴"},
  {id: 21, name: "BAR D-BULL", genre: "バー", address: "宮崎県都城市牟田町７-７ セントレアビル２F", latitude: 31.725866, longitude: 131.062073, owner: "深江 真"},
]

// 都市中心の座標
export const cityCenter = {latitude: 31.722, longitude: 131.057}

export const venues = []
