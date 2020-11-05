const { basename } = require("path");
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://pc.lan:27017/epkg";
const client = new MongoClient(MONGODB_URI, {
  useUnifiedTopology: true,
});

async function list() {
  try {
    await client.connect();
    const db = client.db(basename(MONGODB_URI));
    const collection = db.collection("packages");
    const projection = { name: 1, summary: 1, _id: 0 };
    const cursor = collection.find().project(projection);
    const array = await cursor.toArray();
    return array.map(({ name, summary }) => [name, summary]);
  } finally {
    console.log("closing mongodb connection");
    await client.close();
  }
}

list().then((x) => console.log(x));

module.exports = { list };
