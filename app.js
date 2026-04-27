// Firebase 연동 (firebase.js 먼저 로드)
import "./firebase.js";

// ═══════════════════════════════════════════════════
//  DATA MODEL
// ═══════════════════════════════════════════════════
let D = {"title":"GI팀 주간업무보고","week":"2026년 4월 3주차","chip":"WEEKLY REPORT","navTree":[{"type":"folder","id":"f_default","name":"4월 업무","open":true,"children":[{"type":"sec","id":"summary"},{"type":"sec","id":"target"},{"type":"sec","id":"pl"},{"type":"sec","id":"rec"}]}],"sections":{"summary":{"id":"summary","tag":"00 — SUMMARY","title":"금주 업무 현황 요약","hidden":false,"infoCard":null,"blocks":[{"type":"table","cols":["업무 항목","담당자","일정","주요 내용","상태"],"aligns":["left","left","left","left","center"],"rows":[["독립매장 목표 수립","VC실","26년 연간","온라인 마케팅+오프라인 영업 병행 / 누적가입 7,000점포, 12월 거래 1,900점포, 점당 구매 100만원 목표 수립","__S__complete"],["3월 손익 보고","김하나","4/21 완료 예정","3월 손익 데이터 취합 및 분석 보고서 작성","__S__inprogress"],["추천시스템 로직 개선","정지현","금주 완료 예정","전처리 개선·추천 후보군 구성·점수 산정 로직 고도화 테스트","__S__inprogress"]]}]},"target":{"id":"target","tag":"01 — SALES TARGET","title":"독립매장 매출 목표 수립","hidden":false,"infoCard":{"rows":[{"key":"담당","val":"VC실"},{"key":"상태","val":"__S__complete"}]},"blocks":[{"type":"kpi","items":[{"value":"7,000","label":"누적 가입 목표 점포"},{"value":"1,900","label":"12월 거래 목표 점포"},{"value":"100만원","label":"점당 구매금액 목표"},{"value":"11억","label":"12월 매출 목표"}]},{"type":"heading","text":"전략 방향 및 주요 과제"},{"type":"table","cols":["구분","내용"],"aligns":["left","left"],"rows":[["전략 방향","온라인 마케팅 + 오프라인 영업을 통한 독립매장 활성화 추진"],["주요 과제","① 신규 가입 후 거래 전환율 제고\n② 점당 구매금액 단계적 증가 계획 ('27년 이후 본격화)\n③ 불안정 고객 증가 구간 관리 → 기존7:불안정3 비율 유지"],["비고","불안정 고객 증가로 점당 구매금액 감소 구간 발생. 2027년 이후 본격 활동 예정"]]}]},"pl":{"id":"pl","tag":"02 — P&L Report","title":"3월 손익 보고","hidden":false,"infoCard":{"rows":[{"key":"담당","val":"김하나"},{"key":"일정","val":"2026. 04. 21"},{"key":"상태","val":"__S__inprogress"}]},"blocks":[{"type":"heading","text":"보고 내용"},{"type":"list","items":["3월 손익 데이터 취합 및 분석 작업 진행 중","최종 보고서 작성 및 검토"]}]},"rec":{"id":"rec","tag":"03 — Recommendation","title":"추천시스템 로직 개선 방향","hidden":false,"infoCard":{"rows":[{"key":"담당","val":"정지현"},{"key":"일정","val":"2026년 4월 (금주 테스트)"},{"key":"상태","val":"__S__inprogress"}]},"blocks":[{"type":"heading","text":"전처리 개선"},{"type":"list","items":["매출처명 텍스트 정제 → 브랜드 식별 컬럼 생성, 동일 브랜드 매장을 프랜차이즈 단위로 묶어 추천 가능하도록 구성","수동 매핑 테이블 + 접두어 중복 점검 구조 병행 운영 → 브랜드 식별 정확도 지속 관리"]},{"type":"heading","text":"추천 점수 산정 개선"},{"type":"textbox","text":"[기존] 카테고리 비율 + 상품 비율 결합 방식\n[개선] 3가지 구매 신호 기반 가중치 자동 조정 구조로 고도화"},{"type":"list","items":["① 개인 구매 신호: 매장별 구매 빈도 + 최근 구매 이력 반영","② 프랜차이즈 구매 신호: 동일 브랜드 소속 매장의 구매 이력 반영","③ 이탈 매장 구매 신호: 동일 브랜드 내 운영 종료 매장의 과거 구매 이력 반영"]},{"type":"heading","text":"Fallback 적용 구조"},{"type":"list","items":["1순위: 개인 구매 이력 기반 — 이력 충분 시 우선 반영","2순위: 프랜차이즈 구매 이력 기반 — 개인 이력 부족 시 보완","3순위: FC 인기 상품 기반 추천"]}]}},"theme":{"name":"슬레이트","bg":"#f0f2f5","sb":"#1e2332","bdr":"#d4d8e4","ac":"#3b82f6","ac2":"#1d4ed8","sb-ac":"#60a5fa","txt":"#1e2332","muted":"#6070a0"}};
let editMode=false,snapshot=null,activeId="summary";
let pendingSec=null,selBTval=null,pendingStatusEl=null,pendingInfoSec=null;
const SL={complete:"완료",inprogress:"진행중",planned:"예정",hold:"보류"};
const isS=v=>typeof v==="string"&&v.startsWith("__S__");
const getS=v=>v.replace("__S__","");

// ═══════════════════════════════════════════════════
//  LOCAL STORAGE (백업용)
// ═══════════════════════════════════════════════════
const LS_KEY = "gi_weekly_report_data_v1";
function saveToLocal(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(D)); }catch(e){} }
function loadFromLocal(){ try{ const s=localStorage.getItem(LS_KEY); if(s){ const p=JSON.parse(s); if(p&&typeof p==="object") D=p; } }catch(e){} }

// ═══════════════════════════════════════════════════
//  Firebase 연동 콜백
// ═══════════════════════════════════════════════════
window.onRemoteDataChange = function(remote){
  if(editMode) return;
  D = remote;
  render();
  gotoSec(activeId);
};

// ═══════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════
function render(){
  document.getElementById("sb-title").textContent=D.title;
  document.getElementById("sb-week").textContent=D.week;
  document.getElementById("sb-chip").textContent=D.chip||"Weekly Report";
  renderNav();
  const main=document.getElementById("main");
  main.innerHTML=Object.values(D.sections).map(s=>renderSec(s)).join("");
  gotoSec(activeId,false);
}

function allSecIds(){
  const ids=[];
  function walk(items){items.forEach(item=>{if(item.type==="sec")ids.push(item.id);else if(item.type==="folder")walk(item.children||[])})}
  walk(D.navTree); return ids;
}

function renderNav(){
  const nav=document.getElementById("nav-list");
  nav.innerHTML='<div class="nav-lbl">목차</div>';
  let idx=0;
  function renderItem(item,container,startIdx){
    if(startIdx!==undefined) idx=startIdx;
    if(item.type==="sec"){
      const sec=D.sections[item.id]; if(!sec) return;
      const d=document.createElement("div");
      d.className="nav-item"+(sec.id===activeId?" active":"")+(sec.hidden?" hidden-sec":"");
      d.dataset.secId=sec.id; d.draggable=true;
      d.innerHTML=`<span class="drag-handle">⠿</span><span class="nav-num">${String(idx).padStart(2,"0")}</span><span class="nav-item-label">${sec.title}</span>
        <span class="nav-actions">
          <button class="nav-act" title="${sec.hidden?"표시":"숨김"}" onclick="toggleHide(event,'${sec.id}')">${sec.hidden?"👁":"🚫"}</button>
          <button class="nav-act" title="삭제" onclick="delSec(event,'${sec.id}')">✕</button>
        </span>`;
      d.addEventListener("click",e=>{if(e.target.closest(".nav-actions")||e.target.closest(".drag-handle"))return;if(!sec.hidden)gotoSec(sec.id)});
      addNavDrag(d,item.id);
      container.appendChild(d); idx++;
    } else if(item.type==="folder"){
      const fEl=document.createElement("div");
      fEl.className="nav-folder";
      const hd=document.createElement("div");
      hd.className="nav-folder-hd";
      hd.innerHTML=`<span class="folder-drag-handle" style="cursor:grab;opacity:0;transition:opacity .15s;color:#667;font-size:13px;margin-right:2px">⠿</span>
        <button class="nav-folder-toggle" onclick="toggleFolder('${item.id}')">${item.open!==false?'−':'+'}</button>
        <span class="nav-folder-name" ondblclick="startFolderRename(event,'${item.id}',this)">📁 ${item.name||"폴더"}</span>
        <button class="nav-folder-add" onclick="addSecToFolder(event,'${item.id}')" title="섹션 추가">＋</button>
        <button class="nav-act" onclick="delFolder(event,'${item.id}')" style="opacity:0;margin-left:2px" title="폴더 삭제">✕</button>`;
      hd.addEventListener("mouseenter",()=>{
        hd.querySelector(".nav-act").style.opacity="1";
        const fh=hd.querySelector(".folder-drag-handle");
        if(fh) fh.style.opacity="1";
      });
      hd.addEventListener("mouseleave",()=>{
        hd.querySelector(".nav-act").style.opacity="0";
        const fh=hd.querySelector(".folder-drag-handle");
        if(fh) fh.style.opacity="0";
      });
      fEl.appendChild(hd);
      const body=document.createElement("div");
      body.className="nav-folder-body"+(item.open===false?" collapsed":"");
      body.style.maxHeight=item.open===false?"0":"2000px";
      let folderIdx=0;
      (item.children||[]).forEach(child=>{
        renderItem(child,body,folderIdx);
        if(child.type==="sec") folderIdx++;
      });
      fEl.appendChild(body);
      addFolderDrag(body,item.id,hd);
      addFolderMoveDrag(fEl, hd, item.id);
      container.appendChild(fEl);
    }
  }
  D.navTree.forEach(item=>renderItem(item,nav));
}

function renderSec(s){
  const icHtml=s.infoCard
    ?`<div class="info-card" id="ic-${s.id}">${renderInfoCard(s)}</div>`
    :`<button class="add-info-card-btn" onclick="addInfoCard('${s.id}')">＋ 정보 카드</button>`;
  let blocksHtml="";
  blocksHtml += `<div class="block-gap"><div class="block-gap-line"></div><button class="block-gap-btn" onclick="openBap(event,'${s.id}',0)" title="블록 추가">+</button></div>`;
  s.blocks.forEach((b,i)=>{
    blocksHtml += renderBW(s.id,b,i);
    blocksHtml += `<div class="block-gap"><div class="block-gap-line"></div><button class="block-gap-btn" onclick="openBap(event,'${s.id}',${i+1})" title="블록 추가">+</button></div>`;
  });
  return `<div class="page-section${s.hidden?" sec-hidden":""}" id="ps-${s.id}">
    <div class="sec-hdr">
      <div class="sec-hdr-left">
        <div class="sec-tag" ce data-f="tag" data-s="${s.id}">${s.tag}</div>
        <div class="sec-title-el" ce data-f="title" data-s="${s.id}">${s.title}</div>
      </div>
      ${icHtml}
    </div>
    <div class="blocks-container" id="bc-${s.id}">${blocksHtml}</div>
    <div class="block-end-add"><button class="block-end-add-btn" onclick="openBap(event,'${s.id}',${s.blocks.length})">＋ 블록 추가</button></div>
  </div>`;
}

function renderInfoCard(s){
  const rows=(s.infoCard.rows||[]).map((r,ri)=>{
    const vHtml=isS(r.val)?renderBadge(getS(r.val),s.id,"ic",ri):`<span ce data-s="${s.id}" data-f="ic-val" data-ri="${ri}">${r.val}</span>`;
    return `<tr><td ce data-s="${s.id}" data-f="ic-key" data-ri="${ri}">${r.key}</td><td>${vHtml}<button class="ic-row-del" onclick="delICRow('${s.id}',${ri})">✕</button></td></tr>`;
  }).join("");
  return `<button class="info-card-del" onclick="delInfoCard('${s.id}')">✕</button><table>${rows}</table><button class="ic-add-row" onclick="addICRow('${s.id}')">＋ 행 추가</button>`;
}

function renderBadge(status, secId, ctx, idx){
  return `<span class="badge-wrap" data-status-wrap="1">
      <span class="badge badge-${status}" data-status="${status}" data-s="${secId}" data-ctx="${ctx}" data-idx="${idx}" onclick="openStatusPicker(event,this)">${SL[status] || status}</span>
      <button class="badge-x" onclick="removeCellBadge(event,this)" title="상태배지 삭제">×</button>
    </span>`;
}

function renderBW(secId,b,idx){
  return `<div class="block-wrap" id="bw-${secId}-${idx}">
    ${renderBlock(secId,b,idx)}
    <div class="block-ctrl">
      <button class="bc-btn" onclick="mvB('${secId}',${idx},-1)">↑</button>
      <button class="bc-btn" onclick="mvB('${secId}',${idx},1)">↓</button>
      <button class="bc-btn del" onclick="delB('${secId}',${idx})">🗑</button>
    </div>
  </div>`;
}

function renderBlock(secId,b,idx){
  const ds=`data-s="${secId}" data-bi="${idx}"`;
  switch(b.type){
    case "text":    return `<div class="block-text" ce ${ds} data-f="text">${b.text||""}</div>`;
    case "heading": return `<div class="block-heading" ce ${ds} data-f="text">${b.text||""}</div>`;
    case "textbox": return `<div class="block-textbox" ce ${ds} data-f="text">${b.text||""}</div>`;
    case "list":    return renderListB(secId,b,idx);
    case "table":   return renderTableB(secId,b,idx);
    case "kpi":     return renderKpiB(secId,b,idx);
    case "meta":    return renderMetaB(secId,b,idx);
    case "status":  return renderBadge(b.val||"inprogress",secId,"block",idx);
    case "image":   return renderImgB(secId,b,idx);
    default: return "";
  }
}

function renderListB(secId,b,idx){
  const items=(b.items||[]).map((it,ii)=>`
    <li><span ce data-s="${secId}" data-bi="${idx}" data-li="${ii}" data-f="list-item">${it}</span><button class="li-del" onclick="delLI('${secId}',${idx},${ii})">✕</button></li>
  `).join("");
  return `<div class="block-list"><ul>${items}</ul><button class="list-add-item" onclick="addLI('${secId}',${idx})">＋ 항목 추가</button></div>`;
}

function renderTableB(secId,b,idx){
  const cols=b.cols||[];
  const cws=b.colWidths||cols.map(()=>null);
  const ths=cols.map((c,ci)=>{
    const w=cws[ci]?`width:${cws[ci]}px`:"";
    return `<th style="${w}"><div class="th-inner"><span ce data-s="${secId}" data-bi="${idx}" data-ci="${ci}" data-f="col">${c}</span><button class="th-del" onclick="delCol('${secId}',${idx},${ci})">✕</button></div><div class="col-resizer" onmousedown="startColResize(event,'${secId}',${idx},${ci})"></div></th>`;
  }).join("");
  const rows=(b.rows||[]).map((r,ri)=>{
    const tds=(r||[]).map((cv,ci)=>{
      const al=b.align?.[ri]?.[ci]||"left";
      if(isS(cv)) return `<td class="status-cell" data-align="${al}" data-s="${secId}" data-bi="${idx}" data-ri="${ri}" data-ci="${ci}" data-f="cell">${renderBadge(getS(cv),secId,`t${idx}r${ri}`,ci)}</td>`;
      return `<td data-align="${al}" ce data-s="${secId}" data-bi="${idx}" data-ri="${ri}" data-ci="${ci}" data-f="cell">${cv||""}</td>`;
    }).join("");
    return `<tr>${tds}<td><button class="tbl-row-del" onclick="delRow('${secId}',${idx},${ri})">✕</button></td></tr>`;
  }).join("");
  return `<div class="block-table-wrap">
    <table class="block-table" id="tbl-${secId}-${idx}" onmousedown="tblMouseDown(event,this)" onmouseover="tblMouseOver(event,this)" onmouseup="tblMouseUp()">
      <thead><tr>${ths}<th style="width:32px"><button class="th-add" onclick="addCol('${secId}',${idx})">＋</button></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <button class="tbl-add-row" onclick="addRow('${secId}',${idx})">＋ 행 추가</button>
  </div>`;
}

function renderKpiB(secId,b,idx){
  return `<div class="block-kpi">${(b.items||[]).map((k,ki)=>`
    <div class="kpi-card">
      <div class="kpi-val" ce data-s="${secId}" data-bi="${idx}" data-ki="${ki}" data-f="kpi-val">${k.value}</div>
      <div class="kpi-lbl" ce data-s="${secId}" data-bi="${idx}" data-ki="${ki}" data-f="kpi-lbl">${k.label}</div>
    </div>`).join("")}</div>`;
}

function renderMetaB(secId,b,idx){
  return `<div class="block-meta">${(b.items||[]).map((m,mi)=>`<div class="meta-item"><span class="meta-k" ce data-s="${secId}" data-bi="${idx}" data-mi="${mi}" data-f="meta-k">${m.key}</span><span class="meta-v" ce data-s="${secId}" data-bi="${idx}" data-mi="${mi}" data-f="meta-v">${m.val}</span></div>`).join("")}</div>`;
}

function renderImgB(secId,b,idx){
  if(b.src) return `<div class="block-image" id="bimg-${secId}-${idx}"><img src="${b.src}" alt="${b.caption||''}"><div class="img-cap" ce data-s="${secId}" data-bi="${idx}" data-f="img-cap">${b.caption||""}</div><div class="img-change-bar"><button class="img-change-btn" onclick="pickImg('${secId}',${idx})">🗂 파일 선택</button><button class="img-change-btn" onclick="focusPasteTarget('${secId}',${idx})">📋 붙여넣기</button></div></div>`;
  return `<div class="block-image" id="bimg-${secId}-${idx}"><div class="img-placeholder" tabindex="0" data-paste-sec="${secId}" data-paste-bi="${idx}" onclick="pickImg('${secId}',${idx})" onkeydown="if(event.key==='Enter')pickImg('${secId}',${idx})"><div class="img-ph-icons">🖼️</div><div class="img-ph-main">클릭하여 파일 선택</div><div class="img-ph-sub">또는 이 영역 클릭 후 <kbd>Ctrl+V</kbd> 로 붙여넣기</div></div></div>`;
}

// ═══════════════════════════════════════════════════
//  NAV & GOTO
// ═══════════════════════════════════════════════════
function gotoSec(id,_=true){
  if(D.sections[id]?.hidden) return;
  activeId=id;
  document.querySelectorAll(".page-section").forEach(s=>s.classList.remove("active"));
  const el=document.getElementById("ps-"+id); if(el) el.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.secId===id));
}

function toggleHide(e,id){
  e.stopPropagation();
  const s=D.sections[id]; if(!s) return;
  s.hidden=!s.hidden;
  if(s.hidden&&activeId===id){ const vis=allSecIds().find(sid=>sid!==id&&!D.sections[sid]?.hidden); if(vis) activeId=vis; }
  render();
}

function toggleFolder(id){
  function find(items){ for(const it of items){ if(it.type==="folder"&&it.id===id){it.open=it.open===false?true:false;return true} if(it.type==="folder"&&find(it.children||[]))return true; } return false; }
  find(D.navTree); renderNav();
}

function delFolder(e,id){
  e.stopPropagation();
  if(!confirm("폴더를 삭제할까요? (섹션은 유지됩니다)")) return;
  function rm(items){ for(let i=0;i<items.length;i++){ if(items[i].type==="folder"&&items[i].id===id){ const ch=items[i].children||[]; items.splice(i,1,...ch); return true; } if(items[i].type==="folder"&&rm(items[i].children||[]))return true; } return false; }
  rm(D.navTree); render();
}

function addSecToFolder(e,folderId){ e.stopPropagation(); document.getElementById("sec-folder-sel").value=folderId; openSecModal(); }

// ═══════════════════════════════════════════════════
//  TABLE MULTI-SELECT
// ═══════════════════════════════════════════════════
let tblSel={active:false,startR:-1,startC:-1,endR:-1,endC:-1,tbl:null};

function tblMouseDown(e,tbl){
  if(!editMode) return;
  const td=e.target.closest("td[data-ri][data-ci]"); if(!td) return;
  if(!e.shiftKey) return;
  e.preventDefault();
  const sel=window.getSelection(); if(sel) sel.removeAllRanges();
  _savedRange=null;
  clearTblSel();
  tblSel.active=true; tblSel.startR=+td.dataset.ri; tblSel.startC=+td.dataset.ci;
  tblSel.endR=+td.dataset.ri; tblSel.endC=+td.dataset.ci; tblSel.tbl=tbl;
  highlightTblSel();
}

function tblMouseOver(e,tbl){
  if(!tblSel.active||tblSel.tbl!==tbl) return;
  const td=e.target.closest("td[data-ri][data-ci]"); if(!td) return;
  tblSel.endR=+td.dataset.ri; tblSel.endC=+td.dataset.ci; highlightTblSel();
}

function tblMouseUp(){
  const wasSelecting=tblSel.active; tblSel.active=false;
  if(wasSelecting&&hasTableCellSelection()) showFmt();
}

function clearTblSel(){
  document.querySelectorAll(".block-table td.sel").forEach(td=>td.classList.remove("sel"));
  tblSel.tbl=null; tblSel.startR=-1; tblSel.startC=-1; tblSel.endR=-1; tblSel.endC=-1; tblSel.active=false;
}

function highlightTblSel(){
  document.querySelectorAll(".block-table td.sel").forEach(td=>td.classList.remove("sel"));
  if(!tblSel.tbl) return;
  const r1=Math.min(tblSel.startR,tblSel.endR),r2=Math.max(tblSel.startR,tblSel.endR);
  const c1=Math.min(tblSel.startC,tblSel.endC),c2=Math.max(tblSel.startC,tblSel.endC);
  tblSel.tbl.querySelectorAll("td[data-ri][data-ci]").forEach(td=>{
    if(+td.dataset.ri>=r1&&+td.dataset.ri<=r2&&+td.dataset.ci>=c1&&+td.dataset.ci<=c2) td.classList.add("sel");
  });
}

function getSelectedTableCells(){ if(!tblSel.tbl) return []; return [...tblSel.tbl.querySelectorAll("td.sel")]; }
function hasTableCellSelection(){ return getSelectedTableCells().length>0; }

document.addEventListener("mouseup",()=>{
  const wasSelecting=tblSel.active; tblSel.active=false;
  if(wasSelecting&&hasTableCellSelection()) showFmt();
});

// ═══════════════════════════════════════════════════
//  EDIT MODE
// ═══════════════════════════════════════════════════
function enterEdit(){
  snapshot=JSON.stringify(D); editMode=true;
  document.body.classList.add("edit-mode");
  document.getElementById("btn-edit").style.display="none";
  ["btn-save","btn-cancel","btn-add-sec","btn-add-folder","btn-copy-sec"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display="";
  });
  document.getElementById("mode-badge").textContent="EDIT";
  document.getElementById("mode-badge").className="tb-badge edit";
  document.querySelectorAll("[ce]").forEach(el=>el.setAttribute("contenteditable","true"));
  ["sb-title","sb-week","sb-chip"].forEach(id=>{ const el=document.getElementById(id); if(el) el.setAttribute("contenteditable","true"); });
  attachFmt();
}

function saveEdit(){
  flushAll();
  saveToLocal();
  if(window.fbSave){ window.fbMarkLocal&&window.fbMarkLocal(); window.fbSave(D); }
  editMode=false;
  document.body.classList.remove("edit-mode");
  exitEditUI(); render(); gotoSec(activeId);
}

function cancelEdit(){
  D=JSON.parse(snapshot); editMode=false;
  document.body.classList.remove("edit-mode");
  exitEditUI(); render(); gotoSec(activeId);
}

function exitEditUI(){
  document.getElementById("btn-edit").style.display="";
  ["btn-save","btn-cancel","btn-add-sec","btn-add-folder","btn-copy-sec"].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display="none"; });
  document.getElementById("mode-badge").textContent="VIEW";
  document.getElementById("mode-badge").className="tb-badge view";
  ["sb-title","sb-week","sb-chip"].forEach(id=>{ const el=document.getElementById(id); if(el) el.removeAttribute("contenteditable"); });
  hideFmt();
}

function startFolderRename(e,folderId,nameSpan){
  if(!editMode) return;
  e.stopPropagation();
  nameSpan.contentEditable="true";
  nameSpan.style.cssText="background:rgba(255,107,133,.15);border:1px dashed rgba(255,107,133,.5);border-radius:4px;padding:1px 4px;outline:none";
  nameSpan.focus();
  const range=document.createRange(); range.selectNodeContents(nameSpan); range.collapse(false);
  const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  function finishRename(){
    const rawText=nameSpan.innerText.replace(/^📁\s*/,"").trim()||"폴더";
    nameSpan.contentEditable="false"; nameSpan.style.cssText=""; nameSpan.textContent="📁 "+rawText;
    function findAndUpdate(items){ for(const it of items){ if(it.type==="folder"&&it.id===folderId){ it.name=rawText; return true; } if(it.type==="folder"&&findAndUpdate(it.children||[]))return true; } return false; }
    findAndUpdate(D.navTree);
  }
  nameSpan.addEventListener("blur",finishRename,{once:true});
  nameSpan.addEventListener("keydown",ev=>{ if(ev.key==="Enter"){ ev.preventDefault(); finishRename(); } ev.stopPropagation(); });
}

function copyCurrentSection(){
  const active=document.querySelector('.page-section.active');
  if(!active){ alert("먼저 복사할 섹션을 선택해줘"); return; }
  copySectionData(active.id.replace('ps-',''));
}

function copySectionData(secId){
  const found=findSectionContainer(secId,D);
  if(!found){ alert(`원본 섹션을 못 찾았어: ${secId}`); return; }
  const {mode,container,index,section}=found;
  const newId=`${secId}_copy_${Date.now()}`;
  const copied=JSON.parse(JSON.stringify(section));
  copied.id=newId;
  if(copied.title) copied.title=`${copied.title} (복사)`;
  if(mode==='array') container.splice(index+1,0,copied);
  else if(mode==='object') container[newId]=copied;
  if(Array.isArray(D.navTree)) insertCopiedNavItem(D.navTree,secId,newId,copied.title||'복사된 섹션');
  activeId=newId; saveToLocal?.(); render(); gotoSec(newId);
}

function findSectionContainer(secId,root){
  if(!root||typeof root!=='object') return null;
  if(Array.isArray(root)){
    const idx=root.findIndex(x=>x&&typeof x==='object'&&x.id===secId);
    if(idx>=0) return {mode:'array',container:root,index:idx,key:null,section:root[idx]};
  }
  for(const k of Object.keys(root)){
    const v=root[k];
    if(Array.isArray(v)){
      const idx=v.findIndex(x=>x&&typeof x==='object'&&x.id===secId);
      if(idx>=0) return {mode:'array',container:v,index:idx,key:k,section:v[idx]};
    }
    if(v&&typeof v==='object'&&!Array.isArray(v)&&v[secId]) return {mode:'object',container:v,index:null,key:k,section:v[secId]};
  }
  return null;
}

function insertCopiedNavItem(items,oldSecId,newSecId,newTitle){
  for(let i=0;i<items.length;i++){
    const it=items[i];
    if(it.type==='folder'&&Array.isArray(it.children)){
      const done=insertCopiedNavItem(it.children,oldSecId,newSecId,newTitle);
      if(done) return true; continue;
    }
    const itemSecId=it.secId||it.id;
    if(itemSecId===oldSecId){
      const copiedItem=JSON.parse(JSON.stringify(it));
      if('secId' in copiedItem) copiedItem.secId=newSecId;
      if('id' in copiedItem) copiedItem.id=newSecId;
      if('title' in copiedItem) copiedItem.title=newTitle;
      items.splice(i+1,0,copiedItem); return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════
//  FORMAT BAR
// ═══════════════════════════════════════════════════
function attachFmt(){
  document.querySelectorAll("[contenteditable=true]").forEach(el=>{
    el.addEventListener("mouseup",showFmt); el.addEventListener("keyup",showFmt);
  });
}

function showFmt(){
  const fb=document.getElementById("fmt-bar");
  const sel=window.getSelection();
  if(sel&&sel.rangeCount>0&&!sel.isCollapsed&&sel.toString().trim()!==""){
    saveSelection();
    const r=sel.getRangeAt(0).getBoundingClientRect();
    fb.style.top=Math.max(8,r.top+window.scrollY-46)+"px";
    fb.style.left=Math.min(window.innerWidth-430,Math.max(8,r.left+window.scrollX))+"px";
    fb.classList.add("visible"); return;
  }
  if(tblSel.tbl){
    const cells=[...tblSel.tbl.querySelectorAll("td.sel")];
    if(cells.length){
      const first=cells[0].getBoundingClientRect(),last=cells[cells.length-1].getBoundingClientRect();
      const left=Math.min(first.left,last.left),right=Math.max(first.right,last.right),top=Math.min(first.top,last.top);
      fb.style.top=Math.max(8,top+window.scrollY-46)+"px";
      fb.style.left=Math.min(window.innerWidth-430,Math.max(8,((left+right)/2)-180))+"px";
      fb.classList.add("visible"); return;
    }
  }
  hideFmt();
}

function hideFmt(){ document.getElementById("fmt-bar").classList.remove("visible"); }

function fc(cmd){
  if(cmd==='removeFormat'){
    const cells=getSelectedTableCells();
    if(cells&&cells.length){ cells.forEach(td=>clearCellFormatting(td)); return; }
  }
  document.execCommand(cmd,false,null);
}

document.addEventListener('mousedown',e=>{
  const bar=document.getElementById('fmt-bar');
  if(!bar) return;
  if(bar.contains(e.target)) e.preventDefault();
});

function stripInlineFormattingFromFragment(fragment,opts={}){
  const {removeColor=false,removeBackground=false}=opts;
  const elements=fragment.querySelectorAll('*');
  elements.forEach(el=>{
    if(removeColor) el.style.color='';
    if(removeBackground) el.style.backgroundColor='';
    const tag=el.tagName?el.tagName.toLowerCase():'';
    if(tag==='span'||tag==='font'){
      const style=(el.getAttribute('style')||'').trim();
      if(!style) unwrapNode(el);
    }
  });
}

function unwrapNode(el){
  if(!el||!el.parentNode) return;
  const parent=el.parentNode;
  while(el.firstChild) parent.insertBefore(el.firstChild,el);
  parent.removeChild(el);
}

function clearCellFormatting(td){
  if(!td) return;
  ['color','backgroundColor','fontWeight','fontStyle','textDecoration','fontSize','fontFamily','textAlign'].forEach(p=>td.style[p]='');
  td.querySelectorAll('*').forEach(el=>{
    ['color','backgroundColor','fontWeight','fontStyle','textDecoration','fontSize','fontFamily'].forEach(p=>el.style[p]='');
  });
  Array.from(td.querySelectorAll('span,font,b,strong,i,em,u')).forEach(el=>{
    const parent=el.parentNode; if(!parent) return;
    while(el.firstChild) parent.insertBefore(el.firstChild,el);
    parent.removeChild(el);
  });
}

function applyStyleToSelectedCells(styleObj={}){
  const cells=getSelectedTableCells(); if(!cells||!cells.length) return;
  cells.forEach(td=>{
    Object.assign(td.style,styleObj);
    td.querySelectorAll('*').forEach(el=>{
      if(styleObj.color!==undefined) el.style.color=styleObj.color;
      if(styleObj.backgroundColor!==undefined) el.style.backgroundColor=styleObj.backgroundColor;
      if(styleObj.fontSize!==undefined) el.style.fontSize=styleObj.fontSize;
    });
  });
}

function applyFontSize(px){
  restoreSelection();
  const sel=window.getSelection();
  const hasTextSel=!!(sel&&sel.rangeCount>0&&!sel.isCollapsed&&sel.toString().trim()!=="");
  if(hasTextSel){
    const r=sel.getRangeAt(0),span=document.createElement("span");
    span.style.fontSize=px+"px";
    const frag=r.extractContents(); span.appendChild(frag); r.insertNode(span);
    const newRange=document.createRange(); newRange.selectNodeContents(span);
    sel.removeAllRanges(); sel.addRange(newRange); saveSelection(); return;
  }
  if(hasTableCellSelection()) applyStyleToSelectedCells({fontSize:px+"px"});
}

let _currentFontSize=13;
function applyFontSizeStep(delta){
  _currentFontSize=Math.max(8,Math.min(72,_currentFontSize+delta));
  const display=document.getElementById("fb-size-display");
  if(display) display.textContent=_currentFontSize;
  applyFontSize(_currentFontSize);
}

function applyHexColor(type,hex){
  hex=(hex||"").replace("#","");
  if(!/^[0-9a-fA-F]{3,6}$/.test(hex)) return;
  const color="#"+hex;
  const isText=(type==="text"||type==="txt");
  const isBg=(type==="bg"||type==="background");
  if(hasTableCellSelection()){
    if(isText) applyStyleToSelectedCells({color});
    else if(isBg) applyStyleToSelectedCells({backgroundColor:color});
    return;
  }
  restoreSelection();
  const sel=window.getSelection();
  const hasTextSel=!!(sel&&sel.rangeCount>0&&!sel.isCollapsed&&sel.toString().trim()!=="");
  if(!hasTextSel) return;
  const r=sel.getRangeAt(0);
  const frag=r.extractContents();
  stripInlineFormattingFromFragment(frag,{removeColor:isText,removeBackground:isBg});
  const span=document.createElement("span");
  if(isText) span.style.color=color;
  if(isBg) span.style.backgroundColor=color;
  span.appendChild(frag); r.insertNode(span);
  const newRange=document.createRange(); newRange.selectNodeContents(span);
  sel.removeAllRanges(); sel.addRange(newRange); saveSelection();
}

function syncHex(type,val){
  const color=val.startsWith('#')?val:'#'+val;
  const swatchInput=document.getElementById(type==='txt'?'fb-txt-picker':'fb-bg-picker');
  const hexInput=document.getElementById(type==='txt'?'fb-txt-hex':'fb-bg-hex');
  if(swatchInput) swatchInput.value=color;
  if(hexInput) hexInput.value=val.replace('#','');
}

function fa(dir){
  const sel=window.getSelection(); if(!sel) return;
  const node=sel.anchorNode;
  const td=node&&(node.nodeType===3?node.parentElement:node).closest("td[data-ri]");
  if(td){td.dataset.align=dir;td.style.textAlign=dir;}
}

document.addEventListener("mousedown",e=>{
  const fb=document.getElementById("fmt-bar");
  const inFb=fb&&fb.contains(e.target);
  if(!e.shiftKey&&!inFb&&hasTableCellSelection()) clearTblSel();
  if(!inFb) hideFmt();
});

let _savedRange=null;
function saveSelection(){ const sel=window.getSelection(); if(sel&&sel.rangeCount>0) _savedRange=sel.getRangeAt(0).cloneRange(); }
function restoreSelection(){ if(!_savedRange) return false; const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(_savedRange); return true; }

// ═══════════════════════════════════════════════════
//  STATUS PICKER
// ═══════════════════════════════════════════════════
let _stTarget=null,_cellStatusTarget=null;

function openStatusPicker(e,el){
  if(!editMode) return;
  e.stopPropagation();
  _stTarget=el; _cellStatusTarget=null;
  const pk=document.getElementById("status-picker");
  pk.style.top=(e.clientY+6)+"px"; pk.style.left=e.clientX+"px";
  pk.classList.add("open");
}

function pickStatus(status){
  const pk=document.getElementById("status-picker");
  flushAll();
  if(_cellStatusTarget){
    const td=_cellStatusTarget;
    const sec=D.sections[td.dataset.s];
    const b=sec?.blocks?.[+td.dataset.bi];
    if(b?.rows?.[+td.dataset.ri]) b.rows[+td.dataset.ri][+td.dataset.ci]="__S__"+status;
    _cellStatusTarget=null; _stTarget=null; pk.classList.remove("open");
    render(); gotoSec(activeId); if(editMode) enterEdit(); return;
  }
  if(!_stTarget) return;
  const el=_stTarget,secId=el.dataset.s,ctx=el.dataset.ctx,idx=+el.dataset.idx,sec=D.sections[secId];
  if(sec){
    if(ctx==="ic"&&sec.infoCard) sec.infoCard.rows[idx].val="__S__"+status;
    else if(ctx==="block"&&sec.blocks[idx]) sec.blocks[idx].val=status;
    else{
      const m=ctx.match(/t(\d+)r(\d+)/);
      if(m&&sec.blocks[+m[1]]?.rows?.[+m[2]]) sec.blocks[+m[1]].rows[+m[2]][idx]="__S__"+status;
    }
  }
  _stTarget=null; pk.classList.remove("open");
  render(); gotoSec(activeId); if(editMode) enterEdit();
}

document.addEventListener("click",e=>{
  const pk=document.getElementById("status-picker");
  if(!pk.contains(e.target)){ pk.classList.remove("open"); _cellStatusTarget=null; }
});

function removeCellBadge(e,btn){
  if(!editMode) return;
  e.preventDefault(); e.stopPropagation(); flushAll();
  const badge=btn.closest(".badge-wrap")?.querySelector(".badge"); if(!badge) return;
  const secId=badge.dataset.s,ctx=badge.dataset.ctx,idx=+badge.dataset.idx,sec=D.sections[secId];
  if(!sec) return;
  const m=ctx.match(/t(\d+)r(\d+)/);
  if(m&&sec.blocks[+m[1]]?.rows?.[+m[2]]) sec.blocks[+m[1]].rows[+m[2]][idx]="";
  render(); gotoSec(activeId); if(editMode) enterEdit();
}

document.addEventListener("contextmenu",function(e){
  if(!editMode) return;
  const td=e.target.closest(".block-table tbody td[data-ri][data-ci]");
  if(!td||e.target.closest(".tbl-row-del")) return;
  e.preventDefault(); e.stopPropagation();
  _cellStatusTarget=td; _stTarget=null;
  const pk=document.getElementById("status-picker");
  pk.style.top=(e.clientY+6)+"px"; pk.style.left=e.clientX+"px";
  pk.classList.add("open");
});

// ═══════════════════════════════════════════════════
//  INFO CARD
// ═══════════════════════════════════════════════════
function addInfoCard(secId){ const s=D.sections[secId]; if(!s) return; s.infoCard={rows:[{key:"담당자",val:""},{key:"일정",val:""},{key:"상태",val:"__S__inprogress"}]}; flushAll(); render(); gotoSec(activeId); if(editMode)enterEdit(); }
function delInfoCard(secId){ if(!confirm("정보 카드를 삭제할까요?"))return; const s=D.sections[secId]; if(s) s.infoCard=null; flushAll(); render(); gotoSec(activeId); if(editMode)enterEdit(); }
function addICRow(secId){ flushAll(); const s=D.sections[secId]; if(!s||!s.infoCard)return; s.infoCard.rows.push({key:"항목",val:""}); render(); gotoSec(activeId); if(editMode)enterEdit(); }
function delICRow(secId,ri){ flushAll(); const s=D.sections[secId]; if(!s||!s.infoCard)return; s.infoCard.rows.splice(ri,1); render(); gotoSec(activeId); if(editMode)enterEdit(); }

// ═══════════════════════════════════════════════════
//  FLUSH
// ═══════════════════════════════════════════════════
function flushAll(){
  document.querySelectorAll("[ce][data-f]").forEach(el=>{
    const f=el.dataset.f,sid=el.dataset.s,biS=el.dataset.bi,sec=D.sections[sid]; if(!sec)return;
    const html=el.innerHTML.trim(),txt=el.innerText.trim();
    if(f==="tag"&&biS===undefined){sec.tag=txt;return} if(f==="title"&&biS===undefined){sec.title=txt;return}
    if(f==="ic-key"&&sec.infoCard){sec.infoCard.rows[+el.dataset.ri].key=txt;return} if(f==="ic-val"&&sec.infoCard){sec.infoCard.rows[+el.dataset.ri].val=txt;return}
    const b=biS!==undefined?sec.blocks[+biS]:null; if(!b)return;
    if(f==="text")b.text=html; if(f==="col"&&b.cols)b.cols[+el.dataset.ci]=txt;
    if(f==="cell"&&b.rows){const r=b.rows[+el.dataset.ri];if(r)r[+el.dataset.ci]=html;}
    if(f==="list-item"&&b.items)b.items[+el.dataset.li]=html;
    if(f==="kpi-val"&&b.items)b.items[+el.dataset.ki].value=txt; if(f==="kpi-lbl"&&b.items)b.items[+el.dataset.ki].label=txt;
    if(f==="meta-k"&&b.items)b.items[+el.dataset.mi].key=txt; if(f==="meta-v"&&b.items)b.items[+el.dataset.mi].val=txt;
    if(f==="img-cap")b.caption=txt;
  });
  document.querySelectorAll(".block-table tbody td[data-align][data-bi]").forEach(td=>{ const s=D.sections[td.dataset.s]; if(!s)return; const b=s.blocks[+td.dataset.bi]; if(b&&b.aligns)b.aligns[+td.dataset.ci]=td.dataset.align; });
  const st=document.getElementById("sb-title"),sw=document.getElementById("sb-week"),sc=document.getElementById("sb-chip");
  if(st)D.title=st.innerText.trim(); if(sw)D.week=sw.innerText.trim(); if(sc)D.chip=sc.innerText.trim();
}

// ═══════════════════════════════════════════════════
//  BLOCK OPS
// ═══════════════════════════════════════════════════
function mvB(secId,idx,dir){ flushAll(); const s=D.sections[secId];if(!s)return;const ni=idx+dir;if(ni<0||ni>=s.blocks.length)return;[s.blocks[idx],s.blocks[ni]]=[s.blocks[ni],s.blocks[idx]];render();gotoSec(secId);if(editMode)enterEdit(); }
function delB(secId,idx){ flushAll(); const s=D.sections[secId];if(s)s.blocks.splice(idx,1);render();gotoSec(secId);if(editMode)enterEdit(); }
function addRow(secId,bi){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(b)b.rows.push(b.cols.map(()=>""));render();gotoSec(secId);if(editMode)enterEdit(); }
function delRow(secId,bi,ri){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(b)b.rows.splice(ri,1);render();gotoSec(secId);if(editMode)enterEdit(); }
function addCol(secId,bi){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(!b)return;b.cols.push("새 열");b.aligns=b.aligns||[];b.aligns.push("left");b.rows.forEach(r=>r.push(""));render();gotoSec(secId);if(editMode)enterEdit(); }
function delCol(secId,bi,ci){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(!b)return;b.cols.splice(ci,1);if(b.aligns)b.aligns.splice(ci,1);b.rows.forEach(r=>r.splice(ci,1));render();gotoSec(secId);if(editMode)enterEdit(); }
function addLI(secId,bi){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(b){b.items=b.items||[];b.items.push("새 항목");}render();gotoSec(secId);if(editMode)enterEdit(); }
function delLI(secId,bi,ii){ flushAll(); const b=D.sections[secId]?.blocks[bi];if(b)b.items.splice(ii,1);render();gotoSec(secId);if(editMode)enterEdit(); }

function resizeImageFile(file,maxW,maxH,cb){ const url=URL.createObjectURL(file),img=new Image(); img.onload=()=>{ URL.revokeObjectURL(url); let w=img.width,h=img.height; if(w<=maxW&&h<=maxH){ const cvs=document.createElement("canvas"); cvs.width=w;cvs.height=h;cvs.getContext("2d").drawImage(img,0,0,w,h);cb(cvs.toDataURL("image/png"));return; } const ratio=Math.min(maxW/w,maxH/h); w=Math.round(w*ratio);h=Math.round(h*ratio); const cvs=document.createElement("canvas"); cvs.width=w;cvs.height=h;cvs.getContext("2d").drawImage(img,0,0,w,h);cb(cvs.toDataURL("image/jpeg",.92)); }; img.onerror=()=>URL.revokeObjectURL(url); img.src=url; }

function pickImg(secId,bi){ if(!editMode)return; const inp=document.createElement("input");inp.type="file";inp.accept="image/*"; inp.onchange=e=>{ const f=e.target.files[0];if(!f)return; resizeImageFile(f,2560,1920,src=>{ flushAll();D.sections[secId].blocks[bi].src=src;render();gotoSec(secId);if(editMode)enterEdit(); }); }; inp.click(); }
function focusPasteTarget(secId,bi){ if(!editMode)return; _pasteTarget={secId,bi}; const ph=document.querySelector(`#bimg-${secId}-${bi} .img-placeholder`); if(ph){ph.focus();ph.style.borderColor='var(--ac)';} showPasteHint(); }
let _pasteTarget=null,_pasteHintTimer=null;
function showPasteHint(){ let h=document.getElementById("paste-hint"); if(!h){h=document.createElement("div");h.id="paste-hint";h.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:8px;font-size:12px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.25);pointer-events:none;transition:opacity .3s";document.body.appendChild(h);} h.textContent="📋 이미지를 복사한 후 Ctrl+V (Mac: ⌘V) 를 눌러주세요";h.style.opacity="1";clearTimeout(_pasteHintTimer);_pasteHintTimer=setTimeout(()=>{h.style.opacity="0";_pasteTarget=null;},4000); }

let _modalImgData=null;
function initModalPasteZone(){ const zone=document.getElementById("img-modal-paste-zone"); if(!zone||zone._pasteInited) return; zone._pasteInited=true; zone.addEventListener("paste",e=>{ const items=e.clipboardData?.items; if(!items) return; let imgFile=null; for(const item of items){ if(item.type.startsWith("image/")){imgFile=item.getAsFile();break;} } if(!imgFile) return; e.preventDefault(); resizeImageFile(imgFile,2560,1920,src=>{ _modalImgData=src; const prev=document.getElementById("img-modal-preview"),pimg=document.getElementById("img-modal-preview-img"),hint=document.getElementById("img-modal-hint"); if(pimg)pimg.src=src; if(prev)prev.style.display="block"; if(hint)hint.style.display="none"; zone.classList.add("has-img"); }); }); }

document.addEventListener("paste",e=>{ const zone=document.getElementById("img-modal-paste-zone"); if(!zone||!document.getElementById("block-modal").classList.contains("open")) return; if(document.activeElement===zone||zone.contains(document.activeElement)) return; const items=e.clipboardData?.items; if(!items) return; let imgFile=null; for(const item of items){ if(item.type.startsWith("image/")){imgFile=item.getAsFile();break;} } if(!imgFile) return; e.preventDefault(); resizeImageFile(imgFile,2560,1920,src=>{ _modalImgData=src; const prev=document.getElementById("img-modal-preview"),pimg=document.getElementById("img-modal-preview-img"),hint=document.getElementById("img-modal-hint"); if(pimg)pimg.src=src; if(prev)prev.style.display="block"; if(hint)hint.style.display="none"; document.getElementById("img-modal-paste-zone").classList.add("has-img"); }); },true);

document.addEventListener("paste",e=>{ if(!editMode) return; const items=e.clipboardData?.items; if(!items) return; let imgFile=null; for(const item of items){ if(item.type.startsWith("image/")){imgFile=item.getAsFile();break;} } if(!imgFile) return; let target=_pasteTarget; if(!target){ const focused=document.activeElement?.closest(".img-placeholder[data-paste-sec]"); if(focused) target={secId:focused.dataset.pasteSec,bi:+focused.dataset.pasteBi}; } if(!target) return; e.preventDefault(); resizeImageFile(imgFile,2560,1920,src=>{ const sec=D.sections[target.secId]; if(sec&&sec.blocks[target.bi]){ sec.blocks[target.bi].src=src; flushAll();render();gotoSec(target.secId);if(editMode)enterEdit(); } }); _pasteTarget=null; clearTimeout(_pasteHintTimer); const h=document.getElementById("paste-hint"); if(h)h.style.opacity="0"; });

// ═══════════════════════════════════════════════════
//  BLOCK ADD POPUP
// ═══════════════════════════════════════════════════
let _bapTarget={secId:null,insertAt:null},_bapInsertAt=null;
function openBap(e,secId,insertAt){ e.stopPropagation(); _bapTarget={secId,insertAt}; const popup=document.getElementById("block-add-popup"),btnRect=e.currentTarget.getBoundingClientRect(),pw=184,ph=360; let left=btnRect.left+btnRect.width/2-pw/2,top=btnRect.bottom+6; if(left+pw>window.innerWidth-8)left=window.innerWidth-pw-8; if(left<8)left=8; if(top+ph>window.innerHeight-8)top=btnRect.top-ph-6; popup.style.left=left+"px";popup.style.top=top+"px";popup.classList.add("open"); }
function bapSelect(type){ document.getElementById("block-add-popup").classList.remove("open"); if(!_bapTarget.secId)return; _bapInsertAt=_bapTarget.insertAt; openBlockModal(_bapTarget.secId,type); }
document.addEventListener("click",e=>{ const popup=document.getElementById("block-add-popup"); if(popup&&!popup.contains(e.target)&&!e.target.classList.contains("block-gap-btn")&&!e.target.classList.contains("block-end-add-btn")) popup.classList.remove("open"); });

function openBlockModal(secId,preType){
  pendingSec=secId;selBTval=null;_modalImgData=null;
  document.querySelectorAll(".bt-card").forEach(c=>c.classList.remove("sel"));
  ["cfg-table","cfg-list","cfg-kpi","cfg-meta","cfg-text","cfg-image"].forEach(id=>document.getElementById(id).style.display="none");
  document.getElementById("tbl-cols").value="업무항목, 담당자, 일정, 상태";document.getElementById("tbl-rows").value="2";
  ["list-items","kpi-items","text-content","img-caption"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("meta-items").value="담당자|홍길동\n일정|2026. 00. 00";document.getElementById("img-file-inp").value="";
  const zone=document.getElementById("img-modal-paste-zone"),prev=document.getElementById("img-modal-preview"),hint=document.getElementById("img-modal-hint");
  if(zone)zone.classList.remove("has-img"); if(prev)prev.style.display="none"; if(hint)hint.style.display="block";
  if(preType)selBT(preType);
  document.getElementById("block-modal").classList.add("open");
}

function selBT(t){
  selBTval=t;document.querySelectorAll(".bt-card").forEach(c=>c.classList.remove("sel"));
  const el=document.getElementById("bt-"+t);if(el)el.classList.add("sel");
  ["cfg-table","cfg-list","cfg-kpi","cfg-meta","cfg-text","cfg-image"].forEach(id=>document.getElementById(id).style.display="none");
  if(t==="table")document.getElementById("cfg-table").style.display="block";
  else if(t==="list")document.getElementById("cfg-list").style.display="block";
  else if(t==="kpi")document.getElementById("cfg-kpi").style.display="block";
  else if(t==="meta")document.getElementById("cfg-meta").style.display="block";
  else if(["text","textbox","heading"].includes(t))document.getElementById("cfg-text").style.display="block";
  else if(t==="image"){ document.getElementById("cfg-image").style.display="block"; setTimeout(()=>{ initModalPasteZone();document.getElementById("img-modal-paste-zone")?.focus(); },50); }
}

function confirmAddBlock(){
  if(!selBTval){alert("블록 타입을 선택하세요.");return;}
  flushAll(); const sec=D.sections[pendingSec];if(!sec)return;
  let b={type:selBTval};
  if(selBTval==="table"){ const cols=document.getElementById("tbl-cols").value.split(",").map(s=>s.trim()).filter(Boolean),rc=parseInt(document.getElementById("tbl-rows").value)||2; b.cols=cols.length?cols:["항목","내용"];b.aligns=b.cols.map(()=>"left");b.rows=Array.from({length:rc},()=>b.cols.map(()=>"")); }
  else if(selBTval==="list"){b.items=document.getElementById("list-items").value.split("\n").map(s=>s.trim()).filter(Boolean)||["새 항목"];}
  else if(selBTval==="kpi"){b.items=document.getElementById("kpi-items").value.split("\n").map(l=>{const[v,lb]=(l+"|").split("|");return{value:v.trim(),label:lb.trim()}}).filter(k=>k.value)||[{value:"0",label:"지표"}];}
  else if(selBTval==="meta"){b.items=document.getElementById("meta-items").value.split("\n").map(l=>{const[k,v]=(l+"|").split("|");return{key:k.trim(),val:v.trim()}}).filter(m=>m.key)||[{key:"담당",val:"이름"}];}
  else if(selBTval==="status"){b.val="inprogress";}
  else if(selBTval==="image"){
    const cap=document.getElementById("img-caption").value.trim();
    if(_modalImgData){b.src=_modalImgData;b.caption=cap;_modalImgData=null;insertBlock(sec,b);closeModal("block-modal");render();gotoSec(pendingSec);if(editMode)enterEdit();return;}
    const f=document.getElementById("img-file-inp").files[0];
    if(f){const fr=new FileReader();fr.onload=ev=>{b.src=ev.target.result;b.caption=cap;insertBlock(sec,b);closeModal("block-modal");render();gotoSec(pendingSec);if(editMode)enterEdit();};fr.readAsDataURL(f);return;}
    b.src="";b.caption=cap;
  } else {b.text=document.getElementById("text-content").value.trim()||"내용을 입력하세요";}
  insertBlock(sec,b);closeModal("block-modal");render();gotoSec(pendingSec);if(editMode)enterEdit();
}

function insertBlock(sec,b){ if(_bapInsertAt!==null&&_bapInsertAt<=sec.blocks.length){sec.blocks.splice(_bapInsertAt,0,b);}else{sec.blocks.push(b);} _bapInsertAt=null; }

// ═══════════════════════════════════════════════════
//  SECTION & FOLDER OPS
// ═══════════════════════════════════════════════════
function openSecModal(){ const sel=document.getElementById("sec-folder-sel"); sel.innerHTML='<option value="">── 없음 (최상위)</option>'; function addFolderOpts(items,prefix){items.forEach(item=>{if(item.type==="folder"){const o=document.createElement("option");o.value=item.id;o.textContent=prefix+"📁 "+item.name;sel.appendChild(o);addFolderOpts(item.children||[],prefix+"　");}});} addFolderOpts(D.navTree,""); document.getElementById("sec-modal").classList.add("open"); }
function confirmAddSec(){
  const title=document.getElementById("sec-title-inp").value.trim()||"새 섹션",tag=document.getElementById("sec-tag-inp").value.trim()||(String(Object.keys(D.sections).length).padStart(2,"0")+" — New"),folderId=document.getElementById("sec-folder-sel").value;
  flushAll(); const id="s_"+Date.now();
  D.sections[id]={id,tag,title,hidden:false,infoCard:{rows:[{key:"담당자",val:""},{key:"일정",val:""},{key:"상태",val:"__S__inprogress"}]},blocks:[]};
  const node={type:"sec",id};
  if(folderId){ function insertInFolder(items){ for(const it of items){ if(it.type==="folder"&&it.id===folderId){(it.children=it.children||[]).push(node);return true;} if(it.type==="folder"&&insertInFolder(it.children||[]))return true; }return false; } if(!insertInFolder(D.navTree))D.navTree.push(node); } else D.navTree.push(node);
  document.getElementById("sec-title-inp").value="";document.getElementById("sec-tag-inp").value="";
  closeModal("sec-modal");activeId=id;render();gotoSec(id);if(editMode)enterEdit();
}
function delSec(e,id){ e.stopPropagation(); if(Object.keys(D.sections).length<=1){alert("마지막 섹션은 삭제할 수 없습니다.");return;} if(!confirm("이 섹션을 삭제할까요?"))return; delete D.sections[id]; function rm(items){ for(let i=0;i<items.length;i++){ if(items[i].type==="sec"&&items[i].id===id){items.splice(i,1);return true;} if(items[i].type==="folder"&&rm(items[i].children||[]))return true; }return false; } rm(D.navTree); const remaining=allSecIds();activeId=remaining[0]||""; render();if(activeId)gotoSec(activeId); }
function openFolderModal(){ document.getElementById("folder-modal").classList.add("open"); }
function confirmAddFolder(){ const name=document.getElementById("folder-name-inp").value.trim()||"새 폴더"; flushAll(); D.navTree.push({type:"folder",id:"f_"+Date.now(),name,open:true,children:[]}); document.getElementById("folder-name-inp").value=""; closeModal("folder-modal");render(); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

// ═══════════════════════════════════════════════════
//  DRAG & DROP
// ═══════════════════════════════════════════════════
let dragId=null,dragFolderId=null;

function addFolderMoveDrag(fEl,hdEl,folderId){
  fEl.draggable=true;
  fEl.addEventListener("dragstart",e=>{ if(e.target.closest("button")||e.target.closest("span.nav-folder-name")){e.preventDefault();return;} dragFolderId=folderId;fEl.style.opacity=".45";document.body.classList.add("dragging-nav");e.dataTransfer.effectAllowed="move";e.stopPropagation(); });
  fEl.addEventListener("dragend",()=>{ dragFolderId=null;fEl.style.opacity="";document.body.classList.remove("dragging-nav");document.querySelectorAll(".folder-drag-over").forEach(n=>n.classList.remove("folder-drag-over")); });
  hdEl.addEventListener("dragover",e=>{ if(dragFolderId&&dragFolderId!==folderId){e.preventDefault();e.stopPropagation();hdEl.classList.add("folder-drag-over");} else if(dragId){e.preventDefault();e.stopPropagation();hdEl.classList.add("drag-folder-hl");} });
  hdEl.addEventListener("dragleave",()=>hdEl.classList.remove("folder-drag-over","drag-folder-hl"));
  hdEl.addEventListener("drop",e=>{ e.preventDefault();e.stopPropagation();hdEl.classList.remove("folder-drag-over","drag-folder-hl"); if(dragFolderId&&dragFolderId!==folderId){moveFolderBefore(dragFolderId,folderId);dragFolderId=null;return;} if(dragId){moveSecIntoFolder(dragId,folderId);dragId=null;} });
}

function removeFolderNode(items,folderId){
  for(let i=0;i<items.length;i++){
    if(items[i].type==="folder"&&items[i].id===folderId)return items.splice(i,1)[0];
    if(items[i].type==="folder"){const f=removeFolderNode(items[i].children||[],folderId);if(f)return f;}
  }
  return null;
}

function moveFolderBefore(fromId,beforeId){
  flushAll();
  const node=removeFolderNode(D.navTree,fromId); if(!node){render();return;}
  function ins(items){ for(let i=0;i<items.length;i++){ if(items[i].type==="folder"&&items[i].id===beforeId){items.splice(i,0,node);return true;} if(items[i].type==="folder"&&ins(items[i].children||[]))return true; }return false; }
  if(!ins(D.navTree))D.navTree.push(node); render();
}

function addNavDrag(el,secId){
  el.addEventListener("dragstart",e=>{ dragId=secId;el.classList.add("dragging");document.body.classList.add("dragging-nav");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",secId); });
  el.addEventListener("dragend",()=>{ dragId=null;el.classList.remove("dragging");document.body.classList.remove("dragging-nav");document.querySelectorAll(".nav-item.drag-over,.nav-folder-hd.drag-folder-hl,.nav-drop-root.drag-folder-hl").forEach(n=>n.classList.remove("drag-over","drag-folder-hl")); });
  el.addEventListener("dragover",e=>{ e.preventDefault();if(!dragId||dragId===secId)return;el.classList.add("drag-over"); });
  el.addEventListener("dragleave",e=>{ if(!el.contains(e.relatedTarget))el.classList.remove("drag-over"); });
  el.addEventListener("drop",e=>{ e.preventDefault();e.stopPropagation();if(!dragId||dragId===secId)return;el.classList.remove("drag-over");moveSecBefore(dragId,secId);dragId=null; });
}

function attachRootDropZone(){
  const zone=document.getElementById("nav-drop-root");if(!zone)return;
  zone.addEventListener("dragover",e=>{ if(!dragId&&!dragFolderId)return; e.preventDefault();zone.classList.add("drag-folder-hl"); });
  zone.addEventListener("dragleave",()=>zone.classList.remove("drag-folder-hl"));
  zone.addEventListener("drop",e=>{ e.preventDefault();zone.classList.remove("drag-folder-hl"); if(dragFolderId){flushAll();const node=removeFolderNode(D.navTree,dragFolderId);if(node)D.navTree.push(node);dragFolderId=null;render();return;} if(dragId){flushAll();const node=removeSecNode(D.navTree,dragId);if(node)D.navTree.push(node);dragId=null;render();gotoSec(activeId);} });
}

function addFolderDrag(bodyEl,folderId,hdEl){
  bodyEl.addEventListener("dragover",e=>{if(!dragId)return;e.preventDefault();e.stopPropagation();hdEl.classList.add("drag-folder-hl");});
  bodyEl.addEventListener("dragleave",e=>{if(!bodyEl.contains(e.relatedTarget))hdEl.classList.remove("drag-folder-hl");});
  bodyEl.addEventListener("drop",e=>{e.preventDefault();e.stopPropagation();hdEl.classList.remove("drag-folder-hl");if(!dragId)return;moveSecIntoFolder(dragId,folderId);dragId=null;});
  hdEl.addEventListener("dragover",e=>{if(!dragId)return;e.preventDefault();e.stopPropagation();hdEl.classList.add("drag-folder-hl");});
  hdEl.addEventListener("dragleave",e=>{if(!hdEl.contains(e.relatedTarget))hdEl.classList.remove("drag-folder-hl");});
  hdEl.addEventListener("drop",e=>{e.preventDefault();e.stopPropagation();hdEl.classList.remove("drag-folder-hl");if(!dragId)return;moveSecIntoFolder(dragId,folderId);dragId=null;});
}

function removeSecNode(items,secId){ for(let i=0;i<items.length;i++){ if(items[i].type==="sec"&&items[i].id===secId)return items.splice(i,1)[0]; if(items[i].type==="folder"){const f=removeSecNode(items[i].children||[],secId);if(f)return f;} } return null; }
function moveSecBefore(fromId,beforeId){ flushAll();const node=removeSecNode(D.navTree,fromId);if(!node){render();gotoSec(activeId);return;} function insertBefore(items){for(let i=0;i<items.length;i++){if(items[i].type==="sec"&&items[i].id===beforeId){items.splice(i,0,node);return true;}if(items[i].type==="folder"&&insertBefore(items[i].children||[]))return true;}return false;} if(!insertBefore(D.navTree))D.navTree.push(node);render();gotoSec(activeId); }
function moveSecIntoFolder(fromId,folderId){ flushAll();const node=removeSecNode(D.navTree,fromId);if(!node){render();gotoSec(activeId);return;} function addToFolder(items){for(const it of items){if(it.type==="folder"&&it.id===folderId){(it.children=it.children||[]).push(node);return true;}if(it.type==="folder"&&addToFolder(it.children||[]))return true;}return false;} if(!addToFolder(D.navTree))D.navTree.push(node);render();gotoSec(activeId); }

// ═══════════════════════════════════════════════════
//  TABLE RESIZE
// ═══════════════════════════════════════════════════
let _resize={active:false,type:null,secId:null,bi:null,idx:null,startPos:0,startSize:0};
function startColResize(e,secId,bi,ci){ if(!editMode)return;e.preventDefault();e.stopPropagation();flushAll();const b=D.sections[secId]?.blocks[bi];if(!b)return;if(!b.colWidths)b.colWidths=b.cols.map(()=>null);const th=document.querySelector(`#tbl-${secId}-${bi} thead th:nth-child(${ci+1})`);const startW=th?th.offsetWidth:120;_resize={active:true,type:"col",secId,bi,idx:ci,startPos:e.clientX,startSize:startW};document.addEventListener("mousemove",onResizeMove);document.addEventListener("mouseup",onResizeUp);e.currentTarget.classList.add("resizing"); }
function startRowResize(e,secId,bi,ri){ if(!editMode)return;e.preventDefault();e.stopPropagation();flushAll();const b=D.sections[secId]?.blocks[bi];if(!b)return;if(!b.rowHeights)b.rowHeights=b.rows.map(()=>null);const tr=document.querySelector(`#tbl-${secId}-${bi} tbody tr:nth-child(${ri+1})`);const startH=tr?tr.offsetHeight:36;_resize={active:true,type:"row",secId,bi,idx:ri,startPos:e.clientY,startSize:startH};document.addEventListener("mousemove",onResizeMove);document.addEventListener("mouseup",onResizeUp); }
function onResizeMove(e){ if(!_resize.active)return;const b=D.sections[_resize.secId]?.blocks[_resize.bi];if(!b)return; if(_resize.type==="col"){const newW=Math.max(40,_resize.startSize+(e.clientX-_resize.startPos));if(!b.colWidths)b.colWidths=b.cols.map(()=>null);b.colWidths[_resize.idx]=newW;const th=document.querySelector(`#tbl-${_resize.secId}-${_resize.bi} thead th:nth-child(${_resize.idx+1})`);if(th)th.style.width=newW+"px";}else{const newH=Math.max(28,_resize.startSize+(e.clientY-_resize.startPos));if(!b.rowHeights)b.rowHeights=b.rows.map(()=>null);b.rowHeights[_resize.idx]=newH;const tr=document.querySelector(`#tbl-${_resize.secId}-${_resize.bi} tbody tr:nth-child(${_resize.idx+1})`);if(tr)tr.style.height=newH+"px";} }
function onResizeUp(){ if(!_resize.active)return;_resize.active=false;document.removeEventListener("mousemove",onResizeMove);document.removeEventListener("mouseup",onResizeUp);document.querySelectorAll(".col-resizer.resizing,.row-resizer.resizing").forEach(el=>el.classList.remove("resizing")); }

// ═══════════════════════════════════════════════════
//  THEME PANEL
// ═══════════════════════════════════════════════════
const THEME_VARS=[{id:'bg'},{id:'sb'},{id:'bdr'},{id:'ac'},{id:'ac2'},{id:'sb-ac'},{id:'txt'},{id:'muted'}];
const THEME_PRESETS=[
  {name:'기본',bg:'#f0efe9',sb:'#1a1a2e',bdr:'#e0ddd4',ac:'#e94560',ac2:'#0f3460','sb-ac':'#ff6b85',txt:'#1a1a2e',muted:'#66668a'},
  {name:'다크',bg:'#18181f',sb:'#0f0f16',bdr:'#2a2a3a',ac:'#e94560',ac2:'#4f8ef7','sb-ac':'#ff8fa3',txt:'#e0e0f0',muted:'#8888aa'},
  {name:'민트',bg:'#f0faf7',sb:'#0d3b2e',bdr:'#b8e0d4',ac:'#00b894',ac2:'#007a5e','sb-ac':'#4cd9ae',txt:'#0d2b22',muted:'#4a7a6a'},
  {name:'퍼플',bg:'#f5f0ff',sb:'#2d1b69',bdr:'#d8ccf8',ac:'#7c3aed',ac2:'#4f1fb8','sb-ac':'#a78bfa',txt:'#1e1040',muted:'#7060a0'},
  {name:'브라운',bg:'#faf6f0',sb:'#2c1810',bdr:'#e0c8b4',ac:'#c0621a',ac2:'#7a3a0a','sb-ac':'#e8924a',txt:'#2c1810',muted:'#8a6448'},
  {name:'슬레이트',bg:'#f0f2f5',sb:'#1e2332',bdr:'#d4d8e4',ac:'#3b82f6',ac2:'#1d4ed8','sb-ac':'#60a5fa',txt:'#1e2332',muted:'#6070a0'},
  {name:'로즈',bg:'#fff0f3',sb:'#3b0a1e',bdr:'#f4c0cc',ac:'#e11d48',ac2:'#9f1239','sb-ac':'#fb7185',txt:'#3b0a1e',muted:'#a04060'},
  {name:'황토',bg:'#fffbf0',sb:'#2a2000',bdr:'#e8d890',ac:'#d4a017',ac2:'#8a6400','sb-ac':'#f0c040',txt:'#2a2000',muted:'#806030'},
  {name:'아이스',bg:'#f0f8ff',sb:'#0a2a4a',bdr:'#c0d8f0',ac:'#0284c7',ac2:'#075985','sb-ac':'#38bdf8',txt:'#0a2a4a',muted:'#4880a8'},
  {name:'모노',bg:'#f8f8f8',sb:'#222222',bdr:'#dddddd',ac:'#444444',ac2:'#222222','sb-ac':'#888888',txt:'#111111',muted:'#777777'},
];
let _themeDraft={};
const _themeDefault={bg:'#f0efe9',sb:'#1a1a2e',bdr:'#e0ddd4',ac:'#e94560',ac2:'#0f3460','sb-ac':'#ff6b85',txt:'#1a1a2e',muted:'#66668a'};
function getCssVar(n){return getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim();}
function readCurrentTheme(){const t={};THEME_VARS.forEach(v=>{t[v.id]=getCssVar(v.id)||'#000000';});return t;}
function normalizeHex(h){h=h.trim();if(!h.startsWith('#'))h='#'+h;if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return h.toLowerCase();}
function lightenHex(hex,amt){hex=normalizeHex(hex).replace('#','');let r=Math.min(255,parseInt(hex.slice(0,2),16)+amt),g=Math.min(255,parseInt(hex.slice(2,4),16)+amt),b=Math.min(255,parseInt(hex.slice(4,6),16)+amt);return'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}
function initThemePanel(){ const grid=document.getElementById("tp-presets"); THEME_PRESETS.forEach((p)=>{const el=document.createElement("div");el.className="tp-preset";el.title=p.name;el.style.background=`linear-gradient(135deg,${p.sb} 50%,${p.ac} 50%)`;el.onclick=()=>applyPreset(p,el);grid.appendChild(el);}); syncThemePanelUI(readCurrentTheme()); }
function syncThemePanelUI(theme){ _themeDraft={...theme}; THEME_VARS.forEach(v=>{const hex=normalizeHex(_themeDraft[v.id]||'#000000'),inp=document.getElementById('th-'+v.id),prev=document.getElementById('thp-'+v.id);if(inp)inp.value=hex.toUpperCase();if(prev)prev.style.background=hex;const wrap=prev?.parentElement?.querySelector('input[type=color]');if(wrap)wrap.value=hex.substring(0,7);}); }
function onThemeColor(varId,val){_themeDraft[varId]=val;const inp=document.getElementById('th-'+varId),prev=document.getElementById('thp-'+varId);if(inp)inp.value=val.replace('#','').toUpperCase();if(prev)prev.style.background=val;previewTheme(_themeDraft);}
function onThemeHex(varId,val){val=val.trim();if(!val.startsWith('#'))val='#'+val;_themeDraft[varId]=val;const prev=document.getElementById('thp-'+varId);if(prev&&/^#[0-9a-fA-F]{6}$/.test(val)){prev.style.background=val;const wrap=prev.parentElement?.querySelector('input[type=color]');if(wrap)wrap.value=val;previewTheme(_themeDraft);}}
function previewTheme(theme){const root=document.documentElement;THEME_VARS.forEach(v=>{const val=theme[v.id];if(val&&/^#[0-9a-fA-F]{3,6}$/.test(normalizeHex(val)))root.style.setProperty('--'+v.id,normalizeHex(val));});if(theme['sb-ac'])root.style.setProperty('--sb-ac2',lightenHex(theme['sb-ac'],20));}
function applyPreset(p,el){document.querySelectorAll('.tp-preset').forEach(e=>e.classList.remove('active'));if(el)el.classList.add('active');syncThemePanelUI(p);previewTheme(p);}
function applyTheme(){previewTheme(_themeDraft);D.theme=_themeDraft;toggleThemePanel();}
function resetTheme(){applyPreset(_themeDefault,null);D.theme=null;}
function toggleThemePanel(){const panel=document.getElementById("theme-panel");if(panel.classList.contains("open")){panel.classList.remove("open");}else{syncThemePanelUI(readCurrentTheme());panel.classList.add("open");}}

// ═══════════════════════════════════════════════════
//  DOWNLOAD
// ═══════════════════════════════════════════════════
function downloadFile(){
  if(editMode)flushAll();
  const snap=JSON.stringify(D);
  let html=document.documentElement.outerHTML;
  html=html.replace(/let D = \{[\s\S]*?\};\s*\nlet editMode/,"let D = "+snap+";\nlet editMode");
  if(D.theme){ const t=D.theme; let ro='--bg:'+normalizeHex(t.bg||'#f0efe9')+';--sb:'+normalizeHex(t.sb||'#1a1a2e')+';--ac:'+normalizeHex(t.ac||'#e94560')+';--ac2:'+normalizeHex(t.ac2||'#0f3460')+';--bdr:'+normalizeHex(t.bdr||'#e0ddd4')+';--txt:'+normalizeHex(t.txt||'#1a1a2e')+';--muted:'+normalizeHex(t.muted||'#66668a')+';--sb-ac:'+normalizeHex(t['sb-ac']||'#ff6b85')+';'; html=html.replace('</head>',`<style>:root{${ro}}</style></head>`); }
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));a.download="주간업무보고_"+D.week.replace(/\s/g,"_")+".html";a.click();
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
async function init(){
  let remote=null;
  if(window.fbLoad) remote=await window.fbLoad();
  if(remote) D=remote;
  else loadFromLocal();
  render();
  attachRootDropZone();
  initThemePanel();
  if(D.theme) previewTheme(D.theme);
  document.body.classList.add("app-ready");
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
else init();

// ── 전역 함수 노출 (HTML onclick 연동용) ──
Object.assign(window, {
  enterEdit, saveEdit, cancelEdit, openSecModal, copyCurrentSection,
  openFolderModal, toggleThemePanel, downloadFile,
  toggleFolder, toggleHide, delSec, delFolder, addSecToFolder,
  startFolderRename, gotoSec,
  openBap, bapSelect, openBlockModal, selBT, confirmAddBlock, closeModal,
  confirmAddSec, confirmAddFolder,
  mvB, delB, addRow, delRow, addCol, delCol, addLI, delLI,
  addInfoCard, delInfoCard, addICRow, delICRow,
  openStatusPicker, pickStatus, removeCellBadge,
  tblMouseDown, tblMouseOver, tblMouseUp,
  startColResize, startRowResize,
  applyFontSizeStep, applyHexColor, syncHex, fa, fc, restoreSelection,
  onThemeColor, onThemeHex, applyTheme, resetTheme,
  pickImg, focusPasteTarget,
});