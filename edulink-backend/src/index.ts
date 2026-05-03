import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import connectionsRoutes from "./routes/connections.routes";
import insightsRoutes from "./routes/insights.routes";
import profileRoutes from "./routes/profile.routes";
import sessionsRoutes from "./routes/sessions.routes";
import usersRoutes from "./routes/users.routes";

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/profile", authMiddleware, profileRoutes);
app.use("/api/users", authMiddleware, usersRoutes);
app.use("/api/connections", authMiddleware, connectionsRoutes);
app.use("/api/sessions", authMiddleware, sessionsRoutes);
app.use("/api/insights", authMiddleware, insightsRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Edulink backend listening on port ${port}`);
});
