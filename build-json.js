const fs = require("fs");
const { execFileSync } = require("child_process");

const db = process.env.DB || "epkg.sqlite3";

buildPackageNames();
buildPackages();

function buildPackageNames() {
  fs.mkdirSync("public", { recursive: true });
  const packages = all("select name from packages").map(row => unquoteSimple(row.name));
  const filename = "public/.package-names.json";
  fs.writeFileSync(filename, JSON.stringify(packages));
}

function buildPackages() {
  const rows = all("SELECT * FROM packages");

  for (const row of rows) {
    for (const col in row) {
      if (row[col] === "eieio-unbound") {
        if (col.endsWith("_recipes")) {
          delete row[col];
          continue;
        }
        // libraries provided required keywords authors maintainers builtin_libraries
        row[col] = all(`SELECT * FROM ${col} WHERE package = ${sqlQuote(row.name)}`, "package");
      }
    }

    row.required_by = all(
      `select * from required where feature = ${sqlQuote(unquoteSimple(row.name))}`,
      "feature"
    );

    unquoteObj(row);
    const path = `public/${row.name}.json`;
    fs.writeFileSync(path, JSON.stringify(row, null, 2) + "\n");
  }

  console.log("Total %d packages", rows.length);
}

function all(query, del) {
  const output = execFileSync("sqlite3", ["-json", db, query], { encoding: "utf8" });
  const rows = output ? JSON.parse(output) : [];
  if (del) {
    rows.forEach(row => delete row[del]);
  }
  return rows;
}

function sqlQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
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
