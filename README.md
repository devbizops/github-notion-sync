# GitHub-Notion Sync

Simple script to sync GitHub commits to a Notion database.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.local` and add your tokens:
   - `NOTION_TOKEN` - Your Notion integration token
   - `GITHUB_TOKEN` - Your GitHub personal access token
3. Edit the script to set your database ID and repo details
4. Run: `npm run sync`

## Usage

- `npm run sync` - Sync recent commits
- `npm run sync:clear` - Clear cache and sync

## Features

- Client-side caching for duplicate prevention
- Configurable date ranges
- Rich commit data with file changes
- Error handling and graceful fallbacks

See [docs/github-notion-sync.md](docs/github-notion-sync.md) for complete documentation.