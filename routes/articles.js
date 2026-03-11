const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");
const supabase = require("../util/supabase");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/articles")
  .get(async (_, res) => {
    try {
      const { data, error } = await supabase
        .from("chess_articles")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Články nelze načíst...", error);
        return res.status(500).json({ message: "Články nelze načíst...", error });
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Články nelze načíst...", error });
    }
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const { userID, title, content, image, ...rest } = req.body;
    const invalid = !userID || !title || !content || !image;

    if (invalid) {
      return res.status(400).json({
        message: "Některé z povinných polí nebyly vyplněny!",
        error: "Chybí povinná pole!",
      });
    }

    console.log(req.token);
    const userMatch = await prisma.chess_users.findFirst({
      where: {
        username: req.token.username,
      },
    });
    if (userMatch && userID === userMatch?.id) {
      const { data, error } = await supabase
        .from("chess_articles")
        .insert([{ userID, title, content, image, ...rest }]);

      if (error) {
        console.error("Článek nelze vytvořit...", error);
        return res.status(500).json({ message: "Článek nelze vytvořit...", error });
      }

      res.status(201).json({ message: "Článek byl úspěšně vytvořen!", data });
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        errors: { hacking: "Nemůžete přidávat články za jiné uživatele!" },
      });
    }
  });

router
  .route("/articles/:id")
  .get(async (req, res) => {
    const id = +req.params.id;
    try {
      const { data, error } = await supabase
        .from("chess_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Článek nelze načíst...", error);
        return res.status(500).json({ message: "Článek nelze načíst...", error });
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Článek nelze načíst...", error });
    }
  })
  .patch(checkAuthMiddleWare, async (req, res) => {
    const articleID = +req.params.id;
    const userID = req.token.userID;
    const data = req.body;
    const article = await prisma.chess_articles.findUnique({
      where: {
        id: articleID,
      },
    });
    if (article && article?.userID === userID) {
      try {
        const { data: updatedArticle, error } = await supabase
          .from("chess_articles")
          .update(data)
          .eq("id", articleID)
          .eq("userID", userID)
          .select("*")
          .single();

        if (error) {
          console.error("Článek nelze aktualizovat...", error);
          return res.status(500).json({ message: "Článek nelze aktualizovat...", error });
        }

        res.json({ message: "Článek byl úspěšně aktualizován!", updatedArticle });
      } catch (error) {
        console.error("Článek nelze aktualizovat...", error);
        return res.status(500).json({ message: "Článek nelze aktualizovat...", error });
      }
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        errors: { hacking: "Nemůžete upravovat články jiných uživatelů!" },
      });
    }
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    const articleID = +req.params.id;
    const userID = req.token.userID;

    const article = await prisma.chess_articles.findUnique({
      where: {
        id: articleID,
      },
    });
    if (article && article?.userID === userID) {
      try {
        const { data, error } = await supabase
          .from("chess_articles")
          .delete()
          .eq("id", articleID)
          .eq("userID", userID)
          .select("*")
          .single();

        if (error) {
          console.error("Článek nelze smazat...", error);
          return res.status(500).json({ message: "Článek nelze smazat...", error });
        }
        res.status(201).json({ message: "Článek byl úspěšně smazán!", data });
      } catch (error) {
        console.error("Článek nelze smazat...", error);
        return res.status(500).json({ message: "Článek nelze smazat...", error });
      }
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        errors: { hacking: "Nemůžete mazat články jiných uživatelů!" },
      });
    }
  });

module.exports = router;
