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
            console.log(topic)

            if (!topic || !topic.trim()) {
                return res.status(400).json({ error: "Topic is required." });
            }

            try {
                const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`,
                    {
                        method: "POST",
                        headers: {
                        Authorization: `Bearer ${hugging_face_api_key}`,
                        "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ inputs: `Answer this student question clearly:\n\n${topic}` }),
                    }
                );
                console.log(response)

                // Check if HF returned JSON
                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } 
                catch {
                    console.error("HF API returned non-JSON:", text);
                    return res.status(500).json({ error: "Hugging Face API returned invalid response", details: text });
                }

                // Extract answer
                const aiText =
                data?.[0]?.generated_text ||
                "⚠️ Sorry, the AI could not generate an answer right now.";

                res.json({ answer: aiText });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Error fetching AI response", details: error.message });
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