# GitHub to Notion Commit Sync Script

## Overview

This script automatically synchronizes GitHub commits to a Notion database, providing a centralized view of your development activity. It fetches recent commits from a specified GitHub repository and creates structured entries in your Notion database.

## Features

- ✅ **Automatic Commit Fetching**: Retrieves commits from the last N days (default: 7)
- ✅ **Rich Commit Data**: Includes commit message, author, date, SHA, and file changes
- ✅ **Notion Integration**: Creates structured database entries with all commit details
- ✅ **Environment Configuration**: Secure token management via environment variables
- ✅ **Error Handling**: Graceful error handling with detailed logging
- ✅ **Flexible Date Range**: Configurable number of days to sync

## Prerequisites

### 1. GitHub Personal Access Token
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create a new token with `repo` scope
- Copy the token for use in environment variables

### 2. Notion Integration
- Go to [Notion Integrations](https://www.notion.so/my-integrations)
- Create a new integration (e.g., "GitHub Sync")
- Copy the integration token
- Share your database with the integration:
  - Open your Notion database
  - Click "Share" → "Add connections"
  - Search for your integration and add it

### 3. Notion Database Setup
Create a database with the following properties:
- **Title** (Title) - Commit message
- **GitHub SHA** (Rich text) - Short commit hash
- **Author** (Rich text) - Commit author
- **Commit Date** (Date) - Commit date
- **Repository** (Rich text) - Repository name
- **Files Changed** (Number) - Number of files modified
- **Additions** (Number) - Lines added
- **Deletions** (Number) - Lines deleted
- **Commit URL** (URL) - Link to commit on GitHub

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in your project root:
   ```env
   NOTION_TOKEN=your_notion_integration_token
   GITHUB_TOKEN=your_github_personal_access_token
   ```

3. **Script Configuration**:
   Update the configuration in `sync-github-commits.ts`:
   ```typescript
   const NOTION_DATABASE_ID = 'your_database_id_here';
   const GITHUB_OWNER = 'your_github_username';
   const GITHUB_REPO = 'your_repository_name';
   ```

## Usage

### Basic Usage
```bash
npm run sync
```

### Custom Date Range
```bash
npx tsx sync-github-commits.ts 14  # Sync last 14 days
```

### Cache Management
```bash
# Clear the cache (forces re-processing of all commits)
npm run sync:clear
```

### Example Output
```bash
🚀 Starting GitHub to Notion sync for last 7 days...
📊 Cache: 15 commits previously processed
📅 Last sync: 2025-09-05T18:20:43.275Z
📦 Found 9 commits in the last 7 days
⏭️  Skipping cached commit: b55417d
⏭️  Skipping cached commit: 47281dc
✅ Created Notion entry for commit: a1b2c3d  # New commit
✨ Sync complete! Processed: 1, Skipped: 8
📊 Total commits in cache: 16
```

## Script Structure

```
sync-github-commits.ts
├── Environment Setup
├── Client Initialization
├── Cache Management Functions
│   ├── loadCache()                # Load cache from file
│   ├── saveCache()                # Save cache to file
│   ├── cleanupCache()             # Prevent unlimited growth
│   └── commitExistsInCache()      # Fast duplicate checking
├── Helper Functions
│   ├── getCommitDetails()         # Fetch detailed commit info
│   ├── createNotionCommit()       # Create Notion database entry
│   └── syncRecentCommits()        # Main sync logic with caching
└── Main Execution (with --clear-cache support)
```

## Current Implementation

### Working Features
- ✅ Environment variable loading with dotenv
- ✅ GitHub API integration with Octokit
- ✅ Notion API integration with @notionhq/client
- ✅ Commit data fetching and processing
- ✅ Notion database entry creation
- ✅ Error handling and logging
- ✅ Configurable date ranges
- ✅ **Client-side caching for duplicate checking**
- ✅ **Cache management with automatic cleanup**
- ✅ **Clear cache command (`--clear-cache`)**

### Known Issues
- ✅ **All major issues resolved** - The script is now fully functional

## Future Enhancements

### 1. Duplicate Entry Checking ✅ **IMPLEMENTED**
**Priority: High** - **COMPLETED**

**Solution Implemented**: Client-Side Caching

**Status**: ✅ **FULLY FUNCTIONAL** - The duplicate checking feature has been successfully implemented using client-side caching.

**Current Implementation Details**:
- **Cache File**: `.github-sync-cache.json` (stored in project root)
- **Cache Structure**: Stores processed commit SHAs, last sync timestamp, and total processed count
- **Cache Management**: Automatic cleanup (max 1000 SHAs), cross-session persistence
- **Performance**: Zero API calls for duplicate checking, instant lookups
- **CLI Support**: `--clear-cache` command to reset cache
- **Statistics**: Shows cache size and last sync time in output

**Why This is the Best Approach**:
- ✅ **Zero API calls** for duplicate checking during same run
- ✅ **Fastest execution** - simple in-memory lookups
- ✅ **No rate limiting** concerns from repeated Notion API calls
- ✅ **Cross-session persistence** - prevents re-processing between runs
- ✅ **Fault tolerant** - handles partial syncs gracefully
- ✅ **Version independent** - works with any Notion client version

**Implementation**:
```typescript
// Cache management
const CACHE_FILE = '.github-sync-cache.json';

interface SyncCache {
  processedSHAs: Set<string>;
  lastSync: string;
  totalProcessed: number;
}

async function loadCache(): Promise<SyncCache> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return {
        processedSHAs: new Set(data.processedSHAs || []),
        lastSync: data.lastSync || new Date().toISOString(),
        totalProcessed: data.totalProcessed || 0
      };
    }
  } catch (error) {
    console.log('Cache file corrupted, starting fresh');
  }
  
  return {
    processedSHAs: new Set(),
    lastSync: new Date().toISOString(),
    totalProcessed: 0
  };
}

async function saveCache(cache: SyncCache): Promise<void> {
  try {
    const data = {
      processedSHAs: Array.from(cache.processedSHAs),
      lastSync: cache.lastSync,
      totalProcessed: cache.totalProcessed
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

async function commitExistsInNotion(sha: string, cache: SyncCache): Promise<boolean> {
  return cache.processedSHAs.has(sha);
}

// Usage in main sync function
async function syncRecentCommits(days: number = 7) {
  const cache = await loadCache();
  console.log(`📊 Cache: ${cache.processedSHAs.size} commits previously processed`);
  
  const commits = await getRecentCommits(days);
  
  for (const commit of commits) {
    if (await commitExistsInNotion(commit.sha, cache)) {
      console.log(`⏭️  Skipping cached commit: ${commit.sha.substring(0, 7)}`);
      continue;
    }
    
    // Process commit...
    await createNotionCommit(commitData);
    
    // Update cache
    cache.processedSHAs.add(commit.sha);
    cache.totalProcessed++;
  }
  
  cache.lastSync = new Date().toISOString();
  await saveCache(cache);
  
  console.log(`✨ Sync complete! Processed: ${processedCount}, Cached: ${cache.processedSHAs.size}`);
}
```

**Cache Management Features**:
```typescript
// Optional: Cache cleanup to prevent unlimited growth
function cleanupCache(cache: SyncCache, maxSize: number = 1000): SyncCache {
  if (cache.processedSHAs.size > maxSize) {
    const shas = Array.from(cache.processedSHAs);
    const recentSHAs = shas.slice(-maxSize);
    cache.processedSHAs = new Set(recentSHAs);
    console.log(`🧹 Cache cleaned: kept ${maxSize} most recent SHAs`);
  }
  return cache;
}

// Optional: Clear cache command
if (process.argv.includes('--clear-cache')) {
  fs.unlinkSync(CACHE_FILE);
  console.log('🗑️  Cache cleared');
  process.exit(0);
}
```

### 2. Batch Processing
**Priority: Medium**

**Enhancement**: Process multiple commits in parallel to improve performance.

**Implementation**:
```typescript
async function syncRecentCommits(days: number = 7) {
  const commits = await getRecentCommits(days);
  
  // Process commits in batches of 5
  const batchSize = 5;
  for (let i = 0; i < commits.length; i += batchSize) {
    const batch = commits.slice(i, i + batchSize);
    await Promise.all(batch.map(commit => processCommit(commit)));
  }
}
```

### 3. Incremental Sync
**Priority: Medium**

**Enhancement**: Track the last sync timestamp to only fetch new commits.

**Implementation**:
```typescript
// Store last sync timestamp in a file or database
const LAST_SYNC_FILE = '.last-sync';
const lastSync = await getLastSyncTimestamp();
const commits = await getCommitsSince(lastSync);
await updateLastSyncTimestamp(new Date());
```

### 4. Commit Filtering
**Priority: Low**

**Enhancement**: Filter commits by author, message patterns, or file types.

**Implementation**:
```typescript
interface CommitFilter {
  authors?: string[];
  excludePatterns?: string[];
  fileTypes?: string[];
}

function shouldIncludeCommit(commit: Commit, filter: CommitFilter): boolean {
  // Implementation for filtering logic
}
```

### 5. Rich Commit Details
**Priority: Low**

**Enhancement**: Include more detailed commit information.

**Additional Data**:
- Commit diff statistics
- Changed file names
- Commit tags/branches
- Pull request references
- Code review status

### 6. Notion Database Schema Validation
**Priority: Medium**

**Enhancement**: Validate that the Notion database has the required properties.

**Implementation**:
```typescript
async function validateNotionDatabase(): Promise<boolean> {
  try {
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID
    });
    
    const requiredProperties = [
      'Title', 'GitHub SHA', 'Author', 'Commit Date',
      'Repository', 'Files Changed', 'Additions', 'Deletions', 'Commit URL'
    ];
    
    return requiredProperties.every(prop => 
      database.properties[prop] !== undefined
    );
  } catch (error) {
    console.error('Database validation failed:', error);
    return false;
  }
}
```

### 7. Configuration File
**Priority: Low**

**Enhancement**: Move configuration to a separate JSON file.

**Implementation**:
```json
{
  "notion": {
    "databaseId": "your_database_id",
    "properties": {
      "title": "Title",
      "sha": "GitHub SHA",
      "author": "Author"
    }
  },
  "github": {
    "owner": "your_username",
    "repo": "your_repo"
  },
  "sync": {
    "defaultDays": 7,
    "batchSize": 5,
    "enableDuplicateCheck": true
  }
}
```

### 8. CLI Interface
**Priority: Low**

**Enhancement**: Add command-line interface with options.

**Implementation**:
```bash
npm run sync-commits -- --days 14 --repo my-repo --owner my-username --dry-run
```

### 9. Webhook Integration
**Priority: Low**

**Enhancement**: Set up GitHub webhooks for real-time sync.

**Implementation**:
- Create webhook endpoint
- Process push events
- Update Notion in real-time

### 10. Analytics Dashboard
**Priority: Low**

**Enhancement**: Create Notion dashboard with commit analytics.

**Features**:
- Commit frequency charts
- Author activity metrics
- File change statistics
- Repository health indicators

## Troubleshooting

### Common Issues

1. **"Could not find database" Error**:
   - Verify the database ID is correct
   - Ensure the integration has access to the database
   - Check that the database is shared with your integration

2. **"Invalid token" Error**:
   - Verify environment variables are set correctly
   - Check token permissions and expiration
   - Ensure tokens are in `.env.local` file

3. **"No commits found" Error**:
   - Verify repository name and owner
   - Check if there are commits in the specified date range
   - Ensure GitHub token has repository access

### Debug Mode

Enable debug logging by setting:
```typescript
const DEBUG = true;
```

## Performance Considerations

- **Rate Limiting**: GitHub API has rate limits (5000 requests/hour for authenticated users)
- **Batch Processing**: Process commits in batches to avoid overwhelming the APIs
- **Caching**: Implement caching for duplicate checks and database queries
- **Error Recovery**: Implement retry logic for failed API calls

## Security Best Practices

- Store tokens in environment variables, never in code
- Use `.env.local` for local development
- Regularly rotate API tokens
- Limit token permissions to minimum required scopes
- Use HTTPS for all API communications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## License

This script is part of the chat-demo project and follows the same license terms.

---

**Last Updated**: September 5, 2025  
**Version**: 1.1.0  
**Status**: ✅ **FULLY FUNCTIONAL** - All core features implemented including duplicate checking
