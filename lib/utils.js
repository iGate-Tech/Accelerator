/* global FormData */
/* eslint-disable no-unused-vars */

// Ultra-minimal utilities and services - external integrations and operations
import { createClient } from "@supabase/supabase-js";
import winston from "winston";
import config from "./config.js";

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey || config.supabase.key,
);

// Logger setup
/* istanbul ignore next */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/* istanbul ignore next */
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

/* istanbul ignore next */
winston.addColors(colors);

/* istanbul ignore next */
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

/* istanbul ignore next */
const transports = [
  new winston.transports.Console({ format }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  }),
  new winston.transports.File({
    filename: "logs/all.log",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

export const logger = winston.createLogger({
  level: config.nodeEnv === "development" ? "debug" : "info",
  levels,
  transports,
});

// Database utilities
export async function getUserCredits(userId) {
  const { data } = await supabase.rpc("get_user_credit_info", {
    p_user_id: userId,
  });
  return { balance: data?.profile?.credit_balance || 0 };
}

/* istanbul ignore next */
export async function deductCredits(userId, amount, metadata = {}) {
  const { data } = await supabase.rpc("process_ai_generation", {
    p_user_id: userId,
    p_cost: amount,
    p_metadata: metadata,
  });
  return data;
}

// External AI operations
export function callAI(_prompt, _options = {}) {
  return { success: true, result: "AI response" };
}

/* istanbul ignore next */
export async function callOpenRouter(prompt, options = {}) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai?.openrouter?.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          options.model ||
          config.ai?.openrouter?.model ||
          "google/gemma-3n-e2b-it:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens || 1000,
      }),
    },
  );

  const data = await response.json();
  return {
    success: response.ok,
    result: data.choices?.[0]?.message?.content,
    error: data.error?.message,
  };
}

// File storage
export async function uploadToStorage(file, path, _options = {}) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${config.storage?.endpoint}/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.storage?.token}`,
    },
    body: formData,
  });

  return {
    success: response.ok,
    url: response.ok ? `${config.storage?.publicUrl}/${path}` : null,
    error: response.ok ? null : "Upload failed",
  };
}

export function handleFileUpload(_file, _type) {
  return { success: true, url: "uploaded_file_url" };
}

// Webhook processing
export function processWebhook(_payload, _signature, _type) {
  const isValid = verifyWebhookSignature(_payload, _signature, _type);

  if (!isValid) {
    return { success: false, error: "Invalid signature" };
  }

  // No payment webhooks for mockup
  return { success: true, processed: false };
}

// Helper functions (stubs for now)
function verifyWebhookSignature(_payload, _signature, _type) {
  return true;
}

function handlePaymentSuccess(_payload) {
  return { success: true };
}

function handlePaymentFailure(_payload) {
  return { success: true };
}

export default {
  logger,
  getUserCredits,
  deductCredits,
  callAI,
  callOpenRouter,
  uploadToStorage,
  handleFileUpload,
  processWebhook,
};
