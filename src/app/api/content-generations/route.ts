import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define proper types for the response
type WhitepaperData = {
  id: string;
  title: string;
  filename: string;
  file_url: string;
};

type CampaignWithWhitepaper = {
  id: string;
  campaign_name: string;
  whitepaper_id: string;
  brief_data: unknown;
  selected_theme: unknown;
  generated_content: unknown;
  is_saved: boolean;
  created_at: string;
  whitepapers: WhitepaperData | WhitepaperData[] | null;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";

    let query = supabase
      .from("content_generations")
      .select(
        `
        id,
        campaign_name,
        whitepaper_id,
        brief_data,
        selected_theme,
        generated_content,
        is_saved,
        created_at,
        whitepapers (
          id,
          title,
          filename,
          file_url
        )
      `
      )
      .eq("is_saved", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.or(
        `campaign_name.ilike.%${search}%,whitepapers.title.ilike.%${search}%`
      );
    }

    const { data: campaigns, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include whitepaper details at the top level
    const transformedCampaigns =
      (campaigns as CampaignWithWhitepaper[])?.map((campaign) => {
        // Handle whitepapers as single object or array (Supabase join behavior)
        const whitepaper = Array.isArray(campaign.whitepapers)
          ? campaign.whitepapers[0]
          : campaign.whitepapers;

        return {
          id: campaign.id,
          campaign_name: campaign.campaign_name,
          whitepaper_id: campaign.whitepaper_id,
          brief_data: campaign.brief_data,
          selected_theme: campaign.selected_theme,
          generated_content: campaign.generated_content,
          is_saved: campaign.is_saved,
          created_at: campaign.created_at,
          whitepaper_title: whitepaper?.title,
          whitepaper_filename: whitepaper?.filename,
          whitepaper_file_url: whitepaper?.file_url,
        };
      }) || [];

    return NextResponse.json({
      campaigns: transformedCampaigns,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
