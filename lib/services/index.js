// Ultra-minimal services - only external integrations remain
import config from "../config.js";

// OpenAI/Anthropic integration
export async function callOpenAI(prompt, options = {}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai?.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens || 1000,
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    result: data.choices?.[0]?.message?.content,
    error: data.error?.message,
  };
}

// Anthropic Claude integration
export async function callAnthropic(prompt, options = {}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.anthropic?.key,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model || "claude-3-sonnet-20240229",
      max_tokens: options.maxTokens || 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    result: data.content?.[0]?.text,
    error: data.error?.message,
  };
}

// Stripe payment processing
export async function processStripePayment(amount, token, metadata = {}) {
  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.stripe?.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      source: token,
      metadata: JSON.stringify(metadata),
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    chargeId: data.id,
    error: data.error?.message,
  };
}

// Email service (SendGrid, etc.)
export async function sendTransactionalEmail(to, templateId, data = {}) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.sendgrid?.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email: to }],
      template_id: templateId,
      dynamic_template_data: data,
    }),
  });

  return {
    success: response.ok,
    error: response.status !== 202 ? "Email send failed" : null,
  };
}

// File storage (AWS S3, Cloudflare R2, etc.)
export async function uploadToStorage(file, path, options = {}) {
  // Implementation for cloud storage
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

// Webhook processing (Stripe, etc.)
export async function processWebhook(payload, signature, type) {
  // Webhook signature verification and processing
  const isValid = verifyWebhookSignature(payload, signature, type);

  if (!isValid) {
    return { success: false, error: "Invalid signature" };
  }

  // Process based on webhook type
  switch (type) {
    case "stripe.payment_succeeded":
      return await handlePaymentSuccess(payload);
    case "stripe.payment_failed":
      return await handlePaymentFailure(payload);
    default:
      return { success: true, processed: false };
  }
}

export default {
  callOpenAI,
  callAnthropic,
  processStripePayment,
  sendTransactionalEmail,
  uploadToStorage,
  processWebhook,
};
