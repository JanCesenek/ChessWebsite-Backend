const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const articlesRoutes = require("../routes/articles");
const authRoutes = require("../routes/auth");
const usersRoutes = require("../routes/users");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const port = 8080;

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight for all routes
app.use(bodyParser.urlencoded({ limit: "1mb", extended: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/chess-table", async (_, res) => {
  const url = "https://www.chess.cz/soutez/3291";
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  // Inspect the page and use the correct selector for the table
  const table = $("table").first().html(); // Adjust selector as needed
  res.send(`<table>${table}</table>`);
});

app.get("/api/chess-table-2", async (_, res) => {
  const url = "https://www.chess.cz/soutez/3293";
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  // Inspect the page and use the correct selector for the table
  const table = $("table").first().html(); // Adjust selector as needed
  res.send(`<table>${table}</table>`);
});

app.get("/api/chess-table-3", async (_, res) => {
  const url = "https://www.chess.cz/soutez/3295";
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  // Inspect the page and use the correct selector for the table
  const table = $("table").first().html(); // Adjust selector as needed
  res.send(`<table>${table}</table>`);
});

app.use(articlesRoutes);
app.use(authRoutes);
app.use(usersRoutes);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
