import dotenv from "dotenv";
import pkg from "@prisma/client";

dotenv.config();

const { PrismaClient } = pkg;

export const prisma = new PrismaClient();

export const { JWT_SECRET, OPENAI_API_KEY, DATABASE_URL } = process.env;
export const PORT = process.env.PORT || 4000;

export default {
  prisma,
  JWT_SECRET,
  OPENAI_API_KEY,
  DATABASE_URL,
  PORT,
};

