# Translations System

This directory contains the modular translation system for the Accelerator application, supporting English (`en`) and Arabic (`ar`) languages.

## Structure

- `translations-index.js`: Main entry point that combines all translations
- `translations-common.js`: Shared UI elements and navigation
- `translations-{page}.js`: Page-specific translations
- `validate-translations.js`: Script to check key parity between languages

## Usage

Import the combined translations object:

```javascript
import { translations } from "../assets/translations/translations-index.js";

const t = () => translations[lang()];
```

Then use in components: `{t().key}`

## Adding Translations

1. Add keys to both `en` and `ar` objects in the appropriate file
2. Run `npm run validate-translations` to check for missing keys
3. Test in both languages

## Guidelines

- Use camelCase for key names
- Group related keys with comments
- Keep translations consistent in tone and terminology
- For common UI elements, prefer `commonTranslations`
- Run validation before commits

## File Organization

- **common.js**: Navigation, actions, states
- **sidebar.js**: Project management, models, reports
- **dashboard.js**: Stats, progress, notifications
- **settings.js**: User preferences
- **help.js**: Documentation and support
- Other files follow page-specific naming

## Validation

Use `npm run validate-translations` to ensure:
- All keys have both English and Arabic versions
- No orphaned keys
- Consistent structure across files