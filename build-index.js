const fs = require("fs");
const assert = require("assert").strict;
const Mustache = require("mustache");

run();

async function run() {
  const packageNames = getPackageNames();
  const pkgs = packageNames.map(pkgName => {
    const jsonFile = `public/${pkgName}.json`;
    return JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  });
  const view = {pkgs};
  const template = fs.readFileSync("index.mustache", "utf8");
  fs.writeFileSync("public/index.html", Mustache.render(template, view));
  fs.copyFileSync("index.css", "public/index.css");
}

function getPackageNames() {
  return JSON.parse(fs.readFileSync("public/package-names.json", "utf8"));
}
