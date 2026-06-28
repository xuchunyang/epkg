const fs = require("fs");
const https = require("https");
const sqlite3 = require("sqlite3").verbose();

const dbFile = process.env.DB || "epkg.sqlite3";
const sqlURL = "https://raw.githubusercontent.com/emacsmirror/epkgs/master/epkg.sql";

run().catch(err => {
  process.exitCode = 1;
  throw err;
});

async function run() {
  fs.rmSync(dbFile, { force: true });
  const sql = await download(sqlURL);
  const db = new sqlite3.Database(dbFile);
  await exec(db, sql);
  await close(db);
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

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
