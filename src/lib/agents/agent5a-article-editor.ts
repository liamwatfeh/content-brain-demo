// Agent 5a: Article Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit article drafts using Economist style guide

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  ArticleOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedArticleOutputSchema } from "../schemas/types";
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

// Create output parser for edited articles
const editedArticleOutputParser = StructuredOutputParser.fromZodSchema(
  EditedArticleOutputSchema
);

export async function articleEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("✏️ Agent 5a: Starting article editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for article editing");
    }

    if (!state.articleOutput) {
      throw new Error("Article output is required for editing");
    }

    // Load agent configuration from database
    const agentConfig = await loadAgentConfig("agent5a");
    console.log("📋 Loaded agent5a configuration from database");

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

    const articleOutput = state.articleOutput as ArticleOutput;

    console.log(`✏️ Editing ${articleOutput.articles.length} article(s)...`);

    // Build user prompt using template from database
    const userPromptVariables = {
      executiveSummary: marketingBrief.executiveSummary || "Not provided",
      targetPersona: JSON.stringify(marketingBrief.targetPersona || {}),
      campaignObjectives: JSON.stringify(
        marketingBrief.campaignObjectives || []
      ),
      keyMessages: JSON.stringify(marketingBrief.keyMessages || []),
      callToAction: marketingBrief.callToAction || "Not specified",
      articlesToEdit: articleOutput.articles
        .map(
          (article, i) =>
            `ARTICLE ${i + 1}:\nHeadline: ${article.headline}\nSubheadline: ${article.subheadline}\nWord Count: ${article.word_count}\nBody: ${article.body}\nKey Takeaways: ${Array.isArray(article.key_takeaways) ? article.key_takeaways.join(" | ") : "Not specified"}\nCall to Action: ${article.call_to_action}`
        )
        .join("\n\n"),
      formatInstructions: editedArticleOutputParser.getFormatInstructions(),
    };

    // Create the article editing prompt using template
    const editingPrompt = fillTemplate(
      agentConfig.user_prompt_template,
      userPromptVariables
    );

    console.log("🎯 Using system prompt from database");
    console.log("📝 Using user prompt template from database");

    // Generate edited articles using Claude
    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: agentConfig.system_prompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("📝 Article editing completed, parsing output...");

    // Parse the edited article output
    const editedArticleOutput = await editedArticleOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5a: Edited ${editedArticleOutput.articles.length} article(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedArticleOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedArticleOutput.editing_notes}`);

    return {
      editedArticleOutput,
      currentStep: "articles_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5a Error:", error);
    throw new Error(
      `Article editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const ArticleEditorAgent = {
  name: "article-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional editor specializing in The Economist style guide. Review and edit article drafts to improve them.

Focus on:
- Grammar and spelling accuracy
- Clarity and readability
- Logical flow and structure
- Fact-checking consistency with the marketing brief
- Tone and voice alignment
- Compelling headlines and subheadings
- Strong opening and closing
- Call-to-action effectiveness

Provide the edited version with clear improvements while maintaining the original intent and key messages.`,

  userPromptTemplate: `Marketing brief: {marketing_brief}
Article draft: {article_draft}`,

  tools: ["output-parser"],
};

export type ArticleEditorAgentType = typeof ArticleEditorAgent;
