const fs = require("fs");

module.exports = (req, res) => {
  res.end(`${process.env.PWD}
.
${fs.readdirSync(".")}


..
${fs.readdirSync("..")};


path.resolve(__dirname, "epkg.sqlite3")
`);
};
