import express from "express";
import { db } from "../db/index.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { badRequest, conflict, notFound, parseId } from "../utils/http.mjs";
import * as v from "../utils/validate.mjs";

const router = express.Router();

const SELECT = `
  SELECT c.id, c.name, COUNT(e.id) AS events_count
  FROM categories c
  LEFT JOIN events e ON e.category_id = c.id
`;

const findCategory = (id) => db.prepare(`${SELECT} WHERE c.id = ? GROUP BY c.id`).get(id);

function readName(body = {}, exceptId = 0) {
  const errors = {};
  const name = v.text(errors, body, "name", "Name", { min: 2, max: 40 });
  if (v.hasErrors(errors)) throw badRequest(errors);
  const clash = db.prepare("SELECT id FROM categories WHERE name = ? AND id != ?").get(name, exceptId);
  if (clash) throw conflict("This category already exists", { name: "This category already exists" });
  return name;
}

router.get("/", (req, res) => {
  res.json(db.prepare(`${SELECT} GROUP BY c.id ORDER BY c.name`).all());
});

router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const name = readName(req.body);
  const { lastInsertRowid } = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
  res.status(201).json(findCategory(lastInsertRowid));
});

router.put("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  if (!findCategory(id)) throw notFound("Category not found");
  const name = readName(req.body, id);
  db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
  res.json(findCategory(id));
});

router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = parseId(req.params.id);
  const category = findCategory(id);
  if (!category) throw notFound("Category not found");
  if (category.events_count > 0) {
    throw conflict(`${category.events_count} event(s) use this category. Change them first.`);
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  res.status(204).end();
});

export default router;
