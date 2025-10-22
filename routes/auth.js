const express = require("express");
const { get } = require("../data/user");
const { createJSONToken, isValidPassword } = require("../util/auth");
const { isValidPassword: pwCheck, isValidUsername, isValidText } = require("../util/validation");
const { hash } = require("bcryptjs");

const router = express.Router();
const prisma = require("./prisma");

router.post("/signup", async (req, res, next) => {
  const data = req.body;
  const username = data.username;
  let errors = {};

  if (!isValidUsername(data.username)) {
    errors.username = "Invalid username.";
  } else {
    try {
      const existingUser = await prisma.chess_users.findUnique({
        where: {
          username,
        },
      });
      if (existingUser) {
        errors.username = "Username already exists.";
      }
    } catch (error) {}
  }

  if (!pwCheck(data.password)) {
    errors.password = "Invalid password.";
  }

  if (!isValidText(data.firstName)) {
    errors.firstName = "Invalid first name.";
  }

  if (!isValidText(data.lastName)) {
    errors.lastName = "Invalid last name.";
  }

  if (Object.keys(errors).length > 0) {
    console.log(errors);
    return res.status(422).json({
      message: "User signup failed due to validation errors.",
      errors,
    });
  }

  data.password = (await hash(data.password, 16)).toString();

  try {
    const createdUser = await prisma.chess_users.create({
      data,
    });
    const token = createJSONToken(username);
    res.status(201).json({ message: "User created.", user: createdUser, auth: { token } });
  } catch (error) {
    console.log("This is where it fucked up!", error);
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

  const token = createJSONToken(username);
  res.json({ auth: { token } });
});

module.exports = router;
