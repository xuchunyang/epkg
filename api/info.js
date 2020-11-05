const { info } = require("../mongodb.js");

module.exports = async (req, res) => {
  const {
    query: { name },
  } = req;

  if (!name) {
    res.status(400).json({ error: "Missing package name" });
    return;
  }

  try {
    const data = await info(name);
    // when no match found, data is null
    if (!data) {
      res.status(404).json({ error: `No such package: ${name}` });
      return;
    }
    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
