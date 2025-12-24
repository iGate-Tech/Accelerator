import express from 'express';
import { requireAuth } from '../../session.js';
import { requirePackage } from '../../middleware/package.js';
import { getUserCredits, deductCredits } from '../../utils/credits.js';

const router = express.Router();

// API Endpoints for Reports

// POST /api/reports/business-plan - Generate business plan report
router.post('/api/reports/business-plan', requireAuth, async (req, res) => {
  try {
    const { idea_id } = req.body;
    const userId = req.user.id;

    if (!idea_id) {
      return res.status(400).json({
        success: false,
        error: 'Idea ID is required',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Check package access
    const { data: profile } = await supabase
      .from('profiles')
      .select('package_type')
      .eq('user_id', userId)
      .single();

    if (!profile || !['student', 'enterprise'].includes(profile.package_type)) {
      return res.status(403).json({
        success: false,
        error:
          'Business plan generation requires Student or Enterprise package',
      });
    }

    // Check credit balance
    const { balance } = await getUserCredits(userId);
    if (balance < 50) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. Report generation costs 50 credits.',
        required_credits: 50,
        current_balance: balance,
      });
    }

    // Get idea data
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', idea_id)
      .eq('user_id', userId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found or access denied',
      });
    }

    if (!idea.validation_threshold_met) {
      return res.status(400).json({
        success: false,
        error: 'Idea must reach validation threshold before generating reports',
      });
    }

    // Get completed model data
    const { data: modelData } = await supabase
      .from('model_instances')
      .select(
        `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
      )
      .eq('idea_id', idea_id)
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Generate report using AI
    const { generateBusinessPlan } = await import(
      '../../services/report-generator.js'
    );
    const reportContent = await generateBusinessPlan(idea, modelData);

    // Generate PDF and upload to storage
    const { generateAndUploadPDF, convertReportToHTML } = await import(
      '../../services/report-storage.js'
    );

    const reportTitle = `Business Plan - ${idea.title}`;
    const htmlContent = convertReportToHTML(
      reportContent,
      reportTitle,
      'business-plan',
      idea,
    );

    const pdfResult = await generateAndUploadPDF(
      htmlContent,
      `business-plan-${idea.id}`,
      'reports',
    );

    if (!pdfResult.success) {
      console.error('PDF generation failed:', pdfResult.error);
      return res.status(500).json({
        success: false,
        error: 'Report generated but PDF creation failed',
      });
    }

    // Deduct credits
    await deductCredits(userId, 50, 'report_generation', {
      idea_id: idea_id,
      report_type: 'business-plan',
    });

    // Save report with file URL
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        idea_id: idea_id,
        user_id: userId,
        report_type: 'business-plan',
        report_data: {
          content: reportContent,
          file_url: pdfResult.publicUrl,
        },
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error saving report:', reportError);
      return res.status(500).json({
        success: false,
        error: 'Report generated but failed to save',
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'report_generated',
      entity_type: 'report',
      entity_id: report.id,
      details: { report_type: 'business-plan', idea_id: idea_id },
    });

    res.json({
      success: true,
      message: 'Business plan generated successfully',
      report: {
        id: report.id,
        type: report.report_type,
        idea_id: report.idea_id,
        created_at: report.created_at,
      },
      credits_deducted: 50,
    });
  } catch (error) {
    console.error('API business plan generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate business plan',
    });
  }
});

// POST /api/reports/pitch-deck - Generate pitch deck report
router.post('/api/reports/pitch-deck', requireAuth, async (req, res) => {
  try {
    const { idea_id } = req.body;
    const userId = req.user.id;

    if (!idea_id) {
      return res.status(400).json({
        success: false,
        error: 'Idea ID is required',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Check package access
    const { data: profile } = await supabase
      .from('profiles')
      .select('package_type')
      .eq('user_id', userId)
      .single();

    if (!profile || !['student', 'enterprise'].includes(profile.package_type)) {
      return res.status(403).json({
        success: false,
        error: 'Pitch deck generation requires Student or Enterprise package',
      });
    }

    // Check credit balance
    const { balance } = await getUserCredits(userId);
    if (balance < 50) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. Report generation costs 50 credits.',
        required_credits: 50,
        current_balance: balance,
      });
    }

    // Get idea and model data
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', idea_id)
      .eq('user_id', userId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found or access denied',
      });
    }

    if (!idea.validation_threshold_met) {
      return res.status(400).json({
        success: false,
        error: 'Idea must reach validation threshold before generating reports',
      });
    }

    const { data: modelData } = await supabase
      .from('model_instances')
      .select(
        `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
      )
      .eq('idea_id', idea_id)
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Generate pitch deck
    const { generatePitchDeck } = await import(
      '../../services/report-generator.js'
    );
    const reportContent = await generatePitchDeck(idea, modelData);

    // Generate PDF and upload to storage
    const { generateAndUploadPDF, convertReportToHTML } = await import(
      '../../services/report-storage.js'
    );

    const reportTitle = `Pitch Deck - ${idea.title}`;
    const htmlContent = convertReportToHTML(
      reportContent,
      reportTitle,
      'pitch-deck',
      idea,
    );

    const pdfResult = await generateAndUploadPDF(
      htmlContent,
      `pitch-deck-${idea.id}`,
      'reports',
    );

    if (!pdfResult.success) {
      console.error('PDF generation failed:', pdfResult.error);
      return res.status(500).json({
        success: false,
        error: 'Report generated but PDF creation failed',
      });
    }

    // Deduct credits and save report
    await deductCredits(userId, 50, 'report_generation', {
      idea_id: idea_id,
      report_type: 'pitch-deck',
    });

    const { data: report } = await supabase
      .from('reports')
      .insert({
        idea_id: idea_id,
        user_id: userId,
        report_type: 'pitch-deck',
        report_data: {
          content: reportContent,
          file_url: pdfResult.publicUrl,
        },
      })
      .select()
      .single();

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'report_generated',
      entity_type: 'report',
      entity_id: report.id,
      details: { report_type: 'pitch-deck', idea_id: idea_id },
    });

    res.json({
      success: true,
      message: 'Pitch deck generated successfully',
      report: {
        id: report.id,
        type: report.report_type,
        idea_id: report.idea_id,
        created_at: report.created_at,
      },
      credits_deducted: 50,
    });
  } catch (error) {
    console.error('API pitch deck generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate pitch deck',
    });
  }
});

// POST /api/reports/valuation - Generate valuation report
router.post('/api/reports/valuation', requireAuth, async (req, res) => {
  try {
    const { idea_id } = req.body;
    const userId = req.user.id;

    if (!idea_id) {
      return res.status(400).json({
        success: false,
        error: 'Idea ID is required',
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Check package access
    const { data: profile } = await supabase
      .from('profiles')
      .select('package_type')
      .eq('user_id', userId)
      .single();

    if (!profile || !['student', 'enterprise'].includes(profile.package_type)) {
      return res.status(403).json({
        success: false,
        error:
          'Valuation report generation requires Student or Enterprise package',
      });
    }

    // Check credit balance
    const { balance } = await getUserCredits(userId);
    if (balance < 50) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. Report generation costs 50 credits.',
        required_credits: 50,
        current_balance: balance,
      });
    }

    // Get idea and model data
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', idea_id)
      .eq('user_id', userId)
      .single();

    if (ideaError || !idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found or access denied',
      });
    }

    if (!idea.validation_threshold_met) {
      return res.status(400).json({
        success: false,
        error: 'Idea must reach validation threshold before generating reports',
      });
    }

    const { data: modelData } = await supabase
      .from('model_instances')
      .select(
        `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
      )
      .eq('idea_id', idea_id)
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Generate valuation
    const { generateValuation } = await import(
      '../../services/report-generator.js'
    );
    const reportContent = await generateValuation(idea, modelData);

    // Generate PDF and upload to storage
    const { generateAndUploadPDF, convertReportToHTML } = await import(
      '../../services/report-storage.js'
    );

    const reportTitle = `Valuation Report - ${idea.title}`;
    const htmlContent = convertReportToHTML(
      reportContent,
      reportTitle,
      'valuation',
      idea,
    );

    const pdfResult = await generateAndUploadPDF(
      htmlContent,
      `valuation-${idea.id}`,
      'reports',
    );

    if (!pdfResult.success) {
      console.error('PDF generation failed:', pdfResult.error);
      return res.status(500).json({
        success: false,
        error: 'Report generated but PDF creation failed',
      });
    }

    // Deduct credits and save report
    await deductCredits(userId, 50, 'report_generation', {
      idea_id: idea_id,
      report_type: 'valuation',
    });

    const { data: report } = await supabase
      .from('reports')
      .insert({
        idea_id: idea_id,
        user_id: userId,
        report_type: 'valuation',
        report_data: {
          content: reportContent,
          file_url: pdfResult.publicUrl,
        },
      })
      .select()
      .single();

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      action_type: 'report_generated',
      entity_type: 'report',
      entity_id: report.id,
      details: { report_type: 'valuation', idea_id: idea_id },
    });

    res.json({
      success: true,
      message: 'Valuation report generated successfully',
      report: {
        id: report.id,
        type: report.report_type,
        idea_id: report.idea_id,
        created_at: report.created_at,
      },
      credits_deducted: 50,
    });
  } catch (error) {
    console.error('API valuation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate valuation report',
    });
  }
});

// GET /api/reports - List user's generated reports
router.get('/api/reports', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, offset = 0 } = req.query;

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    let query = supabase
      .from('reports')
      .select(
        `
        id,
        report_type,
        created_at,
        idea_id,
        ideas (
          title,
          category
        )
      `,
      )
      .eq('user_id', userId);

    if (type) {
      query = query.eq('report_type', type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch reports',
      });
    }

    res.json({
      success: true,
      reports: reports || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: reports && reports.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get reports API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/reports/:id - Get specific report details
router.get('/api/reports/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: report, error } = await supabase
      .from('reports')
      .select(
        `
        *,
        ideas (
          title,
          description,
          category
        )
      `,
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      report: report,
    });
  } catch (error) {
    console.error('Get report API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/reports/:id/download - Download report as PDF
router.get('/api/reports/:id/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: report, error } = await supabase
      .from('reports')
      .select(
        `
        *,
        ideas (
          title
        )
      `,
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    const fileUrl = report.report_data?.file_url;

    if (!fileUrl) {
      // Fallback: generate PDF on-the-fly if no stored file
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        '../../services/report-storage.js'
      );

      const reportTitle = `${report.report_type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - ${report.ideas?.title || 'Report'}`;
      const htmlContent = convertReportToHTML(
        report.report_data?.content || 'Report content not available',
        reportTitle,
        report.report_type,
        report.ideas,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        `${report.report_type}-${report.id}`,
        'reports',
      );

      if (pdfResult.success) {
        // Update report with file URL for future downloads
        await supabase
          .from('reports')
          .update({
            report_data: {
              ...report.report_data,
              file_url: pdfResult.publicUrl,
            },
          })
          .eq('id', id);

        // Redirect to the file
        return res.redirect(pdfResult.publicUrl);
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF',
        });
      }
    }

    // Redirect to the stored PDF file
    res.redirect(fileUrl);
  } catch (error) {
    console.error('Download report API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
    });
  }
});

// Business Plan report
router.get(
  '/reports/business-plan',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from('ideas')
      .select('id, title, completion_percentage, validation_threshold_met')
      .eq('user_id', req.user.id)
      .eq('validation_threshold_met', true)
      .order('updated_at', { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', req.user.id)
      .single();

    res.render('reports/business-plan', {
      title: 'Business Plan Generator - Accelerator',
      bodyClass: 'business-plan-report-page',
      layout: 'main',
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Pitch Deck report
router.get(
  '/reports/pitch-deck',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from('ideas')
      .select('id, title, completion_percentage, validation_threshold_met')
      .eq('user_id', req.user.id)
      .eq('validation_threshold_met', true)
      .order('updated_at', { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', req.user.id)
      .single();

    res.render('reports/pitch-deck', {
      title: 'Pitch Deck Generator - Accelerator',
      bodyClass: 'pitch-deck-report-page',
      layout: 'main',
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Valuation report
router.get(
  '/reports/valuation',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    if (req.session.supabaseAccessToken) {
      await supabase.auth.setSession({
        access_token: req.session.supabaseAccessToken,
        refresh_token: req.session.supabaseRefreshToken,
      });
    }

    // Get user's ideas that have validation threshold met
    const { data: userIdeas } = await supabase
      .from('ideas')
      .select('id, title, completion_percentage, validation_threshold_met')
      .eq('user_id', req.user.id)
      .eq('validation_threshold_met', true)
      .order('updated_at', { ascending: false });

    // Get user's credit balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', req.user.id)
      .single();

    res.render('reports/valuation', {
      title: 'Valuation Report Generator - Accelerator',
      bodyClass: 'valuation-report-page',
      layout: 'main',
      user: req.user,
      userIdeas: userIdeas || [],
      userCredits: profile?.credit_balance || 0,
    });
  },
);

// Generate Business Plan
router.post(
  '/reports/business-plan',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect('/reports/business-plan');
      }

      // Get idea data
      const { createClient } = await import('@supabase/supabase-js');
      const config = (await import('../../config.js')).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect('/reports/business-plan');
      }

      // Get completed model data
      const { data: modelData } = await supabase
        .from('model_instances')
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .eq('status', 'completed');

      // Generate report using AI
      const { generateBusinessPlan } = await import(
        '../../services/report-generator.js'
      );
      const reportContent = await generateBusinessPlan(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        '../../services/report-storage.js'
      );

      const reportTitle = `Business Plan - ${idea.title}`;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        'business-plan',
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        `business-plan-${idea.id}`,
        'reports',
      );

      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        return res.redirect('/reports/business-plan');
      }

      // Deduct credits
      await deductCredits(userId, 50, 'report_generation', {
        idea_id: ideaId,
        report_type: 'business-plan',
      });

      // Save report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: 'business-plan',
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error saving report:', reportError);
        return res.redirect('/reports/business-plan');
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: userId,
        action_type: 'report_generated',
        entity_type: 'report',
        entity_id: report.id,
        details: { report_type: 'business-plan', idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error('Business plan generation error:', error);
      res.redirect('/reports/business-plan');
    }
  },
);

// Generate Pitch Deck
router.post(
  '/reports/pitch-deck',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect('/reports/pitch-deck');
      }

      // Get idea and model data (similar to business plan)
      const { createClient } = await import('@supabase/supabase-js');
      const config = (await import('../../config.js')).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect('/reports/pitch-deck');
      }

      const { data: modelData } = await supabase
        .from('model_instances')
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .eq('status', 'completed');

      // Generate pitch deck
      const { generatePitchDeck } = await import(
        '../../services/report-generator.js'
      );
      const reportContent = await generatePitchDeck(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        '../../services/report-storage.js'
      );

      const reportTitle = `Pitch Deck - ${idea.title}`;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        'pitch-deck',
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        `pitch-deck-${idea.id}`,
        'reports',
      );

      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        return res.redirect('/reports/pitch-deck');
      }

      // Deduct credits and save report
      await deductCredits(userId, 50, 'report_generation', {
        idea_id: ideaId,
        report_type: 'pitch-deck',
      });

      const { data: report } = await supabase
        .from('reports')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: 'pitch-deck',
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: userId,
        action_type: 'report_generated',
        entity_type: 'report',
        entity_id: report.id,
        details: { report_type: 'pitch-deck', idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error('Pitch deck generation error:', error);
      res.redirect('/reports/pitch-deck');
    }
  },
);

// Generate Valuation Report
router.post(
  '/reports/valuation',
  requireAuth,
  requirePackage(['student', 'enterprise']),
  async (req, res) => {
    try {
      const { ideaId } = req.body;
      const userId = req.user.id;

      // Check credit balance
      const { balance } = await getUserCredits(userId);
      if (balance < 50) {
        return res.redirect('/reports/valuation');
      }

      // Get idea and model data
      const { createClient } = await import('@supabase/supabase-js');
      const config = (await import('../../config.js')).default;
      const supabase = createClient(config.supabase.url, config.supabase.key);

      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .single();

      if (ideaError || !idea) {
        return res.redirect('/reports/valuation');
      }

      const { data: modelData } = await supabase
        .from('model_instances')
        .select(
          `
        model_type,
        model_sections (
          section_name,
          section_data
        )
      `,
        )
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .eq('status', 'completed');

      // Generate valuation
      const { generateValuation } = await import(
        '../../services/report-generator.js'
      );
      const reportContent = await generateValuation(idea, modelData);

      // Generate PDF and upload to storage
      const { generateAndUploadPDF, convertReportToHTML } = await import(
        '../../services/report-storage.js'
      );

      const reportTitle = `Valuation Report - ${idea.title}`;
      const htmlContent = convertReportToHTML(
        reportContent,
        reportTitle,
        'valuation',
        idea,
      );

      const pdfResult = await generateAndUploadPDF(
        htmlContent,
        `valuation-${idea.id}`,
        'reports',
      );

      if (!pdfResult.success) {
        console.error('PDF generation failed:', pdfResult.error);
        return res.redirect('/reports/valuation');
      }

      // Deduct credits and save report
      await deductCredits(userId, 50, 'report_generation', {
        idea_id: ideaId,
        report_type: 'valuation',
      });

      const { data: report } = await supabase
        .from('reports')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          report_type: 'valuation',
          report_data: {
            content: reportContent,
            file_url: pdfResult.publicUrl,
          },
        })
        .select()
        .single();

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: userId,
        action_type: 'report_generated',
        entity_type: 'report',
        entity_id: report.id,
        details: { report_type: 'valuation', idea_id: ideaId },
      });

      res.redirect(`/reports/view/${report.id}`);
    } catch (error) {
      console.error('Valuation generation error:', error);
      res.redirect('/reports/valuation');
    }
  },
);

// View generated report
router.get('/reports/view/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('../../config.js')).default;
    const supabase = createClient(config.supabase.url, config.supabase.key);

    const { data: report, error } = await supabase
      .from('reports')
      .select(
        `
        *,
        ideas (
          title,
          description
        )
      `,
      )
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (error || !report) {
      return res.redirect('/dashboard');
    }

    res.render('reports/view', {
      title: `${report.report_type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Report - Accelerator`,
      bodyClass: 'report-view-page',
      layout: 'main',
      user: req.user,
      report: report,
    });
  } catch (error) {
    console.error('View report error:', error);
    res.redirect('/dashboard');
  }
});

export default router;
