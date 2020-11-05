const { list } = require("../mongodb.js");

module.exports = async (req, res) => {
  try {
    const data = await list();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
