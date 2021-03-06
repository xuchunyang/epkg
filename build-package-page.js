const fs = require("fs").promises;
const assert = require("assert").strict;
const Mustache = require("mustache");

run().catch(e => {
  // NOTE Right now, throw promise rejections does not set exitCode to non-zero
  process.exitCode = 1;
  throw e;
});

async function run() {
  const template = await fs.readFile("package.mustache", "utf8");
  Mustache.parse(template);
  const packageNames = await getPackageNames();
  for (const pkgName of packageNames) {
    await buildHTML(pkgName, template);
  }
  console.log(`Wrote ${packageNames.length} HTML files`);
}

async function buildHTML(pkgName, template) {
  const jsonFile = `public/${pkgName}.json`;
  const pkg = JSON.parse(await fs.readFile(jsonFile, "utf8"));
  assert.equal(pkgName, pkg.name);
  fixHomepage(pkg);
  fixUpdated(pkg);
  pkg.hasDependencies = pkg.required.length > 0;
  pkg.hasReverseDependencies = pkg.required_by.length > 0;
  if (pkg.authors) {
    pkg.authors_rendered =
      pkg.authors.map(author => author.name).join(", ");
  }
  const dir = `public/${pkgName}`;
  await fs.mkdir(`public/${pkgName}`, { recursive: true });
  const file = `${dir}/index.html`;
  await fs.writeFile(file, Mustache.render(template, pkg));
  // console.log(`Wrote ${file}`);
}

async function getPackageNames() {
  return JSON.parse(await fs.readFile("public/.package-names.json", "utf8"));
}

function fixHomepage(pkg) {
  pkg.homepage = pkg.homepage || pkg.url;
  if (pkg.homepage) {
    // git@github.com:etu/0blayout-mode.git
    if (pkg.homepage.startsWith("git@github.com:")) {
      pkg.homepage = pkg.homepage.replace(/^git@github.com:(.*)\.git$/, "https://github.com/$1");
      return;
    }
    // git@gitlab.com:egh/zotxt-emacs.git
    if (pkg.homepage.startsWith("git@gitlab.com:")) {
      pkg.homepage = pkg.homepage.replace(/^git@gitlab.com:(.*)\.git$/, "https://gitlab.com/$1");
      return;
    }
  }
}

function fixUpdated(pkg) {
  if (pkg.updated) {
    // "20200816"
    assert.equal(pkg.updated.length, 8);
    const year = pkg.updated.slice(0, 4);
    const month = pkg.updated.slice(4, 6);
    const day = pkg.updated.slice(6);
    const iso = `${year}-${month}-${day}`;
    const date = new Date(iso);
    const readable = formatDate(date);
    pkg.updated = {
      iso,
      readable
    };
  }
}

// (format-time-string "%Y-%b-%d")
// => "2020-Aug-19"
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
