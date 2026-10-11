/*
 * مزامنة بيانات "إدارة مشاريع الزمرة الملكية" مع Google Drive
 * غيّر المفتاح السري أدناه، ثم انشر السكربت كتطبيق ويب.
 * (Replace the secret key below, then deploy as a Web app.)
 */
var KEY = "CHANGE-ME-SECRET";
var FOLDER = "RoyalGroupApp";
var FILE = "RoyalGroup-Data.json";

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
}
function file_(fo) {
  var it = fo.getFilesByName(FILE);
  return it.hasNext() ? it.next() : fo.createFile(FILE, JSON.stringify({version: 0, docs: {}, del: {}}), MimeType.PLAIN_TEXT);
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput("Royal Group sync is running.");
}
function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({error: "bad"}); }
  if (b.key !== KEY) return out_({error: "auth"});
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var fo = folder_(), fl = file_(fo);
    var txt = fl.getBlob().getDataAsString("UTF-8");
    var d = JSON.parse(txt);
    if (b.action === "meta") return out_({version: d.version});
    if (b.action === "pull") return out_(d);
    if (b.action === "push") {
      if (b.base !== d.version) return out_({conflict: true, version: d.version});
      var pv = fo.getFilesByName("prev-" + FILE);
      var pf = pv.hasNext() ? pv.next() : fo.createFile("prev-" + FILE, "", MimeType.PLAIN_TEXT);
      pf.setContent(txt);
      var n = {version: d.version + 1, docs: b.docs || {}, del: b.del || {}};
      fl.setContent(JSON.stringify(n));
      return out_({ok: true, version: n.version});
    }
    return out_({error: "bad"});
  } finally {
    lock.releaseLock();
  }
}
