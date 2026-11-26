/* 目目眼動遊戲收藏：目錄、遊戲資訊、播放頁共用程式。
   資料全部來自 games.json；所有路徑都是相對路徑，可直接放到 GitHub Pages 子目錄。 */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=d=>d?d.replace(/-/g,"/"):"";
const qs=new URLSearchParams(location.search);

/* ---------- 凝視停留選取（站內導覽用，可開關） ---------- */
const DW_KEY="muve-dwell", DW_MS_KEY="muve-dwell-ms";
const dwell={on:localStorage.getItem(DW_KEY)==="1",ms:+(localStorage.getItem(DW_MS_KEY)||1200)};
document.documentElement.style.setProperty("--dwell-ms",dwell.ms+"ms");
function attachDwell(root=document){
  root.querySelectorAll(".btn:not([data-dwell-ready])").forEach(el=>{
    el.dataset.dwellReady="1";
    const bar=document.createElement("span");bar.className="dwell-bar";el.appendChild(bar);
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
  container.innerHTML=`<button class="btn btn-yellow" id="dwellToggle" data-nodwell aria-pressed="${dwell.on}">凝視選取：${dwell.on?"開":"關"}</button>`;
  $("#dwellToggle").addEventListener("click",e=>{
    dwell.on=!dwell.on;localStorage.setItem(DW_KEY,dwell.on?"1":"0");
    e.currentTarget.textContent="凝視選取："+(dwell.on?"開":"關");
    e.currentTarget.setAttribute("aria-pressed",dwell.on);
  });
}

async function loadData(){
  const r=await fetch("games.json",{cache:"no-cache"});
  if(!r.ok)throw new Error("games.json "+r.status);
  return r.json();
}
const nameOf=(list,id)=>(list.find(x=>x.id===id)||{}).name||id;
const versionOf=(g,vid)=>g.versions.find(v=>v.id===vid);
const playHref=(g,vid)=>`play.html?game=${encodeURIComponent(g.id)}&v=${encodeURIComponent(vid||g.defaultVersion)}`;

/* ---------- 目錄頁 ---------- */
function renderCatalog(data){
  const state={cat:qs.get("cat")||"all",input:qs.get("input")||"all",diff:qs.get("diff")||"all"};
  const cats=[{id:"all",name:"全部遊戲",desc:"所有學習目標"}].concat(data.categories);
  const count=id=>id==="all"?data.games.length:data.games.filter(g=>g.category===id).length;
  $("#cats").innerHTML=cats.map(c=>`<button class="btn cat-btn" data-cat="${c.id}">
      <span class="cname">${esc(c.name)}</span><span class="cdesc">${esc(c.desc)}</span><span class="ccount">${count(c.id)}</span></button>`).join("");
  const chips=(key,list)=>[{id:"all",name:"全部"}].concat(list).map(t=>`<button class="btn chip-btn" data-${key}="${t.id}">${esc(t.name)}</button>`).join("");
  $("#inputs").innerHTML=chips("input",data.tags.input);
  $("#diffs").innerHTML=chips("diff",data.tags.difficulty);

  function sync(){
    document.querySelectorAll("[data-cat]").forEach(b=>b.classList.toggle("is-active",b.dataset.cat===state.cat));
    document.querySelectorAll("[data-input]").forEach(b=>b.classList.toggle("is-active",b.dataset.input===state.input));
    document.querySelectorAll("[data-diff]").forEach(b=>b.classList.toggle("is-active",b.dataset.diff===state.diff));
    const p=new URLSearchParams();for(const k in state)if(state[k]!=="all")p.set(k,state[k]);
    history.replaceState(null,"",location.pathname+(p.toString()?"?"+p:""));
    const list=data.games.filter(g=>(state.cat==="all"||g.category===state.cat)
      &&(state.input==="all"||g.tags.input.includes(state.input))
      &&(state.diff==="all"||g.tags.difficulty.includes(state.diff)));
    $("#resultLine").innerHTML=`找到 <b>${list.length}</b> 款`+(state.cat!=="all"?`，分類「${esc(nameOf(data.categories,state.cat))}」`:"")
      +(state.input!=="all"?`，操作「${esc(nameOf(data.tags.input,state.input))}」`:"")+(state.diff!=="all"?`，難度「${esc(nameOf(data.tags.difficulty,state.diff))}」`:"");
    $("#grid").innerHTML=list.length?list.map(g=>card(g,data)).join(""):`<p class="empty">沒有符合的遊戲，請換一個條件。</p>`;
    attachDwell($("#grid"));
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-cat],[data-input],[data-diff]");if(!b)return;
    if(b.dataset.cat)state.cat=b.dataset.cat;
    if(b.dataset.input)state.input=b.dataset.input;
    if(b.dataset.diff)state.diff=b.dataset.diff;
    sync();
  });
  sync();attachDwell();
}
function card(g,data){
  const ext=g.status==="external";
  const dv=ext?null:versionOf(g,g.defaultVersion);
  const older=ext?0:g.versions.length-1;
  const tags=g.tags.input.map(t=>`<span class="tag input">${esc(nameOf(data.tags.input,t))}</span>`).join("")
    +g.tags.difficulty.map(t=>`<span class="tag">${esc(nameOf(data.tags.difficulty,t))}</span>`).join("")
    +(g.offline?`<span class="tag">可離線</span>`:"")
    +(g.status==="partial"?`<span class="tag warn">素材不完整</span>`:"")
    +(ext?`<span class="tag warn">外部網站</span>`:"");
  const cover=g.cover?`<img src="${esc(g.cover)}" alt="${esc(g.title)} 遊戲畫面">`
    :`<div class="ph"><span class="circle"></span><span style="position:relative">${esc(g.title)}<br><span style="font-size:22px;font-weight:400">內容在 Canva，未收錄進本站</span></span></div>`;
  const flag=g.status==="partial"?`<span class="flag">缺部分圖片與音效</span>`:ext?`<span class="flag">外部連結</span>`:"";
  const vline=ext?`<div class="vline">尚未收錄，需取得原始檔</div>`
    :`<div class="vline">最新 <span class="num">${esc(dv.id)}</span>・<span class="num">${fmtDate(dv.date)}</span>${older>0?`・另有 <span class="num">${older}</span> 個舊版`:""}</div>`;
  const actions=ext
    ?`<a class="btn btn-primary" href="${esc(g.external_url)}" target="_blank" rel="noopener">開啟外部網站</a><a class="btn btn-secondary" href="game.html?game=${esc(g.id)}">說明</a>`
    :`<a class="btn btn-primary" href="${playHref(g)}">開始玩</a><a class="btn btn-secondary" href="game.html?game=${esc(g.id)}">版本紀錄</a>`;
  return `<article class="card" data-game="${esc(g.id)}"><div class="cover">${cover}${flag}</div><div class="body">
    <div class="cat">${esc(nameOf(data.categories,g.category))}</div>
    <h3>${esc(g.title)}${g.subtitle?`<small>${esc(g.subtitle)}</small>`:""}</h3>
    <p class="summary">${esc(g.summary)}</p><div class="tags">${tags}</div>${vline}
    <div class="actions">${actions}</div></div></article>`;
}

/* ---------- 遊戲資訊／版本紀錄頁 ---------- */
function renderGame(data){
  const g=data.games.find(x=>x.id===qs.get("game"));
  if(!g){$("#main").innerHTML=`<p class="pmsg">找不到這款遊戲。</p>`;return}
  document.title=g.title+"｜目目眼動遊戲收藏";
  const ext=g.status==="external";
  const vs=[...g.versions].reverse();
  $("#main").innerHTML=`<section>
    <p class="eyebrow">${esc(nameOf(data.categories,g.category))}</p>
    <h1>${esc(g.title)}</h1>${g.subtitle?`<p class="sub" style="font-size:26px;margin:4px 0 0;color:var(--teal)">${esc(g.subtitle)}</p>`:""}
    <p style="font-size:24px">${esc(g.summary)}</p>
    ${g.cover?`<div class="cover"><img src="${esc(g.cover)}" alt="${esc(g.title)} 遊戲畫面"></div>`:""}
    ${g.status==="partial"?`<div class="note-box">素材不完整：原倉庫缺少 ${g.known_missing.map(esc).join("、")}，畫面會少角色圖、沒有音效。</div>`:""}
    ${ext?`<div class="note-box">這款放在 Canva 網站，原始檔抓不到，目前只能開外部連結。取得匯出的 HTML 後再收錄。</div>`:""}
    <dl class="facts">
      <dt>學習目標</dt><dd>${g.goals.map(esc).join("、")}</dd>
      <dt>操作方式</dt><dd>${g.tags.input.map(t=>esc(nameOf(data.tags.input,t))).join("、")||"未知"}${g.input_note?`（${esc(g.input_note)}）`:""}</dd>
      <dt>難度</dt><dd>${g.tags.difficulty.map(t=>esc(nameOf(data.tags.difficulty,t))).join("、")||"未知"}</dd>
      <dt>分級／設定</dt><dd>${esc(g.levels)}</dd>
      <dt>離線</dt><dd>${esc(g.offline_note)}</dd>
      <dt>出處</dt><dd><a href="${esc(g.source.url)}" target="_blank" rel="noopener">${esc(g.source.label)}</a></dd>
    </dl></section>
    <section class="versions"><h2>版本紀錄</h2>
    ${ext?`<a class="btn btn-primary" href="${esc(g.external_url)}" target="_blank" rel="noopener">開啟外部網站</a>`:
      vs.map(v=>`<div class="vcard ${v.id===g.defaultVersion?"is-default":""}">
        <div class="vhead"><span class="vid">${esc(v.id)}</span><span class="vlabel">${esc(v.label)}</span><span class="vdate">${fmtDate(v.date)}</span>${v.id===g.defaultVersion?`<span class="vlabel">・預設版本</span>`:""}</div>
        <p>${esc(v.notes)}</p>${v.changes.length?`<ul>${v.changes.map(c=>`<li>${esc(c)}</li>`).join("")}</ul>`:""}
        <p style="font-size:18px">原始網址：<a class="src" href="${esc(v.source)}" target="_blank" rel="noopener">${esc(v.source)}</a></p>
        <a class="btn btn-primary" href="${playHref(g,v.id)}">玩 ${esc(v.id)}</a></div>`).join("")}
    </section>`;
  attachDwell();
}

/* ---------- 播放頁 ---------- */
function renderPlayer(data){
  const g=data.games.find(x=>x.id===qs.get("game"));
  if(!g||g.status==="external"||!g.versions.length){$("#stage").innerHTML=`<p class="pmsg">找不到這款遊戲，請回到目錄。</p>`;attachDwell();return}
  const v=versionOf(g,qs.get("v"))||versionOf(g,g.defaultVersion);
  document.title=`${g.title} ${v.id}｜目目眼動遊戲收藏`;
  $("#ptitle").innerHTML=`${esc(g.title)}<span class="num">${esc(v.id)}・${fmtDate(v.date)}</span>`;
  $("#vers").innerHTML=g.versions.length>1?g.versions.map(x=>`<a class="btn ${x.id===v.id?"is-active":""}" href="${playHref(g,x.id)}" ${x.id===v.id?'aria-current="true"':""}>${esc(x.id)}</a>`).join(""):"";
  $("#info").href=`game.html?game=${encodeURIComponent(g.id)}`;
  $("#newtab").href=v.path;
  const f=document.createElement("iframe");
  f.src=v.path;f.title=g.title+" "+v.id;
  f.allow="fullscreen; camera; microphone; autoplay";f.allowFullscreen=true;
  $("#stage").appendChild(f);
  $("#fs").addEventListener("click",()=>{const s=$("#stage");(s.requestFullscreen||s.webkitRequestFullscreen).call(s);setTimeout(()=>f.focus(),300)});
  f.addEventListener("load",()=>f.focus());
  attachDwell();
}

window.MuveApp={init(page){
  dwellToggle($("#dwellSlot"));
  loadData().then(d=>({catalog:renderCatalog,game:renderGame,player:renderPlayer})[page](d))
   .catch(e=>{const m=$("#grid")||$("#main")||$("#stage");if(m)m.innerHTML=`<p class="pmsg">讀不到遊戲清單（${esc(e.message)}）。請用網頁伺服器開啟，不要直接雙擊 HTML 檔。</p>`});
}};
})();
