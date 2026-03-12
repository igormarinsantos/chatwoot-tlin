import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/clinic_scheduler",
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: "./src/db/migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./src/db/seeds",
      extension: "ts"
    }
  },
  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: "./src/db/migrations"
    }
  }
};

export default config;
