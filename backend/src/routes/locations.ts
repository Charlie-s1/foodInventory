import { FastifyInstance } from "fastify";
import db from "../db.js";

export interface Location {
  id: number;
  household_id: number;
  parent_id?: number;
  name: string;
  icon?: string;
  sort_order: number;
  children?: Location[];
}

const getLocation = db.prepare("SELECT * FROM locations WHERE id = ?");

const getAllLocations = db.prepare(
  "SELECT l.*, p.name as parent_name, p.icon as parent_icon " +
    "FROM locations l " +
    "LEFT JOIN locations p ON l.parent_id = p.id AND l.household_id = p.household_id " +
    "WHERE l.household_id = ? " +
    "ORDER BY l.sort_order ASC, l.name ASC",
);

const getLocationByParent = db.prepare(
  "SELECT * FROM locations WHERE household_id = ? AND (parent_id IS NULL OR parent_id = ?) " +
    "ORDER BY sort_order ASC, name ASC",
);

const insertLocation = db.prepare(
  "INSERT INTO locations (household_id, parent_id, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
);

const updateLocation = db.prepare(
  "UPDATE locations SET name = ?, icon = ?, sort_order = ? WHERE id = ?",
);

const deleteLocation = db.prepare("DELETE FROM locations WHERE id = ?");

export async function locationRoutes(app: FastifyInstance) {
  const householdId = 1;

  // GET /locations - Retrieve all locations for the current household
  app.get<{ Params: {} }>("/locations", async (req, reply) => {
    try {
      const locations = getAllLocations.all(householdId) as Location[];

      // Build nested structure
      const rootLocations: Location[] = [];
      const childLocations: Map<number, Location[]> = new Map();

      for (const loc of locations) {
        rootLocations.push(loc);

        // if (!loc.parent_id || loc.parent_id === 0) {
        //   rootLocations.push(loc);
        // } else {
        //   let parentChildren = childLocations.get(loc.parent_id);
        //   if (!parentChildren) {
        //     parentChildren = [];
        //     childLocations.set(loc.parent_id, parentChildren);
        //   }
        //   parentChildren.push(loc);
        // }
      }

      // Attach children to parents
      for (const parent of rootLocations) {
        const children = childLocations.get(parent.id);
        if (children && children.length > 0) {
          parent.children = children;
        }
      }

      return reply.code(200).send(rootLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      return reply.code(500).send({ error: "Failed to fetch locations" });
    }
  });

  // GET /locations/:id - Retrieve a single location by ID
  app.get<{ Params: { id: number } }>("/locations/:id", async (req, reply) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return reply.code(400).send({ error: "Invalid location ID" });
    }

    try {
      const location = getLocation.get(id) as Location;
      // Check household ownership (security)
      if (!location || location.household_id !== householdId) {
        return reply.code(404).send({ error: "Location not found" });
      }

      // Fetch parent info
      const parentResult = db
        .prepare("SELECT name, icon FROM locations WHERE id = ? AND household_id = ?")
        .get(location.parent_id || 0, location.household_id) as { name?: string; icon?: string };

      return reply.code(200).send({
        ...location,
        parentId: location.parent_id,
        parentName: parentResult?.name,
        parentIcon: parentResult?.icon,
      });
    } catch (error) {
      console.error("Error fetching location:", error);
      return reply.code(500).send({ error: "Failed to fetch location" });
    }
  });

  // GET /locations/:parentId/children - Get child locations under a parent
  app.get<{ Params: { parentId?: number } }>(
    "/locations/:parentId/children?",
    async (req, reply) => {
      const { parentId } = req.params;

      if (parentId !== undefined && !parentId) {
        return reply.code(400).send({ error: "Invalid parent ID" });
      }

      try {
        let query;
        let params: any[] = [];

        if (parentId !== undefined) {
          const parentLocation = getLocation.get(parentId) as Location;
          if (!parentLocation || parentLocation.household_id !== householdId) {
            return reply.code(404).send({ error: "Parent location not found" });
          }
          query = getAllLocations;
          params = [householdId];
        } else {
          // Get all root locations (no parent)
          const locations = db
            .prepare("SELECT * FROM locations WHERE household_id = ? AND parent_id IS NULL")
            .all(householdId) as Location[];
          return reply.code(200).send(locations);
        }

        const children = getAllLocations.all(...params) as Location[];

        // Filter to only show direct children if parentId was provided
        if (parentId !== undefined) {
          const parentLoc = getLocation.get(parentId) as Location;
          const filteredChildren = children.filter((child) => child.parent_id === parentLoc.id);
          return reply.code(200).send(filteredChildren);
        }

        return reply.code(200).send(children);
      } catch (error) {
        console.error("Error fetching locations:", error);
        return reply.code(500).send({ error: "Failed to fetch locations" });
      }
    },
  );

  // POST /locations - Create a new location
  app.post<{ Body: Partial<Location> }>("/locations", async (req, reply) => {
    const { name, parent_id, icon, sort_order = 0 } = req.body;

    if (!name || !/^\S.{1,100}$/.test(name)) {
      return reply.code(400).send({ error: "Location name is required" });
    }

    try {
      // Check for duplicate name under the same parent
      const duplicateCheck = db
        .prepare(
          "SELECT * FROM locations WHERE household_id = ? AND (parent_id IS NULL OR parent_id = ?) AND LOWER(name) = LOWER(?)",
        )
        .all(householdId, parent_id || 0, name);

      if (duplicateCheck.length > 0) {
        return reply.code(409).send({
          error: "A location with this name already exists in this category",
        });
      }

      const newLocation = insertLocation.run(
        householdId,
        parent_id || null,
        name,
        icon || "",
        sort_order,
      );

      return reply.code(201).send({
        message: "Location created",
        location: {
          id: newLocation.lastInsertRowid,
          household_id: householdId,
          parent_id: parent_id,
          name,
          icon: icon || "",
          sort_order,
        },
      });
    } catch (error) {
      console.error("Error creating location:", error);
      if ((error as any).code === "SQLITE_CONSTRAINT_UNIQUE") {
        return reply.code(409).send({ error: "Location with this name already exists" });
      }
      return reply.code(500).send({ error: "Failed to create location" });
    }
  });

  // PUT /locations/:id - Update an existing location
  app.put<{ Params: { id: number }; Body: Partial<Location> }>(
    "/locations/:id",
    async (req, reply) => {
      const { id } = req.params;
      const { name, icon, sort_order } = req.body;

      const locationId = id;
      const existingLocation = getLocation.get(locationId) as Location;

      if (!locationId || isNaN(locationId)) {
        return reply.code(400).send({ error: "Invalid location ID" });
      }

      // Check if name is provided and validate uniqueness
      if (name) {
        if (!/^\S.{1,100}$/.test(name)) {
          return reply.code(400).send({ error: "Invalid location name" });
        }

        // Check for duplicate
        if (existingLocation && existingLocation.id !== locationId) {
          const duplicateCheck = db
            .prepare(
              "SELECT * FROM locations WHERE household_id = ? AND id != ? AND (parent_id IS NULL OR parent_id = ?) AND LOWER(name) = LOWER(?)",
            )
            .all(householdId, locationId, existingLocation.parent_id || 0, name);

          if (duplicateCheck.length > 0) {
            return reply.code(409).send({
              error: "A location with this name already exists in this category",
            });
          }
        }
      }

      try {
        const updated = updateLocation.run(name ?? "", icon ?? "", sort_order ?? 0, locationId);

        return reply.code(200).send({
          message: "Location updated",
          location: {
            id: locationId,
            household_id: householdId,
            parent_id: existingLocation?.parent_id || null,
            name: name ?? existingLocation.name,
            icon: icon ?? existingLocation.icon,
            sort_order: sort_order ?? 0,
          } as Location,
        });
      } catch (error) {
        console.error("Error updating location:", error);
        if ((error as any).code === "SQLITE_CONSTRAINT_UNIQUE") {
          return reply.code(409).send({
            error: "A location with this name already exists in this category",
          });
        }
        throw error;
      }
    },
  );

  // DELETE /locations/:id - Delete a location
  app.delete<{ Params: { id: number } }>("/locations/:id", async (req, reply) => {
    const { id } = req.params;
    const locationId = id;

    if (!locationId || isNaN(locationId)) {
      return reply.code(400).send({ error: "Invalid location ID" });
    }

    try {
      const existingLocation = getLocation.get(locationId) as Location | undefined;

      if (!existingLocation) {
        return reply.code(404).send({ error: "Location not found" });
      }

      // Security check: only allow deletion of own locations
      if (existingLocation.household_id !== householdId) {
        return reply.code(403).send({ error: "Access denied" });
      }

      // Check if location has items
      const itemCount = db
        .prepare("SELECT COUNT(*) as count FROM items WHERE location_id = ?")
        .get(locationId) as { count: number };

      if (itemCount.count > 0) {
        return reply.code(409).send({
          error: `Cannot delete location: ${itemCount.count} items are stored here`,
        });
      }

      // Delete the location
      deleteLocation.run(locationId);

      return reply.code(204).send({ message: "Location deleted" });
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error;
    }
  });

  // POST /locations/:id/move - Move a location under another parent
  app.post<{
    Params: { id: number };
    Body: { parentId: number | null };
  }>("/locations/:id/move", async (req, reply) => {
    const { id } = req.params;
    const { parentId } = req.body;

    const locationId = id;

    if (!locationId || isNaN(locationId)) {
      return reply.code(400).send({ error: "Invalid location ID" });
    }

    try {
      const existingLocation = getLocation.get(locationId) as Location | undefined;

      if (!existingLocation) {
        return reply.code(404).send({ error: "Location not found" });
      }

      // Validate parent (if provided)
      if (parentId !== null && parentId !== undefined) {
        const parentLocation = getLocation.get(parentId) as Location | undefined;

        if (!parentLocation || parentLocation.household_id !== householdId) {
          return reply.code(404).send({ error: "Parent location not found" });
        }

        // Check for duplicate name under new parent
        const duplicateCheck = db
          .prepare(
            "SELECT * FROM locations WHERE household_id = ? AND id != ? AND parent_id = ? AND LOWER(name) = LOWER(?)",
          )
          .all(householdId, locationId, parentId, existingLocation.name);

        if (duplicateCheck.length > 0) {
          return reply.code(409).send({
            error: "A location with this name already exists in the target category",
          });
        }
      }

      // Update parent_id
      const updateStmt = db.prepare("UPDATE locations SET parent_id = ? WHERE id = ?");
      updateStmt.run(parentId || null, locationId);

      return reply.code(200).send({
        message: "Location moved",
        location: {
          id: locationId,
          household_id: householdId,
          parent_id: parentId,
          name: existingLocation.name,
          icon: existingLocation.icon,
          sort_order: existingLocation.sort_order,
        },
      });
    } catch (error) {
      console.error("Error moving location:", error);
      throw error;
    }
  });

  return app;
}
