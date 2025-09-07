# GitHub to Notion Sync - Complete Guide

A comprehensive guide to setting up and using the GitHub to Notion commit synchronization system.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Using the Application](#using-the-application)
- [Notion Database Guide](#notion-database-guide)
- [GitHub Actions Setup](#github-actions-setup)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Advanced Configuration](#advanced-configuration)

## 🎯 Overview

This system automatically syncs GitHub commits to a Notion database, providing a centralized view of your development activity. It features intelligent deduplication, automated GitHub Actions, and rich commit data with feature area detection.

### ✨ Key Features

- **🔄 Automated Syncing**: GitHub Actions workflow runs every 6 hours
- **🚫 Duplicate Prevention**: Notion-based deduplication prevents duplicate entries
- **🏠 Local Development**: Run locally for testing and development
- **📊 Rich Data**: Includes commit stats, file changes, and feature area detection
- **⚡ Performance**: Local caching for faster development runs
- **🔧 Configurable**: Customizable date ranges and repository settings

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create `.env.local` with your credentials:
```env
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_target_repository_name
```

### 3. Test Locally
```bash
npm run sync
```

### 4. Setup GitHub Actions
1. Push to GitHub
2. Add environment variables as repository secrets
3. Workflow runs automatically every 6 hours

## 🔧 Detailed Setup

### Step 1: GitHub Personal Access Token

1. **Go to GitHub Settings**:
   - Visit: [github.com/settings/tokens](https://github.com/settings/tokens)
   - Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Create New Token**:
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name (e.g., "Notion Sync")
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token" and copy it

3. **Required Permissions**:
   - `repo` - Access to private repositories
   - `public_repo` - Access to public repositories (if needed)

### Step 2: Notion Integration Setup

1. **Create Integration**:
   - Go to [notion.so/my-integrations](https://notion.so/my-integrations)
   - Click "New integration"
   - Give it a name (e.g., "GitHub Sync")
   - Select your workspace
   - Copy the "Internal Integration Token"

2. **Share Database with Integration**:
   - Open your Notion database
   - Click "Share" in the top right
   - Click "Add connections"
   - Search for your integration name
   - Click "Add"

### Step 3: Notion Database Setup

Create a database with these properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| **Commit Message** | Title | The commit message (main title) |
| **GitHub SHA** | Rich Text | Short commit hash (7 characters) |
| **GitHub URL** | URL | Link to commit on GitHub |
| **Author** | Rich Text | Commit author name |
| **Commit Date** | Date | When the commit was made |
| **Repository** | Select | Repository name (e.g., "CommunityGPT-MVP") |
| **Feature Area** | Select | Auto-detected area (e.g., "Chat Interface") |
| **Impact Level** | Select | Auto-detected impact (e.g., "Major Feature") |
| **Lines Added** | Number | Lines of code added |
| **Lines Deleted** | Number | Lines of code deleted |
| **Files Changed** | Number | Number of files modified |
| **Status** | Select | Commit status (e.g., "Committed") |
| **Branch** | Rich Text | Branch name (default: "main") |

### Step 4: Get Database ID

1. **Open your Notion database**
2. **Copy the URL** - it looks like:
   ```
   https://notion.so/your-workspace/DATABASE_ID?v=...
   ```
3. **Extract the Database ID** - the 32-character string between the last `/` and the `?`

## 💻 Using the Application

### Basic Commands

```bash
# Sync last 7 days (default)
npm run sync

# Sync last 30 days
npm run sync 30

# Clear cache and sync
npm run sync:clear
```

### Understanding the Output

When you run the sync, you'll see output like this:

```bash
🚀 Starting GitHub to Notion sync for last 7 days...
🔍 Using Notion-based deduplication (no local cache dependency)
📊 Local cache: 11 commits previously processed locally
📅 Last local sync: 2025-09-06T16:35:48.831Z
📅 Fetching commits since: 2025-08-30T19:10:57.603Z
🔍 Querying: devbizops/chat-demo
📦 Found 11 commits in the last 7 days
🔍 Checking if commit d447d59 exists in Notion...
✅ Commit d447d59 already exists in Notion
⏭️  Skipping existing commit: d447d59
✨ Sync complete! Processed: 0, Skipped: 11
```

### What Each Line Means

- **🚀 Starting sync**: Beginning the synchronization process
- **🔍 Using Notion-based deduplication**: Using Notion as the source of truth
- **📊 Local cache**: Shows your local performance cache
- **📅 Fetching commits**: Getting commits from GitHub
- **📦 Found X commits**: Number of commits found in the date range
- **🔍 Checking if commit exists**: Verifying against Notion database
- **✅ Already exists**: Commit is already in Notion (skipped)
- **➕ Not found**: Commit is new (will be created)
- **✨ Sync complete**: Final summary

## 📊 Notion Database Guide

### Understanding Your Data

Once commits are synced, your Notion database will contain rich information about each commit:

#### **Commit Message** (Title)
The main commit message from GitHub, used as the page title.

#### **GitHub SHA**
Short commit hash (7 characters) for easy identification.

#### **GitHub URL**
Direct link to view the commit on GitHub.

#### **Author**
The person who made the commit.

#### **Commit Date**
When the commit was made.

#### **Repository**
Which repository the commit belongs to.

#### **Feature Area** (Auto-detected)
The system automatically categorizes commits based on:
- **Chat Interface**: Files with "chat" or "interface" in the name
- **BigQuery Integration**: Files related to analytics or BigQuery
- **AI/Claude API**: Files related to AI or Anthropic services
- **Database/Supabase**: Database or authentication related files
- **UI/UX**: CSS, styling, or UI related changes
- **Testing**: Test files or testing related commits
- **Deployment**: Build, deploy, or infrastructure changes
- **Bug Fix**: Commits with "fix" or "bug" in the message

#### **Impact Level** (Auto-detected)
Based on commit patterns and changes:
- **Major Feature**: Large changes (>200 lines) or "feat:" commits
- **Bug Fix**: Commits with "fix:" or "bug" in the message
- **Refactor**: Commits with "refactor:" or "cleanup"
- **Documentation**: Commits with "docs:" or "readme"
- **Minor Feature**: Smaller changes (50-200 lines)

#### **Lines Added/Deleted**
Statistics about code changes.

#### **Files Changed**
Number of files modified in the commit.

### Using Your Database

#### **Filtering and Sorting**
- **Filter by Feature Area**: See all commits related to a specific feature
- **Filter by Impact Level**: Focus on major features or bug fixes
- **Sort by Date**: See recent activity
- **Filter by Author**: Track individual contributor activity

#### **Creating Views**
Create different views for different purposes:
- **Recent Activity**: Last 30 days, sorted by date
- **Major Features**: Filter by "Major Feature" impact level
- **Bug Fixes**: Filter by "Bug Fix" impact level
- **By Feature Area**: Group by feature area

#### **Creating Reports**
Use Notion's reporting features to:
- Track development velocity
- Identify active contributors
- Monitor feature development
- Analyze code quality trends

## ⚙️ GitHub Actions Setup

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add GitHub to Notion sync with Actions"
git push origin main
```

### Step 2: Add Repository Secrets

Go to your repository on GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. **Click "New repository secret"** and add each:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `NOTION_TOKEN` | Your Notion integration token | `secret_abc123...` |
| `GH_TOKEN` | Your GitHub personal access token | `ghp_xyz789...` |
| `NOTION_DATABASE_ID` | Your Notion database ID | `a1b2c3d4e5f6...` |
| `GH_OWNER` | Owner of the repository you want to track | `yourusername` |
| `GH_REPO` | Name of the repository you want to track | `my-awesome-app` |

### Step 3: Test the Workflow

1. **Go to Actions tab** in your repository
2. **Click on "Sync Commits to Notion"** workflow
3. **Click "Run workflow"** button
4. **Choose "Run workflow"** to test manually

### Step 4: Monitor the Workflow

The workflow will:
- Run every 6 hours automatically
- Run on every push to main (optional)
- Allow manual triggering with custom parameters
- Show detailed logs of what it's doing


## 🔧 Troubleshooting & FAQ

### Common Issues

#### **"Missing required environment variables" Error**

**Problem**: Script can't find your credentials.

**Solution**:
1. Check that `.env.local` file exists in project root
2. Verify all required variables are set:
   ```env
   NOTION_TOKEN=your_token_here
   NOTION_DATABASE_ID=your_database_id_here
   GITHUB_TOKEN=your_github_token_here
   GITHUB_OWNER=your_username
   GITHUB_REPO=your_repo_name
   ```
3. Make sure there are no extra spaces or quotes

#### **"Could not find database" Error**

**Problem**: Notion can't access your database.

**Solutions**:
1. **Check Database ID**: Make sure it's the correct 32-character string
2. **Share with Integration**: 
   - Open your Notion database
   - Click "Share" → "Add connections"
   - Add your integration
3. **Check Integration Token**: Verify it's correct and not expired

#### **"Invalid token" Error**

**Problem**: GitHub or Notion token is invalid.

**Solutions**:
1. **GitHub Token**: 
   - Check it has `repo` scope
   - Verify it's not expired
   - Make sure it has access to the target repository
2. **Notion Token**: 
   - Verify it's the correct integration token
   - Check the integration is active

#### **"No commits found" Error**

**Problem**: No commits in the specified date range.

**Solutions**:
1. **Check Date Range**: Try a longer period (e.g., 30 days)
2. **Verify Repository**: Make sure `GH_OWNER` and `GH_REPO` are correct
3. **Check Repository Access**: Ensure your GitHub token can access the repository

#### **"Repository not found" Error**

**Problem**: GitHub can't find the repository.

**Solutions**:
1. **Check Repository Name**: Verify `GH_REPO` is exactly right
2. **Check Owner**: Verify `GH_OWNER` is correct (username or organization)
3. **Check Access**: Make sure your token has access to the repository

### Performance Issues

#### **Slow Sync Performance**

**Problem**: Sync takes a long time.

**Solutions**:
1. **Reduce Date Range**: Sync fewer days at a time
2. **Check API Limits**: GitHub has rate limits (5000 requests/hour)
3. **Use Local Cache**: The system caches results for faster subsequent runs

#### **Rate Limiting**

**Problem**: GitHub API rate limit exceeded.

**Solutions**:
1. **Wait**: Rate limits reset every hour
2. **Reduce Batch Size**: The script includes delays between API calls
3. **Use Authenticated Requests**: Your token increases rate limits

### GitHub Actions Issues

#### **Workflow Fails to Start**

**Problem**: GitHub Action doesn't run.

**Solutions**:
1. **Check Secrets**: All required secrets must be set
2. **Check Workflow File**: Make sure `.github/workflows/sync-commits.yml` exists
3. **Check Permissions**: Repository must allow GitHub Actions

#### **Workflow Runs But Fails**

**Problem**: Action runs but encounters errors.

**Solutions**:
1. **Check Logs**: View the workflow logs in the Actions tab
2. **Verify Secrets**: Make sure all secrets are correctly set
3. **Test Locally**: Run the script locally to identify issues

### Notion Issues

#### **Database Properties Missing**

**Problem**: Script can't create entries because properties don't exist.

**Solutions**:
1. **Check Property Names**: Make sure they match exactly (case-sensitive)
2. **Check Property Types**: Verify each property has the correct type
3. **Recreate Database**: If needed, create a new database with the correct schema

#### **Integration Permissions**

**Problem**: Integration can't access the database.

**Solutions**:
1. **Re-share Database**: Remove and re-add the integration
2. **Check Integration Status**: Make sure it's active in Notion
3. **Verify Workspace**: Ensure the integration is in the correct workspace

## 🔧 Advanced Configuration

### Custom Feature Area Detection

You can modify the feature area detection logic in `sync-github-commits.ts`:

```typescript
function detectFeatureArea(message: string, files: string[] = []): string {
  const lowerMessage = message.toLowerCase();
  const fileStr = files.join(' ').toLowerCase();
  
  // Add your custom detection logic here
  if (lowerMessage.includes('your-keyword') || fileStr.includes('your-file-pattern')) {
    return 'Your Custom Area';
  }
  
  // ... existing logic
}
```

### Custom Impact Level Detection

Modify the impact level detection:

```typescript
function detectImpactLevel(message: string, additions: number = 0, deletions: number = 0): string {
  const lowerMessage = message.toLowerCase();
  const totalChanges = additions + deletions;
  
  // Add your custom logic here
  if (lowerMessage.includes('your-pattern')) {
    return 'Your Custom Level';
  }
  
  // ... existing logic
}
```

### Environment Variables

You can use different environment files:

```bash
# Use .env.local (default)
npm run sync

# Use .env.production
NODE_ENV=production npm run sync

# Use custom file
DOTENV_CONFIG_PATH=.env.custom npm run sync
```

### Cache Management

The system automatically manages cache, but you can:

```bash
# Clear cache manually
npm run sync:clear

# Or delete the cache file directly
rm .github-sync-cache.json
```

### GitHub Actions Customization

Modify the workflow schedule in `.github/workflows/sync-commits.yml`:

```yaml
on:
  schedule:
    # Run every 2 hours instead of 6
    - cron: '0 */2 * * *'
    
    # Run every weekday at 9 AM
    - cron: '0 9 * * 1-5'
```

## 📚 Additional Resources

- [Notion API Documentation](https://developers.notion.com/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Last Updated**: September 6, 2025  
**Version**: 2.0.0  
**Status**: ✅ **Production Ready** - Full Notion-based deduplication implemented
