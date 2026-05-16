import { config } from "dotenv";

const environment = process.env.NODE_ENV || "development";

config({ path: `.env.${environment}.local` });

export const { PORT = 5500, NODE_ENV, MONGO_URI } = process.env;