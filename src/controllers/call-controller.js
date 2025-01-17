import axios from "axios";
import { configDotenv } from "dotenv";
import twilio from "twilio";
import { fireStore, storage } from "../config/firebaseconfig.js";
import { client } from "../config/twilioConfig.js";
import { ErrorHandler } from "../utility/ErrorClass.js";

configDotenv();
const voiceController = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE,
    record: "record-from-answer-dual",
    recordingStatusCallback:
      "https://member-service-node.vercel.app/api/call/call-recording",
  });
  dial.number(req.body.To);

  res.type("text/xml");
  res.send(response.toString());
};

const twilioTokenGeneratorController = async (req, res, next) => {
  const { identity } = req.body;
  try {
    if (!identity) {
      return res.status(400).json({
        success: false,
        message: "Identity Not Provided!",
      });
    }
    const token = new twilio.jwt.AccessToken(
      process.env.ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_SECRET_KEY,
      { identity }
    );
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: process.env.OUTGOINGAPPLICATION_SID,
    });
    token.addGrant(voiceGrant);

    return res.status(200).json({
      success: true,
      message: "Token generated successfully",
      token: token.toJwt(),
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
const getCallStatusController = async (req, res, next) => {
  const { callSid } = req.query;
  try {
    const call = await client.calls(callSid).fetch();
    return res.status(200).json({
      success: true,
      message: "Call status fetched successfully",
      data: {
        status: call.status,
      },
    });
  } catch (error) {
    console.error("Error fetching call status:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

const callRecordingController = async (req, res, next) => {
  const recordingUrl = req.body.RecordingUrl + ".wav";
  const recordingSid = req.body.RecordingSid;
  const callSid = req.body.CallSid;
  const childCalls = await client.calls.list({
    parentCallSid: callSid,
  });
  const actualCallDetail = childCalls.find(
    (call) => call.direction === "outbound-dial"
  );

  // Extract details from the actual call
  const { to } = actualCallDetail;

  try {
    const response = await axios({
      method: "get",
      url: recordingUrl,
      responseType: "arraybuffer",
      auth: {
        username: process.env.ACCOUNT_SID,
        password: process.env.AUTH_TOKEN,
      },
    });
    const buffer = Buffer.from(response.data, "binary");
    const bucket = storage.bucket();
    const file = bucket.file(`recordings/${recordingSid}.wav`);
    await file.save(buffer, {
      contentType: "audio/wav",
      metadata: {
        callSid,
        dateTime: new Date().toISOString(),
      },
    });

    const callDetail = await client.calls(callSid).fetch();
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${
      bucket.name
    }/${encodeURIComponent(file.name)}`;

    await fireStore.collection("calls").add({
      callSid: callSid,
      recordingUrl: publicUrl,
      to,
      datetime: new Date().toISOString(),
      duration: callDetail.duration,
      callStatus: callDetail.status,
    });

    return res.status(200).json({
      success: true,
      message: "Call Recorded And Saved Successfully",
    });
  } catch (error) {
    console.log(error);
    return next(
      new ErrorHandler("Error Recording and Storing Call Recording", 500)
    );
  }
};

const getAllCallsController = async (req, res, next) => {
  try {
    const callsRef = fireStore.collection("calls").orderBy("datetime", "desc");
    const snapshot = await callsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No chats Found",
        data: {
          calls: [],
        },
      });
    }
    let calls = [];
    snapshot.forEach((doc) => {
      calls.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      message: "Calls Retrieved Successfully",
      data: {
        calls,
      },
    });
  } catch (error) {
    console.log(error);

    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export {
  callRecordingController,
  getAllCallsController, getCallStatusController,
  twilioTokenGeneratorController,
  voiceController
};

