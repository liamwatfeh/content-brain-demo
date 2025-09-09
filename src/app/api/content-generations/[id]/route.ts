import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const { data: campaign, error } = await supabase
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
        ),
        content_items (
          id,
          content_type,
          title,
          content,
          metadata,
          created_at
        )
      `
      )
      .eq("id", id)
      .eq("is_saved", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include whitepaper details at the top level
    const transformedCampaign = {
      id: campaign.id,
      campaign_name: campaign.campaign_name,
      whitepaper_id: campaign.whitepaper_id,
      brief_data: campaign.brief_data,
      selected_theme: campaign.selected_theme,
      generated_content: campaign.generated_content,
      is_saved: campaign.is_saved,
      created_at: campaign.created_at,
      whitepaper_title: campaign.whitepapers?.title,
      whitepaper_filename: campaign.whitepapers?.filename,
      whitepaper_file_url: campaign.whitepapers?.file_url,
      content_items: campaign.content_items || [],
    };

    return NextResponse.json(transformedCampaign);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Delete the campaign (content_items will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from("content_generations")
      .delete()
      .eq("id", id)
      .eq("is_saved", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
