// Agent 1: Brief Creator
// Model: o3-2025-04-16
// Purpose: Generate a detailed marketing brief optimized for LLM consumption

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { BasicWorkflowState } from "../schemas/types";
import { createClient } from "@supabase/supabase-js";

// Simplified schema for Agent 1's output
const MarketingBriefOutputSchema = z.object({
  executiveSummary: z.string(),
  targetPersona: z.object({
    demographic: z.string(),
    psychographic: z.string(),
    painPoints: z.array(z.string()),
    motivations: z.array(z.string()),
  }),
  campaignObjectives: z.array(z.string()),
  keyMessages: z.array(z.string()),
  contentStrategy: z.object({
    articles: z.number(),
    linkedinPosts: z.number(),
    socialPosts: z.number(),
  }),
  callToAction: z.object({
    type: z.string(),
    message: z.string(),
    url: z.string().optional(),
  }),
});

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
    // Handle conditional CTA URL logic
    if (key === "ctaUrl" && variables.ctaUrl) {
      result = result.replace(
        '{ctaUrl ? `CTA URL: ${ctaUrl}` : ""}',
        `CTA URL: ${value}`
      );
    } else if (key === "ctaUrl" && !variables.ctaUrl) {
      result = result.replace('{ctaUrl ? `CTA URL: ${ctaUrl}` : ""}', "");
    } else {
      // Standard template replacement
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, "g"), String(value));
    }
  }

  return result;
}

export async function briefCreatorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🤖 Agent 1: Brief Creator starting...");

  try {
    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent1");
    console.log("📋 Loaded agent1 configuration from database");

    // Initialize OpenAI with the model from database
    const llm = new ChatOpenAI({
      model: agentConfig.model_name,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use system prompt from database
    const systemPrompt = agentConfig.system_prompt;

    // Build user prompt using template from database
    const userPromptVariables = {
      businessContext: state.businessContext,
      targetAudience: state.targetAudience,
      marketingGoals: state.marketingGoals,
      articlesCount: state.articlesCount,
      linkedinPostsCount: state.linkedinPostsCount,
      socialPostsCount: state.socialPostsCount,
      ctaType: state.ctaType,
      ctaUrl: state.ctaUrl,
    };

    const userPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Call LLM
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Parse and validate response
    const briefData = JSON.parse(response.content as string);
    const validatedBrief = MarketingBriefOutputSchema.parse(briefData);
    const marketingBrief = JSON.stringify(validatedBrief, null, 2);

    console.log("✅ Agent 1: Brief created successfully");

    return {
      // Preserve all input state fields
      businessContext: state.businessContext,
      targetAudience: state.targetAudience,
      marketingGoals: state.marketingGoals,
      articlesCount: state.articlesCount,
      linkedinPostsCount: state.linkedinPostsCount,
      socialPostsCount: state.socialPostsCount,
      ctaType: state.ctaType,
      ctaUrl: state.ctaUrl,
      selectedWhitepaperId: state.selectedWhitepaperId, // IMPORTANT: Preserve this for Agent 2!

      // Preserve any existing workflow state
      previousThemes: state.previousThemes,
      searchHistory: state.searchHistory,
      regenerationCount: state.regenerationCount,

      // Add the generated marketing brief
      marketingBrief,

      // Update workflow status
      currentStep: "brief_complete",
      isComplete: false, // Keep as false since we need to continue to Agent 2
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 1 Error:", error);
    throw new Error(
      `Brief creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility with existing workflow
export const BriefCreatorAgent = {
  name: "brief-creator",
  model: "o3-2025-04-16", // Default fallback model
  systemPrompt: "Loading from database...", // Will be loaded dynamically
  userPromptTemplate: "Loading from database...", // Will be loaded dynamically
  tools: ["output-parser"],
};

// Export the schema for use in other parts of the system
export { MarketingBriefOutputSchema };
export type MarketingBriefOutput = z.infer<typeof MarketingBriefOutputSchema>;
