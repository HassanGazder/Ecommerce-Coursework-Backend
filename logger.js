function logger(req, res, next) {
  console.log("-----------------------------------");
  console.log("New Request Received:");
  console.log("Method:", req.method);     // GET, POST, PUT, DELETE
  console.log("URL:", req.url);           // /api/products, /api/orders, etc.
  console.log("Time:", new Date().toISOString());
  console.log("-----------------------------------");

  next(); // allow request to continue
}

module.exports = logger;
