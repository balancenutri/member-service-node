import twilio from "twilio";
import { client } from "../app.js";
import { ErrorHandler } from "../utility/ErrorClass.js";

const voiceController = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE,
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
export {
  voiceController,
  twilioTokenGeneratorController,
  getCallStatusController,
};
