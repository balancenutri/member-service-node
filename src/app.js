import cors from "cors";
import { configDotenv } from "dotenv";
import express from "express";
import morgan from "morgan";


//middleware Import
import { errorMiddleware } from "./middlewares/error.js";

// routes Import
import callRouter from "./routes/call-routes.js";

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


app.use(errorMiddleware);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
