import knex from "knex";
import config from "../db/knexfile";

const db = knex(config);

await db.migrate.latest();
await db.destroy();
