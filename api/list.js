module.exports = (req, res) => {
  const start_time = new Date();
  const sqlite3 = require("sqlite3");
  const db = new sqlite3.Database("epkg.sqlite3");
  const sql = "select name, summary from packages";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json(err);
      return;
    }
    const unquote = (s) => {
      // all package names are non-nil, while some summaries are null
      if (s === null) {
        return null;
      }
      return s.substring(1, s.length - 1);
    };
    const data = rows.map(({ name, summary }) => [
      unquote(name),
      unquote(summary),
    ]);
    const length = data.length;
    const cost = `${new Date() - start_time} milliseconds`;
    res.status(200).json({ length, cost, data });
  });
  db.close();
};
