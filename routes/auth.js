const express = require("express");
const { get } = require("../data/user");
const { createJSONToken, isValidPassword } = require("../util/auth");
const { isValidPassword: pwCheck, isValidUsername, isValidText } = require("../util/validation");
const { hash } = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../util/supabase");

const router = express.Router();
const prisma = require("./prisma");

router.post("/signup", async (req, res, next) => {
  const data = req.body;
  const username = data.username;
  let errors = {};

  if (!isValidUsername(data.username)) {
    errors.username = "Neplatné uživatelské jméno.";
  } else {
    try {
      const existingUser = await prisma.users.findUnique({
        where: {
          username,
        },
      });
      if (existingUser) {
        errors.username = "Uživatelské jméno již existuje.";
      }
    } catch (error) {}
  }

  if (!pwCheck(data.password)) {
    errors.password = "Neplatné heslo.";
  }

  if (!isValidText(data.firstName)) {
    errors.firstName = "Neplatné křestní jméno.";
  }

  if (!isValidText(data.lastName)) {
    errors.lastName = "Neplatné příjmení.";
  }

  if (Object.keys(errors).length > 0) {
    console.log(errors);
    return res.status(422).json({
      message: "Registrace uživatele selhala kvůli chybám ve validaci.",
      errors,
    });
  }

  data.password = (await hash(data.password, 16)).toString();

  try {
    const { data: createdUser, error } = await supabase
      .from("users")
      .insert([data])
      .select("*")
      .single();

    if (error) {
      console.log("Nepodařilo se vytvořit uživatele...", error);
      return res.status(500).json({ message: "Nepodařilo se vytvořit uživatele.", error });
    }

    const userRecord = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    if (!userRecord) {
      throw new Error("Nepodařilo se získat ID uživatele.");
    }

    const token = createJSONToken({ username, userID: userRecord.id });
    res.status(201).json({ message: "Uživatel vytvořen.", user: createdUser, auth: { token } });
  } catch (error) {
    console.log("Tady se něco pokazilo...", error);
    next(error);
  }
});

router.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  let user;
  try {
    user = await get(username);
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Not authorized." });
  }

  const pwIsValid = await isValidPassword(password, user.password);
  if (!pwIsValid) {
    return res.status(422).json({
      message: "Invalid credentials.",
      errors: { credentials: "Invalid username or password entered." },
    });
  }

  const userRecord = await prisma.users.findUnique({
    where: {
      username,
    },
  });

  if (!userRecord) {
    return res.status(401).json({ message: "User not found." });
  }

  const token = createJSONToken({ username, userID: userRecord.id });

  const decodedToken = jwt.decode(token);
  console.log("Decoded token:", decodedToken);

  res.json({ auth: { token } });
});

module.exports = router;
