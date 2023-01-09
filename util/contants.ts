import * as dotenv from "dotenv";
dotenv.config();

export const defaultPayload = {
    "prompt": process.env.DEFAULT_PROMPTS,
    "negative_prompt": process.env.DEFAULT_NEGATIVE_PROMPTS,
    "sampler_index": process.env.DEFAULT_SAMPLER,
    "steps": process.env.DEFAULT_STEPS,
    "cfg_scale": process.env.DEFAULT_CFG_SCALE,
    "sd_model_checkpoint": process.env.DEFAULT_CHECKPOINT
}

export const minute = 60 * 1000;