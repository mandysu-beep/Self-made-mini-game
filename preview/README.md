# 目目眼動遊戲收藏

目目非營利的眼動遊戲總庫。目錄依學習目標分類，可再用操作方式（凝視停留／點擊／磁吸）和難度篩選；每款遊戲保留所有版本，可以直接在站內玩。

## 資料夾

```
index.html          目錄（分類、篩選、卡片）
game.html           單款遊戲說明與版本紀錄（game.html?game=<id>）
play.html           站內播放頁（play.html?game=<id>&v=<版本>）
games.json          遊戲清單，目錄頁全部從這裡讀
games/<id>/<版本>/index.html   每一版的遊戲檔
assets/             目目主視覺（tokens.css、字型、Logo、角色）、卡片封面圖、程式
```

所有路徑都是相對路徑，放在 GitHub Pages 的子目錄（例如 `https://<帳號>.github.io/Self-made-mini-game/`）也能用。

## 本機預覽

`games.json` 要透過網頁伺服器讀取，直接雙擊 `index.html` 會讀不到清單。

```
cd site
python3 -m http.server 8000
```

再用瀏覽器開 http://localhost:8000/ 。

## 新增一個版本（例如洗車遊戲 v3）

1. 建立資料夾 `games/carwash/v3/`，把新檔案存成 `index.html`。圖片或音效放在同一個資料夾。
2. **不要修改或刪除 `v1`、`v2` 的資料夾**。舊版要一直能玩。
3. 打開 `games.json`，在洗車遊戲的 `versions` 最後面加一筆：

```json
{
  "id": "v3",
  "label": "依回饋修改",
  "date": "2027-01-10",
  "path": "games/carwash/v3/index.html",
  "notes": "這一版改了什麼（一兩句話）",
  "source": "原始檔來源或網址",
  "changes": ["改動一", "改動二"]
}
```

4. 把 `defaultVersion` 改成 `"v3"`，遊戲介紹頁的「開始玩」就會開新版。

> 網站會把 `games.json` 暫存在瀏覽器分頁裡（sessionStorage），讓換頁轉場的第一個畫面就有內容。目錄頁每次都會在背景重新讀取；改完 `games.json` 後若介紹頁還是舊資料，回目錄頁一次或開新分頁即可。

## 外觀與動畫

- 樣式全在 `assets/css/site.css`，色彩只用 `assets/css/tokens.css` 的品牌色。
- 卡片與篩選磚是不等圓角的「卵石形」，按鈕都是膠囊形；立體感用下方實色唇邊，不用陰影與漸層。
- 換頁：支援跨頁 View Transitions 的瀏覽器，點卡片時封面會放大成介紹頁的大圖；不支援時用淡出淡入（`app.js` 的 `setupFadeFallback`）。
- 系統開啟「減少動態」時，所有動畫與轉場都會關掉。
- Logo 與角色圖是 `brand/` 的原始 PNG，請勿裁切、改色或另存壓縮版。

## 新增一款遊戲

1. 取一個英文小寫 id（例如 `fishing`），建立 `games/fishing/v1/index.html`。
2. 在 `games.json` 的 `games` 加一筆。欄位說明：

| 欄位 | 說明 |
|---|---|
| `id` | 英文小寫、用 `-` 連接，之後不要改 |
| `title`／`subtitle` | 中文名稱與副標（副標可省略） |
| `category` | 主分類，填 `categories` 裡的 id：`cause-effect` 因果入門、`fixation` 凝視選取、`tracking` 視覺追蹤、`matching` 配對分類、`daily` 生活步驟、`create` 創作表達、`adventure` 綜合闖關 |
| `goals` | 學習目標文字，可多個 |
| `tags.input` | `dwell` 凝視停留、`click` 點擊、`magnet` 磁吸，可多選 |
| `tags.difficulty` | `beginner` 入門、`intermediate` 中等、`advanced` 進階，可多選 |
| `summary` | 一句話說明玩法 |
| `levels` | 原作自己的分級與可調設定 |
| `offline`／`offline_note` | 能不能離線、需要哪些外部資源 |
| `source` | 出處名稱與網址 |
| `versions`／`defaultVersion` | 見上一節 |
| `cover` | 封面圖路徑，例如 `assets/covers/fishing.jpg`（建議 16:9 遊戲截圖） |
| `status` | `ok`；素材不完整填 `partial`；只能外連填 `external`，並加 `external_url` |
| `known_missing` | 已知缺少的檔名（選填） |

3. 本機預覽確認可以玩，再上傳。

## 收錄規則

- 版本只新增、不覆蓋。老師改了遊戲，就存成下一版。
- 第一次收錄時遊戲程式不改。若為了能在本站運作而必須改動（例如主機自動插入的程式碼），寫在該版的 `notes`。
- 目錄頁使用目目主視覺；遊戲畫面維持老師做的樣子。若要做品牌版，另存新版本。

## 這次收錄時的改動

- `playground/v1`：移除 Netlify 主機自動插入的兩行 `/.netlify/scripts/...`（離開 Netlify 會 404）。
- `apple-tree/v1`、`watermelon/v1`：移除檔尾一行 Cloudflare 流量統計程式（離開原網站會回報錯誤）。
- 其餘遊戲檔與原始來源完全相同。
