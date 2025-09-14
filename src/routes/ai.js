import { Router } from "express";
import { badRequest, unauthorized, serviceUnavailable } from "../utils/httpErrors.js";
import {
  summarizeText as summarize,
  sentiment,
  zeroShotClassify,
  translate,
  namedEntities,
  answerQuestion,
  generate,
  paraphrase
} from "../services/huggingface.js";

const router = Router();

function requireField(obj, field, type = "string") {
  if (!(field in obj)) throw badRequest(`Missing field '${field}'.`);
  if (type && typeof obj[field] !== type) throw badRequest(`Field '${field}' must be ${type}.`);
}

function handleErr(next, err) {
  if (err.status === 401) return next(unauthorized("Invalid or missing Hugging Face token."));
  if (err.status === 503) return next(serviceUnavailable("Model is loading. Try again shortly."));
  return next(err);
}

// POST /summarize
router.post("/summarize", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    const summary = await summarize(req.body.text);
    if (!summary) throw new Error("No summary generated.");
    res.json({ summary });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /sentiment
router.post("/sentiment", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    const result = await sentiment(req.body.text);
    res.json({ result });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /classify (zero-shot)
// body: { text: string, labels: string[], multiLabel?: boolean }
router.post("/classify", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    if (!Array.isArray(req.body.labels) || req.body.labels.length === 0) {
      throw badRequest("Field 'labels' must be a non-empty string array.");
    }
    const result = await zeroShotClassify(req.body.text, req.body.labels, !!req.body.multiLabel);
    res.json({ result });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /translate
router.post("/translate", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    const translation = await translate(req.body.text);
    if (!translation) throw new Error("No translation generated.");
    res.json({ translation });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /ner
router.post("/ner", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    const entities = await namedEntities(req.body.text);
    res.json({ entities });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /qa
// body: { context: string, question: string }
router.post("/qa", async (req, res, next) => {
  try {
    requireField(req.body, "context");
    requireField(req.body, "question");
    const result = await answerQuestion(req.body.context, req.body.question);
    res.json({ result });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /generate
router.post("/generate", async (req, res, next) => {
  try {
    requireField(req.body, "prompt");
    const output = await generate(req.body.prompt, req.body.params || {});
    if (!output) throw new Error("No text generated.");
    res.json({ output });
  } catch (err) {
    handleErr(next, err);
  }
});

// POST /paraphrase
router.post("/paraphrase", async (req, res, next) => {
  try {
    requireField(req.body, "text");
    const output = await paraphrase(req.body.text);
    res.json({ output });
  } catch (err) {
    handleErr(next, err);
  }
});

export default router;