# GitHub-Notion Sync

Automatically sync GitHub commits to a Notion database with intelligent deduplication and GitHub Actions support.

## ✨ Features

- **🔄 Automated Syncing**: GitHub Actions workflow runs every 6 hours
- **🚫 Duplicate Prevention**: Notion-based deduplication prevents duplicate entries
- **🏠 Local Development**: Run locally for testing and development
- **📊 Rich Data**: Includes commit stats, file changes, and feature area detection
- **⚡ Performance**: Local caching for faster development runs
- **🔧 Configurable**: Customizable date ranges and repository settings

## 🚀 Quick Start

### 1. Setup Environment

Create a `.env.local` file with your credentials:

```env
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_target_repository_name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Locally

```bash
npm run sync
```

### 4. Setup GitHub Actions

1. Push this repository to GitHub
2. Add the same environment variables as GitHub repository secrets
3. The workflow will automatically run every 6 hours

## 📋 Usage

- `npm run sync` - Sync recent commits (default: 7 days)
- `npm run sync:clear` - Clear local cache and sync
- `npm run sync 30` - Sync commits from last 30 days

## 🔧 Configuration

The script automatically detects:
- **Feature Areas**: Based on file paths and commit messages
- **Impact Levels**: Based on commit patterns and line changes
- **Repository Info**: From environment variables

## 🏗️ Architecture

- **Notion as Source of Truth**: Prevents duplicates across local and GitHub Action runs
- **Local Cache**: Improves performance for development
- **GitHub Actions**: Automated syncing without manual intervention
- **Error Handling**: Graceful fallbacks and comprehensive logging

## 📚 Documentation

See [docs/github-notion-sync.md](docs/github-notion-sync.md) for complete setup and configuration details.