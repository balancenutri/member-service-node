import express from "express";
import {
  callRecordingController,
  getAllCallsController,
  getCallStatusController,
  twilioTokenGeneratorController,
  voiceController,
} from "../controllers/call-controller.js";

const router = express.Router();

router.post("/voice", voiceController);
router.post("/token", twilioTokenGeneratorController);
router.get("/call-status", getCallStatusController);
router.post("/call-recording", callRecordingController);
router.get("/get-calls", getAllCallsController);


export default router;
