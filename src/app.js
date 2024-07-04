import cors from "cors";
import { configDotenv } from "dotenv";
import express from "express";
import morgan from "morgan";


//middleware Import
import { errorMiddleware } from "./middlewares/error.js";

// routes Import
import callRouter from "./routes/call-routes.js";
import { client } from "./config/twilioConfig.js";

configDotenv();

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/call", callRouter);
const mainCallDetail = await client
  .calls("CA23263cc7358f02b174729f9eb5d1ef77")
  .fetch();
const childCalls = await client.calls.list({
  parentCallSid: "CA23263cc7358f02b174729f9eb5d1ef77",
});
const actualCallDetail = childCalls.find(
  (call) => call.direction === "outbound-dial"
);

// Extract details from the actual call
// const { to, from, duration, status } = actualCallDetail;;


app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
