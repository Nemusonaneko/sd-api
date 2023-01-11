import express from "express";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import * as bodyParser from "body-parser";
import cors from "cors";
dotenv.config();

const app = express();
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req, res) =>
    req.headers["cf-connecting-ip"]?.toString() || req.ip,
});
const jsonParser = bodyParser.json();
const allowedOrigins = ["http://localhost:3000", "https://waifus.nemusona.com"];
const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
app.use(cors(options));

app.get("/api/status", async (req: express.Request, res: express.Response) => {
  try {
    const status = await fetch(`${process.env.SD}/queue/status`, {
      method: "GET",
    }).then((s) => s.json());
    return res.status(200).send(status);
  } catch (error: any) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/api/generate",
  rateLimiter,
  jsonParser,
  async (req: express.Request, res: express.Response) => {
    const payload = {
      prompt: process.env.DEFAULT_PROMPTS,
      negative_prompt: process.env.DEFAULT_NEGATIVE_PROMPTS,
      sampler_index: process.env.DEFAULT_SAMPLER,
      steps: process.env.DEFAULT_STEPS,
      cfg_scale: process.env.DEFAULT_CFG_SCALE,
      sd_model_checkpoint: process.env.DEFAULT_CHECKPOINT,
    };
    try {
      const prompt = req.body.prompt;
      const negative = req.body.negative;
      if (prompt) {
        payload.prompt += `, ${prompt.toString()}`;
      }
      if (negative) {
        payload.negative_prompt += `, ${negative.toString()}`;
      }
      const generate = await fetch(`${process.env.SD}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (generate.status === 200) {
        const base64 = (await generate.json()).images[0];
        const buffer = Buffer.from(base64, "base64");
        res.set({ "Content-Type": "image/png" });
        res.status(200).send(buffer);
      } else {
        res.status(500).send("Server Error");
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  }
);

app.listen(80, () => {
  
});
