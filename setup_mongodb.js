const { readFileSync } = require("fs");
const { MongoClient } = require("mongodb");
const { allPackages } = require("./db.js");
const { basename } = require("path");

const main = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://pc.lan:27017/epkg";
  console.log(`Connecting to ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI, {
    useUnifiedTopology: true,
  });
  await client.connect();
  const db = client.db(basename(MONGODB_URI));
  console.log(`Connected to ${MONGODB_URI}`);

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
