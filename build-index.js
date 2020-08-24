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
  const data = pkgs.map(p => [p.name, p.summary]);
  fs.writeFileSync("public/.index.json", JSON.stringify(data));
}

function getPackageNames() {
  return JSON.parse(fs.readFileSync("public/.package-names.json", "utf8"));
}
