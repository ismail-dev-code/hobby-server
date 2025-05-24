const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pw0rah1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;




const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
    await client.connect();

    const hobbiesCollection = client.db("hobbyNewDB").collection("newHobbies");

    app.get("/all-group", async (req, res) => {
      const result = await hobbiesCollection.find().toArray();
      res.send(result);
    });

    app.get("/my-groups", async (req, res) => {
      const email = req.query.email;
      const groups = await hobbiesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(groups);
    });
    // get group by ID
    app.get("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update group by ID
    app.put("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const updatedGroup = req.body;
      const result = await hobbiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedGroup }
      );
      res.send(result);
    });

    app.post("/create-group", async (req, res) => {
      const newGroup = req.body;
      console.log(newGroup);
      const result = await hobbiesCollection.insertOne(newGroup);
      res.send(result);
    });

    app.delete("/all-group/:id", async (req, res) => {
      const id = req.params.id;
      const result = await hobbiesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
        // POST route for chatbot
    app.post("/chat", async (req, res) => {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo", 
            messages: messages,
            max_tokens: 150,
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_HOBBY_BD_OPENAI_API_KEY}`,
            },
          }
        );

        res.send(response.data);
      } catch (error) {
        console.error("OpenAI error:", error?.response?.data || error.message);
        res.status(500).json({
          error: "Failed to get response from OpenAI",
          details: error?.response?.data || error.message,
        });
      }
    });

    
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("HobbyHub Server is running");
});

app.listen(port, () => {
  console.log(`HobbyHub server running on port: ${port}`);
});