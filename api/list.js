const { list } = require("../mongodb.js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", `max-age=${3600 * 12}, s-maxage=${30 * 24 * 3600}`);
  
  try {
    const data = await list();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
