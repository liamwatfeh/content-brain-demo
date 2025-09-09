// Agent 4a: Article Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft 1-3 articles using Economist style guide and research from Agent 3

import { ChatAnthropic } from "@langchain/anthropic";
import type {
  BasicWorkflowState,
  ArticleOutput,
  ResearchDossier,
  MarketingBrief,
} from "../schemas/types";
import { ArticleOutputSchema } from "../schemas/types";
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

export async function articleWriterAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🖋️ Agent 4a: Starting article generation...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for article generation");
    }

    if (!state.researchDossier) {
      throw new Error("Research dossier is required for article generation");
    }

    if (!state.selectedTheme) {
      throw new Error("Selected theme is required for article generation");
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent4a");
    console.log("📋 Loaded agent4a configuration from database");

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
    const articlesCount = state.articlesCount || 1;

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

        // Get whitepaper title for context (simple query)
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
      `📝 Generating ${articlesCount} article(s) using research dossier...`
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
      articlesCount,
      ctaType: state.ctaType,
      ctaUrlInfo: state.ctaUrl ? ` (URL: ${state.ctaUrl})` : "",
      whitepaperTitle,
    };

    // Create the article generation prompt using template
    const articlePrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Step 1: Optional research phase - determine if additional evidence is needed
    let researchResults = "";
    let toolUsageLog = "";

    const needsResearchPrompt = `Based on this research dossier, do you need additional specific evidence from "${whitepaperTitle}" to write authoritative Economist-style articles about "${state.selectedTheme.title}"?

RESEARCH DOSSIER SUMMARY:
Key Findings: ${researchDossier.whitepaperEvidence?.keyFindings?.map((f) => f.claim).join("; ") || "None"}
Suggested Concepts: ${researchDossier.suggestedConcepts?.map((c) => c.title).join("; ") || "None"}

Respond with "YES" if you need more specific statistics, case studies, or technical details. Respond with "NO" if the dossier provides sufficient evidence.`;

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
      console.log("🔍 Agent 4a determined additional research is needed...");

      // Create research-focused LLM with tools
      const researchLlm = baseLlm.bindTools([pineconeSearchTool]);

      const researchPrompt = `You are a research assistant for The Economist. Search "${whitepaperTitle}" for additional evidence to strengthen articles about "${state.selectedTheme.title}".

CURRENT RESEARCH GAPS:
Based on the research dossier, search for:
1. Specific statistics and ROI data
2. Business impact case studies  
3. Technical implementation details
4. Real-world examples and quotes

Make 1-3 focused searches to gather compelling evidence for analytical articles.`;

      try {
        const researchResponse = await researchLlm.invoke([
          {
            role: "system",
            content:
              "Search for specific evidence to strengthen analytical articles. Use the search tool to find compelling data.",
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
        "✅ Agent 4a determined research dossier provides sufficient evidence"
      );
    }

    // Step 2: Generate structured content with GUARANTEED JSON output
    console.log("📝 Generating articles with guaranteed structured output...");

    const contentPrompt = `${articlePrompt}${researchResults}`;

    // Use withStructuredOutput for guaranteed JSON - no parsing needed!
    const structuredLlm = baseLlm.withStructuredOutput(ArticleOutputSchema);

    const articleOutput = await structuredLlm.invoke([
      {
        role: "system",
        content: `${agentConfig.system_prompt}

ARTICLE REQUIREMENTS:
- Generate exactly ${articlesCount} article(s)
- Each article ~1000 words in The Economist style
- Use different suggested concepts if multiple articles requested
- Integrate evidence naturally from the research dossier${needsResearch ? " and additional research findings" : ""}
- Include compelling call-to-action aligned with marketing goals
- Maintain journalistic integrity while achieving marketing objectives

${toolUsageLog ? `RESEARCH CONTEXT: ${toolUsageLog}` : ""}`,
      },
      {
        role: "user",
        content: contentPrompt,
      },
    ]);

    console.log(
      "📄 Articles generated successfully with guaranteed structure!"
    );

    // Log detailed article information
    console.log("\n📰 GENERATED ARTICLES SUMMARY:");
    console.log("=".repeat(80));
    console.log(`Total Articles: ${articleOutput.articles.length}`);
    console.log(`Generation Strategy: ${articleOutput.generation_strategy}`);
    console.log(
      `Whitepaper Utilization: ${articleOutput.whitepaper_utilization}`
    );

    articleOutput.articles.forEach((article, index) => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`ARTICLE ${index + 1}`);
      console.log(`${"=".repeat(50)}`);
      console.log(`📰 Headline: ${article.headline}`);
      console.log(`📝 Subheadline: ${article.subheadline}`);
      console.log(`📊 Word Count: ${article.word_count}`);
      console.log(`🎯 Concept Used: ${article.concept_used}`);
      console.log(
        `🔍 Key Takeaways: ${Array.isArray(article.key_takeaways) ? article.key_takeaways.join(" | ") : "Not specified"}`
      );
      console.log(
        `🏷️ SEO Keywords: ${Array.isArray(article.seo_keywords) ? article.seo_keywords.join(", ") : "Not specified"}`
      );
      console.log(`📞 Call to Action: ${article.call_to_action}`);
      console.log(`\n📖 Article Body Preview (first 200 chars):`);
      console.log(`${article.body.substring(0, 200)}...`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎉 ARTICLE GENERATION COMPLETE");
    console.log("=".repeat(80));

    console.log(
      `✅ Agent 4a: Generated ${articleOutput.articles.length} article(s) successfully`
    );

    return {
      articleOutput,
      currentStep: "articles_generated",
      needsHumanInput: false, // Articles ready for next agents
    };
  } catch (error) {
    console.error("❌ Agent 4a Error:", error);
    throw new Error(
      `Article generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function for additional Pinecone searches if needed
export async function searchWhitepaperForArticle(
  query: string,
  whitepaperConfig: { namespace: string; indexName: string }
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching whitepaper for: "${query}"`);

    const searchResults = await pineconeSearchTool.invoke({
      query,
      whitepaperNamespace: whitepaperConfig.namespace,
      indexName: whitepaperConfig.indexName,
      // ORIGINAL CODE (BACKED UP): topK: 10,
      topK: 10, // Reduced for faster testing
      topN: 5,
    });

    // Handle string response (should be JSON)
    const results =
      typeof searchResults === "string"
        ? JSON.parse(searchResults)
        : searchResults;

    if (Array.isArray(results)) {
      return results.map((result: SearchResult) => ({
        id: result.id || "unknown",
        score: result.score || 0,
        text: result.text || "",
        category: result.category || "general",
      }));
    }

    return [];
  } catch (error) {
    console.error("❌ Whitepaper search failed:", error);
    return [];
  }
}
