// Agent 4c: Social Media Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft short, punchy social media posts based on research and theme

import { ChatAnthropic } from "@langchain/anthropic";
import type {
  BasicWorkflowState,
  SocialOutput,
  ResearchDossier,
  MarketingBrief,
} from "../schemas/types";
import { SocialOutputSchema } from "../schemas/types";
import {
  pineconeSearchTool,
  getWhitepaperConfigById,
} from "../tools/pinecone-search";
import { createClient } from "@supabase/supabase-js";

// Search result interface for Pinecone
interface SearchResult {
  id: string;
  score?: number;
  text: string;
  category?: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to load agent configuration from database
async function loadAgentConfig(agentId: string) {
  const { data, error } = await supabase
    .from("agent_system_prompts")
    .select("system_prompt, user_prompt_template, model_name")
    .eq("agent_id", agentId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(`Error loading agent config for ${agentId}:`, error);
    throw new Error(`Failed to load agent configuration: ${error.message}`);
  }

  return data;
}

// Template replacement function
function fillTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value || "");
    result = result.replace(new RegExp(placeholder, "g"), stringValue);
  }

  return result;
}

export async function socialWriterAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("📱 Agent 4c: Starting social media post generation...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error(
        "Marketing brief is required for social media post generation"
      );
    }

    if (!state.researchDossier) {
      throw new Error(
        "Research dossier is required for social media post generation"
      );
    }

    if (!state.selectedTheme) {
      throw new Error(
        "Selected theme is required for social media post generation"
      );
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent4c");
    console.log("📋 Loaded agent4c configuration from database");

    // Initialize Claude Sonnet 4 with config from database
    const baseLlm = new ChatAnthropic({
      modelName: agentConfig.model_name,
      temperature: 0.7,
      maxTokens: 4000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Bind Pinecone search tool for autonomous calling
    const llm = baseLlm.bindTools([pineconeSearchTool]);

    // Parse the marketing brief from Agent 1 (handles Agent 1 output format)
    let marketingBrief;
    try {
      marketingBrief =
        typeof state.marketingBrief === "string"
          ? JSON.parse(state.marketingBrief)
          : state.marketingBrief;
    } catch (error) {
      console.error("❌ Failed to parse marketing brief:", error);
      throw new Error("Invalid marketing brief format");
    }

    const researchDossier = state.researchDossier as ResearchDossier;
    const socialPostsCount = state.socialPostsCount || 8;

    // Get whitepaper configuration for tool context
    let whitepaperConfig;
    let whitepaperTitle = "the selected whitepaper";
    if (state.selectedWhitepaperId) {
      try {
        whitepaperConfig = await getWhitepaperConfigById(
          state.selectedWhitepaperId
        );
        console.log(
          `📄 Whitepaper config loaded: namespace=${whitepaperConfig.namespace}, index=${whitepaperConfig.indexName}`
        );

        // Get whitepaper title for context
        const { supabase } = await import("../supabase");
        const { data: whitepaper } = await supabase
          .from("whitepapers")
          .select("title, filename")
          .eq("id", state.selectedWhitepaperId)
          .single();

        if (whitepaper) {
          whitepaperTitle =
            whitepaper.title ||
            whitepaper.filename ||
            "the selected whitepaper";
          console.log(`📄 Whitepaper title: ${whitepaperTitle}`);
        }
      } catch (error) {
        console.warn("⚠️ Could not load whitepaper config:", error);
      }
    }

    console.log(
      `📱 Generating ${socialPostsCount} social media post(s) using research dossier...`
    );

    // Build user prompt using template from database
    const userPromptVariables = {
      executiveSummary: marketingBrief.executiveSummary || "Not provided",
      targetPersona: JSON.stringify(marketingBrief.targetPersona || {}),
      campaignObjectives: JSON.stringify(
        marketingBrief.campaignObjectives || []
      ),
      keyMessages: JSON.stringify(marketingBrief.keyMessages || []),
      callToAction: JSON.stringify(marketingBrief.callToAction || {}),
      selectedThemeTitle: state.selectedTheme.title,
      selectedThemeDescription: state.selectedTheme.description,
      selectedThemeWhyItWorks: Array.isArray(state.selectedTheme.whyItWorks)
        ? state.selectedTheme.whyItWorks.join(" | ")
        : state.selectedTheme.whyItWorks || "Not specified",
      keyFindingsCount: researchDossier.whitepaperEvidence.keyFindings.length,
      keyFindings: researchDossier.whitepaperEvidence.keyFindings
        .map(
          (finding, i) =>
            `${i + 1}. ${finding.claim} (Evidence: ${finding.evidence}) [Confidence: ${finding.confidence}]`
        )
        .join("\n"),
      suggestedConcepts: researchDossier.suggestedConcepts
        .map(
          (concept, i) =>
            `${i + 1}. ${concept.title}\n   Angle: ${concept.angle}\n   Why it works: ${concept.whyItWorks}\n   Key Evidence: ${Array.isArray(concept.keyEvidence) ? concept.keyEvidence.join(" | ") : concept.keyEvidence || "Not specified"}\n   Direction: ${concept.contentDirection}`
        )
        .join("\n\n"),
      socialPostsCount,
      ctaType: state.ctaType,
      ctaUrlInfo: state.ctaUrl ? ` (URL: ${state.ctaUrl})` : "",
      whitepaperTitle,
    };

    // Create the Twitter post generation prompt using template
    const socialPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Step 1: Optional research phase - determine if additional evidence is needed
    let researchResults = "";
    let toolUsageLog = "";

    const needsResearchPrompt = `Based on this research dossier, do you need additional specific evidence from "${whitepaperTitle}" to create viral Twitter posts about "${state.selectedTheme.title}"?

RESEARCH DOSSIER SUMMARY:
Key Findings: ${researchDossier.whitepaperEvidence?.keyFindings?.map((f) => f.claim).join("; ") || "None"}
Suggested Concepts: ${researchDossier.suggestedConcepts?.map((c) => c.title).join("; ") || "None"}

Respond with "YES" if you need more specific statistics, viral hooks, or compelling examples. Respond with "NO" if the dossier provides sufficient evidence.`;

    const researchDecision = await baseLlm.invoke([
      {
        role: "system",
        content:
          "You are an expert research analyst. Respond with only YES or NO.",
      },
      { role: "user", content: needsResearchPrompt },
    ]);

    const needsResearch = researchDecision.content
      .toString()
      .trim()
      .toUpperCase()
      .includes("YES");

    if (needsResearch) {
      console.log("🔍 Agent 4c determined additional research is needed...");

      // Create research-focused LLM with tools
      const researchLlm = baseLlm.bindTools([pineconeSearchTool]);

      const researchPrompt = `You are a research assistant for viral Twitter content. Search "${whitepaperTitle}" for additional evidence to create engaging Twitter posts about "${state.selectedTheme.title}".

CURRENT RESEARCH GAPS:
Search for Twitter-optimized content:
1. Viral statistics and shocking metrics for hooks
2. Controversial insights and hot takes
3. Relatable examples and success stories
4. Trending topics and conversation starters

Make 1-3 focused searches to gather engaging evidence for viral Twitter content.`;

      try {
        const researchResponse = await researchLlm.invoke([
          {
            role: "system",
            content:
              "Search for specific evidence to strengthen Twitter content. Use the search tool to find compelling viral data.",
          },
          { role: "user", content: researchPrompt },
        ]);

        // Extract and log tool results
        if (Array.isArray(researchResponse.content)) {
          const toolCalls = researchResponse.content.filter(
            (item: any) => item.type === "tool_use"
          );
          const textBlocks = researchResponse.content.filter(
            (item: any) => item.type === "text"
          );

          toolUsageLog = `Research phase: ${toolCalls.length} tool call(s) made`;
          console.log(`🔍 ${toolUsageLog}`);

          // Include research summary in final content
          researchResults =
            "\n\nADDITIONAL RESEARCH FINDINGS:\n" +
            toolCalls
              .map(
                (call: any, i: number) =>
                  `Research Query ${i + 1}: ${JSON.stringify(call.input)}`
              )
              .join("\n") +
            (textBlocks.length > 0
              ? `\nResearch Summary: ${(textBlocks[textBlocks.length - 1] as any)?.text || ""}`
              : "");
        }
      } catch (error) {
        console.log(
          "⚠️ Research phase encountered issue, proceeding with dossier only"
        );
        researchResults =
          "\n\nNote: Research phase encountered limitations, using research dossier evidence.";
      }
    } else {
      console.log(
        "✅ Agent 4c determined research dossier provides sufficient evidence"
      );
    }

    // Step 2: Generate structured content with GUARANTEED JSON output
    console.log(
      "📝 Generating Twitter posts with guaranteed structured output..."
    );

    const contentPrompt = `${socialPrompt}${researchResults}`;

    // Use withStructuredOutput for guaranteed JSON - no parsing needed!
    const structuredLlm = baseLlm.withStructuredOutput(SocialOutputSchema);

    const socialOutput = await structuredLlm.invoke([
      {
        role: "system",
        content: `${agentConfig.system_prompt}

TWITTER POST REQUIREMENTS:
- Generate exactly ${socialPostsCount} Twitter post(s)
- Each post under 280 characters (Twitter limit)
- Include viral hooks, engaging insights, and conversation starters
- Vary post types: stats, questions, hot takes, threads, quotes
- Integrate evidence naturally from the research dossier${needsResearch ? " and additional research findings" : ""}
- Focus on maximizing engagement: retweets, likes, replies
- Use Twitter-optimized formatting and language

${toolUsageLog ? `RESEARCH CONTEXT: ${toolUsageLog}` : ""}`,
      },
      {
        role: "user",
        content: contentPrompt,
      },
    ]);

    console.log(
      "📱 Twitter posts generated successfully with guaranteed structure!"
    );

    // Log detailed Twitter information
    console.log("\n🐦 GENERATED TWITTER POSTS SUMMARY:");
    console.log("=".repeat(80));
    console.log(`Total Posts: ${socialOutput.posts.length}`);
    console.log(`Generation Strategy: ${socialOutput.generation_strategy}`);
    console.log(
      `Whitepaper Utilization: ${socialOutput.whitepaper_utilization}`
    );

    socialOutput.posts.forEach((post, index) => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`🐦 TWITTER POST ${index + 1}`);
      console.log(`${"=".repeat(50)}`);
      console.log(`📱 Platform: ${post.platform}`);
      console.log(`📊 Character Count: ${post.character_count}`);
      console.log(`🎯 Concept Used: ${post.concept_used}`);
      console.log(`\n📖 Content Preview:`);
      console.log(`${post.content}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎉 TWITTER GENERATION COMPLETE");
    console.log("=".repeat(80));

    console.log(
      `✅ Agent 4c: Generated ${socialOutput.posts.length} Twitter post(s) successfully`
    );

    return {
      socialOutput,
      currentStep: "social_posts_generated",
    };
  } catch (error) {
    console.error("❌ Agent 4c Error:", error);
    throw new Error(
      `Twitter post generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function for searching whitepaper content for social media posts
export async function searchWhitepaperForSocial(
  query: string,
  whitepaperConfig: { namespace: string; indexName: string }
): Promise<SearchResult[]> {
  try {
    console.log(
      `🔍 Searching whitepaper: "${query}" in namespace: ${whitepaperConfig.namespace}`
    );

    const searchResults = await pineconeSearchTool.invoke({
      query,
      whitepaperNamespace: whitepaperConfig.namespace,
      indexName: whitepaperConfig.indexName,
      // ORIGINAL CODE (BACKED UP): topK: 10,
      topK: 5, // Reduced for faster testing
      topN: 5,
    });

    // Handle both string and object responses
    if (typeof searchResults === "string") {
      try {
        const parsed = JSON.parse(searchResults);
        return parsed.results || parsed || [];
      } catch {
        return [];
      }
    }

    return (searchResults as any)?.results || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
