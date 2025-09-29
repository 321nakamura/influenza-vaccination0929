// GAS Code.gs （SHEET_ID を実シートIDに置換してデプロイしてください）
const SHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';
function sheet(){ return SpreadsheetApp.openById(SHEET_ID).getSheets()[0]; }
function doOptions(e){ return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT); }
function doPost(e){ try{ const d=JSON.parse(e.postData&&e.postData.contents||'{}'); sheet().appendRow([d.employeeId||'',d.department||'',d.fullName||'',d.choice||'',d.place||'',d.createdAt||new Date().toISOString()]); return _json({ok:true}); }catch(err){ return _json({ok:false,error:String(err)}); } }
function doGet(e){ const v=sheet().getDataRange().getValues(); if(!v||v.length===0) return _json({ok:true,items:[]}); const h=v.shift(); const idx={employee_id:h.indexOf('employee_id'),department:h.indexOf('department'),full_name:h.indexOf('full_name'),choice:h.indexOf('choice'),place:h.indexOf('place'),created_at:h.indexOf('created_at')}; const items=v.map(r=>({employeeId:r[idx.employee_id]||'',department:r[idx.department]||'',fullName:r[idx.full_name]||'',choice:r[idx.choice]||'',place:r[idx.place]||'',createdAt:r[idx.created_at]||''})); return _json({ok:true,items}); }
function _json(o){ const out=ContentService.createTextOutput(JSON.stringify(o)); out.setMimeType(ContentService.MimeType.JSON); return out; }
