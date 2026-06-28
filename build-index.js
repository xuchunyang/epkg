const fs = require("fs");
const assert = require("assert").strict;
const Mustache = require("mustache");

run().catch(e => {
  // NOTE Right now, throw promise rejections does not set exitCode to non-zero
  process.exitCode = 1;
  throw e;
});

async function run() {
  const packageNames = getPackageNames();
  const pkgs = packageNames.map(pkgName => {
    const jsonFile = `public/${pkgName}.json`;
    const pkg = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
    fixHomepage(pkg);
    return toIndexPackage(pkg);
  });
  fs.writeFileSync("public/.index.json", JSON.stringify(pkgs));
}

function getPackageNames() {
  return JSON.parse(fs.readFileSync("public/.package-names.json", "utf8"));
}

function toIndexPackage(pkg) {
  return {
    name: pkg.name,
    summary: pkg.summary || "",
    author: formatAuthors(pkg.authors),
    updated: formatUpdated(pkg.updated),
    homepage: pkg.homepage || "",
    stars: numberOrNull(pkg.stars),
    downloads: numberOrNull(pkg.downloads),
    dependencyCount: Array.isArray(pkg.required) ? pkg.required.length : 0,
    reverseDependencyCount: Array.isArray(pkg.required_by) ? pkg.required_by.length : 0
  };
}

function formatAuthors(authors) {
  if (!Array.isArray(authors)) return "";
  return authors.map(author => author.name).filter(Boolean).join(", ");
}

function formatUpdated(updated) {
  if (!updated) return null;
  assert.equal(updated.length, 8);
  const year = updated.slice(0, 4);
  const month = updated.slice(4, 6);
  const day = updated.slice(6);
  const iso = `${year}-${month}-${day}`;
  const date = new Date(iso);
  return {
    iso,
    readable: formatDate(date),
    timestamp: date.getTime()
  };
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function fixHomepage(pkg) {
  pkg.homepage = pkg.homepage || pkg.url;
  if (pkg.homepage) {
    if (pkg.homepage.startsWith("git@github.com:")) {
      pkg.homepage = pkg.homepage.replace(/^git@github.com:(.*)\.git$/, "https://github.com/$1");
      return;
    }
    if (pkg.homepage.startsWith("git@gitlab.com:")) {
      pkg.homepage = pkg.homepage.replace(/^git@gitlab.com:(.*)\.git$/, "https://gitlab.com/$1");
      return;
    }
  }
}

function formatDate(d) {
  const year = d.getFullYear();
  const mon = d.getMonth();
  const day = d.getDate();
  const monthAbbrev = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return [year, monthAbbrev[mon], leftpad0(day, 2)].join("-");
}

function leftpad0(n, len) {
  let s = n.toString();
  while (s.length < len) {
    s = "0" + s;
  }
  return s;
}
