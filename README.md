# Accelerator - Business Idea Development Platform

A comprehensive Node.js web application for entrepreneurs to generate, develop, and validate business ideas using AI-powered tools and community feedback.

## 🚀 Features

### Core Functionality

- **AI-Powered Idea Generation**: Generate business ideas using OpenRouter AI models
- **Structured Development**: Follow proven business development frameworks (Business Model Canvas, Financial Projections, etc.)
- **Community Voting**: Rate and get feedback on ideas from the community
- **Credit System**: Earn and spend credits for AI services and premium features
- **Multi-language Support**: English and Arabic localization

### User Management

- User registration with package-based credit allocation
- Profile management and preferences
- Package upgrades (Free, Student, Enterprise)
- Achievement system with milestones

### Advanced Features

- **Portfolios**: Organize ideas into portfolios (Enterprise)
- **Leaderboards**: Public rankings based on various metrics
- **Recommendations**: Personalized idea suggestions
- **Real-time Notifications**: Activity feeds and alerts
- **Analytics Dashboard**: User progress and system health monitoring

## 🏗️ Architecture

### Database-First Design

This application follows a unique **database-first architecture** where 95% of the business logic resides in PostgreSQL:

- **63 PostgreSQL Functions**: Handle all core operations
- **8 Aggregation Views**: Pre-computed data for performance
- **Row Level Security (RLS)**: Comprehensive access control
- **Automated Triggers**: Real-time updates and notifications

### Technology Stack

- **Backend**: Node.js 22+, Express.js, Handlebars templating
- **Database**: PostgreSQL via Supabase (database, auth, storage)
- **AI Integration**: OpenRouter API for content generation
- **Frontend**: Server-side rendered Handlebars templates, Tailwind CSS
- **Authentication**: Supabase Auth with session management
- **Internationalization**: i18next for multi-language support

## 📋 Prerequisites

- Node.js 22.12.0 or higher
- Supabase account and project
- OpenRouter API key (for AI features)
- Docker (optional, for containerized deployment)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AR-92/accelerator.git
cd accelerator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLIC_KEY=your_supabase_anon_key
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# Required: AI Provider
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_api_key

# Required: Session Security
SESSION_SECRET=your_random_session_secret_here
```

### 4. Database Setup

The database schema and functions are included in the `db/` directory. Run the setup scripts:

```bash
# Install all database components (reset, setup, seed)
npm run db:dev:setup

# Or run individually:
npm run db:reset    # Reset database
npm run db:setup    # Apply schema and functions
npm run db:seed     # Seed initial data
```

### 5. Build Assets

```bash
npm run build
```

### 6. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:4000`.

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Environment Variables for Docker

Ensure your `.env` file is properly configured before running Docker Compose.

## 📁 Project Structure

```
accelerator/
├── db/                          # Database schema and functions
│   ├── schema/                  # SQL schema files
│   ├── functions/               # PostgreSQL functions
│   ├── views/                   # Database views
│   ├── security/                # RLS policies
│   └── maintenance/             # Database maintenance scripts
├── lib/                         # Application core
│   ├── components/              # Handlebars components
│   ├── layouts/                 # Page layouts
│   ├── pages/                   # Route templates
│   ├── prompts/                 # AI prompt templates
│   ├── app.js                   # Express application setup
│   ├── config.js                # Configuration management
│   ├── routes.js                # Route definitions
│   ├── session.js               # Session management
│   └── utils.js                 # Utility functions
├── locales/                     # Internationalization files
├── public/                      # Static assets
│   ├── css/                     # Stylesheets
│   ├── images/                  # Images
│   └── js/                      # Client-side JavaScript
├── scripts/                     # Database and utility scripts
└── docker-compose.yml           # Docker configuration
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

## 🚀 Deployment

### Staging Deployment

```bash
npm run deploy:staging
```

### Production Deployment

```bash
npm run deploy:production
```

## 📊 Database Management

### Backup Database

```bash
npm run db:prod:backup
```

### Migrate Database

```bash
npm run db:migrate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/AR-92/accelerator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AR-92/accelerator/discussions)

## 🔒 Security

This application implements several security measures:

- Row Level Security (RLS) on all database tables
- Input validation and sanitization
- Secure session management
- HTTPS enforcement in production
- API key protection

Never commit sensitive information like API keys or database credentials to version control.
