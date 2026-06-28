const fs = require("fs");
const https = require("https");
const initSqlJs = require("sql.js");

const dbFile = process.env.DB || "epkg.sqlite3";
const sqlURL = "https://raw.githubusercontent.com/emacsmirror/epkgs/master/epkg.sql";

run().catch(err => {
  process.exitCode = 1;
  throw err;
});

async function run() {
  fs.rmSync(dbFile, { force: true });
  const SQL = await initSqlJs();
  const sql = await download(sqlURL);
  const db = new SQL.Database();
  db.run(sql);
  fs.writeFileSync(dbFile, Buffer.from(db.export()));
  db.close();
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        res.resume();
        return;
      }

      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}
