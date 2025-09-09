# Pinecone Reranking - Temporary Disable Documentation

## Overview
This document outlines the temporary disabling of Pinecone reranking functionality due to token limit exhaustion and provides instructions for re-enabling it when needed.

## Issue Encountered
**Date:** January 13, 2025  
**Error:** `RESOURCE_EXHAUSTED` - Pinecone reranking token limit (500) exceeded for model `pinecone-rerank-v0`

```
Error [PineconeUnmappedHttpError]: Request failed. You've reached the embedding token limit (500) for model pinecone-rerank-v0 for the current month. To continue using this model, upgrade your plan.
```

## What Was Changed

### File Modified: `cb/src/lib/tools/pinecone-search.ts`

#### 1. Disabled Reranking in Search Function
**Lines 82-96:** Modified the `searchRecords()` call to remove reranking:

**BEFORE (with reranking):**
```typescript
const searchResponse = await index
  .namespace(whitepaperNamespace)
  .searchRecords({
    query: {
      topK: topK,
      inputs: { text: query },
    },
    fields: ["text", "category"],
    rerank: {
      model: "pinecone-rerank-v0",
      rankFields: ["text"],
      topN: topN,
    },
  });
```

**AFTER (without reranking):**
```typescript
const searchResponse = await index
  .namespace(whitepaperNamespace)
  .searchRecords({
    query: {
      topK: topN, // Use topN directly since we're not reranking
      inputs: { text: query },
    },
    fields: ["text", "category"],
    // TEMPORARILY DISABLED: reranking due to token limit exhaustion
    // rerank: {
    //   model: "pinecone-rerank-v0",
    //   rankFields: ["text"],
    //   topN: topN,
    // },
  });
```

#### 2. Updated Schema Descriptions
**Lines 35 & 47:** Updated parameter descriptions:

```typescript
// BEFORE
topN: z.number().default(5).describe("Number of results after reranking"),

// AFTER
topN: z.number().default(5).describe("Number of results to return (reranking temporarily disabled)"),
```

#### 3. Updated Tool Descriptions
**Lines 124 & 163:** Added notes about disabled reranking:

```typescript
// Main search tool
description: "Search the uploaded whitepaper content using Pinecone vector database. Returns relevant text chunks from the whitepaper based on the query. NOTE: Reranking is temporarily disabled due to token limits."

// Simple search tool
description: "Search a whitepaper by name - automatically looks up the correct Pinecone index and namespace from the database. NOTE: Reranking is temporarily disabled due to token limits."
```

## Impact on Agents
All agents are automatically affected since they use the centralized `pineconeSearchTool`:
- ✅ `agent1-brief-creator.ts`
- ✅ `agent2-theme-generator.ts` 
- ✅ `agent3-researcher.ts`
- ✅ `agent4a-article-writer.ts`
- ✅ `agent4b-linkedin-writer.ts`
- ✅ `agent4c-social-writer.ts`
- ✅ `agent5a-article-editor.ts`
- ✅ `agent5b-linkedin-editor.ts`
- ✅ `agent5c-social-editor.ts`

No individual agent files required modification.

## Performance Considerations
**Without Reranking:**
- ⚡ Faster search response times
- 💰 No reranking token consumption
- ⚠️ Potentially less relevant result ordering (relies on vector similarity only)

**With Reranking:**
- 🎯 Better result relevance through semantic reranking
- 🐌 Slower response times
- 💸 Consumes reranking tokens

## How to Re-Enable Reranking

When your Pinecone token limit resets (monthly) or you upgrade your plan, follow these steps:

### Step 1: Restore the Reranking Configuration
In `cb/src/lib/tools/pinecone-search.ts`, lines 82-96:

```typescript
// Change this:
const searchResponse = await index
  .namespace(whitepaperNamespace)
  .searchRecords({
    query: {
      topK: topN, // Use topN directly since we're not reranking
      inputs: { text: query },
    },
    fields: ["text", "category"],
    // TEMPORARILY DISABLED: reranking due to token limit exhaustion
    // rerank: {
    //   model: "pinecone-rerank-v0",
    //   rankFields: ["text"],
    //   topN: topN,
    // },
  });

// Back to this:
const searchResponse = await index
  .namespace(whitepaperNamespace)
  .searchRecords({
    query: {
      topK: topK, // Restore original topK parameter
      inputs: { text: query },
    },
    fields: ["text", "category"],
    rerank: {
      model: "pinecone-rerank-v0",
      rankFields: ["text"],
      topN: topN,
    },
  });
```

### Step 2: Update Schema Descriptions
In `cb/src/lib/tools/pinecone-search.ts`, lines 35 & 47:

```typescript
// Change:
topN: z.number().default(5).describe("Number of results to return (reranking temporarily disabled)"),

// Back to:
topN: z.number().default(5).describe("Number of results after reranking"),
```

### Step 3: Update Tool Descriptions
In `cb/src/lib/tools/pinecone-search.ts`, lines 124 & 163:

```typescript
// Remove "NOTE: Reranking is temporarily disabled due to token limits." from both descriptions

// Main search tool (line 124):
description: "Search the uploaded whitepaper content using Pinecone vector database. Returns relevant text chunks from the whitepaper based on the query."

// Simple search tool (line 163):
description: "Search a whitepaper by name - automatically looks up the correct Pinecone index and namespace from the database."
```

### Step 4: Update Comments
Change the comment on line 83:

```typescript
// From:
// Use the official Pinecone searchRecords method WITHOUT reranking (temporarily disabled due to token limits)

// Back to:
// Use the official Pinecone searchRecords method with reranking
```

## Testing After Re-enabling
1. Run a small test search to verify reranking is working
2. Monitor token consumption in your Pinecone dashboard
3. Ensure search quality has improved with reranking restored

## Token Management Tips
- Monitor your monthly reranking token usage
- Consider upgrading Pinecone plan if you frequently hit limits
- Use reranking selectively for high-value searches
- Implement fallback logic to disable reranking when limits are reached

---
**Created:** January 13, 2025  
**Purpose:** Knight Frank demo preparation  
**Status:** Reranking currently disabled ⚠️ 