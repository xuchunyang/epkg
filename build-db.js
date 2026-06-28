const fs = require("fs");
const https = require("https");
const { spawn } = require("child_process");

const dbFile = process.env.DB || "epkg.sqlite3";
const sqlURL = "https://raw.githubusercontent.com/emacsmirror/epkgs/master/epkg.sql";

run().catch(err => {
  process.exitCode = 1;
  throw err;
});

async function run() {
  fs.rmSync(dbFile, { force: true });
  const sql = await download(sqlURL);
  await importSQL(sql);
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

function importSQL(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn("sqlite3", [dbFile], { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`sqlite3 exited with code ${code}`));
      }
    });
    child.stdin.end(sql);
  });
}
