import { randomUUID } from "crypto";
import { pipeline } from "@huggingface/transformers";
import { env } from "../../config/env.js";

let extractorPromise;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", env.hfEmbeddingModel);
  }
  return extractorPromise;
}

export async function createEmbedding(input) {
  const extractor = await getExtractor();
  const output = await extractor(input, {
    pooling: "mean",
    normalize: true
  });
  return Array.from(output.data);
}

export async function createEmbeddings(inputs) {
  if (!inputs.length) return [];
  return Promise.all(inputs.map((input) => createEmbedding(input)));
}

export function vectorId() {
  return randomUUID();
}
