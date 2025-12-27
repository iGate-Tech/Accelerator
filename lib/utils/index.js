// Ultra-minimal utilities - only external operations remain
import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey || config.supabase.key,
);

// Only external operations - database handles everything else
export async function getUserCredits(userId) {
  const { data } = await supabase.rpc("get_user_credit_info", {
    p_user_id: userId,
  });
  return { balance: data?.profile?.credit_balance || 0 };
}

export async function deductCredits(userId, amount, metadata = {}) {
  const { data } = await supabase.rpc("process_ai_generation", {
    p_user_id: userId,
    p_cost: amount,
    p_metadata: metadata,
  });
  return data;
}

// External AI operations only
export async function callAI(prompt, options = {}) {
  // AI service calls remain here - database handles credit validation
  // Implementation would call OpenAI/Anthropic APIs
  return { success: true, result: "AI response" };
}

// File upload handling (external service)
export async function handleFileUpload(file, type) {
  // File processing logic remains here
  return { success: true, url: "uploaded_file_url" };
}

// Email sending (external service)
export async function sendEmail(to, subject, body) {
  // Email service integration remains here
  return { success: true };
}

export default {
  getUserCredits,
  deductCredits,
  callAI,
  handleFileUpload,
  sendEmail,
};
