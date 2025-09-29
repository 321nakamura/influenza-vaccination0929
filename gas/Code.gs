// ===== Google Apps Script (Code.gs) =====
// 1) スプレッドシートを用意し、1行目に以下の見出しを入れてください。
//    employee_id, department, full_name, choice, place, created_at
// 2) SHEET_ID に対象スプレッドシートのIDを設定してください。
// 3) デプロイ → ウェブアプリ → 「全員」アクセス可 でURLを発行し、
//    そのURLを app.js の CONFIG.webhookUrl / remoteJsonUrl に設定します。

const SHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';

function sheet(){ return SpreadsheetApp.openById(SHEET_ID).getSheets()[0]; }

function doOptions(e){
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e){
  try{
    const data = JSON.parse(e.postData && e.postData.contents || '{}');
    sheet().appendRow([
      data.employeeId || '',
      data.department || '',
      data.fullName || '',
      data.choice || '',
      data.place || '',
      data.createdAt || new Date().toISOString(),
    ]);
    return _json({ ok:true });
  }catch(err){
    return _json({ ok:false, error:String(err) });
  }
}

function doGet(e){
  const values = sheet().getDataRange().getValues();
  if(!values || values.length===0) return _json({ ok:true, items: [] });
  const header = values.shift();
  const idx = {
    employee_id: header.indexOf('employee_id'),
    department: header.indexOf('department'),
    full_name: header.indexOf('full_name'),
    choice: header.indexOf('choice'),
    place: header.indexOf('place'),
    created_at: header.indexOf('created_at'),
  };
  const items = values.map(r => ({
    employeeId: r[idx.employee_id] || '',
    department: r[idx.department] || '',
    fullName: r[idx.full_name] || '',
    choice: r[idx.choice] || '',
    place: r[idx.place] || '',
    createdAt: r[idx.created_at] || '',
  }));
  return _json({ ok:true, items });
}

function _json(obj){
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
