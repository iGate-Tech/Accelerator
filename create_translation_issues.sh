bd create --title="Translate lib/components/nav.hbs hardcoded strings" --type=task --priority=2 --description="Translate remaining hardcoded strings in nav.hbs. Example: Replace 'Failed to mark as read' in showToast calls with {{t 'common.failed_to_mark_as_read'}}. Follow pattern from existing {{t 'nav.*'}} keys."

bd create --title="Translate lib/components/floating-form.hbs buttons and labels" --type=task --priority=2 --description="Replace hardcoded button text like 'Improve Description with AI' with {{t 'buttons.improve_description_ai'}}. Example: <span class=\"hidden group-hover:inline\">Improve Description with AI</span> → <span class=\"hidden group-hover:inline\">{{t 'buttons.improve_description_ai'}}</span>"

bd create --title="Translate lib/components/idea-card.hbs privacy and progress labels" --type=task --priority=2 --description="Translate labels like 'Public', 'Private', 'Progress: '. Example: Replace 'Full Screen' title with {{t 'buttons.full_screen'}}. Follow nav.hbs pattern for consistency."

bd create --title="Translate lib/components/idea-creation.hbs toolbar and form elements" --type=task --priority=2 --description="Replace hardcoded text in buttons like 'Auto Fill with AI', 'Reset Form', 'Create Project'. Example: {{t 'buttons.auto_fill_ai'}} for Auto Fill with AI. Add character counter translation."

bd create --title="Translate lib/components/move-next-block.hbs navigation" --type=task --priority=2 --description="Translate 'Next Section' button text. Example: <span>{{t 'buttons.next_section'}}</span>"

bd create --title="Translate lib/components/progress-steps.hbs steps" --type=task --priority=2 --description="Replace hardcoded step names like 'Pitch Deck', 'Business Plan' with {{t 'steps.pitch_deck'}}. Example: <span>{{t 'steps.pitch_deck'}}</span>"

bd create --title="Translate lib/components/progress-bar.hbs progress labels" --type=task --priority=2 --description="Translate step labels 'Idea', 'Business', 'Financial', etc. Example: {{t 'steps.idea'}} for Idea."

bd create --title="Translate lib/components/question-block.hbs chat and actions" --type=task --priority=2 --description="Replace 'Chat with AI', 'Auto Fill with AI', placeholder text with translations. Example: {{t 'buttons.chat_with_ai'}} for Chat with AI."

bd create --title="Translate lib/components/sidebar.hbs navigation" --type=task --priority=2 --description="Translate 'New Project', 'My Favorites', etc. Example: {{t 'nav.new_project'}} following nav.hbs pattern."

bd create --title="Translate lib/pages/auth/terms.hbs terms content" --type=task --priority=2 --description="Wrap all terms and conditions text with {{t 'terms.*'}} keys. Example: Replace 'Please read these terms...' with {{t 'terms.intro'}}. Create hierarchical keys like terms.acceptance, terms.use_license."

bd create --title="Translate lib/pages/dashboard/home.hbs stats and sections" --type=task --priority=2 --description="Translate 'Welcome back', 'Completion Rate', 'Credits', 'View All', etc. Example: {{t 'dashboard.welcome_back'}} for 'Welcome back'."

bd create --title="Translate lib/pages/dashboard/portfolios.hbs portfolio management" --type=task --priority=2 --description="Replace 'Total Portfolios', 'Active Ideas', buttons like 'View', 'Add Ideas'. Example: {{t 'portfolios.total_portfolios'}} for 'Total Portfolios'."

bd create --title="Translate lib/pages/dashboard/settings.hbs profile and package" --type=task --priority=2 --description="Translate 'Save Profile', 'Student - $9.99/month', 'Free Plan'. Example: {{t 'settings.save_profile'}} for 'Save Profile'."

bd create --title="Translate lib/pages/dashboard/user-activity.hbs activity feed" --type=task --priority=2 --description="Translate activity descriptions like 'Account created', 'Created new idea'. Example: {{t 'activity.account_created'}} for 'Account created'."

bd create --title="Translate lib/pages/models/financial.hbs questions" --type=task --priority=2 --description="Wrap questions like 'What are your revenue expectations?' with {{t 'models.financial.revenue_expectations'}}."

bd create --title="Translate lib/pages/models/funding.hbs sections" --type=task --priority=2 --description="Translate 'Funding Goal', 'Determine your funding requirements.' with {{t 'models.funding.goal'}}."

bd create --title="Translate lib/pages/models/idea.hbs model sections" --type=task --priority=2 --description="Replace 'Executive Summary', 'Overview of your startup idea' with {{t 'models.idea.executive_summary'}}."

bd create --title="Translate lib/pages/onboarding/package.hbs package selection" --type=task --priority=2 --description="Translate package options and descriptions. Example: {{t 'onboarding.package.free_description'}}."

bd create --title="Translate lib/pages/payments/add-payment-method.hbs form" --type=task --priority=2 --description="Replace form labels, placeholders, buttons with {{t 'payments.*'}} keys."

bd create --title="Translate lib/pages/payments/billing.hbs billing interface" --type=task --priority=2 --description="Translate 'Billing & Transactions', 'Export Transactions', 'Current Balance' with {{t 'billing.*'}}."

bd create --title="Translate lib/pages/payments/buy-credits.hbs purchase flow" --type=task --priority=2 --description="Replace purchase-related text like plan names, prices, buttons."

bd create --title="Translate lib/pages/payments/processing.hbs processing messages" --type=task --priority=2 --description="Translate 'Processing payment...', status messages."

bd create --title="Translate lib/pages/payments/upgrade-package.hbs upgrade options" --type=task --priority=2 --description="Replace 'View community content', 'Create and manage ideas' with {{t 'upgrade.*'}}."

bd create --title="Translate lib/pages/portfolios/add-ideas.hbs search and add" --type=task --priority=2 --description="Translate 'Back to Portfolio', 'Search ideas...', 'Cancel' with {{t 'portfolios.*'}}."

bd create --title="Translate lib/pages/portfolios/detail.hbs portfolio details" --type=task --priority=2 --description="Replace 'View Details', 'Viewer', 'Editor' with translations."

bd create --title="Translate lib/pages/portfolios/portfolios.hbs portfolio list" --type=task --priority=2 --description="Translate 'Create Portfolio', 'No portfolios yet' with {{t 'portfolios.*'}}."

bd create --title="Translate lib/pages/reports/business-plan.hbs report generation" --type=task --priority=2 --description="Replace 'Create your first idea to generate business plans' with {{t 'reports.business_plan.no_ideas'}}."

bd create --title="Translate lib/pages/reports/pitch-deck.hbs deck creation" --type=task --priority=2 --description="Translate 'Create compelling investor presentations' with {{t 'reports.pitch_deck.description'}}."

bd create --title="Translate lib/pages/reports/valuation.hbs valuation reports" --type=task --priority=2 --description="Replace 'Create your first idea to generate valuation reports'."

bd create --title="Translate lib/pages/reports/view.hbs report viewer" --type=task --priority=2 --description="Translate 'Download PDF' with {{t 'reports.download_pdf'}}."

bd create --title="Translate lib/prompts/models/idea/sections/*/ prompts" --type=task --priority=2 --description="Translate AI prompt templates in all section files. Example: Wrap user instructions with {{t 'prompts.*'}} keys if needed for UI display."

bd create --title="Add translation keys to locales/en.json and locales/ar.json" --type=task --priority=1 --description="After translating templates, add all new {{t 'key'}} entries to English and Arabic locale files. Example: Add 'buttons.improve_description_ai': 'Improve Description with AI' to en.json, and Arabic equivalent to ar.json."

bd create --title="Test translations across all pages" --type=task --priority=3 --description="Verify all {{t 'key'}} references resolve correctly. Switch language via nav.hbs switcher and check for missing keys or broken UI." --dependencies="translate_all_files,add_locale_keys"