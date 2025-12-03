const express = require("express");
const path = require("path");

const app = express();
const logger = require("./logger");

app.use(logger);
app.use("/images", express.static(path.join(__dirname, "images")));

// 2️⃣ IMAGE NOT FOUND ERROR HANDLER
app.use("/images", (req, res) => {
  return res.status(404).json({ error: "Image not found" });
});


app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  next();
});

const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
let db;
MongoClient.connect(
  "mongodb+srv://hassan:hassangazder321@cluster0.7qjb5ax.mongodb.net",
  (err, client) => {
    db = client.db("webstore");
  }
);

app.get("/", (req, res, next) => {
  res.send("Hello World");
});

app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  return next();
});

app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.send(results);
  });
});

app.post("/placeorder", (req, res, next) => {
  const name = req.body.name;
  const number = req.body.number;
  const cart = req.body.cart;

  if (!name || !number || !cart || cart.length === 0) {
    return res.status(400).send({ msg: "Invalid order data" });
  }

  const ordersCollection = db.collection("orders");
  const productsCollection = db.collection("products");

  ordersCollection.insertOne(
    {
      name: name,
      number: number,
      cart: cart,
      createdAt: new Date(),
    },
    (err, result) => {
      if (err) {
        console.log("Error saving order:", err);
        return res.status(500).send({ msg: "Error placing order" });
      }
      res.json({
        msg: "Order placed successfully",
        orderId: result.insertedId,
      });
    }
  );
});
app.put("/update-spaces", async (req, res) => {
  const cart = req.body.cart;

  if (!cart || cart.length === 0) {
    return res.status(400).send({ msg: "Cart is empty" });
  }

  const productsCollection = db.collection("products");

  try {
    for (let item of cart) {
      await productsCollection.updateOne(
        { id: item.id },
        { $inc: { Spaces: -item.quantity } }
      );
    }

    res.json({ msg: "Spaces updated successfully" });

  } catch (err) {
    console.log("Error updating spaces:", err);
    res.status(500).send({ msg: "Failed to update spaces" });
  }
});
app.get("/search", (req, res) => {
  const search = req.query.search || "";

  // If search box empty → return all products
  if (!search.trim()) {
    return db.collection("products")
      .find({})
      .toArray((err, data) => {
        if (err) return res.status(500).send({ msg: "DB error" });
        res.send(data);
      });
  }

  // Search in Subject or Location fields
  db.collection("products")
    .find({
      $or: [
        { Subject: { $regex: search, $options: "i" } },   // case-insensitive
        { Location: { $regex: search, $options: "i" } }
      ]
    })
    .toArray((err, data) => {
      if (err) return res.status(500).send({ msg: "DB error" });
      res.send(data);
    });
});

const port = 3000 || process.env.PORT;

app.listen(port, () => {
  console.log(`Server started on Port ${app.get("port")}`);
});
