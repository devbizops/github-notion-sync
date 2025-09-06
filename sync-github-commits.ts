// scripts/sync-github-commits.ts
console.log('🚀 Script starting...');

// Load environment variables from .env files
import { config } from 'dotenv';
config({ path: '.env.local' }); // Load from .env.local first
config(); // Then load from .env if it exists

import { Client } from '@notionhq/client';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';

console.log('📦 Imports loaded successfully');

// Configuration
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Cache configuration
const CACHE_FILE = '.github-sync-cache.json';
const MAX_CACHE_SIZE = 1000; // Maximum number of SHAs to keep in cache

// Cache interface
interface SyncCache {
  processedSHAs: string[];
  lastSync: string;
  totalProcessed: number;
}

// Initialize clients
console.log('🔧 Initializing clients...');
const notion = new Client({ auth: NOTION_TOKEN });
const octokit = new Octokit({ auth: GITHUB_TOKEN });
console.log('✅ Clients initialized');

// Cache management functions
async function loadCache(): Promise<SyncCache> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return {
        processedSHAs: data.processedSHAs || [],
        lastSync: data.lastSync || new Date().toISOString(),
        totalProcessed: data.totalProcessed || 0
      };
    }
  } catch (error) {
    console.log('⚠️  Cache file corrupted, starting fresh');
  }
  
  return {
    processedSHAs: [],
    lastSync: new Date().toISOString(),
    totalProcessed: 0
  };
}

async function saveCache(cache: SyncCache): Promise<void> {
  try {
    const data = {
      processedSHAs: cache.processedSHAs,
      lastSync: cache.lastSync,
      totalProcessed: cache.totalProcessed
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed to save cache:', error);
  }
}

function cleanupCache(cache: SyncCache): SyncCache {
  if (cache.processedSHAs.length > MAX_CACHE_SIZE) {
    const recentSHAs = cache.processedSHAs.slice(-MAX_CACHE_SIZE);
    cache.processedSHAs = recentSHAs;
    console.log(`🧹 Cache cleaned: kept ${MAX_CACHE_SIZE} most recent SHAs`);
  }
  return cache;
}

function commitExistsInCache(sha: string, cache: SyncCache): boolean {
  return cache.processedSHAs.includes(sha);
}

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: number;
}

// Feature area detection based on file paths and commit messages
function detectFeatureArea(message: string, files: string[] = []): string {
  const lowerMessage = message.toLowerCase();
  const fileStr = files.join(' ').toLowerCase();
  
  if (lowerMessage.includes('chat') || fileStr.includes('chat-interface') || fileStr.includes('chat.tsx')) {
    return 'Chat Interface';
  }
  if (lowerMessage.includes('bigquery') || lowerMessage.includes('analytics') || fileStr.includes('bigquery')) {
    return 'BigQuery Integration';
  }
  if (lowerMessage.includes('claude') || lowerMessage.includes('ai') || lowerMessage.includes('anthropic')) {
    return 'AI/Claude API';
  }
  if (lowerMessage.includes('supabase') || lowerMessage.includes('database') || lowerMessage.includes('auth')) {
    return 'Database/Supabase';
  }
  if (lowerMessage.includes('ui') || lowerMessage.includes('style') || lowerMessage.includes('css') || fileStr.includes('.css')) {
    return 'UI/UX';
  }
  if (lowerMessage.includes('test') || fileStr.includes('test') || fileStr.includes('.spec.')) {
    return 'Testing';
  }
  if (lowerMessage.includes('deploy') || lowerMessage.includes('build') || fileStr.includes('vercel') || fileStr.includes('dockerfile')) {
    return 'Deployment';
  }
  if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
    return 'Bug Fix';
  }
  
  return 'Chat Interface'; // Default
}

// Impact level detection based on lines changed and commit patterns
function detectImpactLevel(message: string, additions: number = 0, deletions: number = 0): string {
  const lowerMessage = message.toLowerCase();
  const totalChanges = additions + deletions;
  
  if (lowerMessage.includes('feat:') || lowerMessage.includes('feature:') || totalChanges > 200) {
    return 'Major Feature';
  }
  if (lowerMessage.includes('fix:') || lowerMessage.includes('bug')) {
    return 'Bug Fix';
  }
  if (lowerMessage.includes('refactor:') || lowerMessage.includes('cleanup')) {
    return 'Refactor';
  }
  if (lowerMessage.includes('docs:') || lowerMessage.includes('readme')) {
    return 'Documentation';
  }
  if (totalChanges > 50) {
    return 'Minor Feature';
  }
  
  return 'Minor Feature'; // Default
}


// Note: commitExistsInNotion function removed - now using client-side caching

// Get detailed commit information including file changes
async function getCommitDetails(sha: string): Promise<CommitData | null> {
  try {
    const { data: commit } = await octokit.rest.repos.getCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: sha
    });

    return {
      sha: sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url,
      stats: {
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        total: commit.stats?.total || 0
      },
      files: commit.files?.length || 0
    };
  } catch (error) {
    console.error(`Error getting commit details for ${sha}:`, error);
    return null;
  }
}

// Create Notion page for commit
async function createNotionCommit(commitData: CommitData): Promise<boolean> {
  try {
    const files = await getCommitFiles(commitData.sha);
    const featureArea = detectFeatureArea(commitData.message, files);
    const impactLevel = detectImpactLevel(
      commitData.message, 
      commitData.stats?.additions, 
      commitData.stats?.deletions
    );

    await notion.pages.create({
      parent: {
        database_id: NOTION_DATABASE_ID
      },
      properties: {
        'Commit Message': {
          title: [{ text: { content: commitData.message } }]
        },
        'GitHub SHA': {
          rich_text: [{ text: { content: commitData.sha } }]
        },
        'GitHub URL': {
          url: commitData.url
        },
        'Author': {
          rich_text: [{ text: { content: commitData.author } }]
        },
        'Commit Date': {
          date: {
            start: new Date(commitData.date).toISOString().split('T')[0]
          }
        },
        'Repository': {
          select: { name: 'CommunityGPT-MVP' }
        },
        'Feature Area': {
          select: { name: featureArea }
        },
        'Impact Level': {
          select: { name: impactLevel }
        },
        'Lines Added': {
          number: commitData.stats?.additions || 0
        },
        'Lines Deleted': {
          number: commitData.stats?.deletions || 0
        },
        'Files Changed': {
          number: commitData.files || 0
        },
        'Status': {
          select: { name: 'Committed' }
        },
        'Branch': {
          rich_text: [{ text: { content: 'main' } }] // Default, could be enhanced
        }
      }
    });

    console.log(`✅ Created Notion entry for commit: ${commitData.sha}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating Notion entry for commit ${commitData.sha}:`, error);
    return false;
  }
}

// Get file names from commit
async function getCommitFiles(sha: string): Promise<string[]> {
  try {
    const { data: commit } = await octokit.rest.repos.getCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: sha
    });
    return commit.files?.map(file => file.filename) || [];
  } catch (error) {
    console.error(`Error getting files for commit ${sha}:`, error);
    return [];
  }
}

// Main sync function
async function syncRecentCommits(days: number = 7): Promise<void> {
  console.log(`🚀 Starting GitHub to Notion sync for last ${days} days...`);
  
  // Load cache
  const cache = await loadCache();
  console.log(`📊 Cache: ${cache.processedSHAs.length} commits previously processed`);
  console.log(`📅 Last sync: ${cache.lastSync}`);
  
  try {
    // Get recent commits
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    console.log(`📅 Fetching commits since: ${since.toISOString()}`);
    console.log(`🔍 Querying: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    
    // First, let's try without the 'since' filter to see if we can get any commits at all
    console.log(`🔍 Testing GitHub API connection...`);
    const { data: allCommits } = await octokit.rest.repos.listCommits({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      per_page: 10
    });
    
    console.log(`📦 Total commits in repo (last 10): ${allCommits.length}`);
    if (allCommits.length > 0) {
      console.log(`📅 Most recent commit: ${allCommits[0].commit.author?.date}`);
      console.log(`📝 Most recent commit message: ${allCommits[0].commit.message}`);
    }
    
    // Now try with the date filter
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      since: since.toISOString(),
      per_page: 50
    });

    console.log(`📦 Found ${commits.length} commits in the last ${days} days`);
    
    if (commits.length === 0) {
      console.log(`⚠️  No commits found in the last ${days} days.`);
      console.log(`🔄 Trying to fetch commits from the last 30 days...`);
      
      // Try a longer period
      const longerSince = new Date();
      longerSince.setDate(longerSince.getDate() - 30);
      
      const { data: longerCommits } = await octokit.rest.repos.listCommits({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        since: longerSince.toISOString(),
        per_page: 50
      });
      
      if (longerCommits.length > 0) {
        console.log(`📦 Found ${longerCommits.length} commits in the last 30 days. Processing these instead.`);
        // Use the longer period commits
        commits.splice(0, commits.length, ...longerCommits);
      } else {
        console.log(`❌ No commits found in the last 30 days either.`);
        console.log(`💡 This might mean:`);
        console.log(`   - The repository is empty`);
        console.log(`   - All commits are older than 30 days`);
        console.log(`   - There's an issue with the GitHub API access`);
        return;
      }
    }

    let processedCount = 0;
    let skippedCount = 0;

    for (const commit of commits) {
      // Check if commit already exists in cache
      if (commitExistsInCache(commit.sha, cache)) {
        console.log(`⏭️  Skipping cached commit: ${commit.sha.substring(0, 7)}`);
        skippedCount++;
        continue;
      }

      // Get detailed commit info
      const commitData = await getCommitDetails(commit.sha);
      if (!commitData) {
        console.log(`⚠️  Could not get details for commit: ${commit.sha.substring(0, 7)}`);
        continue;
      }

      // Create Notion entry
      const success = await createNotionCommit(commitData);
      if (success) {
        processedCount++;
        // Add to cache after successful creation
        cache.processedSHAs.push(commit.sha);
        cache.totalProcessed++;
      }

      // Rate limiting - be nice to the APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Cleanup cache and save
    cleanupCache(cache);
    cache.lastSync = new Date().toISOString();
    await saveCache(cache);
    
    console.log(`✨ Sync complete! Processed: ${processedCount}, Skipped: ${skippedCount}`);
    console.log(`📊 Total commits in cache: ${cache.processedSHAs.length}`);
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// CLI interface
async function main() {
  console.log('🎯 Main function called');
  try {
    const args = process.argv.slice(2);
    
    // Check for clear cache command
    if (args.includes('--clear-cache')) {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
        console.log('🗑️  Cache cleared successfully');
      } else {
        console.log('ℹ️  No cache file found');
      }
      process.exit(0);
    }
    
    const days = args[0] ? parseInt(args[0]) : 7;
    console.log(`📋 Arguments: ${args.join(' ')}, Days: ${days}`);
    
    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      console.error('❌ Invalid days parameter. Please provide a number between 1 and 365.');
      process.exit(1);
    }
    
    if (!NOTION_TOKEN || !GITHUB_TOKEN) {
      console.error('❌ Missing required environment variables:');
      console.error('   NOTION_TOKEN - Your Notion integration token');
      console.error('   GITHUB_TOKEN - Your GitHub personal access token');
      console.error('');
      console.error('💡 Make sure to set these in your .env file or environment.');
      process.exit(1);
    }

    console.log(`🔧 Configuration:`);
    console.log(`   GitHub: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`   Notion Database: ${NOTION_DATABASE_ID}`);
    console.log(`   Days to sync: ${days}`);
    console.log('');

    await syncRecentCommits(days);
  } catch (error) {
    console.error('❌ Fatal error in main function:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { syncRecentCommits, detectFeatureArea, detectImpactLevel };

// Run if called directly
console.log('🔍 Checking if script is being run directly...');

// Simple approach: if this script is being run via tsx, it should be the main module
if (process.argv[1] && process.argv[1].includes('sync-github-commits.ts')) {
  console.log('✅ Script is being run directly, calling main()');
  main().catch(console.error);
} else {
  console.log('ℹ️  Script is being imported, not running main()');
}