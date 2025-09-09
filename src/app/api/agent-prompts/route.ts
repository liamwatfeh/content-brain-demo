import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all agent prompts or a specific agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (agentId) {
      // Fetch specific agent
      const { data, error } = await supabase
        .from("agent_system_prompts")
        .select("*")
        .eq("agent_id", agentId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching agent prompt:", error);
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      return NextResponse.json(data);
    } else {
      // Fetch all agents
      const { data, error } = await supabase
        .from("agent_system_prompts")
        .select("*")
        .eq("is_active", true)
        .order("agent_id");

      if (error) {
        console.error("Error fetching agent prompts:", error);
        return NextResponse.json(
          { error: "Failed to fetch agents" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an agent's system prompt
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, system_prompt, user_prompt_template, model_name } = body;

    if (!agent_id || !system_prompt) {
      return NextResponse.json(
        { error: "Agent ID and system prompt are required" },
        { status: 400 }
      );
    }

    // First get current version
    const { data: currentData } = await supabase
      .from("agent_system_prompts")
      .select("version")
      .eq("agent_id", agent_id)
      .single();

    // Update the agent prompt
    const { data, error } = await supabase
      .from("agent_system_prompts")
      .update({
        system_prompt,
        user_prompt_template,
        model_name,
        version: (currentData?.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", agent_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating agent prompt:", error);
      return NextResponse.json(
        { error: "Failed to update agent prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent prompt updated successfully",
      data,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new agent prompt version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agent_id,
      agent_name,
      agent_description,
      model_name,
      system_prompt,
      user_prompt_template,
    } = body;

    if (!agent_id || !agent_name || !system_prompt) {
      return NextResponse.json(
        { error: "Agent ID, name, and system prompt are required" },
        { status: 400 }
      );
    }

    // Create new agent prompt
    const { data, error } = await supabase
      .from("agent_system_prompts")
      .insert({
        agent_id,
        agent_name,
        agent_description,
        model_name: model_name || "claude-sonnet-4-20250514",
        system_prompt,
        user_prompt_template,
        status: "active",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent prompt:", error);
      return NextResponse.json(
        { error: "Failed to create agent prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent prompt created successfully",
      data,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
