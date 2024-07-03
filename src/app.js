import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import twilio from "twilio";
import { errorMiddleware } from "./middlewares/error.js";

// routes Import
import callRouter from "./routes/call-routes.js";

dotenv.config();
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://member-service-db.vercel.app"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
const PORT = process.env.PORT || 8080;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
export const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/call", callRouter);

app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
