const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const db = new sqlite3.Database("epkg.sqlite3");

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

const fillPackage = async (pkg) => {
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
  ).reduce((acc, elt) => acc.concat(elt), []);

  unquoteObj(pkg);
  console.log("Filled", pkg.name);
  return pkg;
};

const queryPackage = async (name) => {
  const pkg = await dbGet(`select * from packages where name = ?`, [
    `"${name}"`,
  ]);
  if (!pkg) return;
  return fillPackage(pkg);
};

const list = async () => {
  const rows = await dbAll(`select name from packages`, []);
  const unquote = (s) => s.substring(1, s.length - 1);
  return rows.map((o) => unquote(o.name));
};

const allPackages = async () => {
  const pkgs = await dbAll(`select * from packages`);
  return Promise.all(pkgs.map(fillPackage));
};

const dumpToJson = (jsonFile) => {
  allPackages().then((pkgs) => {
    const count = pkgs.length;
    const data = {};
    pkgs.forEach((pkg) => {
      data[pkg.name] = pkg;
    });
    const updated = new Date().toJSON();
    const obj = {
      count,
      updated,
      data,
    };
    fs.writeFileSync(jsonFile, JSON.stringify(obj, null, 2));
    db.close();
  });
};

module.exports = { db, queryPackage, list, dumpToJson };

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
