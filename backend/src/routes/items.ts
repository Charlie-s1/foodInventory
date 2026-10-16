import { FastifyInstance } from "fastify";
import db from "../db.js";

export interface Item {
  id: string;
  household_id: string;
  location_id: string;
  barcode: string;
  name?: string;
  brand?: string;
  icon?: string;
  quantity: number;
  unit?: string;
  category?: string;
  expires_at?: string;
  expites_at?: string;
  added_at: number;
  added_by?: number;
}

const getItem = db.prepare("SELECT * FROM items WHERE barcode = ?");
const insertItem = db.prepare(
  "INSERT INTO items (barcode, name, brand, category, unit, quantity, household_id, icon, expires_at, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
);
const updateItem = db.prepare(
  "UPDATE items SET name = ?, category = ?, quantity = ? WHERE barcode = ?",
);
const deleteItem = db.prepare("DELETE FROM items WHERE barcode = ?");

export async function itemRoutes(app: FastifyInstance) {
  // GET /items/:barcode - Retrieve a single item by barcode
  app.get<{ Params: { barcode?: string } }>("/items/:barcode?", async (req, reply) => {
    const { barcode } = req.params;

    // If no barcode provided, return all items
    if (!barcode) {
      const allItems = db.prepare("SELECT * FROM items ORDER BY added_at DESC").all() as Item[];
      return reply.code(200).send(allItems);
    }

    // Validate barcode format
    if (!/^\d{8,14}$/.test(barcode)) {
      return reply.code(400).send({ message: "Invalid barcode" });
    }

    const item = getItem.get(barcode) as Item | null;
    if (!item) {
      return reply.code(404).send({ error: "Item not found" });
    }
    return reply.code(200).send(item);
  });

  // POST /items - Create a new item
  app.post<{ Body: Item }>("/addItem", async (req, reply) => {
    const { barcode, name, brand, category, unit, quantity, household_id, icon, expires_at } =
      req.body;

    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      return reply.code(400).send({ error: "Valid barcode is required" });
    }
    const expirationDate = new Date(expires_at || "");

    try {
      insertItem.run(
        barcode,
        name ?? "",
        brand ?? "",
        category ?? "",
        unit ?? "",
        quantity ?? 0,
        household_id ?? 1,
        icon ?? "",
        expires_at ? Math.floor(expirationDate.getTime() / 1000) : null,
        Math.floor(Date.now() / 1000),
      );
      return reply.code(201).send({
        message: "Item created",
        item: { barcode, name, category, unit, quantity },
      });
    } catch (error) {
      // Handle duplicate entry error
      if (
        (error as any).code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
        (error as any).code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        return reply.code(409).send({ error: "Item already exists" });
      }
      throw error;
    }
  });

  // PUT /items/:barcode - Update an existing item
  app.put<{ Params: { barcode: string }; Body: Partial<Item> }>(
    "/items/:barcode",
    async (req, reply) => {
      const { barcode } = req.params;
      const { name, category, unit, quantity } = req.body;

      if (!barcode || !/^\d{8,14}$/.test(barcode)) {
        return reply.code(400).send({ error: "Invalid barcode" });
      }

      // Check if item exists
      const existing = getItem.get(barcode) as Item | undefined;
      if (!existing) {
        return reply.code(404).send({ error: "Item not found" });
      }

      try {
        updateItem.run(
          name ?? existing.name,
          category ?? existing.category,
          unit ?? existing.unit,
          quantity ?? 0,
          barcode,
        );
        return reply.code(200).send({
          message: "Item updated",
          item: { barcode, name, category, unit, quantity },
        });
      } catch (error) {
        // Handle duplicate entry error
        if (
          (error as any).code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
          (error as any).code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
          return reply.code(409).send({ error: "Item already exists with this barcode" });
        }
        throw error;
      }
    },
  );

  // DELETE /items/:barcode - Delete an item
  app.delete<{ Params: { barcode: string } }>("/items/:barcode", async (req, reply) => {
    const { barcode } = req.params;

    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      return reply.code(400).send({ error: "Invalid barcode" });
    }

    try {
      deleteItem.run(barcode);
      return reply.code(204).send({ message: "Item deleted" });
    } catch (error) {
      if ((error as any).code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        return reply.code(400).send({ error: "Cannot delete item with existing relationships" });
      }
      throw error;
    }
  });
}
