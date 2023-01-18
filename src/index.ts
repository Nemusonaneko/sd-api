import express from "express";
import * as dotenv from "dotenv";
import * as bodyParser from "body-parser";
import cors from "cors";
dotenv.config();

const jsonParser = bodyParser.json();
const app = express();

const allowedOrigins = ["waifus.nemusona.com"];
const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
app.use(cors(options));

app.get("/api/status", async (req: express.Request, res: express.Response) => {
  try {
    const status: globalThis.Response = await fetch(
      `${process.env.SD}/queue/status`,
      {
        method: "GET",
      }
    );
    if (status.status === 200) {
      const json = await status.json();
      return res.status(200).send(json);
    } else {
      return res.status(status.status).send(status.statusText);
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/api/generate",
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
        res.status(generate.status).send(generate.statusText);
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  }
);

app.listen(80, () => {
  console.log("started on port 80");
});
