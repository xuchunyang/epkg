const fs = require("fs").promises;
const assert = require("assert").strict;
const Mustache = require("mustache");

run().catch(e => {
  throw e;
});

async function run() {
  const template = await fs.readFile("package.mustache", "utf8");
  Mustache.parse(template);
  const packageNames = await getPackageNames();
  packageNames.forEach(pkgName => {
    buildHTML(pkgName, template);
  });
}

async function buildHTML(pkgName, template) {
  const jsonFile = `public/${pkgName}.json`;
  const pkg = JSON.parse(await fs.readFile(jsonFile, "utf8"));
  fixHomepage(pkg);
  fixUpdated(pkg);
  assert.ok(pkgName === pkg.name);
  const dir = `public/${pkgName}`;
  await fs.mkdir(`public/${pkgName}`, { recursive: true });
  const file = `${dir}/index.html`;
  await fs.writeFile(file, Mustache.render(template, pkg));
  console.log(`Wrote ${file}`);
}

async function getPackageNames() {
  return JSON.parse(await fs.readFile("public/package-names.json", "utf8"));
}

function fixHomepage(pkg) {
  pkg.homepage = pkg.homepage || pkg.url;
  // "git@github.com:etu/0blayout-mode.git"
  if (pkg.homepage && pkg.homepage.startsWith("git@github.com:")) {
    pkg.homepage = pkg.homepage.replace(/^git@github.com:(.*)\.git$/, "https://github.com/$1")
  }
}

function fixUpdated(pkg) {
  if (pkg.updated) {
    // "20200816"
    const year = pkg.updated.slice(0, 4);
    const month = pkg.updated.slice(4, 6);
    const day = pkg.updated.slice(6);
    const date = new Date(`${year}-${month}-${day}`);
    pkg.updated = date;
  }
}
