import express from "express";
import { prisma, OPENAI_API_KEY } from "../config.js";
import { auth } from "../middleware/auth.js";
import fetch from "node-fetch";

const router = express.Router();

// Create Case
router.post("/:patientId", auth, async (req, res) => {
  const { patientId } = req.params;
  const { title } = req.body;

  const patient = await prisma.patient.findFirst({ where: { id: Number(patientId), doctorId: req.user.id } });
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  const c = await prisma.case.create({ data: { title, patientId: Number(patientId) } });
  res.json(c);
});

// List cases for patient
router.get("/:patientId", auth, async (req, res) => {
  const { patientId } = req.params;
  const patient = await prisma.patient.findFirst({
    where: { id: Number(patientId), doctorId: req.user.id },
  });
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const cases = await prisma.case.findMany({ where: { patientId: Number(patientId) } });
  res.json(cases);
});

// Update case
router.patch("/:caseId", auth, async (req, res) => {
  const { caseId } = req.params;
  const { title, status } = req.body;

  const caseRecord = await prisma.case.findFirst({
    where: { id: Number(caseId) },
    include: { patient: true },
  });

  if (!caseRecord) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (caseRecord.patient.doctorId !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized access to this case" });
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (status !== undefined) updateData.status = status;

  const updatedCase = await prisma.case.update({
    where: { id: Number(caseId) },
    data: updateData,
  });

  res.json(updatedCase);
});

// Delete case
router.delete("/:caseId", auth, async (req, res) => {
  const { caseId } = req.params;
  const caseIdNum = Number(caseId);

  const caseRecord = await prisma.case.findFirst({
    where: { id: caseIdNum },
    include: { patient: true },
  });

  if (!caseRecord) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (caseRecord.patient.doctorId !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized access to this case" });
  }

  // Delete all messages first, then the case in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete all messages for this case
    await tx.message.deleteMany({
      where: { caseId: caseIdNum },
    });
    
    // Then delete the case
    await tx.case.delete({
      where: { id: caseIdNum },
    });
  });

  res.json({ message: "Case and all associated messages deleted successfully" });
});

// Get all messages for a case
router.get("/messages/:caseId", auth, async (req, res) => {
  const { caseId } = req.params;

  const caseRecord = await prisma.case.findFirst({
    where: { id: Number(caseId) },
    include: { patient: true },
  });

  if (!caseRecord) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (caseRecord.patient.doctorId !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized access to this case" });
  }

  const messages = await prisma.message.findMany({
    where: { caseId: Number(caseId) },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

// Chat endpoint: Doctor message -> AI reply -> auto save treatment plan
router.post("/ai/:caseId", auth, async (req, res) => {
  const { caseId } = req.params;
  const { message } = req.body;

  // Validate OpenAI API key
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ message: "OpenAI API key not configured" });
  }

  // Verify case exists and belongs to doctor's patient
  const caseRecord = await prisma.case.findFirst({
    where: { id: Number(caseId) },
    include: { patient: true }
  });

  if (!caseRecord) {
    return res.status(404).json({ message: "Case not found" });
  }

  if (caseRecord.patient.doctorId !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized access to this case" });
  }

  // Save doctor message
  await prisma.message.create({ data: { caseId: Number(caseId), sender: "doctor", content: message } });

  // Get chat history
  const history = await prisma.message.findMany({ where: { caseId: Number(caseId) }, orderBy: { createdAt: "asc" } });
  const chatMessages = [
    { role: "system", content: "You are an AI medical assistant. Provide concise treatment recommendations." },
    ...history.map(m => ({ role: m.sender === "doctor" ? "user" : "assistant", content: m.content }))
  ];

  // Call OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: chatMessages })
  });
  
  const data = await response.json();
  
  // Check if API call was successful
  if (!response.ok) {
    console.error(`OpenAI API Error [Status ${response.status}]:`, data);
    return res.status(500).json({ 
      message: "Failed to get AI response", 
      statusCode: response.status,
      error: data.error?.message || "Unknown error",
      errorType: data.error?.type || null,
      errorCode: data.error?.code || null
    });
  }
  
  // Check if choices array exists and has content
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Invalid OpenAI response format:", data);
    return res.status(500).json({ 
      message: "Invalid response from AI service" 
    });
  }
  
  const aiText = data.choices[0].message.content;

  // Save AI message + treatment plan
  await prisma.message.create({ data: { caseId: Number(caseId), sender: "ai", content: aiText } });
  await prisma.case.update({ where: { id: Number(caseId) }, data: { treatmentPlan: aiText } });

  res.json({ aiText });
});

export default router;

