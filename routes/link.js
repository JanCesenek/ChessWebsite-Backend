const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");
const supabase = require("../util/supabase");

const router = express.Router();
const prisma = require("./prisma");

router.get("/link", async (_, res) => {
  const { data, error } = await supabase
    .from("link")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Odkazy nelze načíst...", error);
    return res.status(500).json({ message: "Odkazy nelze načíst...", error });
  }

  res.json(data);
});

router.patch("/link/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const userID = req.token.userID;

  if (userID) {
    const { data, error } = await supabase
      .from("link")
      .update(req.body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Odkaz nelze aktualizovat...", error);
      return res.status(500).json({ message: "Odkaz nelze aktualizovat...", error });
    }

    res.json({ message: "Odkaz byl úspěšně aktualizován!", data });
  } else {
    res.status(401).json({
      message: "Nemáte oprávnění.",
      errors: { hacking: "Nemůžete upravovat odkaz jako nepřihlášený uživatel!" },
    });
  }
});

module.exports = router;
