import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_API_TOKEN;
if (!HF_TOKEN) {
  console.error("❌ Missing HF_API_TOKEN in .env");
  process.exit(1);
}

// Default models (can be overridden in .env)
const MODELS = {
  summarization: process.env.HF_MODEL_SUMMARIZATION || "facebook/bart-large-cnn",
  sentiment: process.env.HF_MODEL_SENTIMENT || "distilbert-base-uncased-finetuned-sst-2-english",
  zeroShot: process.env.HF_MODEL_ZS_CLASSIFY || "facebook/bart-large-mnli",
  translation: process.env.HF_MODEL_TRANSLATION || "Helsinki-NLP/opus-mt-en-ROMANCE",
  ner: process.env.HF_MODEL_NER || "dslim/bert-base-NER",
  qa: process.env.HF_MODEL_QA || "deepset/roberta-base-squad2",
  generation: process.env.HF_MODEL_GENERATION || "gpt2",
  paraphrase: process.env.HF_MODEL_PARAPHRASE || "Vamsi/T5_Paraphrase_Paws"
};

async function hfPost(model, payload) {
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid JSON from Hugging Face: ${raw.slice(0, 200)}`);
  }

  if (!res.ok || data.error) {
    throw new Error(data.error || res.statusText);
  }

  return data;
}

// === Exported task functions ===

export async function summarizeText(text) {
  const data = await hfPost(MODELS.summarization, { inputs: text });
  return data[0]?.summary_text || null;
}

export async function sentiment(text) {
  const data = await hfPost(MODELS.sentiment, { inputs: text });
  return Array.isArray(data?.[0]) ? data[0] : data;
}

export async function zeroShotClassify(text, labels = [], multiLabel = false) {
  return hfPost(MODELS.zeroShot, {
    inputs: text,
    parameters: { candidate_labels: labels, multi_label: multiLabel }
  });
}

export async function translate(text) {
  const data = await hfPost(MODELS.translation, { inputs: text });
  return data[0]?.translation_text || null;
}

export async function namedEntities(text) {
  const data = await hfPost(MODELS.ner, { inputs: text });
  return Array.isArray(data?.[0]) ? data[0] : data;
}

export async function answerQuestion(context, question) {
  return hfPost(MODELS.qa, { inputs: { context, question } });
}

export async function generate(prompt, params = {}) {
  const data = await hfPost(MODELS.generation, {
    inputs: prompt,
    parameters: { max_length: 200, ...params }
  });
  return data[0]?.generated_text || null;
}

export async function paraphrase(text) {
  const input = `paraphrase: ${text}`;
  const data = await hfPost(MODELS.paraphrase, {
    inputs: input,
    parameters: { max_length: 128, temperature: 0.7 }
  });
  return Array.isArray(data) ? (data[0]?.generated_text || data[0]) : data?.[0]?.generated_text || null;
}