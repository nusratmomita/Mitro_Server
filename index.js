const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { default: fetch } = require('node-fetch');


const port = process.env.PORT || 9000;

const app = express();

app.use(cors());
app.use(express.json());

const hugging_face_api_key = process.env.HUGGING_FACE_KEY;
const modelName = "google/flan-t5-small";
// console.log(hugging_face_api_key)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1k8uoge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

    const subjectsCollection = client.db("Mitro").collection("subjects");
    const budgetCollection = client.db("Mitro").collection("budget");

    try {

        // * Subject Schedule
        // to get all the subject data
        app.get("/subjects", async(req,res) => {
            const allSubjects = await subjectsCollection.find().toArray();
            res.send(allSubjects);
        });

        // to create a new subject
        app.post("/subjects", async(req,res)=>{
            // res.send("Subjects calling!!")
            const newSubject = req.body;
            const result = await subjectsCollection.insertOne(newSubject);
            res.send(result);
        });

        // * Budget tracker
        // to create a new budget entry
        app.post("/budget", async(req,res)=>{
            const newBudget = req.body;
            const result = await budgetCollection.insertOne(newBudget);
            res.send(result);
        });

        app.post("/api/answer", async (req, res) => {
  const { topic } = req.body;

  if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required." });
  }

  try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Answer this question clearly in 4-5 lines:\n\n${topic}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      console.log("Gemini Response:", data);

      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ Sorry, Gemini could not generate an answer.";

      res.json({ answer: aiText });

  } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error fetching AI response",
        details: error.message
      });
  }
});



        

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