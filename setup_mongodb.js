const { readFileSync } = require("fs");
const { MongoClient } = require("mongodb");
const { allPackages } = require("./db.js");
const { basename } = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://pc.lan:27017/epkg";
const DB_NAME = new URL(MONGODB_URI).pathname.slice(1);
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const main = async () => {
  console.log(`Connecting to ${MONGODB_URI}...`);
  await client.connect();
  console.log(`Connected to ${MONGODB_URI}`);
  const db = client.db(DB_NAME);
  console.log("Getting packages from SQLite...");
  const pkgs = await allPackages();
  console.log(`Got ${pkgs.length} packages`);

  console.log("Inserting them into mongodb...");
  const collection = db.collection("packages");
  await collection.insertMany(pkgs);
  console.log("Inserting them into mongodb...done");

  console.log("Creating index...");
  await collection.createIndex(
    {
      name: 1,
    },
    {
      name: "Package name",
      unique: true,
    }
  );
  console.log("Creating index...done");
  await client.close();
};

main();
