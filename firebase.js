import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { FIREBASE_CONFIGS, ACTIVE_COMPANY } from "./config.js";

const firebaseConfig = FIREBASE_CONFIGS[ACTIVE_COMPANY];
if (!firebaseConfig) throw new Error("firebaseConfig 없음: " + ACTIVE_COMPANY);

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const REPORT_DOC = doc(db, "reports", "main");

function showFbStatus(msg, color, duration = 2500) {
  let el = document.getElementById("fb-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "fb-status";
    el.style.cssText = "position:fixed;bottom:20px;right:20px;padding:9px 18px;"
      + "border-radius:8px;font-size:12px;font-weight:600;color:#fff;z-index:9999;"
      + "box-shadow:0 4px 16px rgba(0,0,0,.2);transition:opacity .4s;"
      + "font-family:'Noto Sans KR',sans-serif;pointer-events:none";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = color;
  el.style.opacity = "1";
  clearTimeout(el._t);
  if (duration) el._t = setTimeout(() => el.style.opacity = "0", duration);
}

window.fbSave = async function(data) {
  try {
    await setDoc(REPORT_DOC, { data: JSON.stringify(data), updatedAt: Date.now() });
    showFbStatus("✅ 저장됨", "#27ae60");
  } catch(e) {
    showFbStatus("❌ 저장 실패: " + e.message, "#e94560", 4000);
    console.error(e);
  }
};

let _skipNext = false;
window.fbMarkLocal = function() { _skipNext = true; };

window.startFbSync = function(onRemote) {
  onSnapshot(REPORT_DOC, snap => {
    if (!snap.exists()) return;
    if (_skipNext) { _skipNext = false; return; }
    try {
      const remote = JSON.parse(snap.data().data);
      onRemote(remote);
      showFbStatus("🔄 다른 팀원이 수정함 — 자동 반영", "#0f3460", 3000);
    } catch(e) { console.error(e); }
  });
};

window.fbLoad = async function() {
  try {
    const snap = await getDoc(REPORT_DOC);
    if (snap.exists()) return JSON.parse(snap.data().data);
  } catch(e) { console.error(e); }
  return null;
};

document.addEventListener("DOMContentLoaded", async () => {
  const remote = await window.fbLoad();
  if (remote) window._fbInitialData = remote;
  window.startFbSync(remote => {
    if (typeof window.onRemoteDataChange === "function")
      window.onRemoteDataChange(remote);
  });
  showFbStatus("🔗 Firebase 연결됨", "#0f3460", 2000);
});
