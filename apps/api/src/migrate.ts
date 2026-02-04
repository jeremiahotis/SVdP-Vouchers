import knex from "knex";
import config from "../db/knexfile.js";

const db = knex(config);

await db.migrate.latest();
await db.destroy();
