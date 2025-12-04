import express from "express";
import { prisma } from "../config.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { name, age, gender } = req.body;
  const patient = await prisma.patient.create({
    data: { name, age: age ?? null, gender, doctorId: req.user.id },
  });
  res.json(patient);
});

router.get("/", auth, async (req, res) => {
  const patients = await prisma.patient.findMany({ where: { doctorId: req.user.id } });
  res.json(patients);
});

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const patientId = Number(id);
  
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, doctorId: req.user.id },
    include: { cases: { include: { messages: true } } },
  });
  
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  // Delete all messages, cases, and then the patient in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete all messages for all cases of this patient
    for (const caseRecord of patient.cases) {
      await tx.message.deleteMany({
        where: { caseId: caseRecord.id },
      });
    }
    
    // Delete all cases for this patient
    await tx.case.deleteMany({
      where: { patientId: patientId },
    });
    
    // Finally delete the patient
    await tx.patient.delete({
      where: { id: patientId },
    });
  });

  res.json({ message: "Patient and all associated cases deleted successfully" });
});

export default router;

