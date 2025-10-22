const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");
const { isValidText, isValidUsername, isValidPassword } = require("../util/validation");
const { hash } = require("bcryptjs");

const router = express.Router();
const prisma = require("./prisma");

router.get("/users", async (_, res) => {
  const users = await prisma.chess_users.findMany();
  res.json(users);
});

router
  .route("/users/:username")
  .get(async (req, res) => {
    const username = req.params.username;
    const user = await prisma.chess_users.findUnique({
      where: {
        username,
      },
    });
    res.json(user);
  })
  .patch(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    let patchErrors = {};

    if (data.firstName) {
      if (!isValidText(data.firstName)) {
        patchErrors.firstName = "Invalid first name!";
      }
    }

    if (data.lastName) {
      if (!isValidText(data.lastName)) {
        patchErrors.lastName = "Invalid last name!";
      }
    }

    if (data.username) {
      if (!isValidUsername(data.username)) {
        patchErrors.username = "Invalid username!";
      }
    }

    if (data.password) {
      if (!isValidPassword(data.password)) {
        patchErrors.password = "Invalid password!";
      }
    }

    if (Object.keys(patchErrors).length > 0) {
      return res.status(400).json({
        message: "Incorrect details!",
        patchErrors,
      });
    }

    if (req.params.username === req.token.username) {
      if (data.password) {
        data.password = (await hash(data.password, 16)).toString();
      }

      const updatedUser = await prisma.chess_users.update({
        where: {
          username: req.params.username,
        },
        data,
      });
      res.status(201).json({ message: "User updated successfully!", updatedUser });
    } else {
      res.status(401).json({
        message: "Not authorized.",
        patchErrors: { hacking: "You are not allowed to update other user's details!" },
      });
    }
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    if (req.params.username === req.token.username) {
      const deletedUser = await prisma.chess_users.delete({
        where: {
          username: req.params.username,
        },
      });
      res.status(201).json({ message: "User deleted successfully!", deletedUser });
    } else {
      res.status(401).json({
        message: "Not authorized.",
        patchErrors: { hacking: "You are not allowed to delete other users!" },
      });
    }
  });

module.exports = router;
