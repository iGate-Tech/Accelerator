import express from 'express';
import { requireAuth } from '../../session.js';
import {
  generateTitle,
  improveDescription,
  generateRandomIdea,
  chatAboutRequirements,
  generateDescriptionForSection,
  improveDescriptionForSection,
  explainExecutiveSummary,
} from '../../services/ai.js';

const router = express.Router();

// Apply authentication to all AI routes
router.use(requireAuth);

// Generate description for a model section
router.post('/generate/:model/:section', async (req, res) => {
  try {
    const { model, section } = req.params;
    const { question, ideaId } = req.body;
    const userId = req.user.id;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Credit validation is handled inside the AI function
    const result = await generateDescriptionForSection(
      model,
      section,
      'generate',
      question,
      '',
      '',
      ideaId,
      userId,
    );

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error.message || 'AI generation failed' });
    }

    res.json({ generated_content: result.generated_content });
  } catch (error) {
    console.error('Generate section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Improve description for a model section
router.post('/improve/:model/:section', async (req, res) => {
  try {
    const { model, section } = req.params;
    const { description, existingContent, userInputs, ideaId } = req.body;
    const userId = req.user.id;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Credit validation is handled inside the AI function
    const result = await improveDescriptionForSection(
      model,
      section,
      'improve',
      description,
      existingContent,
      userInputs,
      ideaId,
      userId,
    );

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error.message || 'AI improvement failed' });
    }

    res.json({ improved_description: result.improved_description });
  } catch (error) {
    console.error('Improve section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat with AI about requirements (conversation with history)
router.post('/chat', async (req, res) => {
  try {
    const { messages, ideaId } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Credit validation is handled inside the AI function
    const result = await chatAboutRequirements(messages, ideaId, userId);

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error.message || 'AI chat failed' });
    }

    res.json({ response: result.response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Single question chat (temporary, no persistent history)
router.post('/ask', async (req, res) => {
  try {
    const { question, context, model, section, ideaId } = req.body;
    const userId = req.user.id;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Validate credits (5 credits for single questions)
    const { hasEnoughCredits } = await import('../../services/ai.js');
    const { hasEnough, error: creditError } = await hasEnoughCredits(userId, 5);
    if (creditError) {
      return res.status(500).json({ error: 'Failed to validate credits' });
    }
    if (!hasEnough) {
      return res.status(402).json({
        error: 'Insufficient credits. Single questions cost 5 credits.',
        required_credits: 5,
      });
    }

    // Build context-aware prompt
    let systemPrompt =
      "You are a helpful business consultant. Answer the user's question clearly and concisely.";
    let fullPrompt = question;

    if (model && section) {
      // Load model-specific context
      try {
        const fs = await import('fs');
        const path = await import('path');

        const contextPath = path.join(
          process.cwd(),
          'prompts',
          'models',
          model,
          'sections',
          section,
          'chat.hbs',
        );

        if (fs.existsSync(contextPath)) {
          const templateSource = fs.readFileSync(contextPath, 'utf8');
          const Handlebars = (await import('handlebars')).default;
          const template = Handlebars.compile(templateSource);

          systemPrompt = template({
            modelType: model,
            sectionName: section,
            question: question,
            context: context || '',
          });
        }
      } catch (error) {
        console.warn('Could not load model context:', error);
      }
    }

    if (context) {
      fullPrompt = `Context: ${context}\n\nQuestion: ${question}`;
    }

    // Get idea history if provided
    if (ideaId) {
      try {
        const { getIdeaHistoryContext } = await import('../../services/ai.js');
        const historyContext = await getIdeaHistoryContext(ideaId);
        if (historyContext) {
          fullPrompt = `Project History: ${historyContext}\n\n${fullPrompt}`;
        }
      } catch (error) {
        console.warn('Could not load idea history:', error);
      }
    }

    // Call AI
    const { callAI } = await import('../../services/ai.js');
    const result = await callAI(fullPrompt, systemPrompt, {
      maxTokens: 300,
      temperature: 0.7,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.error?.message || 'AI response failed',
      });
    }

    // Deduct credits after successful response
    const { deductCredits } = await import('../../utils/credits.js');
    await deductCredits(userId, 5, 'ai_single_question', {
      question: question.substring(0, 100),
      model,
      section,
      idea_id: ideaId,
    });

    res.json({
      success: true,
      answer: result.content,
      credits_deducted: 5,
      context: {
        model,
        section,
        has_idea_context: !!ideaId,
      },
    });
  } catch (error) {
    console.error('Single question chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy endpoints for backward compatibility
router.post('/generate', async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Credit validation is handled inside the AI function
    const result = await generateTitle(question, userId);

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error.message || 'AI generation failed' });
    }

    res.json({ generated_content: result.title });
  } catch (error) {
    console.error('Legacy generate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/improve', async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user.id;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Credit validation is handled inside the AI function
    const result = await improveDescription(description, userId);

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error.message || 'AI improvement failed' });
    }

    res.json({ improved_description: result.improved_description });
  } catch (error) {
    console.error('Legacy improve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ai/generate-content - Generate content for any model section
router.post('/generate-content', requireAuth, async (req, res) => {
  try {
    const {
      model,
      section,
      action,
      input,
      existingContent,
      userInputs,
      ideaId,
    } = req.body;
    const userId = req.user.id;

    if (!model || !section || !action || !input) {
      return res.status(400).json({
        success: false,
        error: 'Model, section, action, and input are required',
      });
    }

    // Validate action type
    if (!['generate', 'improve', 'chat'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be one of: generate, improve, chat',
      });
    }

    let result;

    if (action === 'generate') {
      result = await generateDescriptionForSection(
        model,
        section,
        action,
        input,
        existingContent || '',
        userInputs || '',
        ideaId,
        userId,
      );
    } else if (action === 'improve') {
      result = await improveDescriptionForSection(
        model,
        section,
        action,
        input,
        existingContent || '',
        userInputs || '',
        ideaId,
        userId,
      );
    } else if (action === 'chat') {
      // For chat, we need messages array
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required for chat action',
        });
      }

      result = await chatAboutRequirements(messages, ideaId, userId);
      return res.json({
        success: result.success,
        response: result.response,
        error: result.error?.message,
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error?.message || 'AI content generation failed',
      });
    }

    const responseKey =
      action === 'generate' ? 'generated_content' : 'improved_description';

    res.json({
      success: true,
      model,
      section,
      action,
      [responseKey]: result[responseKey] || result.generated_content,
      credits_deducted: 10,
    });
  } catch (error) {
    console.error('Generate content API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/ai/models - List available AI models and providers
router.get('/models', async (req, res) => {
  try {
    const { getAvailableProviders, getCurrentProvider } = await import(
      '../../services/ai.js'
    );

    res.json({
      success: true,
      current_provider: getCurrentProvider(),
      available_providers: getAvailableProviders(),
      supported_models: {
        openrouter: ['google/gemma-3n-e2b-it:free'],
        openai: ['gpt-4', 'gpt-3.5-turbo'],
        anthropic: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      },
    });
  } catch (error) {
    console.error('Get AI models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI models information',
    });
  }
});

// POST /api/ai/suggest-autofill - Intelligent auto-fill suggestions
router.post('/suggest-autofill', requireAuth, async (req, res) => {
  try {
    const { formData, context } = req.body;
    const userId = req.user.id;

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'formData object is required',
      });
    }

    const { suggestAutoFill } = await import('../../services/ai.js');
    const result = await suggestAutoFill(formData, userId, context || '');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error?.message || 'Auto-fill suggestions failed',
      });
    }

    res.json({
      success: true,
      suggestions: result.suggestions,
      confidence: result.confidence,
      reasoning: result.reasoning,
      credits_deducted: result.credits_deducted,
    });
  } catch (error) {
    console.error('Suggest auto-fill API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/ai/executive-summary - Generate executive summary from idea data
router.post('/executive-summary', requireAuth, async (req, res) => {
  try {
    const { ideaId } = req.body;
    const userId = req.user.id;

    if (!ideaId) {
      return res.status(400).json({
        success: false,
        error: 'Idea ID is required',
      });
    }

    // Get idea details
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('title, description, category')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    // Generate executive summary
    const result = await explainExecutiveSummary(
      idea.title,
      idea.category,
      idea.description,
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error?.message || 'Executive summary generation failed',
      });
    }

    // Deduct credits (10 credits for executive summary)
    const { deductCredits } = await import('../../utils/credits.js');
    await deductCredits(userId, 10, 'ai_executive_summary', {
      idea_id: ideaId,
      title: idea.title,
    });

    res.json({
      success: true,
      executive_summary: result.explanation,
      credits_deducted: 10,
    });
  } catch (error) {
    console.error('Executive summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/ai/test-provider - Test AI provider connectivity
router.post('/test-provider', async (req, res) => {
  try {
    const { provider } = req.body;
    const { testProvider } = await import('../../services/ai.js');

    const result = await testProvider(provider);

    res.json({
      success: true,
      provider: provider || 'current',
      test_result: result,
    });
  } catch (error) {
    console.error('Test provider error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI provider',
    });
  }
});

// POST /api/ai/random-idea - Generate a random business idea
router.post('/random-idea', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate random idea using AI
    const result = await generateRandomIdea(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error?.message || 'Random idea generation failed',
      });
    }

    res.json({
      success: true,
      title: result.title,
      description: result.description,
      category: result.category,
      tags: result.tags,
      credits_deducted: 20,
    });
  } catch (error) {
    console.error('Random idea generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
