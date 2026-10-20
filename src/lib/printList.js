// 印刷リスト：会員・お店を選んで A4 タテで印刷する（2026-10-21）。
// 中身は「s:店のID」「m:会員のID」の並び。ブラウザに保存し、印刷画面の URL（?print=...）にも載せて共有できる。
const KEY = 'shusei-map:print-list'

export const listKey = (type, id) => `${type === 'store' ? 's' : 'm'}:${id}`

export const parseKey = (key) => {
  const i = key.indexOf(':')
  return { type: key.slice(0, i) === 's' ? 'store' : 'member', id: key.slice(i + 1) }
}

export const loadList = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((k) => typeof k === 'string') : []
  } catch {
    return []
  }
}

export const saveList = (keys) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys))
  } catch {
    // 保存できない環境（プライベートブラウズなど）では、その画面のあいだだけ持つ
  }
}

export const DEFAULT_TITLE = '守成クラブ都城MAP リスト'

/** 印刷画面の URL の中身。title は空なら付けない */
export const printParams = (keys, title) => {
  const p = new URLSearchParams()
  p.set('print', keys.join(','))
  if (title && title !== DEFAULT_TITLE) p.set('title', title)
  return p
}
