const fs = require("fs");
const initSqlJs = require("sql.js");

run().catch(err => {
  process.exitCode = 1;
  throw err;
});

async function run() {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(process.env.DB || "epkg.sqlite3");
  const db = new SQL.Database(data);

  try {
    const packageNames = buildPackageNames(db);
    buildPackages(db);
    fs.writeFileSync("public/.package-names.json", JSON.stringify(packageNames));
  } finally {
    db.close();
  }
}

function buildPackageNames(db) {
  fs.mkdirSync("public", { recursive: true });
  return all(db, "select name from packages").map(row => unquoteSimple(row.name));
}

function buildPackages(db) {
  const rows = all(db, "SELECT * FROM packages");

  for (const row of rows) {
    for (const col in row) {
      if (row[col] === "eieio-unbound") {
        if (col.endsWith("_recipes")) {
          delete row[col];
          continue;
        }
        // libraries provided required keywords authors maintainers builtin_libraries
        row[col] = all(db, `SELECT * FROM ${col} WHERE package = ?`, [row.name], "package");
      }
    }

    row.required_by = all(
      db,
      "select * from required where feature = ?",
      [unquoteSimple(row.name)],
      "feature"
    );

    unquoteObj(row);
    const path = `public/${row.name}.json`;
    fs.writeFileSync(path, JSON.stringify(row, null, 2) + "\n");
  }

  console.log("Total %d packages", rows.length);
}

function all(db, query, params = [], del) {
  const stmt = db.prepare(query);
  const rows = [];

  try {
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (del) {
        delete row[del];
      }
      rows.push(row);
    }
  } finally {
    stmt.free();
  }

  return rows;
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
