import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (Edge runtime safe)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignName,
      whitepaperId,
      briefData,
      selectedTheme,
      finalResults,
      createdAt,
    } = body;

    if (!campaignName || !whitepaperId || !briefData || !finalResults) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into content_generations
    const { data: generation, error: genError } = await supabase
      .from("content_generations")
      .insert([
        {
          campaign_name: campaignName,
          whitepaper_id: whitepaperId,
          brief_data: briefData,
          selected_theme: selectedTheme,
          generated_content: finalResults,
          is_saved: true,
          created_at: createdAt || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: genError?.message || "Failed to save campaign" },
        { status: 500 }
      );
    }

    // Insert content items (articles, linkedin, social)
    const items = [];
    if (finalResults.article?.articles) {
      for (const article of finalResults.article.articles) {
        items.push({
          content_generation_id: generation.id,
          content_type: "article",
          title: article.headline || article.title,
          content: article.body,
          metadata: article,
        });
      }
    }
    if (finalResults.linkedin_posts?.posts) {
      for (const post of finalResults.linkedin_posts.posts) {
        items.push({
          content_generation_id: generation.id,
          content_type: "linkedin_post",
          title: post.hook || "LinkedIn Post",
          content: post.body || post.content,
          metadata: post,
        });
      }
    }
    if (finalResults.social_posts?.posts) {
      for (const post of finalResults.social_posts.posts) {
        items.push({
          content_generation_id: generation.id,
          content_type: "social_post",
          title: post.platform || "Social Post",
          content: post.content,
          metadata: post,
        });
      }
    }
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("content_items")
        .insert(items);
      if (itemsError) {
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, id: generation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 