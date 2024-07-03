import express from "express";
import {
  callRecordingController,
  getCallStatusController,
  twilioTokenGeneratorController,
  voiceController,
  getAllCallsController,
  transcribeCallController,
} from "../controllers/call-controller.js";

const router = express.Router();

router.post("/voice", voiceController);
router.post("/token", twilioTokenGeneratorController);
router.get("/call-status", getCallStatusController);
router.post("/call-recording", callRecordingController);
router.get("/get-calls", getAllCallsController);
router.post("/transcribe", transcribeCallController);

export default router;
