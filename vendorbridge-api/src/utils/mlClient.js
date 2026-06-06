import axios from "axios";

export const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Usage: await mlClient.post("/predict/risk", { quotationId, lineItems })