// Agent 5c: Social Media Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit social media post drafts

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  SocialOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedSocialOutputSchema } from "../schemas/types";
import { createClient } from "@supabase/supabase-js";

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

// Create output parser for edited social posts
const editedSocialOutputParser = StructuredOutputParser.fromZodSchema(
  EditedSocialOutputSchema
);

export async function socialEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("📱 Agent 5c: Starting social media post editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for social editing");
    }

    if (!state.socialOutput) {
      throw new Error("Social output is required for editing");
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent5c");
    console.log("📋 Loaded agent5c configuration from database");

    // Initialize Claude Sonnet 4 with config from database
    const llm = new ChatAnthropic({
      modelName: agentConfig.model_name,
      temperature: 0.3,
      maxTokens: 4000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

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

    const socialOutput = state.socialOutput as SocialOutput;

    console.log(
      `📱 Editing ${socialOutput.posts.length} social media post(s)...`
    );

    // Build user prompt using template from database
    const userPromptVariables = {
      executiveSummary: marketingBrief.executiveSummary || "Not provided",
      targetPersona: JSON.stringify(marketingBrief.targetPersona || {}),
      campaignObjectives: JSON.stringify(
        marketingBrief.campaignObjectives || []
      ),
      keyMessages: JSON.stringify(marketingBrief.keyMessages || []),
      callToAction: marketingBrief.callToAction || "Not specified",
      socialPostsToEdit: socialOutput.posts
        .map(
          (post, i) =>
            `SOCIAL POST ${i + 1}:\nPlatform: ${post.platform}\nContent: ${post.content}\nCharacter Count: ${post.character_count}\nVisual Suggestion: ${post.visual_suggestion || "Not specified"}\nConcept Used: ${post.concept_used}`
        )
        .join("\n\n"),
      formatInstructions: editedSocialOutputParser.getFormatInstructions(),
    };

    // Create the social editing prompt using template
    const editingPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Generate edited social posts using Claude
    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: agentConfig.system_prompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("📱 Social media editing completed, parsing output...");

    // Parse the edited social output
    const editedSocialOutput = await editedSocialOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5c: Edited ${editedSocialOutput.posts.length} social media post(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedSocialOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedSocialOutput.editing_notes}`);

    return {
      editedSocialOutput,
      currentStep: "social_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5c Error:", error);
    throw new Error(
      `Social media editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const SocialEditorAgent = {
  name: "social-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional social media editor who specializes in viral, engaging content. Review and edit social media post drafts to maximize engagement.

Focus on:
- Platform-specific optimization (Twitter/X, Facebook, Instagram)
- Character limits and formatting constraints
- Visual content suggestions
- Engagement hooks and call-to-actions
- Brand voice consistency
- Accessibility considerations
- Timing and posting strategy recommendations

Ensure each post maximizes engagement potential while staying true to the campaign theme.`,

  userPromptTemplate: `Marketing brief: {marketing_brief}
Social posts draft: {social_draft}`,

  tools: ["output-parser"],
};

export type SocialEditorAgentType = typeof SocialEditorAgent;
