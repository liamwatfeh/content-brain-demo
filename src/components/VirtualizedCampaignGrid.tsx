"use client";

import { useMemo, useCallback } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { motion } from "framer-motion";
import ContentKitCard from "./ContentKitCard";

interface Campaign {
  id: string;
  campaign_name: string;
  whitepaper_title?: string;
  whitepaper_filename?: string;
  created_at: string;
  generated_content: any;
  brief_data: any;
}

interface VirtualizedCampaignGridProps {
  campaigns: Campaign[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedCampaigns?: Set<string>;
  deleting?: string | null;
  getContentTypes: (campaign: Campaign) => string[];
  generateContentSummary: (campaign: Campaign) => string;
  containerHeight?: number;
  containerWidth?: number;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    campaigns: Campaign[];
    columnsPerRow: number;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect?: (id: string) => void;
    selectedCampaigns?: Set<string>;
    deleting?: string | null;
    getContentTypes: (campaign: Campaign) => string[];
    generateContentSummary: (campaign: Campaign) => string;
  };
}

const Cell = ({ columnIndex, rowIndex, style, data }: CellProps) => {
  const {
    campaigns,
    columnsPerRow,
    onView,
    onDelete,
    onSelect,
    selectedCampaigns,
    deleting,
    getContentTypes,
    generateContentSummary,
  } = data;

  const campaignIndex = rowIndex * columnsPerRow + columnIndex;
  const campaign = campaigns[campaignIndex];

  if (!campaign) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: campaignIndex * 0.05 }}
      >
        <ContentKitCard
          id={campaign.id}
          campaignName={campaign.campaign_name}
          whitepaperTitle={campaign.whitepaper_title || "Unknown Whitepaper"}
          whitepaperFilename={campaign.whitepaper_filename || ""}
          createdAt={campaign.created_at}
          contentTypes={getContentTypes(campaign)}
          contentSummary={generateContentSummary(campaign)}
          onView={onView}
          onDelete={onDelete}
          className={
            deleting === campaign.id ? "opacity-50 pointer-events-none" : ""
          }
          isSelectable={
            selectedCampaigns
              ? selectedCampaigns.size > 0 || campaigns.length > 1
              : false
          }
          isSelected={
            selectedCampaigns ? selectedCampaigns.has(campaign.id) : false
          }
          onSelect={onSelect}
        />
      </motion.div>
    </div>
  );
};

export default function VirtualizedCampaignGrid({
  campaigns,
  onView,
  onDelete,
  onSelect,
  selectedCampaigns,
  deleting,
  getContentTypes,
  generateContentSummary,
  containerHeight = 600,
  containerWidth = 1200,
}: VirtualizedCampaignGridProps) {
  // Calculate columns based on container width
  const columnsPerRow = useMemo(() => {
    if (containerWidth >= 1280) return 3; // xl
    if (containerWidth >= 768) return 2; // md
    return 1; // default
  }, [containerWidth]);

  const rowCount = Math.ceil(campaigns.length / columnsPerRow);
  const columnCount = columnsPerRow;

  const itemData = useMemo(
    () => ({
      campaigns,
      columnsPerRow,
      onView,
      onDelete,
      onSelect,
      selectedCampaigns,
      deleting,
      getContentTypes,
      generateContentSummary,
    }),
    [
      campaigns,
      columnsPerRow,
      onView,
      onDelete,
      onSelect,
      selectedCampaigns,
      deleting,
      getContentTypes,
      generateContentSummary,
    ]
  );

  // Don't use virtualization for small lists (< 50 items)
  if (campaigns.length < 50) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <ContentKitCard
              id={campaign.id}
              campaignName={campaign.campaign_name}
              whitepaperTitle={
                campaign.whitepaper_title || "Unknown Whitepaper"
              }
              whitepaperFilename={campaign.whitepaper_filename || ""}
              createdAt={campaign.created_at}
              contentTypes={getContentTypes(campaign)}
              contentSummary={generateContentSummary(campaign)}
              onView={onView}
              onDelete={onDelete}
              className={
                deleting === campaign.id ? "opacity-50 pointer-events-none" : ""
              }
              isSelectable={
                selectedCampaigns
                  ? selectedCampaigns.size > 0 || campaigns.length > 1
                  : false
              }
              isSelected={
                selectedCampaigns ? selectedCampaigns.has(campaign.id) : false
              }
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={containerWidth / columnsPerRow}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={320} // Approximate height of a campaign card
        width={containerWidth}
        itemData={itemData}
      >
        {Cell}
      </Grid>
    </div>
  );
}
