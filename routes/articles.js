const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");
const supabase = require("../util/supabase");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/articles")
  .get(async (_, res) => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Články nelze načíst...", error);
      return res.status(500).json({ message: "Články nelze načíst...", error });
    }
    res.json(data);
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
    const userMatch = await prisma.users.findFirst({
      where: {
        username: req.token.username,
      },
    });
    if (userMatch && userID === userMatch?.id) {
      const { data, error } = await supabase
        .from("articles")
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
    const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();

    if (error) {
      console.error("Článek nelze načíst...", error);
      return res.status(500).json({ message: "Článek nelze načíst...", error });
    }
    res.json(data);
  })
  .patch(checkAuthMiddleWare, async (req, res) => {
    const articleID = +req.params.id;
    const userID = req.token.userID;
    const data = req.body;
    const article = await prisma.articles.findUnique({
      where: {
        id: articleID,
      },
    });
    if (article && article?.userID === userID) {
      const { data: updatedArticle, error } = await supabase
        .from("articles")
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

    const article = await prisma.articles.findUnique({
      where: {
        id: articleID,
      },
    });
    if (article && article?.userID === userID) {
      const { data, error } = await supabase
        .from("articles")
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
    } else {
      res.status(401).json({
        message: "Nemáte oprávnění.",
        errors: { hacking: "Nemůžete mazat články jiných uživatelů!" },
      });
    }
  });

module.exports = router;
