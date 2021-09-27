import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ObjectID } from "mongodb";
import path from "path";

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });

    try {
      const db = client.db("my-blog");
      await operations(db);
    } finally {
      client.close();
    }
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

// app.get("/hello", (req, res) => {
//   res.send("Hello!");
// });
// app.get("/hello/:name", (req, res) => {
//   res.send(`Hello ${req.params.name}!`);
// });
// app.post("/hello", (req, res) => {
//   res.send(`Hello1! ${req.body.name}`);
// });

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    await db
      .collection("articles")
      .updateOne({ name: articleName }, { $inc: { upvotes: 1 } });

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;

  withDB(async (db) => {
    const articleName = req.params.name;
    // const articleInfo = await db
    //   .collection("articles")
    //   .findOne({ name: articleName });
    // await db.collection("articles").updateOne(
    //   { name: articleName },
    //   {
    //     "$set": { comments: articleInfo.comments.concat({username, text}) },
    //   }
    // );

    // using MongoDB Array Update Operator - $push
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $push: { comments: { username, text } },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);

    // articlesInfo[articleName].comments.push({
    //   username,
    //   text,
    // });
    // res.status(200).send(articlesInfo[articleName]);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

app.listen(8000, () => {
  console.log("Listening on port 8000.");
});
