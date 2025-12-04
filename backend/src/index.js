import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import caseRoutes from "./routes/case.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/cases", caseRoutes);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

