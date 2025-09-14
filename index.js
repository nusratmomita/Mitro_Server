const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 9000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1k8uoge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
  }
}


run().catch(console.dir);






app.get("/", async(req,res)=>{
    res.send("Mitro server is running");
})

app.listen(port, ()=>{
    console.log(`Mitro server is running on port ${port}`)
})