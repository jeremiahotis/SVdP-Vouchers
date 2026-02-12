import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST ?? "db",
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  migrations: {
    directory: "db/migrations",
    extension: "ts",
    loadExtensions: [".ts"],
  },
};

export default config;
