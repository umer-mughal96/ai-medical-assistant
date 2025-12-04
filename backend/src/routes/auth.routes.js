import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma, JWT_SECRET } from "../config.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const doctor = await prisma.doctor.create({
    data: { name, email, passwordHash: hash },
  });
  res.json({ id: doctor.id, name: doctor.name, email: doctor.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const doctor = await prisma.doctor.findUnique({ where: { email } });
  if (!doctor) return res.status(400).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, doctor.passwordHash);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: doctor.id, email: doctor.email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email } });
});

export default router;

