import express from "express";
import * as dotenv from "dotenv";
import { defaultPayload, minute } from "../util/contants";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();
const rateLimiter = rateLimit({
  windowMs: minute,
  max: (req, resp) => {
    if (req.query.token === process.env.TOKEN) {
      return 5;
    } else {
      return 1;
    }
  },
});

app.enable("trust proxy"); /// Use if behind a proxy i.e. Cloudflare

app.get("/api/status", async (req: express.Request, res: express.Response) => {
  try {
    const status = await fetch(`${process.env.SD}/queue/status`, {
      method: "GET",
    }).then((s) => s.json());
    return res.send(status);
  } catch (error: any) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

app.get(
  "/api/generate",
  rateLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const payload = defaultPayload;
      const prompt = req.query.prompt;
      const negative = req.query.negative;
      if (prompt) {
        payload.prompt += `, ${prompt.toString().replace(" ", ", ")}`;
      }
      if (negative) {
        payload.negative_prompt += `, ${negative
          .toString()
          .replace(" ", ", ")}`;
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
        res.send(buffer);
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
  console.log("Started on port 80");
});
