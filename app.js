'use strict';

const CONFIG = {
  storageKey: 'flu2025_submissions',
  webhookUrl: '<<PUT_YOUR_WEB_APP_URL_HERE>>',
  remoteJsonUrl: '<<PUT_YOUR_WEB_APP_URL_HERE>>'
};

const DEPARTMENTS=['営業本部','管理本部','生産本部','生産管理部','出力業務部','制作部','印刷生産課','加工生産課','用紙管理課'];

let els={};
const q=id=>document.getElementById(id);
const normId=v=>(v||'').trim().replace(/\s+/g,'').toUpperCase();

function setAdminVisible(on){ document.body.classList.toggle('admin-visible',on); }
function isAdminMode(){ const p=new URLSearchParams(location.search); return p.get('admin')==='1'||location.hash==='#admin'||document.body.classList.contains('admin-visible'); }
function applyAdminVisibility(){ setAdminVisible(isAdminMode()); }
function initDepartmentOptions(){
  if(!els.department) return;
  els.department.innerHTML='<option value="">選択してください</option>'+DEPARTMENTS.map(d=>`<option value="${d}">${d}</option>`).join('');
}

function loadLocal(){ try{return JSON.parse(localStorage.getItem(CONFIG.storageKey)||'[]');}catch(e){return[];} }
function saveLocal(items){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(items)); }
function clearLocal(){ localStorage.removeItem(CONFIG.storageKey); }

async function loadRemoteAll(){
  if(!CONFIG.remoteJsonUrl||CONFIG.remoteJsonUrl.startsWith('<<')) return [];
  try{ const r=await fetch(CONFIG.remoteJsonUrl,{cache:'no-store'}); const j=await r.json(); if(j&&j.ok&&Array.isArray(j.items)) return j.items; }catch(e){ console.warn(e); }
  return [];
}
async function loadCombined(){
  const local=loadLocal();
  const remote=await loadRemoteAll();
  const map=new Map();
  for(const x of local) map.set(normId(x.employeeId), x);
  for(const x of remote) map.set(normId(x.employeeId||''), x);
  return Array.from(map.values());
}
async function isDupAny(employeeId){
  const all=await loadCombined(); const id=normId(employeeId);
  return all.some(x=>normId(x.employeeId)===id);
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function addRow(item){
  if(!els.listTbody) return;
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${esc(item.employeeId)}</td>
<td>${esc(item.department)}</td>
<td>${esc(item.fullName)}</td>
<td>${esc(item.choice)}</td>
<td>${esc(item.place||'')}</td>
<td>${item.createdAt?new Date(item.createdAt).toLocaleString('ja-JP'):''}</td>`;
  els.listTbody.appendChild(tr);
}
function renderList(items){ if(!els.listTbody) return; els.listTbody.innerHTML=''; items.forEach(addRow); }

async function postWebhook(data){
  if(!CONFIG.webhookUrl||CONFIG.webhookUrl.startsWith('<<')) return {ok:true,skipped:true};
  try{ const res=await fetch(CONFIG.webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); return {ok:res.ok,status:res.status}; }
  catch(e){ return {ok:false,error:String(e)}; }
}
function toCSV(items){
  const header=['employee_id','department','full_name','choice','place','created_at'];
  const rows=items.map(x=>[x.employeeId,x.department,x.fullName,x.choice,x.place||'',x.createdAt||'']);
  const all=[header,...rows];
  return all.map(cols=>cols.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
}
function download(name,content,mime='text/plain'){
  const blob=new Blob([content],{type:mime+';charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function handleCsvImport(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const text=reader.result; const lines=text.split(/\r?\n/).filter(Boolean);
      if(!lines.length) return;
      const header=lines[0].split(',').map(s=>s.replace(/^"|"$/g,''));
      const idx={employeeId:header.indexOf('employee_id'),department:header.indexOf('department'),fullName:header.indexOf('full_name'),choice:header.indexOf('choice'),place:header.indexOf('place'),createdAt:header.indexOf('created_at')};
      const current=loadLocal(); let added=0;
      for(let i=1;i<lines.length;i++){
        const cols=lines[i].match(/("([^"]|"")*"|[^,]+)/g); if(!cols) continue;
        const get=j=>(j>=0?cols[j].replace(/^"|"$/g,'').replace(/""/g,'"'):'');
        const item={employeeId:get(idx.employeeId),department:get(idx.department),fullName:get(idx.fullName),choice:get(idx.choice),place:get(idx.place),createdAt:get(idx.createdAt)||new Date().toISOString()};
        if(item.employeeId && !current.some(x=>normId(x.employeeId)===normId(item.employeeId))){ current.push(item); added++; }
      }
      saveLocal(current);
      loadCombined().then(renderList);
      alert(`取り込み完了：${added}件 追加しました。`);
    }catch(e){ console.error(e); alert('CSVの取り込みでエラーが発生しました。'); }
  };
  reader.readAsText(file,'utf-8');
}

document.addEventListener('DOMContentLoaded',()=>{
  els={
    form:q('reservation-form'),
    employeeId:q('employeeId'),
    department:q('department'),
    fullName:q('fullName'),
    choice:q('choice'),
    place:q('place'),
    listTbody:document.querySelector('#list tbody'),
    exportCsvBtn:q('exportCsvBtn'),
    clearBtn:q('clearBtn'),
    csvFile:q('csvFile'),
    adminToggle:q('adminToggle'),
  };

  applyAdminVisibility();
  window.addEventListener('hashchange',applyAdminVisibility);
  window.addEventListener('keydown',e=>{ if(e.altKey&&e.shiftKey&&(e.key==='A'||e.key==='a')){ e.preventDefault(); setAdminVisible(!document.body.classList.contains('admin-visible')); }});
  if(els.adminToggle){ els.adminToggle.addEventListener('click',()=>{ const to=!document.body.classList.contains('admin-visible'); if(to && !confirm('管理モードを表示しますか？\n（CSV出力・初期化など）')) return; setAdminVisible(to); if(to) loadCombined().then(renderList); }); }

  initDepartmentOptions();
  loadCombined().then(renderList);

  if(els.form){
    els.form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const employeeId=normId(els.employeeId.value), department=els.department.value, fullName=els.fullName.value.trim(), choice=els.choice.value, place=els.place.value;
      if(!employeeId||!department||!fullName||!choice||!place){ alert('未入力の項目があります。'); return; }
      if(await isDupAny(employeeId)){ alert('この社員番号は既に登録されています。重複登録はできません。'); return; }
      const entry={employeeId,department,fullName,choice,place,createdAt:new Date().toISOString()};
      const webhookRes=await postWebhook(entry);
      if(webhookRes && webhookRes.ok===false){ const cont=confirm('中央保存に失敗しました。ローカル保存のみ続行しますか？'); if(!cont) return; }
      const items=loadLocal(); items.push(entry); saveLocal(items);
      loadCombined().then(renderList);
      els.form.reset(); alert('登録しました。');
    });
  }

  if(els.exportCsvBtn){
    els.exportCsvBtn.addEventListener('click', async ()=>{
      const items=await loadCombined(); const csv=toCSV(items);
      const ts=new Date().toISOString().slice(0,10).replace(/-/g,''); download(`flu_reservations_${ts}.csv`, csv, 'text/csv');
    });
  }

  if(els.clearBtn){
    els.clearBtn.addEventListener('click', ()=>{
      const items=loadLocal();
      if(items.length===0){
        if(confirm('この端末には登録がありません。初期化しますか？（重複チェック履歴も消えます）')){ clearLocal(); loadCombined().then(renderList); alert('初期化しました。'); }
        return;
      }
      const ok=confirm('この端末に保存された登録データを全て削除します。よろしいですか？\n※ 事前にCSVエクスポートでバックアップ取得を推奨します。');
      if(!ok) return;
      clearLocal(); loadCombined().then(renderList); alert('初期化しました。');
    });
  }

  if(els.csvFile){ els.csvFile.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) handleCsvImport(f); }); }
});
