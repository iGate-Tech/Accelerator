import config from "../config.js";
import { hasEnoughCredits } from "../utils/credits.js";

import Handlebars from "handlebars";

/**
 * AI Provider utilities
 */
export const AI_PROVIDERS = {
  OPENROUTER: "openrouter",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
};

/**
 * Get available AI providers based on configuration
 * @returns {string[]} Array of available provider names
 */
export function getAvailableProviders() {
  const providers = [];

  if (config.ai.openrouter?.apiKey) {
    providers.push(AI_PROVIDERS.OPENROUTER);
  }

  if (config.ai.openai?.apiKey) {
    providers.push(AI_PROVIDERS.OPENAI);
  }

  if (config.ai.anthropic?.apiKey) {
    providers.push(AI_PROVIDERS.ANTHROPIC);
  }

  return providers;
}

/**
 * Get the current AI provider
 * @returns {string} Current provider name
 */
export function getCurrentProvider() {
  return config.ai.provider;
}

/**
 * Set the AI provider
 * @param {string} provider - Provider name (openrouter, openai, anthropic)
 */
export function setProvider(provider) {
  if (getAvailableProviders().includes(provider)) {
    config.ai.provider = provider;
    console.log(`AI provider set to: ${provider}`);
  } else {
    console.warn(
      `Provider ${provider} is not available. Available providers: ${getAvailableProviders().join(", ")}`,
    );
  }
}

/**
 * Test AI provider connectivity
 * @param {string} provider - Provider to test (optional, uses current if not specified)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testProvider(provider = null) {
  const testProvider = provider || getCurrentProvider();

  try {
    const result = await callAI(
      "", // No user prompt, system prompt contains everything
      systemPrompt,
      { maxTokens, temperature },
    );

    if (result.success) {
      // Deduct credits after successful generation
      const { deductCredits } = await import("../utils/credits.js");
      await deductCredits(userId, 10, "ai_content_generation", {
        model,
        section,
        action,
        idea_id: ideaId,
      });
    }

    return {
      success: result.success,
      generated_content: result.content,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Call AI provider for chat completions with fallback support
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Additional options (provider, model, fallback, etc.)
 * @returns {Promise<{success: boolean, content: string, error: any, provider: string}>}
 */
async function callAI(prompt, systemPrompt, options = {}) {
  const providers = options.provider
    ? [options.provider]
    : options.fallback === false
      ? [config.ai.provider]
      : getAvailableProviders();

  if (providers.length === 0) {
    return {
      success: false,
      content: "",
      error: new Error("No AI providers configured"),
      provider: null,
    };
  }

  for (const provider of providers) {
    try {
      let result;

      switch (provider) {
        case AI_PROVIDERS.OPENAI:
          result = await callOpenAI(prompt, systemPrompt, options);
          break;
        case AI_PROVIDERS.ANTHROPIC:
          result = await callAnthropic(prompt, systemPrompt, options);
          break;
        case AI_PROVIDERS.OPENROUTER:
        default:
          result = await callOpenRouter(prompt, systemPrompt, options);
          break;
      }

      if (result.success) {
        return {
          ...result,
          provider,
        };
      }

      console.warn(`${provider} failed: ${result.error?.message}`);
    } catch (error) {
      console.warn(`${provider} error: ${error.message}`);
    }
  }

  return {
    success: false,
    content: "",
    error: new Error(`All AI providers failed. Tried: ${providers.join(", ")}`),
    provider: null,
  };
}

/**
 * Call OpenRouter API for chat completions
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Additional options
 * @returns {Promise<{success: boolean, content: string, error: any}>}
 */
async function callOpenRouter(prompt, systemPrompt, options = {}) {
  try {
    // For models that don't support system prompts, combine system prompt with user prompt
    const combinedPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const messages = [];
    if (
      systemPrompt &&
      config.openrouter.model !== "google/gemma-3n-e2b-it:free"
    ) {
      // Use system message for models that support it
      messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });
    } else {
      // Combine system prompt with user prompt for models that don't support system messages
      messages.push({ role: "user", content: combinedPrompt });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:4000",
          "X-Title": "Accelerator AI",
        },
        body: JSON.stringify({
          model: config.openrouter.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", response.status, errorData);
      return {
        success: false,
        content: "",
        error: new Error(`OpenRouter API error: ${response.status}`),
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenRouter response:", data);
      return {
        success: false,
        content: "",
        error: new Error("Invalid response from OpenRouter"),
      };
    }

    return {
      success: true,
      content: data.choices[0].message.content.trim(),
      error: null,
    };
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    return {
      success: false,
      content: "",
      error,
    };
  }
}

/**
 * Call OpenAI API for chat completions
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Additional options
 * @returns {Promise<{success: boolean, content: string, error: any}>}
 */
async function callOpenAI(prompt, systemPrompt, options = {}) {
  try {
    if (!config.ai.openai.apiKey) {
      return {
        success: false,
        content: "",
        error: new Error("OpenAI API key not configured"),
      };
    }

    const model = options.model || config.ai.openai.model;
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.openai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return {
        success: false,
        content: "",
        error: new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`,
        ),
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenAI response:", data);
      return {
        success: false,
        content: "",
        error: new Error("Invalid response from OpenAI"),
      };
    }

    return {
      success: true,
      content: data.choices[0].message.content.trim(),
      error: null,
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {
      success: false,
      content: "",
      error,
    };
  }
}

/**
 * Call Anthropic API for chat completions
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt
 * @param {Object} options - Additional options
 * @returns {Promise<{success: boolean, content: string, error: any}>}
 */
async function callAnthropic(prompt, systemPrompt, options = {}) {
  try {
    if (!config.ai.anthropic.apiKey) {
      return {
        success: false,
        content: "",
        error: new Error("Anthropic API key not configured"),
      };
    }

    const model = options.model || config.ai.anthropic.model;
    let fullPrompt = prompt;

    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.ai.anthropic.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
        system: systemPrompt || undefined,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API error:", errorData);
      return {
        success: false,
        content: "",
        error: new Error(
          `Anthropic API error: ${response.status} ${response.statusText}`,
        ),
      };
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Invalid Anthropic response:", data);
      return {
        success: false,
        content: "",
        error: new Error("Invalid response from Anthropic"),
      };
    }

    return {
      success: true,
      content: data.content[0].text.trim(),
      error: null,
    };
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    return {
      success: false,
      content: "",
      error,
    };
  }
}

/**
 * Generate a title for the project
 * @param {string} description - Project description
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, title: string, error: any}>}
 */
export async function generateTitle(description, userId) {
  // Validate credits before proceeding
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 10);
  if (creditError) {
    return {
      success: false,
      title: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      title: "",
      error: new Error("Insufficient credits"),
    };
  }

  const systemPrompt = `You are a startup naming expert. Given a project description, create a compelling, memorable title that is 3-8 words long. Return only the title, nothing else.`;

  const result = await callAI(description, systemPrompt);

  return {
    success: result.success,
    title: result.content,
    error: result.error,
  };
}

/**
 * Generate a category for the project
 * @param {string} description - Project description
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, category: string, error: any}>}
 */
export async function generateCategory(description, userId) {
  // Validate credits before proceeding
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 5);
  if (creditError) {
    return {
      success: false,
      category: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      category: "",
      error: new Error("Insufficient credits"),
    };
  }

  const systemPrompt = `Categorize this startup idea into exactly one of these categories: Technology, Healthcare, Finance, Education, E-commerce, Entertainment, Social, Environment, or Other. Return only the category name, nothing else.`;

  const result = await callAI(description, systemPrompt);

  return {
    success: result.success,
    category: result.content,
    error: result.error,
  };
}

/**
 * Generate tags for the project
 * @param {string} description - Project description
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, tags: string[], error: any}>}
 */
export async function generateTags(description, userId) {
  // Validate credits before proceeding
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 5);
  if (creditError) {
    return {
      success: false,
      tags: [],
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      tags: [],
      error: new Error("Insufficient credits"),
    };
  }

  const systemPrompt = `Generate 3-5 relevant tags for this project, separated by commas. Tags should be lowercase, use hyphens instead of spaces, and be highly relevant. Return only the comma-separated tags, nothing else.`;

  const result = await callAI(description, systemPrompt);

  if (!result.success) {
    return result;
  }

  // Parse comma-separated tags
  const tags = result.content
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  return {
    success: true,
    tags,
    error: null,
  };
}

/**
 * Improve the project description
 * @param {string} description - Original description
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, improved_description: string, error: any}>}
 */
export async function improveDescription(description, userId) {
  // Validate credits before proceeding
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 15);
  if (creditError) {
    return {
      success: false,
      improved_description: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      improved_description: "",
      error: new Error("Insufficient credits"),
    };
  }

  const systemPrompt = `Improve this project description to be more compelling, clear, and professional while maintaining the original meaning. Keep it concise but detailed. Return only the improved description, nothing else.`;

  const result = await callAI(description, systemPrompt);

  return {
    success: result.success,
    improved_description: result.content,
    error: result.error,
  };
}

/**
 * Generate description based on a question
 * @param {string} question - The question to answer
 * @returns {Promise<{success: boolean, generated_content: string, error: any}>}
 */
export async function generateDescription(question) {
  const systemPrompt = `Answer the following question with a detailed, professional response suitable for a business plan or project description. Provide comprehensive information that directly addresses the question. Keep the response focused and relevant.`;

  const result = await callOpenRouter(question, systemPrompt);

  return {
    success: result.success,
    generated_content: result.content,
    error: result.error,
  };
}

/**
 * Generate description for a specific model section
 * @param {string} model - The model name (e.g., "idea")
 * @param {string} section - The section name (e.g., "market-analysis")
 * @param {string} action - The action type (e.g., "generate")
 * @param {string} input - The input text (question or description)
 * @param {string} existingContent - Existing content for improve action
 * @param {string} userInputs - User inputs for generate action
 * @param {string} ideaId - The idea ID for historical context
 * @returns {Promise<{success: boolean, generated_content: string, error: any}>}
 */
export async function generateDescriptionForSection(
  model,
  section,
  action,
  input,
  existingContent = "",
  userInputs = "",
  ideaId = null,
  userId,
) {
  // Validate credits before proceeding (10 credits for content generation)
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 10);
  if (creditError) {
    return {
      success: false,
      generated_content: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      generated_content: "",
      error: new Error("Insufficient credits"),
    };
  }

  try {
    // Load prompt from .hbs file
    const fs = await import("fs");
    const path = await import("path");

    const promptPath = path.join(
      process.cwd(),
      "prompts",
      "models",
      model,
      "sections",
      section,
      `${action}.hbs`,
    );

    if (!fs.existsSync(promptPath)) {
      // Fallback to generic
      return await generateDescription(input);
    }

    const templateSource = fs.readFileSync(promptPath, "utf8");

    const template = Handlebars.compile(templateSource);

    // Get historical context if ideaId provided
    const ideaHistoryContext = ideaId
      ? await getIdeaHistoryContext(ideaId)
      : "";

    // Prepare data
    const data = {
      question: input,
      description: input,
      existingContent,
      userInputs,
      modelType: model,
      ideaHistoryContext,
    };

    const systemPrompt = template(data);

    // Default parameters based on action
    const maxTokens =
      action === "generate" ? 350 : action === "improve" ? 400 : 300;
    const temperature =
      action === "generate" ? 0.7 : action === "improve" ? 0.6 : 0.7;

    const result = await callOpenRouter(
      "", // No user prompt, system prompt contains everything
      systemPrompt,
      maxTokens,
      temperature,
    );

    return {
      success: result.success,
      generated_content: result.content,
      error: result.error,
    };
  } catch (error) {
    console.error("Error loading prompt file:", error);
    // Fallback to generic
    return await generateDescription(input);
  }
}

/**
 * Improve description for a specific model section
 * @param {string} model - The model name
 * @param {string} section - The section name
 * @param {string} action - The action type (e.g., "improve")
 * @param {string} description - The description to improve
 * @param {string} existingContent - Existing content for improve action
 * @param {string} userInputs - User inputs for improve action
 * @param {string} ideaId - The idea ID for historical context
 * @returns {Promise<{success: boolean, improved_description: string, error: any}>}
 */
export async function improveDescriptionForSection(
  model,
  section,
  action,
  description,
  existingContent = "",
  userInputs = "",
  ideaId = null,
  userId,
) {
  // Validate credits before proceeding (10 credits for content improvement)
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 10);
  if (creditError) {
    return {
      success: false,
      improved_description: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      improved_description: "",
      error: new Error("Insufficient credits"),
    };
  }
  try {
    // Load prompt from .hbs file
    const fs = await import("fs");
    const path = await import("path");

    const promptPath = path.join(
      process.cwd(),
      "prompts",
      "models",
      model,
      "sections",
      section,
      `${action}.hbs`,
    );

    if (!fs.existsSync(promptPath)) {
      // Fallback to generic
      return await improveDescription(description);
    }

    const templateSource = fs.readFileSync(promptPath, "utf8");

    // Register partials
    const partialsDir = path.join(process.cwd(), "prompts", "partials");
    if (fs.existsSync(partialsDir)) {
      const partialFiles = fs.readdirSync(partialsDir);
      for (const file of partialFiles) {
        if (file.endsWith(".hbs")) {
          const partialName = file.replace(".hbs", "");
          const partialPath = path.join(partialsDir, file);
          const partialContent = fs.readFileSync(partialPath, "utf8");
          Handlebars.registerPartial(partialName, partialContent);
        }
      }
    }

    const template = Handlebars.compile(templateSource);

    // Get historical context if ideaId provided
    const ideaHistoryContext = ideaId
      ? await getIdeaHistoryContext(ideaId)
      : "";

    // Prepare data
    const data = {
      question: description,
      description,
      existingContent,
      userInputs,
      modelType: model,
      ideaHistoryContext,
    };

    const systemPrompt = template(data);

    // Default parameters
    const maxTokens = 400;
    const temperature = 0.6;

    const result = await callAI(
      "", // System prompt contains everything
      systemPrompt,
      { maxTokens, temperature },
    );

    if (result.success) {
      // Deduct credits after successful improvement
      const { deductCredits } = await import("../utils/credits.js");
      await deductCredits(userId, 10, "ai_content_improvement", {
        model,
        section,
        action,
        idea_id: ideaId,
      });
    }

    return {
      success: result.success,
      improved_description: result.content,
      error: result.error,
    };
  } catch (error) {
    console.error("Error loading prompt file:", error);
    // Fallback to generic
    return await improveDescription(description);
  }
}

/**
 * Intelligent auto-fill suggestions based on partial form data
 * @param {Object} formData - Partial form data with existing field values
 * @param {string} userId - User ID for credit validation
 * @param {string} context - Additional context (model, section, etc.)
 * @returns {Promise<{success: boolean, suggestions: Object, confidence: number, error: any}>}
 */
export async function suggestAutoFill(formData, userId, context = "") {
  // Validate credits before proceeding (lower cost for suggestions)
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 8);
  if (creditError) {
    return {
      success: false,
      suggestions: {},
      confidence: 0,
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      suggestions: {},
      confidence: 0,
      error: new Error("Insufficient credits for auto-fill suggestions"),
    };
  }

  // Analyze existing data and determine what to suggest
  const existingFields = Object.keys(formData).filter(
    (key) => formData[key] && formData[key].toString().trim().length > 0,
  );

  const missingFields = ["title", "category", "description", "tags"].filter(
    (field) =>
      !existingFields.includes(field) ||
      !formData[field] ||
      formData[field].toString().trim().length < 10,
  );

  if (missingFields.length === 0) {
    return {
      success: true,
      suggestions: {},
      confidence: 1,
      message: "All fields are already complete",
    };
  }

  // Build context-aware prompt
  let prompt = `Based on the following partial form data, suggest appropriate values for the missing fields:\n\n`;

  if (existingFields.length > 0) {
    prompt += `Existing data:\n`;
    existingFields.forEach((field) => {
      prompt += `- ${field}: ${formData[field]}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Please suggest values for: ${missingFields.join(", ")}\n\n`;
  prompt += `Return suggestions in this JSON format:\n`;
  prompt += `{\n`;
  prompt += `  "suggestions": {\n`;

  missingFields.forEach((field) => {
    if (field === "title") prompt += `    "title": "suggested title here",\n`;
    if (field === "category") prompt += `    "category": "Technology",\n`;
    if (field === "description")
      prompt += `    "description": "expanded description here",\n`;
    if (field === "tags") prompt += `    "tags": ["tag1", "tag2", "tag3"]\n`;
  });

  prompt += `  },\n`;
  prompt += `  "confidence": 0.8,\n`;
  prompt += `  "reasoning": "brief explanation of suggestions"\n`;
  prompt += `}\n\n`;
  prompt += `Only return valid JSON. Make suggestions that are contextually appropriate and enhance the existing data.`;

  const systemPrompt = `You are an expert business consultant helping users complete startup idea forms. Analyze the provided data and suggest appropriate completions that fit naturally with the existing information. Be creative but realistic, and ensure suggestions are high-quality and actionable.

Guidelines:
- Title: 3-8 words, compelling and memorable
- Category: Choose from Technology, Healthcare, Finance, Education, E-commerce, Entertainment, Social, Environment, Other
- Description: 100-500 words, detailed but concise, professional business language
- Tags: 3-5 relevant tags, lowercase, hyphen-separated
- Confidence: 0.0-1.0 based on how well suggestions fit the existing data

Focus on creating cohesive, professional startup ideas that build naturally from the provided information.`;

  const result = await callAI(prompt, systemPrompt, { maxTokens: 800 });

  if (!result.success) {
    return {
      success: false,
      suggestions: {},
      confidence: 0,
      error: result.error,
    };
  }

  try {
    // Parse the JSON response
    let jsonContent = result.content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonContent);

    // Validate suggestions
    const suggestions = {};
    let totalConfidence = 0;

    missingFields.forEach((field) => {
      if (parsed.suggestions && parsed.suggestions[field]) {
        suggestions[field] = parsed.suggestions[field];
        totalConfidence += 0.25; // Each suggestion adds confidence
      }
    });

    // Deduct credits after successful suggestions
    await deductCredits(userId, 8, "ai_auto_fill", {
      suggested_fields: Object.keys(suggestions),
      context: context,
    });

    return {
      success: true,
      suggestions,
      confidence: Math.min(parsed.confidence || totalConfidence, 1),
      reasoning:
        parsed.reasoning || "AI-generated suggestions based on existing data",
      credits_deducted: 8,
    };
  } catch (parseError) {
    console.error(
      "Failed to parse auto-fill suggestions:",
      parseError,
      result.content,
    );
    return {
      success: false,
      suggestions: {},
      confidence: 0,
      error: new Error("Failed to parse AI suggestions"),
    };
  }
}

/**
 * Auto-fill all project fields (legacy function for full generation)
 * @param {string} description - Partial description
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, title: string, category: string, description: string, tags: string[], error: any}>}
 */
export async function autoFill(description, userId) {
  // Validate credits before proceeding (higher cost for comprehensive generation)
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 25);
  if (creditError) {
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Insufficient credits"),
    };
  }

  const systemPrompt = `Generate a complete startup idea based on the provided description. Return a JSON object with exactly these fields:
- title: A compelling 3-8 word title
- category: One category from: Technology, Healthcare, Finance, Education, E-commerce, Entertainment, Social, Environment, or Other
- description: An improved, detailed description (100-2000 characters)
- tags: Array of 3-5 relevant tags (lowercase, hyphen-separated)

Return only valid JSON, no other text.`;

  const result = await callAI(description, systemPrompt);

  if (!result.success) {
    return result;
  }

  try {
    // Strip markdown code blocks if present
    let jsonContent = result.content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const data = JSON.parse(jsonContent);
    return {
      success: true,
      title: data.title || "",
      category: data.category || "",
      description: data.description || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      error: null,
    };
  } catch (error) {
    console.error("Error parsing auto-fill JSON:", error, result.content);
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Failed to parse AI response"),
    };
  }
}

/**
 * Generate a random startup idea
 * @param {string} prompt - Optional user prompt for inspiration
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, title: string, category: string, description: string, tags: string[], error: any}>}
 */
export async function generateRandomIdea(prompt = "", userId) {
  // Validate credits before proceeding
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 20);
  if (creditError) {
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Insufficient credits"),
    };
  }

  let systemPrompt = `You are an expert startup consultant and creative innovator with 15+ years of experience launching successful ventures. Your task is to generate groundbreaking startup ideas that solve real problems and have massive market potential.

Generate a creative startup idea that includes:
- A unique value proposition that no one else is offering
- Clear market opportunity with specific target customers
- Innovative solution that leverages current technology trends
- Scalable business model with revenue potential

Return a JSON object with exactly these fields:
- title: A compelling 3-8 word title that's memorable and brandable
- category: One category from: Technology, Healthcare, Finance, Education, E-commerce, Entertainment, Social, Environment, or Other
- description: A detailed description (150-250 words) covering: problem statement, solution overview, market opportunity, competitive advantage, and business model
- tags: Array of 4-6 relevant tags (lowercase, hyphen-separated) including industry, technology, and business model tags

Focus on ideas that could realistically become unicorn companies. Be innovative, practical, and market-driven. Return only valid JSON, no other text or explanations.`;

  if (prompt && prompt.trim()) {
    systemPrompt = `You are an expert startup consultant specializing in innovative business concepts. The user has requested: "${prompt}"

Generate a creative startup idea that directly addresses their inspiration while maintaining market viability and innovation. The idea should:
- Build upon their stated interest or need
- Offer a unique solution that competitors don't provide
- Have clear market potential and target customers
- Leverage current technology or business trends

Return a JSON object with exactly these fields:
- title: A compelling 3-8 word title that's memorable and relevant to their request
- category: One category from: Technology, Healthcare, Finance, Education, E-commerce, Entertainment, Social, Environment, or Other
- description: A detailed description (150-250 words) that incorporates their inspiration while covering: enhanced problem statement, innovative solution, market opportunity, competitive advantage, and scalable business model
- tags: Array of 4-6 relevant tags (lowercase, hyphen-separated) including their requested theme, technology used, and business model

Create something they would genuinely want to build. Be creative but practical, innovative but achievable. Return only valid JSON, no other text.`;
  }

  const result = await callOpenRouter("Generate a startup idea", systemPrompt);

  if (!result.success) {
    return result;
  }

  try {
    // Strip markdown code blocks if present
    let jsonContent = result.content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const data = JSON.parse(jsonContent);
    return {
      success: true,
      title: data.title || "",
      category: data.category || "",
      description: data.description || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      error: null,
    };
  } catch (error) {
    console.error("Error parsing random idea JSON:", error, result.content);
    return {
      success: false,
      title: "",
      category: "",
      description: "",
      tags: [],
      error: new Error("Failed to parse AI response"),
    };
  }
}

/**
 * Explain the executive summary section
 * @param {string} title - The idea title
 * @param {string} category - The idea category
 * @param {string} description - The idea description
 * @returns {Promise<{success: boolean, explanation: string, error: any}>}
 */
export async function explainExecutiveSummary(title, category, description) {
  const systemPrompt = `You are an expert business analyst. Given an idea's title, category, and description, provide a clear, concise explanation of what this executive summary means and why it matters. Focus on:
1. What the idea is about
2. The problem it solves
3. The target market
4. The unique value proposition
5. Why this could be successful

Keep the explanation to 200-400 words, professional but accessible. Return only the explanation text, nothing else.`;

  const prompt = `Title: ${title}\nCategory: ${category}\nDescription: ${description}`;

  const result = await callOpenRouter(prompt, systemPrompt);

  return {
    success: result.success,
    explanation: result.content,
    error: result.error,
  };
}

/**
 * Chat about project requirements
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} ideaId - The idea ID for full historical context
 * @param {string} userId - User ID for credit validation
 * @returns {Promise<{success: boolean, response: string, error: any}>}
 */
export async function chatAboutRequirements(messages, ideaId = null, userId) {
  // Validate credits before proceeding (lower cost for chat)
  const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 5);
  if (creditError) {
    return {
      success: false,
      response: "",
      error: new Error("Failed to validate credits"),
    };
  }
  if (!hasEnough) {
    return {
      success: false,
      response: "",
      error: new Error("Insufficient credits"),
    };
  }

  // Get full historical context
  const ideaHistoryContext = ideaId ? await getIdeaHistoryContext(ideaId) : "";

  const systemPrompt = `You are an AI assistant helping users refine and discuss their startup project requirements. You can help with:
- Clarifying requirements
- Suggesting improvements
- Answering questions about the project
- Providing business advice
- Technical guidance

Be helpful, professional, and concise. Focus on the user's project requirements and context provided. If no specific context is given, ask for clarification about their project.

Full project context and history:
${ideaHistoryContext || "No project context provided yet"}`;

  // Convert messages to OpenRouter format
  const openRouterMessages = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
  }));

  // Handle system prompt based on model support
  if (config.openrouter.model !== "google/gemma-3n-e2b-it:free") {
    // Use system message for models that support it
    openRouterMessages.unshift({ role: "system", content: systemPrompt });
  } else {
    // Combine system prompt with first user message for models that don't support system messages
    const firstUserMessageIndex = openRouterMessages.findIndex(
      (msg) => msg.role === "user",
    );
    if (firstUserMessageIndex !== -1) {
      openRouterMessages[firstUserMessageIndex].content =
        `${systemPrompt}\n\n${openRouterMessages[firstUserMessageIndex].content}`;
    } else {
      // If no user message, add as first message
      openRouterMessages.unshift({ role: "user", content: systemPrompt });
    }
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:4000",
          "X-Title": "Accelerator AI",
        },
        body: JSON.stringify({
          model: config.openrouter.model,
          messages: openRouterMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", response.status, errorData);
      return {
        success: false,
        response: "",
        error: new Error(`OpenRouter API error: ${response.status}`),
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenRouter response:", data);
      return {
        success: false,
        response: "",
        error: new Error("Invalid response from OpenRouter"),
      };
    }

    return {
      success: true,
      response: data.choices[0].message.content.trim(),
      error: null,
    };
  } catch (error) {
    console.error("Error calling OpenRouter for chat:", error);
    return {
      success: false,
      response: "",
      error,
    };
  }
}

/**
 * Get full historical context of all completed sections for an idea
 * @param {string} ideaId - The idea ID
 * @returns {Promise<string>} Formatted historical context
 */
export async function getIdeaHistoryContext(ideaId) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const config = (await import("../config.js")).default;
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey || config.supabase.key,
    );

    // Get all model instances for this idea
    const { data: instances, error: instancesError } = await supabase
      .from("model_instances")
      .select("id, model_type")
      .eq("idea_id", ideaId);

    if (instancesError || !instances) {
      console.error("Error fetching model instances:", instancesError);
      return "";
    }

    let historyParts = [];

    // For each model instance, get completed sections
    for (const instance of instances) {
      const { data: sections, error: sectionsError } = await supabase
        .from("model_sections")
        .select("section_name, section_data")
        .eq("model_instance_id", instance.id)
        .eq("is_completed", true)
        .order("created_at");

      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
        continue;
      }

      if (sections && sections.length > 0) {
        // Capitalize model type for display
        const modelDisplayName =
          instance.model_type.charAt(0).toUpperCase() +
          instance.model_type.slice(1);

        for (const section of sections) {
          // Format section name for display (replace hyphens with spaces, capitalize)
          const sectionDisplayName = section.section_name
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          // Section data is stored as text content
          const content = section.section_data || "";

          if (content.trim()) {
            historyParts.push(
              `${modelDisplayName} - ${sectionDisplayName}:\n${content.trim()}`,
            );
          }
        }
      }
    }

    // Also include basic idea information
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("title, description, category")
      .eq("id", ideaId)
      .single();

    if (!ideaError && idea) {
      historyParts.unshift(
        `Idea Overview:\nTitle: ${idea.title}\nCategory: ${idea.category}\nDescription: ${idea.description || "Not provided"}`,
      );
    }

    return historyParts.length > 0 ? historyParts.join("\n\n") : "";
  } catch (error) {
    console.error("Error fetching idea history context:", error);
    return "";
  }
}
