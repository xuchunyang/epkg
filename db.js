const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.resolve(__dirname, "epkg.sqlite3"));

dbGet = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

dbAll = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryPackage = async (name) => {
  const pkg = await dbGet(`select * from packages where name = ?`, [
    `"${name}"`,
  ]);
  if (!pkg) return;
  const promises = [];
  for (const key in pkg) {
    if (pkg[key] === "eieio-unbound") {
      // in gelpa_recipes and melpa_recipes the name pakage is replaced by
      // epkg_package
      let pkgFieldName = "package";
      if (key === "gelpa_recipes" || key === "melpa_recipes") {
        pkgFieldName = "epkg_package";
      }
      promises.push(
        dbAll(`select * from ${key} where ${pkgFieldName} = ?`, [
          pkg.name,
        ]).then((rows) => [
          key,
          rows.map((row) => {
            delete row[pkgFieldName];
            return row;
          }),
        ])
      );
    }
  }
  const values = await Promise.all(promises);
  for (const [key, val] of values) {
    pkg[key] = val;
  }

  pkg.required_by = (
    await Promise.all(
      pkg.provided.map(({ feature }) => {
        return dbAll(`select * from required where feature = ?`, [feature]);
      })
    )
  ).reduce((acc, elt) => acc.concat(elt));

  unquoteObj(pkg);
  return pkg;
};

module.exports = { db, queryPackage };

function unquoteSimple(s) {
  return s.substring(1, s.length - 1);
}

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
