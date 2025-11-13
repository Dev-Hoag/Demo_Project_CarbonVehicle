import mysql from "mysql2/promise";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Missing required environment variables", { missingEnvVars });
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;
