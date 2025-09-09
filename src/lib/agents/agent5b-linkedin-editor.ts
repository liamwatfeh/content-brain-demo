// Agent 5b: LinkedIn Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit LinkedIn post drafts

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  LinkedInOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedLinkedInOutputSchema } from "../schemas/types";
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

// Create output parser for edited LinkedIn posts
const editedLinkedInOutputParser = StructuredOutputParser.fromZodSchema(
  EditedLinkedInOutputSchema
);

export async function linkedinEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("💼 Agent 5b: Starting LinkedIn post editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for LinkedIn editing");
    }

    if (!state.linkedinOutput) {
      throw new Error("LinkedIn output is required for editing");
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent5b");
    console.log("📋 Loaded agent5b configuration from database");

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

    const linkedinOutput = state.linkedinOutput as LinkedInOutput;

    console.log(
      `💼 Editing ${linkedinOutput.posts.length} LinkedIn post(s)...`
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
      linkedinPostsToEdit: linkedinOutput.posts
        .map(
          (post, i) =>
            `LINKEDIN POST ${i + 1}:\nHook: ${post.hook}\nBody: ${post.body}\nCall to Action: ${post.call_to_action}\nCharacter Count: ${post.character_count}\nConcept Used: ${post.concept_used}`
        )
        .join("\n\n"),
      formatInstructions: editedLinkedInOutputParser.getFormatInstructions(),
    };

    // Create the LinkedIn editing prompt using template
    const editingPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Generate edited LinkedIn posts using Claude
    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: agentConfig.system_prompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("💼 LinkedIn editing completed, parsing output...");

    // Parse the edited LinkedIn output
    const editedLinkedInOutput = await editedLinkedInOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5b: Edited ${editedLinkedInOutput.posts.length} LinkedIn post(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedLinkedInOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedLinkedInOutput.editing_notes}`);

    return {
      editedLinkedInOutput,
      currentStep: "linkedin_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5b Error:", error);
    throw new Error(
      `LinkedIn editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const LinkedInEditorAgent = {
  name: "linkedin-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional LinkedIn content editor. Review and edit LinkedIn post drafts to maximize engagement and professional impact.

Focus on:
- LinkedIn best practices and algorithm optimization
- Professional tone while remaining engaging
- Character limits and formatting
- Call-to-action clarity and effectiveness
- Engagement potential
- Personal branding consistency
- Industry relevance

Ensure each post stands alone while contributing to the overall campaign narrative.`,

  userPromptTemplate: `Marketing brief: {marketing_brief}
LinkedIn posts draft: {linkedin_draft}`,

  tools: ["output-parser"],
};

export type LinkedInEditorAgentType = typeof LinkedInEditorAgent;
