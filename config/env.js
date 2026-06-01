import { config } from "dotenv";

const environment = process.env.NODE_ENV || "development";

config({ path: `.env.${environment}.local` });

export const {
  PORT = 5500,
  SERVER_URL,
  NODE_ENV,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ARCJET_KEY,
  ARCJET_ENV,
  QSTASH_URL,
  QSTASH_TOKEN,
  EMAIL_PASSWORD,
} = process.env;