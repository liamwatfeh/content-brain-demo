// Agent 3: Deep Research Agent
// Model: claude-sonnet-4-20250514 (Claude Sonnet 4 with thinking enabled)
// Purpose: Take selected theme and develop it into 6 compelling content concepts

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { pineconeSearchTool } from "../tools/pinecone-search";
import type { BasicWorkflowState, ResearchDossier } from "../schemas/types";
import { getWhitepaperConfigById } from "../tools/pinecone-search";
import { MessageContentText } from "@langchain/core/messages";
import { researchDossierParser } from "../tools/output-parsers";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@supabase/supabase-js";

// Type for search results
interface SearchResult {
  id: string;
  score?: number;
  text: string;
  category?: string;
}

// Schema for iterative research queries
const ResearchQueriesSchema = z
  .array(
    z
      .string()
      .describe(
        "Short, targeted keyword query (2-6 words max) for semantic search"
      )
  )
  .min(3)
  .max(5);
const researchQueriesParser = StructuredOutputParser.fromZodSchema(
  ResearchQueriesSchema
);

// Schema for concept development iteration
const ConceptDevelopmentSchema = z.object({
  analysis: z.string(),
  nextQueries: z
    .array(
      z.string().describe("Short keyword query (2-6 words) for RAG search")
    )
    .min(2)
    .max(4),
  emergingConcepts: z.array(
    z.object({
      angle: z.string(),
      reasoning: z.string(),
    })
  ),
});
const conceptDevelopmentParser = StructuredOutputParser.fromZodSchema(
  ConceptDevelopmentSchema
);

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

export async function deepResearchAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log(
    "🔬 Agent 3: Deep Research Agent starting concept development..."
  );

  try {
    // Validate required inputs
    if (!state.selectedTheme) {
      throw new Error(
        "No theme selected. Agent 3 requires a selected theme to proceed."
      );
    }

    if (!state.selectedWhitepaperId) {
      throw new Error(
        "No whitepaper selected. Agent 3 requires whitepaper context."
      );
    }

    if (!state.marketingBrief) {
      throw new Error(
        "No marketing brief available. Agent 3 requires marketing context."
      );
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent3");
    console.log("📋 Loaded agent3 configuration from database");

    // Initialize Claude Sonnet 4 model with config from database
    const llm = new ChatAnthropic({
      model: agentConfig.model_name,
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.4, // Slightly higher for creativity
    });

    // Get whitepaper configuration
    console.log("🔍 Getting whitepaper configuration...");
    const whitepaperConfig = await getWhitepaperConfigById(
      state.selectedWhitepaperId
    );

    // Parse marketing brief
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

    const selectedTheme = state.selectedTheme;
    console.log(`🎯 Selected theme: "${selectedTheme.title}"`);

    // Build user prompt using template from database
    const userPromptVariables = {
      selectedThemeTitle: selectedTheme.title,
      selectedThemeDescription: selectedTheme.description,
      selectedThemeWhyItWorks: Array.isArray(selectedTheme.whyItWorks)
        ? selectedTheme.whyItWorks.join(", ")
        : selectedTheme.whyItWorks || "Not specified",
      selectedThemeDetailedDescription: selectedTheme.detailedDescription,
      businessContext: state.businessContext,
      targetAudience: state.targetAudience,
      marketingGoals: state.marketingGoals,
      marketingBrief: JSON.stringify(marketingBrief, null, 2),
      whitepaperNamespace: whitepaperConfig.namespace,
      researchPhase: "INITIAL_EVIDENCE_EXTRACTION",
      phaseSpecificInstructions: researchQueriesParser.getFormatInstructions(),
    };

    // Generate initial whitepaper evidence extraction queries
    const initialQueryPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Get initial research queries
    const initialQueriesResponse = await llm.invoke([
      {
        role: "system",
        content: agentConfig.system_prompt,
      },
      { role: "user", content: initialQueryPrompt },
    ]);

    let currentQueries: string[];
    try {
      const content = Array.isArray(initialQueriesResponse.content)
        ? (initialQueriesResponse.content[0] as MessageContentText).text
        : (initialQueriesResponse.content as string);
      currentQueries = await researchQueriesParser.parse(content);
      console.log("✅ Initial research queries generated:", currentQueries);
    } catch (error) {
      console.error("❌ Failed to parse initial queries:", error);
      throw new Error("Failed to generate valid research queries");
    }

    // Execute iterative deep research
    const allResearchResults: SearchResult[] = [];
    const researchLog: Array<{
      query: string;
      resultCount: number;
      analysis: string;
      emergingConcepts: Array<{ angle: string; reasoning: string }>;
      nextQueries: string[];
    }> = [];

    console.log("🔄 Starting deep research process...");

    let totalSearches = 0;
    // ORIGINAL CODE (BACKED UP): const MAX_SEARCHES = 12; // Optimized for comprehensive research without truncation
    const MAX_SEARCHES = 12; // Reduced for faster testing

    while (totalSearches < MAX_SEARCHES && currentQueries.length > 0) {
      for (const query of currentQueries) {
        if (totalSearches >= MAX_SEARCHES) break;

        console.log(
          `🔍 Deep research ${totalSearches + 1}/${MAX_SEARCHES}: "${query}"`
        );

        try {
          const searchResult = await pineconeSearchTool.invoke({
            query,
            whitepaperNamespace: whitepaperConfig.namespace,
            indexName: whitepaperConfig.indexName,
            // ORIGINAL CODE (BACKED UP): topK: 10,
            topK: 10, // Reduced for faster testing
            topN: 5,
          });

          const parsedResults = JSON.parse(searchResult);
          allResearchResults.push(...parsedResults.results);

          // Analyze results and develop concept angles
          const analysisPrompt = `Current Theme: ${selectedTheme.title}
Search Query: "${query}"

Results:
${JSON.stringify(parsedResults.results, null, 2)}

Previous Research: ${researchLog.map((log) => log.query).join(", ")}

${conceptDevelopmentParser.getFormatInstructions()}`;

          const analysisResponse = await llm.invoke([
            {
              role: "system",
              content:
                "Analyze research results and develop concept angles. Identify interesting angles for content concepts. Note compelling evidence or insights. Suggest 2-4 SHORT, RAG-OPTIMIZED follow-up queries (2-6 words each) to explore promising angles deeper. Consider contrarian or unexpected perspectives. Follow-up query examples: 'leadership training', 'skill assessment', 'adoption metrics', 'resistance factors'. Follow the format instructions exactly.",
            },
            { role: "user", content: analysisPrompt },
          ]);

          let analysis;
          try {
            const content = Array.isArray(analysisResponse.content)
              ? (analysisResponse.content[0] as MessageContentText).text
              : (analysisResponse.content as string);
            analysis = await conceptDevelopmentParser.parse(content);
            console.log(`✅ Analysis completed for query "${query}"`);
          } catch (error) {
            console.error("Failed to parse analysis response:", error);
            analysis = {
              analysis: "Failed to analyze results",
              nextQueries: [],
              emergingConcepts: [],
            };
          }

          researchLog.push({
            query,
            resultCount: parsedResults.results.length,
            analysis: analysis.analysis,
            emergingConcepts: analysis.emergingConcepts,
            nextQueries: analysis.nextQueries,
          });

          // Update queries for next iteration
          currentQueries = analysis.nextQueries;
          totalSearches++;

          // Brief pause between searches
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Search failed for "${query}":`, error);
          researchLog.push({
            query,
            resultCount: 0,
            analysis: `Search failed: ${error}`,
            emergingConcepts: [],
            nextQueries: [],
          });
          totalSearches++;
        }
      }
    }

    console.log(
      `✅ Deep research complete: ${allResearchResults.length} total results from ${researchLog.length} searches`
    );

    if (allResearchResults.length === 0) {
      throw new Error(
        "No research results found. Please check your Pinecone configuration and whitepaper content."
      );
    }

    // Deduplicate and rank results
    const uniqueResults = Array.from(
      new Map(
        allResearchResults.map((result: SearchResult) => [result.id, result])
      ).values()
    )
      .sort(
        (a: SearchResult, b: SearchResult) => (b.score || 0) - (a.score || 0)
      )
      .slice(0, 40); // Top 40 unique results for comprehensive concept development

    // Generate final research dossier with 3 suggested concepts - SIMPLIFIED VERSION
    const conceptSynthesisPrompt = `SELECTED THEME: ${JSON.stringify(selectedTheme, null, 2)}

MARKETING CONTEXT:
Business: ${state.businessContext}
Audience: ${state.targetAudience}
Goals: ${state.marketingGoals}

RESEARCH RESULTS (${uniqueResults.length} findings):
${uniqueResults
  .slice(0, 20) // Limit to top 20 to reduce prompt size
  .map(
    (result: SearchResult, i) => `${i + 1}. ${result.text.substring(0, 150)}...`
  )
  .join("\n")}

${researchDossierParser.getFormatInstructions()}`;

    console.log(
      "🎨 Synthesizing research into 3 suggested content concepts..."
    );

    // Generate the final research dossier
    const dossierResponse = await llm.invoke([
      {
        role: "system",
        content:
          "Create a streamlined research dossier with 3 suggested content concepts from whitepaper analysis. " +
          "Extract 6-8 KEY FINDINGS with confidence levels (high/medium/low). " +
          "Create exactly 3 SUGGESTED CONCEPTS for drafting agents to choose from. " +
          "Each concept needs: title, angle, whyItWorks, 3 keyEvidence items, contentDirection. " +
          "Include brief research summary. " +
          "CRITICAL: Return valid JSON only. The suggestedConcepts must be an array of objects, where each object has curly braces {}. " +
          "Example structure: " +
          '{"suggestedConcepts": [{"title": "...", "angle": "...", "whyItWorks": "...", "keyEvidence": ["...", "...", "..."], "contentDirection": "..."}, {...}, {...}]} ' +
          "Follow the JSON schema exactly. Be concise but specific with evidence.",
      },
      { role: "user", content: conceptSynthesisPrompt },
    ]);

    console.log("📝 Research dossier received, parsing...");

    // Parse the research dossier with better error handling
    let researchDossier: ResearchDossier;
    try {
      const content = dossierResponse.content as string;
      console.log("\n🔍 RAW RESEARCH DOSSIER RESPONSE:");
      console.log("=".repeat(80));
      console.log(content);
      console.log("=".repeat(80));

      // Clean up the content to handle potential truncation and fix JSON issues
      let cleanedContent = content;

      // If content is wrapped in markdown code blocks, extract JSON
      if (content.includes("```json")) {
        const jsonStart = content.indexOf("```json") + 7;
        const jsonEnd = content.indexOf("```", jsonStart);

        if (jsonEnd === -1) {
          // No closing markdown found, likely truncated
          const jsonContent = content.substring(jsonStart);

          // Try to find the last complete object by counting braces
          let braceCount = 0;
          let lastValidIndex = -1;

          for (let i = 0; i < jsonContent.length; i++) {
            if (jsonContent[i] === "{") braceCount++;
            if (jsonContent[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                lastValidIndex = i;
              }
            }
          }

          if (lastValidIndex > 0) {
            cleanedContent = jsonContent.substring(0, lastValidIndex + 1);
            console.log("🔧 Fixed truncated JSON response");
          } else {
            cleanedContent = jsonContent;
          }
        } else {
          cleanedContent = content.substring(jsonStart, jsonEnd);
        }
      }

      // Fix common JSON malformation issues in suggestedConcepts array
      if (cleanedContent.includes('"suggestedConcepts": [')) {
        // Fix missing opening braces in suggestedConcepts array
        cleanedContent = cleanedContent.replace(
          /"suggestedConcepts": \[\s*"title":/g,
          '"suggestedConcepts": [\n    {\n      "title":'
        );

        // Fix missing opening braces for subsequent objects in array
        cleanedContent = cleanedContent.replace(
          /},\s*"title":/g,
          '},\n    {\n      "title":'
        );

        // Ensure last object in array is properly closed
        if (!cleanedContent.includes("}\n  ]")) {
          cleanedContent = cleanedContent.replace(/"\s*}\s*]/, '"\n    }\n  ]');
        }

        console.log("🔧 Fixed suggestedConcepts array structure");
      }

      researchDossier = await researchDossierParser.parse(cleanedContent);
      console.log("✅ Research dossier parsed successfully");

      // Add detailed logging for simplified schema
      console.log("\n📊 SIMPLIFIED RESEARCH DOSSIER OUTPUT:");
      console.log("=".repeat(80));

      console.log("\n🎯 SELECTED THEME:");
      console.log("Title:", researchDossier.selectedTheme.title);
      console.log("Description:", researchDossier.selectedTheme.description);
      console.log("Why It Works:", researchDossier.selectedTheme.whyItWorks);
      console.log(
        "Detailed Description:",
        researchDossier.selectedTheme.detailedDescription
      );

      console.log("\n🔬 WHITEPAPER EVIDENCE:");
      console.log(
        "Key Findings Count:",
        researchDossier.whitepaperEvidence.keyFindings.length
      );
      researchDossier.whitepaperEvidence.keyFindings.forEach((finding, i) => {
        console.log(`\nKey Finding ${i + 1}:`);
        console.log("  Claim:", finding.claim);
        console.log("  Evidence:", finding.evidence);
        console.log("  Confidence Level:", finding.confidence);
      });

      console.log("\n🎯 SUGGESTED CONCEPTS (3 TOTAL):");
      researchDossier.suggestedConcepts.forEach((concept, index) => {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`SUGGESTED CONCEPT ${index + 1}: ${concept.title}`);
        console.log(`${"=".repeat(50)}`);
        console.log("🎯 Angle:", concept.angle);
        console.log("💡 Why It Works:", concept.whyItWorks);
        console.log("🔍 Key Evidence:", concept.keyEvidence.join(" | "));
        console.log("📝 Content Direction:", concept.contentDirection);
      });

      console.log("\n📝 RESEARCH SUMMARY:");
      console.log(researchDossier.researchSummary);

      console.log("\n" + "=".repeat(80));
      console.log("🎉 RESEARCH DOSSIER LOGGING COMPLETE");
      console.log("=".repeat(80));
    } catch (parseError) {
      console.error("❌ Failed to parse research dossier:", parseError);
      console.log("\n🔍 RAW CONTENT THAT FAILED TO PARSE:");
      console.log("=".repeat(80));
      console.log(dossierResponse.content);
      console.log("=".repeat(80));
      throw new Error("Failed to generate valid research dossier");
    }

    console.log(
      "✅ Agent 3: Generated research dossier with 3 suggested content concepts successfully"
    );

    return {
      researchDossier,
      searchHistory: [
        ...(state.searchHistory || []),
        ...researchLog.map((log) => log.query),
      ],
      currentStep: "research_complete",
      needsHumanInput: false, // Continue to content generation automatically
    };
  } catch (error) {
    console.error("❌ Agent 3 Error:", error);
    throw new Error(
      `Deep research failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
