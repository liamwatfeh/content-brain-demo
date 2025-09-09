"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon as DocumentTextSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  EyeIcon as EyeSolidIcon,
} from "@heroicons/react/20/solid";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

interface ContentItem {
  id: string;
  content_type: "article" | "linkedin_post" | "social_post";
  title: string;
  content: string;
  metadata: any;
  created_at: string;
}

interface CampaignDetail {
  id: string;
  campaign_name: string;
  whitepaper_id: string;
  brief_data: any;
  selected_theme: any;
  generated_content: any;
  is_saved: boolean;
  created_at: string;
  whitepaper_title?: string;
  whitepaper_filename?: string;
  whitepaper_file_url?: string;
  content_items: ContentItem[];
}

type TabType = "overview" | "articles" | "linkedin" | "social";

// Animated Number Component
function AnimatedNumber({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(easeOutQuart * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// Enhanced Summary Card Component
function SummaryCard({
  type,
  count,
  icon: Icon,
  color,
  onClick,
  isActive,
}: {
  type: string;
  count: number;
  icon: any;
  color: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${
          isActive
            ? `${color} border-current shadow-lg ring-2 ring-current ring-opacity-20`
            : "bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
        }
      `}
      aria-label={`View ${count} ${type.toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon
          className={`h-6 w-6 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
        />
        <motion.div
          className={`text-3xl font-bold ${isActive ? "text-white" : "text-gray-900"}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <AnimatedNumber value={count} />
        </motion.div>
      </div>
      <div
        className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-600"}`}
      >
        {type}
      </div>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent to-black/10"
        />
      )}
    </motion.button>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: any;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 rounded-t-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="h-6 w-6 text-gray-400" />}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Action Button Component
function ActionButton({
  onClick,
  icon: Icon,
  label,
  variant = "secondary",
  disabled = false,
  tooltip,
}: {
  onClick: () => void;
  icon: any;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  tooltip: string;
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border-blue-600",
    secondary:
      "bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 border-gray-300",
    danger:
      "bg-white text-red-700 hover:bg-red-50 focus:ring-red-500 border-red-300",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2.5 border text-sm font-semibold rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md
        ${variants[variant]}
      `}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </motion.button>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/content-generations/${campaignId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Campaign not found");
          }
          throw new Error(`Failed to fetch campaign: ${response.statusText}`);
        }

        const data: CampaignDetail = await response.json();
        setCampaign(data);
      } catch (err) {
        console.error("Fetch campaign error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch campaign"
        );
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  // Handle copy to clipboard
  const handleCopy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(label);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle delete campaign
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`/api/content-generations/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete campaign");
      }

      // Navigate back to history
      router.push("/history");
    } catch (err) {
      console.error("Delete campaign error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  };

  // Handle duplicate campaign
  const handleDuplicate = () => {
    if (!campaign) return;
    // TODO: Implement duplication logic
    alert("Duplicate functionality coming soon!");
  };

  // Handle share campaign
  const handleShare = async () => {
    try {
      const shareData = {
        title: campaign?.campaign_name,
        text: `Check out this content campaign: ${campaign?.campaign_name}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedContent("URL");
        setTimeout(() => setCopiedContent(null), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get content by type
  const getContentByType = (type: string) => {
    if (!campaign?.generated_content) return [];

    switch (type) {
      case "articles":
        return campaign.generated_content.article?.articles || [];
      case "linkedin":
        return campaign.generated_content.linkedin_posts?.posts || [];
      case "social":
        return campaign.generated_content.social_posts?.posts || [];
      default:
        return [];
    }
  };

  // Get content counts
  const getContentCounts = () => {
    if (!campaign?.generated_content)
      return { articles: 0, linkedin: 0, social: 0 };

    return {
      articles: campaign.generated_content.article?.articles?.length || 0,
      linkedin: campaign.generated_content.linkedin_posts?.posts?.length || 0,
      social: campaign.generated_content.social_posts?.posts?.length || 0,
    };
  };

  const counts = getContentCounts();

  const tabConfig = [
    {
      id: "overview",
      name: "Overview",
      icon: EyeSolidIcon,
      count: null,
    },
    {
      id: "articles",
      name: "Articles",
      icon: DocumentTextSolidIcon,
      count: counts.articles,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: UserGroupSolidIcon,
      count: counts.linkedin,
    },
    {
      id: "social",
      name: "Social",
      icon: ChatBubbleLeftRightSolidIcon,
      count: counts.social,
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <Sidebar />
        <div
          className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? "lg:ml-20" : "lg:ml-80"
          }`}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">
                Loading campaign details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="h-screen flex overflow-hidden bg-gray-50">
        <Sidebar />
        <div
          className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? "lg:ml-20" : "lg:ml-80"
          }`}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Campaign Not Found
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {error || "The requested campaign could not be found."}
              </p>
              <ActionButton
                onClick={() => router.push("/history")}
                icon={ArrowLeftIcon}
                label="Back to History"
                variant="primary"
                tooltip="Return to campaign history"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />

      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Enhanced Breadcrumb/Back Button */}
            <nav className="mb-8" aria-label="Breadcrumb">
              <motion.button
                whileHover={{ x: -2 }}
                onClick={() => router.push("/history")}
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Content Kits
              </motion.button>
            </nav>

            {/* Enhanced Header */}
            <div className="mb-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  {/* Prominent Campaign Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4"
                  >
                    {campaign.campaign_name}
                  </motion.h1>

                  {/* Meta Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center text-gray-600">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-lg font-medium">
                        {campaign.whitepaper_title}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-base">
                        {formatDate(campaign.created_at)}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Right-aligned Action Bar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-3"
                >
                  <ActionButton
                    onClick={handleShare}
                    icon={ShareIcon}
                    label="Share"
                    variant="secondary"
                    tooltip="Share this campaign"
                  />
                  <ActionButton
                    onClick={handleDuplicate}
                    icon={DocumentDuplicateIcon}
                    label="Duplicate"
                    variant="secondary"
                    tooltip="Create a copy of this campaign"
                  />
                  <ActionButton
                    onClick={handleDelete}
                    icon={TrashIcon}
                    label={deleting ? "Deleting..." : "Delete"}
                    variant="danger"
                    disabled={deleting}
                    tooltip="Delete this campaign permanently"
                  />
                </motion.div>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`
                        group inline-flex items-center px-6 py-4 border-b-3 font-semibold text-base
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg
                        ${
                          isActive
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                      />
                      {tab.name}
                      {tab.count !== null && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                          }`}
                        >
                          {tab.count}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {activeTab === "overview" && (
                  <>
                    {/* Enhanced Campaign Summary Cards */}
                    <section aria-labelledby="summary-heading">
                      <h2
                        id="summary-heading"
                        className="text-2xl font-bold text-gray-900 mb-6"
                      >
                        Campaign Summary
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard
                          type="Articles"
                          count={counts.articles}
                          icon={DocumentTextSolidIcon}
                          color="bg-emerald-600"
                          onClick={() => setActiveTab("articles")}
                          isActive={false}
                        />
                        <SummaryCard
                          type="LinkedIn Posts"
                          count={counts.linkedin}
                          icon={UserGroupSolidIcon}
                          color="bg-blue-600"
                          onClick={() => setActiveTab("linkedin")}
                          isActive={false}
                        />
                        <SummaryCard
                          type="Social Posts"
                          count={counts.social}
                          icon={ChatBubbleLeftRightSolidIcon}
                          color="bg-purple-600"
                          onClick={() => setActiveTab("social")}
                          isActive={false}
                        />
                      </div>
                    </section>

                    {/* Enhanced Brief Details */}
                    {campaign.brief_data && (
                      <CollapsibleSection
                        title="Brief Details"
                        icon={DocumentTextIcon}
                        defaultExpanded={true}
                      >
                        <div className="space-y-8 mt-6">
                          {campaign.brief_data.businessContext && (
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-3">
                                Business Context
                              </h3>
                              <p className="text-gray-700 leading-relaxed text-base">
                                {campaign.brief_data.businessContext}
                              </p>
                            </div>
                          )}

                          {campaign.brief_data.targetAudience && (
                            <>
                              <hr className="border-gray-200" />
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                  Target Audience
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-base">
                                  {campaign.brief_data.targetAudience}
                                </p>
                              </div>
                            </>
                          )}

                          {campaign.brief_data.marketingGoals && (
                            <>
                              <hr className="border-gray-200" />
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                  Marketing Goals
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-base">
                                  {campaign.brief_data.marketingGoals}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Enhanced Selected Theme */}
                    {campaign.selected_theme && (
                      <section aria-labelledby="theme-heading">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 shadow-sm">
                          <div className="flex items-start space-x-4">
                            <div className="bg-blue-100 rounded-lg p-3">
                              <LightBulbIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h2
                                  id="theme-heading"
                                  className="text-xl font-bold text-gray-900"
                                >
                                  Selected Theme
                                </h2>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  Content Framework
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                {campaign.selected_theme.title}
                              </h3>
                              <p className="text-gray-700 leading-relaxed text-base mb-4">
                                {campaign.selected_theme.description}
                              </p>
                              {campaign.selected_theme.detailedDescription && (
                                <p className="text-gray-600 leading-relaxed">
                                  {campaign.selected_theme.detailedDescription}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}
                  </>
                )}

                {/* Enhanced Articles Tab */}
                {activeTab === "articles" && (
                  <section aria-labelledby="articles-heading">
                    <h2
                      id="articles-heading"
                      className="text-2xl font-bold text-gray-900 mb-6"
                    >
                      Generated Articles ({counts.articles})
                    </h2>
                    <div className="space-y-6">
                      {getContentByType("articles").map(
                        (article: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-start justify-between p-6 border-b border-gray-100">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                {article.headline ||
                                  article.title ||
                                  `Article ${index + 1}`}
                              </h3>
                              <ActionButton
                                onClick={() =>
                                  handleCopy(
                                    article.body || article.content,
                                    `article-${index}`
                                  )
                                }
                                icon={
                                  copiedContent === `article-${index}`
                                    ? CheckIcon
                                    : ClipboardDocumentIcon
                                }
                                label={
                                  copiedContent === `article-${index}`
                                    ? "Copied!"
                                    : "Copy"
                                }
                                variant="secondary"
                                tooltip="Copy article content to clipboard"
                              />
                            </div>
                            <div className="p-6">
                              <div className="prose prose-lg max-w-none">
                                {(article.body || article.content)
                                  ?.split("\n")
                                  .map((paragraph: string, pIndex: number) => (
                                    <p
                                      key={pIndex}
                                      className="mb-4 text-gray-700 leading-relaxed"
                                    >
                                      {paragraph}
                                    </p>
                                  ))}
                              </div>
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Enhanced LinkedIn Tab */}
                {activeTab === "linkedin" && (
                  <section aria-labelledby="linkedin-heading">
                    <h2
                      id="linkedin-heading"
                      className="text-2xl font-bold text-gray-900 mb-6"
                    >
                      LinkedIn Posts ({counts.linkedin})
                    </h2>
                    <div className="space-y-6">
                      {getContentByType("linkedin").map(
                        (post: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-start justify-between p-6 border-b border-gray-100">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                {post.hook || `LinkedIn Post ${index + 1}`}
                              </h3>
                              <ActionButton
                                onClick={() =>
                                  handleCopy(
                                    post.body || post.content,
                                    `linkedin-${index}`
                                  )
                                }
                                icon={
                                  copiedContent === `linkedin-${index}`
                                    ? CheckIcon
                                    : ClipboardDocumentIcon
                                }
                                label={
                                  copiedContent === `linkedin-${index}`
                                    ? "Copied!"
                                    : "Copy"
                                }
                                variant="secondary"
                                tooltip="Copy LinkedIn post to clipboard"
                              />
                            </div>
                            <div className="p-6">
                              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                                {post.body || post.content}
                              </div>
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Enhanced Social Tab */}
                {activeTab === "social" && (
                  <section aria-labelledby="social-heading">
                    <h2
                      id="social-heading"
                      className="text-2xl font-bold text-gray-900 mb-6"
                    >
                      Social Media Posts ({counts.social})
                    </h2>
                    <div className="space-y-6">
                      {getContentByType("social").map(
                        (post: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-start justify-between p-6 border-b border-gray-100">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                {post.platform
                                  ? `${post.platform} Post`
                                  : `Social Post ${index + 1}`}
                              </h3>
                              <ActionButton
                                onClick={() =>
                                  handleCopy(post.content, `social-${index}`)
                                }
                                icon={
                                  copiedContent === `social-${index}`
                                    ? CheckIcon
                                    : ClipboardDocumentIcon
                                }
                                label={
                                  copiedContent === `social-${index}`
                                    ? "Copied!"
                                    : "Copy"
                                }
                                variant="secondary"
                                tooltip="Copy social media post to clipboard"
                              />
                            </div>
                            <div className="p-6">
                              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                                {post.content}
                              </div>
                              {post.hashtags && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="text-blue-600 font-medium">
                                    {post.hashtags}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Copy success notification */}
            <AnimatePresence>
              {copiedContent === "URL" && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg border border-green-700"
                >
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="h-5 w-5" />
                    <span className="font-medium">
                      URL copied to clipboard!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
