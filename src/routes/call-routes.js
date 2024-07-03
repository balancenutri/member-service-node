import express from "express";
import {
  getCallStatusController,
  twilioTokenGeneratorController,
  voiceController,
} from "../controllers/call-controller.js";

const router = express.Router();

router.post("/voice", voiceController);
router.post("/token", twilioTokenGeneratorController);
router.get("/call-status", getCallStatusController);

export default router;
