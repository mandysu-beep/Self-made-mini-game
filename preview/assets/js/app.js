/* 目目眼動遊戲收藏：目錄、遊戲介紹、播放頁共用程式。
   資料全部來自 games.json；所有路徑都是相對路徑，可直接放到 GitHub Pages 子目錄。
   換頁轉場：支援跨頁 View Transitions 的瀏覽器用原生轉場（封面圖從卡片放大到介紹頁）；
   不支援的瀏覽器用淡出／淡入；prefers-reduced-motion 時一律不做動畫。 */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=d=>d?d.replace(/-/g,"/"):"";
/* 版本說明裡的 GitHub 帳號名稱不顯示，只留倉庫名稱 */
const clean=s=>String(s??"").replace(/(GitHub\s+)[\w.-]+\/([\w.-]+)/g,"$1$2");
const qs=new URLSearchParams(location.search);
const html=document.documentElement;
const reduceMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const ICON={
  eye:`<svg class="eye" viewBox="0 0 48 48" aria-hidden="true"><g class="eyes"><g class="eye-glance"><ellipse class="eye-oval" cx="17.5" cy="23" rx="4.6" ry="10.2" transform="rotate(-16 17.5 23)"/><ellipse class="eye-oval" cx="30.5" cy="23" rx="4.6" ry="10.2" transform="rotate(-16 30.5 23)"/></g></g></svg>`,
  play:`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5v13l10.5-6.5z"/></svg>`,
  ext:`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`
};

/* ---------- 凝視停留選取（站內導覽用，可開關） ---------- */
const DW_KEY="muve-preview-dwell", DW_MS_KEY="muve-preview-dwell-ms";
const dwell={on:localStorage.getItem(DW_KEY)==="1",ms:+(localStorage.getItem(DW_MS_KEY)||1200)};
html.style.setProperty("--dwell-ms",dwell.ms+"ms");
function attachDwell(root=document){
  $$(".btn:not([data-dwell-ready]),.card:not([data-dwell-ready])",root).forEach(el=>{
    el.dataset.dwellReady="1";
    const bar=document.createElement("span");bar.className="dwell-bar";bar.setAttribute("aria-hidden","true");el.appendChild(bar);
    let t=null;
    const stop=()=>{clearTimeout(t);t=null;el.classList.remove("dwelling")};
    el.addEventListener("pointerenter",()=>{
      if(!dwell.on||el.dataset.nodwell!==undefined)return;
      stop();void el.offsetWidth;el.classList.add("dwelling");
      t=setTimeout(()=>{stop();el.click()},dwell.ms);
    });
    el.addEventListener("pointerleave",stop);
    el.addEventListener("click",stop);
  });
}
function dwellToggle(container){
  if(!container)return;
  container.innerHTML=`<button class="btn btn-switch" id="dwellToggle" type="button" data-nodwell aria-pressed="${dwell.on}">
    <span class="knob" aria-hidden="true">${ICON.eye}</span><span>凝視選取：<b id="dwellState">${dwell.on?"開":"關"}</b></span></button>`;
  $("#dwellToggle").addEventListener("click",e=>{
    dwell.on=!dwell.on;localStorage.setItem(DW_KEY,dwell.on?"1":"0");
    $("#dwellState").textContent=dwell.on?"開":"關";
    e.currentTarget.setAttribute("aria-pressed",dwell.on);
  });
}

/* ---------- 資料：第一次用 fetch，之後從 sessionStorage 同步讀出，
   讓換頁後的第一個畫面就有內容（跨頁 View Transitions 需要） ---------- */
const CACHE_KEY="muve-games-preview-json";
function cached(){try{const t=sessionStorage.getItem(CACHE_KEY);return t?{text:t,data:JSON.parse(t)}:null}catch(e){return null}}
async function fetchData(){
  const r=await fetch("games.json",{cache:"no-cache"});
  if(!r.ok)throw new Error("games.json "+r.status);
  const text=await r.text();const data=JSON.parse(text);
  try{sessionStorage.setItem(CACHE_KEY,text)}catch(e){}
  return {text,data};
}
const nameOf=(list,id)=>(list.find(x=>x.id===id)||{}).name||id;
const versionOf=(g,vid)=>g.versions.find(v=>v.id===vid);
const playHref=(g,vid)=>`play.html?game=${encodeURIComponent(g.id)}&v=${encodeURIComponent(vid||g.defaultVersion)}`;
const gameHref=g=>`game.html?game=${encodeURIComponent(g.id)}`;
const CAT_COLORS=["var(--aqua)","var(--amber)","var(--coral)","var(--cyan)","var(--teal-300)","var(--yellow)","var(--peach)"];
const catColor=(data,id)=>{const i=data.categories.findIndex(c=>c.id===id);return i<0?"var(--gray)":CAT_COLORS[i%CAT_COLORS.length]};
const gameIdFromUrl=u=>{try{return new URL(u,location.href).searchParams.get("game")}catch(e){return null}};

/* ---------- 目錄頁 ---------- */
let catalogState=null;
function renderCatalog(data,isUpdate){
  const state=catalogState||(catalogState={cat:qs.get("cat")||"all",input:qs.get("input")||"all",diff:qs.get("diff")||"all"});
  const cats=[{id:"all",name:"全部遊戲",desc:"所有練習都在這裡，還不確定就先從這裡挑"}].concat(data.categories);
  const count=id=>id==="all"?data.games.length:data.games.filter(g=>g.category===id).length;
  $("#cats").innerHTML=cats.map((c,i)=>`<button class="btn tile" type="button" data-cat="${esc(c.id)}" style="--dot:${c.id==="all"?"var(--forest)":catColor(data,c.id)};--i:${i}">
      <span class="tname"><span class="dot" aria-hidden="true"></span>${esc(c.name)}</span>
      <span class="tdesc">${esc(c.desc)}</span>
      <span class="tcount num" aria-label="${count(c.id)} 款">${count(c.id)}</span></button>`).join("");
  const chips=(key,list)=>[{id:"all",name:"全部"}].concat(list).map(t=>`<button class="btn chip" type="button" data-${key}="${esc(t.id)}">${esc(t.name)}</button>`).join("");
  $("#inputs").innerHTML=chips("input",data.tags.input);
  $("#diffs").innerHTML=chips("diff",data.tags.difficulty);
  if(state.input!=="all"||state.diff!=="all")$("#more").open=true;

  function sync(animate){
    $$("[data-cat]").forEach(b=>{const on=b.dataset.cat===state.cat;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",on)});
    $$("[data-input]").forEach(b=>{const on=b.dataset.input===state.input;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",on)});
    $$("[data-diff]").forEach(b=>{const on=b.dataset.diff===state.diff;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",on)});
    const p=new URLSearchParams();for(const k in state)if(state[k]!=="all")p.set(k,state[k]);
    history.replaceState(null,"",location.pathname+(p.toString()?"?"+p:""));
    const list=data.games.filter(g=>(state.cat==="all"||g.category===state.cat)
      &&(state.input==="all"||g.tags.input.includes(state.input))
      &&(state.diff==="all"||g.tags.difficulty.includes(state.diff)));
    $("#resultLine").innerHTML=`找到 <b class="num">${list.length}</b> 款`+(state.cat!=="all"?`，分類「${esc(nameOf(data.categories,state.cat))}」`:"")
      +(state.input!=="all"?`，操作「${esc(nameOf(data.tags.input,state.input))}」`:"")+(state.diff!=="all"?`，難度「${esc(nameOf(data.tags.difficulty,state.diff))}」`:"");
    const grid=$("#grid");
    grid.classList.toggle("is-refilter",!!animate);
    grid.innerHTML=list.length?list.map((g,i)=>card(g,data,i)).join("")
      :`<div class="empty"><img src="assets/brand/guoguo-shy.png" alt=""><p>這個組合目前沒有遊戲。換一個學習目標，或把「更多篩選」改回「全部」。</p></div>`;
    attachDwell(grid);
  }
  if(!isUpdate){
    document.addEventListener("click",e=>{
      const b=e.target.closest("[data-cat],[data-input],[data-diff]");if(!b)return;
      if(b.dataset.cat)state.cat=b.dataset.cat;
      if(b.dataset.input)state.input=b.dataset.input;
      if(b.dataset.diff)state.diff=b.dataset.diff;
      sync(true);
    });
  }
  sync(false);attachDwell();
}
function card(g,data,i){
  const ext=g.status==="external";
  const dv=ext?null:versionOf(g,g.defaultVersion);
  const older=ext?0:g.versions.length-1;
  const tags=g.tags.input.map(t=>`<span class="tag input">${esc(nameOf(data.tags.input,t))}</span>`).join("")
    +g.tags.difficulty.map(t=>`<span class="tag">${esc(nameOf(data.tags.difficulty,t))}</span>`).join("")
    +(g.offline?`<span class="tag">可離線</span>`:"");
  const cover=g.cover?`<img src="${esc(g.cover)}" alt="" loading="lazy" decoding="async">`
    :`<div class="ph"><span class="ph-disc" aria-hidden="true"></span><span class="ph-text">${esc(g.title)}<small>內容在 Canva，未收錄進本站</small></span></div>`;
  const flag=g.status==="partial"?`<span class="flag">缺部分圖片與音效</span>`:ext?`<span class="flag">外部網站</span>`:"";
  const vline=ext?`尚未收錄，需取得原始檔`
    :`最新 <span class="num">${esc(dv.id)}</span>，<span class="num">${fmtDate(dv.date)}</span>${older>0?`，另有 <span class="num">${older}</span> 個舊版`:""}`;
  const tid=`t-${esc(g.id)}`, sid=`s-${esc(g.id)}`;
  return `<a class="card" href="${gameHref(g)}" data-game="${esc(g.id)}" style="--i:${Math.min(i,12)};--dot:${catColor(data,g.category)}" aria-labelledby="${tid}" aria-describedby="${sid}">
    <div class="cover">${cover}${flag}</div>
    <div class="body">
      <p class="cat"><span class="dot" aria-hidden="true"></span>${esc(nameOf(data.categories,g.category))}</p>
      <h3 id="${tid}">${esc(g.title)}${g.subtitle?`<small>${esc(g.subtitle)}</small>`:""}</h3>
      <p class="summary" id="${sid}">${esc(g.summary)}</p>
      <p class="tags">${tags}</p>
      <p class="vline">${vline}</p>
    </div>
    <span class="peek" aria-hidden="true">${ICON.eye}</span>
  </a>`;
}
/* 只把「被點的那張卡」的封面命名，讓它和介紹頁的大圖接起來 */
function setupCatalogTransitions(){
  const mark=(id,e)=>{
    const el=id&&$(`.card[data-game="${CSS.escape(id)}"] .cover`);if(!el)return;
    el.style.viewTransitionName="game-cover";
    e.viewTransition.finished.finally(()=>{el.style.viewTransitionName=""});
  };
  addEventListener("pageswap",e=>{
    if(!e.viewTransition||!e.activation||!e.activation.entry)return;
    mark(gameIdFromUrl(e.activation.entry.url),e);
  });
  addEventListener("pagereveal",e=>{
    if(!e.viewTransition||!window.navigation||!navigation.activation||!navigation.activation.from)return;
    const from=navigation.activation.from.url||"";
    if(/game\.html/.test(from))mark(gameIdFromUrl(from),e);
  });
}

/* ---------- 遊戲介紹／版本紀錄頁 ---------- */
function renderGame(data){
  const g=data.games.find(x=>x.id===qs.get("game"));
  if(!g){$("#main").innerHTML=`<div class="empty"><img src="assets/brand/guoguo-shy.png" alt=""><p>找不到這款遊戲，請回到目錄重新選一次。</p></div>`;attachDwell();return}
  document.title=g.title+"｜目目眼動遊戲收藏";
  const ext=g.status==="external";
  const dv=ext?null:versionOf(g,g.defaultVersion);
  const vs=[...g.versions].reverse();
  const back=$(".btn-back");if(back)back.href="index.html"+(g.category?`?cat=${encodeURIComponent(g.category)}`:"");
  const cover=g.cover?`<img src="${esc(g.cover)}" alt="${esc(g.title)} 遊戲畫面">`
    :`<div class="ph"><span class="ph-disc" aria-hidden="true"></span><span class="ph-text">${esc(g.title)}</span></div>`;
  const main=ext
    ?`<a class="btn btn-main btn-big" href="${esc(g.external_url)}" target="_blank" rel="noopener">${ICON.ext}開啟外部網站</a>`
    :`<a class="btn btn-main btn-big" href="${playHref(g)}">${ICON.play}開始玩</a>`;
  $("#main").innerHTML=`<section class="intro" style="--dot:${catColor(data,g.category)}">
      <div class="intro-cover">${cover}</div>
      <div class="intro-text">
        <p class="cat"><span class="dot" aria-hidden="true"></span>${esc(nameOf(data.categories,g.category))}</p>
        <h1>${esc(g.title)}</h1>${g.subtitle?`<p class="gsub">${esc(g.subtitle)}</p>`:""}
        <p class="gsum">${esc(g.summary)}</p>
        <div class="play-row">
          ${main}
          <img class="cheer" src="assets/brand/guoguo-cheer.png" alt="">
        </div>
        ${ext?"":`<p class="play-meta">開啟 <span class="num">${esc(dv.id)}</span>（${fmtDate(dv.date)}）。也可以<a href="${esc(dv.path)}" target="_blank" rel="noopener">在新分頁開啟</a>。</p>`}
      </div>
    </section>
    ${g.status==="partial"?`<p class="note">素材不完整：原倉庫缺少 ${g.known_missing.map(esc).join("、")}，畫面會少角色圖、沒有音效。</p>`:""}
    ${ext?`<p class="note">這款放在 Canva 網站，原始檔抓不到，目前只能開外部連結。取得匯出的 HTML 後再收錄。</p>`:""}
    <section class="facts-wrap" aria-labelledby="factsTitle">
      <h2 id="factsTitle">適合誰、怎麼玩</h2>
      <dl class="facts">
        <div><dt>學習目標</dt><dd>${g.goals.map(esc).join("、")}</dd></div>
        <div><dt>操作方式</dt><dd>${g.tags.input.map(t=>esc(nameOf(data.tags.input,t))).join("、")||"未知"}${g.input_note?`（${esc(g.input_note)}）`:""}</dd></div>
        <div><dt>難度</dt><dd>${g.tags.difficulty.map(t=>esc(nameOf(data.tags.difficulty,t))).join("、")||"未知"}</dd></div>
        <div><dt>分級與設定</dt><dd>${esc(g.levels)}</dd></div>
        <div><dt>離線使用</dt><dd>${esc(g.offline_note)}</dd></div>
        <div><dt>出處</dt><dd><a href="${esc(g.source.url)}" target="_blank" rel="noopener">${esc(clean(g.source.label))}</a></dd></div>
      </dl>
    </section>
    ${ext?"":`<section class="versions" aria-labelledby="verTitle"><h2 id="verTitle">版本紀錄</h2>
      <ol class="vlist">${vs.map(v=>{const isDef=v.id===g.defaultVersion;return `<li class="vcard${isDef?" is-default":""}">
        <div class="vhead"><span class="vid num">${esc(v.id)}</span><span class="vlabel">${esc(v.label)}</span><span class="vdate num">${fmtDate(v.date)}</span>${isDef?`<span class="vbadge">預設版本</span>`:""}</div>
        <p>${esc(clean(v.notes))}</p>${v.changes.length?`<ul>${v.changes.map(c=>`<li>${esc(clean(c))}</li>`).join("")}</ul>`:""}
        <p class="vsrc"><a href="${esc(v.source)}" target="_blank" rel="noopener">原始網址</a></p>
        ${isDef?"":`<a class="btn btn-soft" href="${playHref(g,v.id)}">${ICON.play}玩 ${esc(v.id)}</a>`}
      </li>`}).join("")}</ol></section>`}`;
  attachDwell();
}

/* ---------- 播放頁 ---------- */
function renderPlayer(data){
  const g=data.games.find(x=>x.id===qs.get("game"));
  if(!g||g.status==="external"||!g.versions.length){$("#stage").innerHTML=`<p class="pmsg">找不到這款遊戲，請回到目錄重新選一次。</p>`;$("#back").href="index.html";attachDwell();return}
  const v=versionOf(g,qs.get("v"))||versionOf(g,g.defaultVersion);
  document.title=`${g.title} ${v.id}｜目目眼動遊戲收藏`;
  $("#ptitle").innerHTML=`${esc(g.title)}<span class="num">${esc(v.id)}</span>`;
  $("#vers").innerHTML=g.versions.length>1?g.versions.map(x=>`<a class="btn ver${x.id===v.id?" is-active":""}" href="${playHref(g,x.id)}" ${x.id===v.id?'aria-current="page"':""}>${esc(x.id)}</a>`).join(""):"";
  $("#back").href=gameHref(g);
  const f=document.createElement("iframe");
  f.src=v.path;f.title=g.title+" "+v.id;
  f.allow="fullscreen; camera; microphone; autoplay";f.allowFullscreen=true;
  $("#stage").appendChild(f);
  $("#fs").addEventListener("click",()=>{const s=$("#stage");(s.requestFullscreen||s.webkitRequestFullscreen).call(s);setTimeout(()=>f.focus(),300)});
  f.addEventListener("load",()=>f.focus());
  attachDwell();
}

/* ---------- 不支援跨頁 View Transitions 時：淡出後再換頁 ---------- */
function setupFadeFallback(){
  if(!html.classList.contains("no-vt"))return;
  document.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||reduceMotion())return;
    const a=e.target.closest("a[href]");if(!a||a.target||a.hasAttribute("download"))return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||(url.pathname===location.pathname&&url.search===location.search))return;
    e.preventDefault();
    html.classList.add("is-leaving");
    setTimeout(()=>{location.href=url.href},220);
  });
  addEventListener("pageshow",e=>{if(e.persisted)html.classList.remove("is-leaving")});
}

const RENDER={catalog:renderCatalog,game:renderGame,player:renderPlayer};
window.MuveApp={init(page){
  dwellToggle($("#dwellSlot"));
  setupFadeFallback();
  if(page==="catalog")setupCatalogTransitions();
  const c=cached();
  if(c){
    RENDER[page](c.data,false);                         // 同步畫出來，第一個畫面就有內容
    if(page==="catalog")fetchData().then(f=>{if(f.text!==c.text)renderCatalog(f.data,true)}).catch(()=>{});
    else fetchData().catch(()=>{});
    return;
  }
  fetchData().then(f=>RENDER[page](f.data,false))
   .catch(e=>{const m=$("#grid")||$("#main")||$("#stage");if(m)m.innerHTML=`<p class="pmsg">讀不到遊戲清單（${esc(e.message)}）。請用網頁伺服器開啟，不要直接雙擊 HTML 檔。</p>`});
}};
})();
