module.exports = async (req, res) => {
  const {
    query: { name },
  } = req;

  if (!name) {
    res.status(400).json({ error: "Missing package name" });
    return;
  }

  try {
    const { db, queryPackage } = require("../db.js");
    const data = await queryPackage(name);
    db.close();
    // when no match found, data is undefined
    if (!data) {
      res.status(404).json({ error: `No such package: ${name}` });
      return;
    }
    const nunjucks = require("nunjucks");
    nunjucks.configure({ autoescape: true });
    const myData = {};
    myData.name = data.name;
    myData.summary = data.summary;
    myData.url =
      data.homepage ||
      data.url ||
      data.wikipage ||
      data.repopage ||
      data.mirrorpage ||
      data.mirror_url;
    if (myData.url) {
      myData.url = fixGitUrl(myData.url);
    }
    myData.authors = data.authors
      .map((o) => o.name)
      .filter((x) => x)
      .join(", ");
    myData.maintainers = data.maintainers
      .map((o) => o.name)
      .filter((x) => x)
      .join(", ");
    myData.updated = data.updated;
    myData.license = data.license;
    myData.commentary = data.commentary;
    myData.required = data.required;
    myData.required_by = uniq(data.required_by.map(o => o.package)).sort();
    const html = nunjucks.render("template.njk", myData);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.end(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

function uniq(arr) {
  const set = new Set(arr);
  return [...set.values()];
}

function fixGitUrl(url) {
  // git@github.com:etu/0blayout-mode.git
  if (url.startsWith("git@github.com:")) {
    return url.replace(/^git@github.com:(.*)\.git$/, "https://github.com/$1");
  }
  // git@gitlab.com:egh/zotxt-emacs.git
  if (url.startsWith("git@gitlab.com:")) {
    return url.replace(/^git@gitlab.com:(.*)\.git$/, "https://gitlab.com/$1");
  }
  return url;
}
