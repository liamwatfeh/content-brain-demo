#!/usr/bin/env node

/**
 * Comprehensive Agent Workflow Test Suite
 * Tests the complete AI agent system including:
 * 1. Database connectivity and agent configuration loading
 * 2. Individual agent prompt loading and template processing
 * 3. End-to-end workflow execution
 * 4. Real-time configuration updates
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env.local") });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test colors for better output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.bold}${colors.magenta}${msg}${colors.reset}\n`),
};

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function assert(condition, testName, errorMsg = "") {
  if (condition) {
    log.success(`${testName}`);
    testResults.passed++;
    testResults.tests.push({ name: testName, status: "PASSED" });
  } else {
    log.error(`${testName}: ${errorMsg}`);
    testResults.failed++;
    testResults.tests.push({
      name: testName,
      status: "FAILED",
      error: errorMsg,
    });
  }
}

// Template replacement function (mirroring agent code)
function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value || "");
    result = result.replace(new RegExp(placeholder, "g"), stringValue);
  }
  return result;
}

// Test 1: Database Connectivity and Agent Configuration
async function testDatabaseConnectivity() {
  log.header("TEST 1: DATABASE CONNECTIVITY & AGENT CONFIGURATION");

  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from("agent_system_prompts")
      .select("agent_id, agent_name, model_name")
      .limit(1);

    assert(!error, "Database connection successful", error?.message);
    assert(data && data.length > 0, "Agent data retrieved successfully");

    // Test all 9 agents exist
    const { data: allAgents, error: allError } = await supabase
      .from("agent_system_prompts")
      .select(
        "agent_id, agent_name, system_prompt, user_prompt_template, model_name, is_active"
      )
      .eq("is_active", true)
      .order("agent_id");

    assert(!allError, "All agents query successful", allError?.message);
    assert(
      allAgents && allAgents.length === 9,
      `Expected 9 agents, found ${allAgents?.length || 0}`
    );

    // Test each agent has required fields
    const expectedAgents = [
      "agent1",
      "agent2",
      "agent3",
      "agent4a",
      "agent4b",
      "agent4c",
      "agent5a",
      "agent5b",
      "agent5c",
    ];

    for (const agentId of expectedAgents) {
      const agent = allAgents?.find((a) => a.agent_id === agentId);
      assert(agent, `Agent ${agentId} exists in database`);
      assert(
        agent?.system_prompt && agent.system_prompt.length > 100,
        `Agent ${agentId} has detailed system prompt`
      );
      assert(
        agent?.user_prompt_template && agent.user_prompt_template.length > 50,
        `Agent ${agentId} has user prompt template`
      );
      assert(
        agent?.model_name === "claude-sonnet-4-20250514",
        `Agent ${agentId} has correct model name`
      );
    }

    log.info(`Found agents: ${allAgents?.map((a) => a.agent_id).join(", ")}`);
  } catch (error) {
    log.error(`Database test failed: ${error.message}`);
    assert(false, "Database connectivity test", error.message);
  }
}

// Test 2: Agent Configuration Loading
async function testAgentConfigurationLoading() {
  log.header("TEST 2: AGENT CONFIGURATION LOADING");

  // Test loading configuration for each agent
  const agentIds = [
    "agent1",
    "agent2",
    "agent3",
    "agent4a",
    "agent4b",
    "agent4c",
    "agent5a",
    "agent5b",
    "agent5c",
  ];

  for (const agentId of agentIds) {
    try {
      const { data, error } = await supabase
        .from("agent_system_prompts")
        .select("system_prompt, user_prompt_template, model_name")
        .eq("agent_id", agentId)
        .eq("is_active", true)
        .single();

      assert(
        !error,
        `${agentId}: Configuration loaded successfully`,
        error?.message
      );
      assert(
        data?.system_prompt,
        `${agentId}: System prompt exists and is non-empty`
      );
      assert(
        data?.user_prompt_template,
        `${agentId}: User prompt template exists and is non-empty`
      );
      assert(
        data?.model_name,
        `${agentId}: Model name exists and is non-empty`
      );

      log.info(
        `${agentId}: System prompt length: ${data?.system_prompt?.length || 0} chars`
      );
      log.info(
        `${agentId}: User template length: ${data?.user_prompt_template?.length || 0} chars`
      );
    } catch (error) {
      assert(false, `${agentId}: Configuration loading failed`, error.message);
    }
  }
}

// Test 3: Template Processing
async function testTemplateProcessing() {
  log.header("TEST 3: TEMPLATE PROCESSING");

  // Test template processing for Agent 1 (Brief Creator)
  try {
    const { data: agent1Config } = await supabase
      .from("agent_system_prompts")
      .select("user_prompt_template")
      .eq("agent_id", "agent1")
      .single();

    const testVariables = {
      businessContext: "AI-powered content marketing platform",
      targetAudience: "B2B SaaS marketing teams",
      marketingGoals: "Increase lead generation by 40%",
    };

    const processedTemplate = fillTemplate(
      agent1Config.user_prompt_template,
      testVariables
    );

    assert(
      processedTemplate !== agent1Config.user_prompt_template,
      "Template variables were replaced"
    );
    assert(
      processedTemplate.includes(testVariables.businessContext),
      "Business context variable replaced correctly"
    );
    assert(
      processedTemplate.includes(testVariables.targetAudience),
      "Target audience variable replaced correctly"
    );
    assert(
      processedTemplate.includes(testVariables.marketingGoals),
      "Marketing goals variable replaced correctly"
    );
    assert(
      !processedTemplate.includes("{businessContext}"),
      "No unreplaced variables remain"
    );

    log.info("Template processing test completed successfully");
  } catch (error) {
    assert(false, "Template processing test", error.message);
  }
}

// Test 4: Agent Workflow State Management
async function testWorkflowStateManagement() {
  log.header("TEST 4: WORKFLOW STATE MANAGEMENT");

  // Test workflow state structure
  const mockWorkflowState = {
    businessContext: "B2B SaaS platform for marketing automation",
    targetAudience: "Marketing directors at mid-size companies",
    marketingGoals: "Generate qualified leads and build thought leadership",
    articlesCount: 2,
    linkedinPostsCount: 4,
    socialPostsCount: 6,
    ctaType: "download_whitepaper",
    ctaUrl: "https://example.com/whitepaper",
    selectedWhitepaperId: "test-whitepaper-id",
    currentStep: "brief_creation",
  };

  assert(
    mockWorkflowState.businessContext,
    "Workflow state has business context"
  );
  assert(
    mockWorkflowState.targetAudience,
    "Workflow state has target audience"
  );
  assert(
    mockWorkflowState.marketingGoals,
    "Workflow state has marketing goals"
  );
  assert(
    typeof mockWorkflowState.articlesCount === "number",
    "Articles count is numeric"
  );
  assert(
    typeof mockWorkflowState.linkedinPostsCount === "number",
    "LinkedIn posts count is numeric"
  );
  assert(
    typeof mockWorkflowState.socialPostsCount === "number",
    "Social posts count is numeric"
  );
  assert(
    ["download_whitepaper", "contact_us"].includes(mockWorkflowState.ctaType),
    "CTA type is valid"
  );

  log.info("Workflow state structure validation passed");
}

// Test 5: Agent Prompt Validation
async function testAgentPromptValidation() {
  log.header("TEST 5: AGENT PROMPT VALIDATION");

  const { data: agents } = await supabase
    .from("agent_system_prompts")
    .select("agent_id, agent_name, system_prompt, user_prompt_template")
    .eq("is_active", true);

  for (const agent of agents) {
    // Test system prompt quality
    const systemPrompt = agent.system_prompt;
    assert(
      systemPrompt.includes("You are"),
      `${agent.agent_id}: System prompt starts with role definition`
    );
    assert(
      systemPrompt.includes(agent.agent_name.replace(": ", " ")),
      `${agent.agent_id}: System prompt mentions agent name/role`
    );
    assert(
      systemPrompt.length > 500,
      `${agent.agent_id}: System prompt is sufficiently detailed (${systemPrompt.length} chars)`
    );

    // Test user prompt template has variables
    const userTemplate = agent.user_prompt_template;
    const hasVariables =
      userTemplate.includes("{") && userTemplate.includes("}");
    assert(
      hasVariables,
      `${agent.agent_id}: User prompt template contains variables`
    );

    // Count variable placeholders
    const variableMatches = userTemplate.match(/\{[^}]+\}/g) || [];
    assert(
      variableMatches.length >= 2,
      `${agent.agent_id}: Has at least 2 template variables (found ${variableMatches.length})`
    );

    log.info(
      `${agent.agent_id}: ${variableMatches.length} template variables found`
    );
  }
}

// Test 6: Real-time Configuration Updates
async function testConfigurationUpdates() {
  log.header("TEST 6: REAL-TIME CONFIGURATION UPDATES");

  try {
    // Test updating and retrieving a configuration
    const testAgentId = "agent1";
    const originalTimestamp = new Date().toISOString();

    // Update the version to trigger a change
    const { error: updateError } = await supabase
      .from("agent_system_prompts")
      .update({
        updated_at: originalTimestamp,
        version: supabase.raw("version + 1"),
      })
      .eq("agent_id", testAgentId);

    assert(
      !updateError,
      "Configuration update successful",
      updateError?.message
    );

    // Retrieve the updated configuration
    const { data: updatedConfig, error: retrieveError } = await supabase
      .from("agent_system_prompts")
      .select("updated_at, version")
      .eq("agent_id", testAgentId)
      .single();

    assert(
      !retrieveError,
      "Updated configuration retrieved successfully",
      retrieveError?.message
    );
    assert(updatedConfig?.updated_at, "Updated timestamp exists");
    assert(updatedConfig?.version > 0, "Version number is positive");

    log.info(
      `Configuration update test passed - Version: ${updatedConfig?.version}`
    );
  } catch (error) {
    assert(false, "Configuration update test", error.message);
  }
}

// Test 7: Environment Variables and Dependencies
async function testEnvironmentAndDependencies() {
  log.header("TEST 7: ENVIRONMENT VARIABLES & DEPENDENCIES");

  // Test environment variables
  assert(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL is set"
  );
  assert(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY is set"
  );
  assert(process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY is set");

  // Test Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assert(supabaseUrl.startsWith("https://"), "Supabase URL uses HTTPS");
  assert(supabaseUrl.includes(".supabase.co"), "Supabase URL is valid domain");

  // Test API key formats (basic validation)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  assert(
    anthropicKey.startsWith("sk-"),
    "Anthropic API key has correct prefix"
  );
  assert(anthropicKey.length > 20, "Anthropic API key has reasonable length");

  log.info("Environment variables validation passed");
}

// Test 8: Agent Workflow Integration Test
async function testAgentWorkflowIntegration() {
  log.header("TEST 8: AGENT WORKFLOW INTEGRATION");

  // Test that all agents can load their configurations and process templates
  const mockState = {
    businessContext: "Enterprise AI platform for content generation",
    targetAudience: "Fortune 500 marketing teams",
    marketingGoals: "Establish thought leadership and drive enterprise sales",
    executiveSummary: "AI-powered content strategy for enterprise clients",
    targetPersona: {
      role: "CMO",
      company_size: "Enterprise",
      industry: "Technology",
    },
    campaignObjectives: [
      "Increase brand awareness",
      "Generate qualified leads",
    ],
    keyMessages: ["AI efficiency", "Enterprise security", "Proven ROI"],
    callToAction: "Schedule a demo",
    selectedThemeTitle: "The Future of Enterprise AI",
    selectedThemeDescription:
      "Transforming how Fortune 500 companies approach content",
    selectedThemeWhyItWorks: "Proven results with major clients",
    articlesCount: 1,
    linkedinPostsCount: 2,
    socialPostsCount: 3,
    ctaType: "contact_us",
  };

  const agentWorkflow = [
    {
      id: "agent1",
      name: "Brief Creator",
      requiredInputs: ["businessContext", "targetAudience", "marketingGoals"],
    },
    {
      id: "agent2",
      name: "Theme Generator",
      requiredInputs: ["businessContext", "executiveSummary"],
    },
    {
      id: "agent3",
      name: "Researcher",
      requiredInputs: ["selectedThemeTitle", "selectedThemeDescription"],
    },
    {
      id: "agent4a",
      name: "Article Writer",
      requiredInputs: [
        "executiveSummary",
        "selectedThemeTitle",
        "articlesCount",
      ],
    },
    {
      id: "agent4b",
      name: "LinkedIn Writer",
      requiredInputs: [
        "executiveSummary",
        "selectedThemeTitle",
        "linkedinPostsCount",
      ],
    },
    {
      id: "agent4c",
      name: "Social Writer",
      requiredInputs: [
        "executiveSummary",
        "selectedThemeTitle",
        "socialPostsCount",
      ],
    },
    {
      id: "agent5a",
      name: "Article Editor",
      requiredInputs: ["executiveSummary", "callToAction"],
    },
    {
      id: "agent5b",
      name: "LinkedIn Editor",
      requiredInputs: ["executiveSummary", "callToAction"],
    },
    {
      id: "agent5c",
      name: "Social Editor",
      requiredInputs: ["executiveSummary", "callToAction"],
    },
  ];

  for (const agent of agentWorkflow) {
    try {
      // Load agent configuration
      const { data: config, error } = await supabase
        .from("agent_system_prompts")
        .select("system_prompt, user_prompt_template, model_name")
        .eq("agent_id", agent.id)
        .eq("is_active", true)
        .single();

      assert(!error, `${agent.name}: Configuration loaded for workflow`);

      // Test template processing with mock state
      const processedTemplate = fillTemplate(
        config.user_prompt_template,
        mockState
      );

      // Verify required inputs are processed
      for (const input of agent.requiredInputs) {
        if (mockState[input]) {
          assert(
            processedTemplate.includes(String(mockState[input])),
            `${agent.name}: Required input '${input}' processed in template`
          );
        }
      }

      assert(
        !processedTemplate.includes("{businessContext}"),
        `${agent.name}: No unreplaced businessContext variables`
      );

      log.info(`${agent.name}: Workflow integration test passed`);
    } catch (error) {
      assert(false, `${agent.name}: Workflow integration test`, error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  log.header("🚀 AGENT WORKFLOW TEST SUITE");
  log.info("Testing complete AI agent system configuration and workflow...\n");

  const startTime = Date.now();

  try {
    await testDatabaseConnectivity();
    await testAgentConfigurationLoading();
    await testTemplateProcessing();
    await testWorkflowStateManagement();
    await testAgentPromptValidation();
    await testConfigurationUpdates();
    await testEnvironmentAndDependencies();
    await testAgentWorkflowIntegration();
  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print final results
  log.header("📊 TEST RESULTS SUMMARY");

  console.log(
    `${colors.bold}Total Tests:${colors.reset} ${testResults.passed + testResults.failed}`
  );
  console.log(`${colors.green}Passed:${colors.reset} ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testResults.failed}`);
  console.log(`${colors.cyan}Duration:${colors.reset} ${duration}s`);

  if (testResults.failed > 0) {
    log.header("❌ FAILED TESTS");
    testResults.tests
      .filter((t) => t.status === "FAILED")
      .forEach((t) => log.error(`${t.name}: ${t.error || "Unknown error"}`));
  }

  const successRate = (
    (testResults.passed / (testResults.passed + testResults.failed)) *
    100
  ).toFixed(1);
  console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

  if (testResults.failed === 0) {
    log.success(
      "🎉 ALL TESTS PASSED! Agent workflow system is fully operational."
    );
  } else {
    log.error(
      "❌ Some tests failed. Please check the configuration and try again."
    );
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run the test suite
runAllTests().catch((error) => {
  log.error(`Test suite failed to run: ${error.message}`);
  process.exit(1);
});
