const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");
const { isValidText, isValidUsername, isValidPassword } = require("../util/validation");
const { hash } = require("bcryptjs");
const supabase = require("../util/supabase");

const router = express.Router();
const prisma = require("./prisma");

router.get("/users", async (_, res) => {
  try {
    const { data, error } = await supabase
      .from("chess_users")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Uživatele nelze načíst...", error);
      return res.status(500).json({ message: "Uživatele nelze načíst...", error });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Uživatele nelze načíst...", error });
  }
});

router
  .route("/users/:username")
  .get(async (req, res) => {
    const username = req.params.username;
    try {
      const { data, error } = await supabase
        .from("chess_users")
        .select("*")
        .eq("username", username)
        .single();

      if (error) {
        console.error("Uživatele nelze načíst...", error);
        return res.status(500).json({ message: "Uživatele nelze načíst...", error });
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Uživatele nelze načíst...", error });
    }
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

      try {
        const { data: updatedUser, error } = await supabase
          .from("chess_users")
          .update(data)
          .eq("username", req.params.username)
          .select("*")
          .single();

        if (error) {
          console.error("Uživatele nelze aktualizovat...", error);
          return res.status(500).json({ message: "Uživatele nelze aktualizovat...", error });
        }

        res.status(201).json({ message: "Uživatel byl úspěšně aktualizován!", updatedUser });
      } catch (error) {
        console.error("Uživatele nelze aktualizovat...", error);
        res.status(500).json({ message: "Uživatele nelze aktualizovat...", error });
      }
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        patchErrors: { hacking: "Nemůžete upravovat údaje jiných uživatelů!" },
      });
    }
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    if (req.params.username === req.token.username) {
      try {
        const { data: deletedUser, error } = await supabase
          .from("chess_users")
          .delete()
          .eq("username", req.params.username)
          .select("*")
          .single();

        if (error) {
          console.error("Uživatele nelze smazat...", error);
          return res.status(500).json({ message: "Uživatele nelze smazat...", error });
        }

        res.status(201).json({ message: "Uživatel byl úspěšně smazán!", deletedUser });
      } catch (error) {
        console.error("Uživatele nelze smazat...", error);
        res.status(500).json({ message: "Uživatele nelze smazat...", error });
      }
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        patchErrors: { hacking: "Nemůžete mazat jiné uživatele!" },
      });
    }
  });

module.exports = router;
