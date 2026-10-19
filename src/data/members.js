// 守成クラブ都城会場 在籍会員（飲食店以外も含む全業種）
// restaurants.js の店舗オーナーは自動で会員として載るので、ここには飲食店以外の会員を足していく
//
// 項目
//   name        氏名（姓と名の間は半角スペース）
//   company     会社名・屋号
//   industry    業種（一言）
//   description 事業内容・PR
//   services    「こんな相談OK」に出すキーワード（任意）
//   venue       所属会場（'都城' の会員だけ掲載）
//   address / latitude / longitude  任意。入れると地図にピンが立つ
//   phoneNumber / url / photo       任意。入れると詳細に連絡ボタン・写真が出る
// 飲食店オーナーは restaurants.js の owner と氏名で自動的に紐づき、店舗の位置で地図に表示される。

export const members = [
  // 例：
  // {
  //   id: 'yamada-taro',
  //   name: '山田 太郎',
  //   company: '株式会社〇〇',
  //   industry: 'リフォーム',
  //   description: '水廻りを中心に住まいのリフォーム全般。',
  //   services: ['水廻りリフォーム', '外壁塗装'],
  //   venue: '都城',
  // },
]
