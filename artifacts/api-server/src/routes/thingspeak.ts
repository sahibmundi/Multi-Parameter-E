import { Router, type IRouter } from "express";

const router: IRouter = Router();

const CHANNEL1_API_KEY = "14MJF61HHABCGD9P";
const CHANNEL2_API_KEY = "VJHHEWZOX2O3AX5Q";

// Channel IDs can be set via environment variables
const ENV_CHANNEL1_ID = process.env.THINGSPEAK_CHANNEL1_ID || "";
const ENV_CHANNEL2_ID = process.env.THINGSPEAK_CHANNEL2_ID || "";

async function fetchThingSpeakChannel(channelId: string, apiKey: string, results: number) {
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=${results}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ThingSpeak API returned ${response.status} for channel ${channelId}`);
  }
  return response.json();
}

router.get("/thingspeak/channel1", async (req, res) => {
  try {
    const results = Math.min(parseInt(String(req.query.results || "100"), 10), 8000);
    // Accept channelId from query param (set by frontend from localStorage), env var, or fail
    const channelId = String(req.query.channelId || ENV_CHANNEL1_ID || "").trim();
    
    if (!channelId) {
      res.status(422).json({
        error: "Channel ID required",
        hint: "Please set your ThingSpeak Channel 1 ID in the dashboard settings panel."
      });
      return;
    }
    
    const data = await fetchThingSpeakChannel(channelId, CHANNEL1_API_KEY, results);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch ThingSpeak channel 1");
    res.status(502).json({ error: "Failed to fetch sensor data from ThingSpeak" });
  }
});

router.get("/thingspeak/channel2", async (req, res) => {
  try {
    const results = Math.min(parseInt(String(req.query.results || "100"), 10), 8000);
    const channelId = String(req.query.channelId || ENV_CHANNEL2_ID || "").trim();
    
    if (!channelId) {
      res.status(422).json({
        error: "Channel ID required",
        hint: "Please set your ThingSpeak Channel 2 ID in the dashboard settings panel."
      });
      return;
    }
    
    const data = await fetchThingSpeakChannel(channelId, CHANNEL2_API_KEY, results);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch ThingSpeak channel 2");
    res.status(502).json({ error: "Failed to fetch sensor data from ThingSpeak" });
  }
});

export default router;
