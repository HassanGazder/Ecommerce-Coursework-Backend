const express = require("express");
const app = express();
const logger = require("./logger");

app.use(logger);


app.use(express.json());
app.set("PORT", 3000);
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
// adding post method to add data to database
// app.post("/collection/:collectionName", (req, res, next) => {
//   req.collection.insert(req.body, (e, result) => {
//     if (e) return next(e);
//     res.send(result.ops);
//   });
// });
app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new ObjectId(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result);
  });
});

app.put("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.update(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body },
    { safe: true, mutli: false },
    (e, result) => {
      if (e) return next(e);
      res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});
app.delete("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.deleteOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body },
    (e, result) => {
      if (e) return next(e);
      res.send(result);
    }
  );
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
// app.put("/update-spaces", async (req, res) => {
//   const cart = req.body.cart; 
//   // cart example: [{ id: 1, quantity: 2 }, {id: 3, quantity: 1}]

//   if (!cart || cart.length === 0) {
//     return res.status(400).json({ message: "Cart missing" });
//   }

//   try {
//     const productsCollection = db.collection("products");

//     // Loop through cart items and update spaces
//     for (let item of cart) {
//       await productsCollection.updateOne(
//         { id: item.id },
//         { $inc: { spaces: -item.quantity } } // subtract spaces
//       );
//     }

//     res.json({ message: "Spaces updated successfully" });

//   } catch (err) {
//     console.log("Error updating spaces:", err);
//     res.status(500).json({ message: "Failed to update spaces" });
//   }
// });


app.listen(3000, () => {
  console.log(`Server started on port ${app.get("PORT")}`);
});
