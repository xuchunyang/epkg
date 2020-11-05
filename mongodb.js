const { MongoClient } = require("mongodb");

let cacheDb = null;
async function connectToDatabase() {
  if (cacheDb) return cacheDb;

  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://pc.lan:27017/epkg";
  const DB_NAME = new URL(MONGODB_URI).pathname.slice(1);
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`connecting to ${MONGODB_URI} ...`);
  await client.connect();
  console.log(`connected to ${MONGODB_URI}`);
  const db = await client.db(DB_NAME);
  cacheDb = db;

  return db;
}

async function list() {
  const db = await connectToDatabase();
  const collection = db.collection("packages");
  const projection = { name: 1, summary: 1, _id: 0 };
  const cursor = collection.find().project(projection);
  const array = await cursor.toArray();
  return array.map(({ name, summary }) => [name, summary]);
}

// list().then((x) => console.log(x));

async function info(name) {
  const db = await connectToDatabase();
  const collection = db.collection("packages");
  return await collection.findOne({ name });
}

module.exports = { list, info };

// info("magit").then((x) => console.log(x));
