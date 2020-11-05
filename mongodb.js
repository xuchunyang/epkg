const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://pc.lan:27017/epkg";
const DB_NAME = new URL(MONGODB_URI).pathname.slice(1);
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function list() {
  try {
    console.log(`connecting to ${MONGODB_URI} ...`);
    await client.connect();
    console.log(`connected to ${MONGODB_URI}`);
    const db = client.db(DB_NAME);
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

// list().then((x) => console.log(x));

async function info(name) {
  try {
    console.log(`connecting to ${MONGODB_URI} ...`);
    await client.connect();
    console.log(`connected to ${MONGODB_URI}`);
    const db = client.db(DB_NAME);
    const collection = db.collection("packages");
    return await collection.findOne({ name });
  } finally {
    console.log("closing mongodb connection");
    await client.close();
  }
}

module.exports = { list, info };

// info("magit").then((x) => console.log(x));
