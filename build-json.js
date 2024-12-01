const fs = require("fs");

// https://github.com/mapbox/node-sqlite3/wiki/API
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(process.env.DB || "epkg.sqlite3");

buildPackageNames();
buildPackages();

function buildPackageNames() {
  fs.mkdirSync(`public`, { recursive: true });
  db.all(`select name from packages`, [], (err, rows) => {
    const packages = rows.map(row => unquoteSimple(row.name));
    const filename = "public/.package-names.json";
    fs.writeFile(filename, JSON.stringify(packages), (err) => {
      if (err) throw err;
      // console.log(`Wrote ${packages.length} package names to ${filename}`);
    });
  });
}

function buildPackages() {
  db.each(
    `SELECT * FROM packages`,
    [],
    (err, row) => {
      if (err) throw err;
      const promises = [];
      for (const col in row) {
        if (row[col] === "eieio-unbound") {

          if (col.endsWith('_recipes')) {
            delete row[col];
            continue;
          }
          // libraries provided required keywords authors maintainers builtin_libraries
          promises.push(
            all(`SELECT * FROM ${col} WHERE package = ?`, [row.name], col)
          );
        }
      }
      promises.push(
        all(
          `select * from required where feature = ?`,
          [unquoteSimple(row.name)],
          "required_by",
          "feature"
        )
      );
      Promise.all(promises).then((values) => {
        for (const [key, val] of values) {
          row[key] = val;
        }
        // console.dir(row, { depth: null });
        unquoteObj(row);
        // row.name = unquoteEmacsLispString(row.name);
        const path = `public/${row.name}.json`;
        fs.writeFileSync(path, JSON.stringify(row, null, 2) + "\n");
      });
    },
    (err, num) => {
      if (err) throw err;
      console.log("Total %d packages", num);
    }
  );
}

function all(query, params, col, del = "package") {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        rows.forEach((row) => delete row[del]);
        resolve([col, rows]);
      }
    });
  });
}

// expect it's much faster than unquoteEmacsLispString
function unquoteSimple(s) {
  return s.substring(1, s.length - 1);
}

// "ag" => ag
function unquoteEmacsLispString(s) {
  // NOTE this does NOT work in strict mode, e.g., ES6 module, because
  // "Octal escape sequences are not allowed in strict mode."
  return eval(s);
}

function unquoteObj(obj) {
  for (const k in obj) {
    const v = obj[k];
    if (typeof v === "string") {
      // looks like an Emacs Lisp string
      if (v[0] === '"' && v[v.length - 1] === '"') {
        obj[k] = unquoteEmacsLispString(v);
      }
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        unquoteObj(v[i]);
      }
    }
  }
}
