"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ChevronLeftIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  EyeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/20/solid";
import Sidebar from "@/components/Sidebar";
import ContentKitCard from "@/components/ContentKitCard";
import { useSidebar } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ContentGeneration {
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
}

interface ApiResponse {
  campaigns: ContentGeneration[];
  total: number;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// Enhanced Content Type Badges for Table
function TableContentTypeBadges({ types }: { types: string[] }) {
  const getBadgeConfig = (type: string) => {
    const baseStyles =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200";

    switch (type.toLowerCase()) {
      case "articles":
        return {
          className: `${baseStyles} bg-emerald-600 text-white border-emerald-700`,
          icon: <DocumentTextSolidIcon className="h-3 w-3 mr-1" />,
          label: "Articles",
          ariaLabel: "Articles content type",
        };
      case "linkedin":
        return {
          className: `${baseStyles} bg-blue-600 text-white border-blue-700`,
          icon: <UserGroupIcon className="h-3 w-3 mr-1" />,
          label: "LinkedIn",
          ariaLabel: "LinkedIn posts content type",
        };
      case "social":
        return {
          className: `${baseStyles} bg-purple-600 text-white border-purple-700`,
          icon: <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />,
          label: "Social",
          ariaLabel: "Social media posts content type",
        };
      default:
        return {
          className: `${baseStyles} bg-gray-600 text-white border-gray-700`,
          icon: <DocumentTextIcon className="h-3 w-3 mr-1" />,
          label: type,
          ariaLabel: `${type} content type`,
        };
    }
  };

  if (types.length === 0) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300"
        aria-label="No content generated"
      >
        No content
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((type) => {
        const config = getBadgeConfig(type);
        return (
          <span
            key={type}
            className={config.className}
            title={config.ariaLabel}
            aria-label={config.ariaLabel}
          >
            {config.icon}
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

// Table Actions Menu Component
function TableActionsMenu({
  campaignId,
  onView,
  onDelete,
  isDeleting = false,
}: {
  campaignId: string;
  onView: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit campaign:", campaignId);
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log("Duplicate campaign:", campaignId);
    setShowMenu(false);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Primary View Action */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onView}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
        aria-label="View campaign details"
      >
        <EyeIcon className="h-4 w-4 mr-1" />
        View
      </motion.button>

      {/* Secondary Actions Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMenu(!showMenu)}
          className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          aria-label="More actions"
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </motion.button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            >
              <button
                onClick={handleEdit}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Campaign
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Duplicate
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                disabled={isDeleting}
                className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton for Table Rows
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-8 py-6">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-8 py-6">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-8 py-6">
        <div className="flex justify-end space-x-2">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </td>
    </tr>
  );
}

// Enhanced Table View Component
function EnhancedTableView({
  campaigns,
  selectedCampaigns,
  onSelectAll,
  onSelectCampaign,
  onViewCampaign,
  onDeleteCampaign,
  deleting,
  getContentTypes,
  generateContentSummary,
  loading,
}: {
  campaigns: ContentGeneration[];
  selectedCampaigns: Set<string>;
  onSelectAll: () => void;
  onSelectCampaign: (id: string) => void;
  onViewCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  deleting: string | null;
  getContentTypes: (campaign: ContentGeneration) => string[];
  generateContentSummary: (campaign: ContentGeneration) => string;
  loading: boolean;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Enhanced Sticky Header */}
          <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200">
            <tr>
              {/* Select All Checkbox */}
              <th scope="col" className="relative w-16 px-8 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-colors"
                  ref={(input) => {
                    if (input) {
                      input.indeterminate =
                        selectedCampaigns.size > 0 &&
                        selectedCampaigns.size < campaigns.length;
                    }
                  }}
                  checked={
                    campaigns.length > 0 &&
                    selectedCampaigns.size === campaigns.length
                  }
                  onChange={onSelectAll}
                  aria-label="Select all campaigns"
                />
              </th>

              {/* Campaign Column */}
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                Campaign
              </th>

              {/* Content Column */}
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                Content
              </th>

              {/* Source Column */}
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                Source
              </th>

              {/* Created Date Column */}
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                Created
              </th>

              {/* Actions Column */}
              <th
                scope="col"
                className="px-8 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {loading
              ? // Loading Skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              : campaigns.map((campaign) => (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
                    group transition-all duration-200 hover:bg-gray-50 focus-within:bg-gray-50
                    ${
                      selectedCampaigns.has(campaign.id)
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : ""
                    }
                    ${
                      deleting === campaign.id
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }
                  `}
                  >
                    {/* Checkbox */}
                    <td className="relative w-16 px-8 py-6">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-colors"
                        checked={selectedCampaigns.has(campaign.id)}
                        onChange={() => onSelectCampaign(campaign.id)}
                        aria-label={`Select ${campaign.campaign_name}`}
                      />
                    </td>

                    {/* Campaign Column - Bold name with summary */}
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="text-base font-bold text-gray-900 leading-tight">
                          {campaign.campaign_name}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {generateContentSummary(campaign)}
                        </div>
                      </div>
                    </td>

                    {/* Content Column - High-contrast badges */}
                    <td className="px-8 py-6">
                      <TableContentTypeBadges
                        types={getContentTypes(campaign)}
                      />
                    </td>

                    {/* Source Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-start space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900 leading-tight">
                            {campaign.whitepaper_title || "Unknown Whitepaper"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {campaign.whitepaper_filename}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Created Date Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">
                          {formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-8 py-6 text-right">
                      <TableActionsMenu
                        campaignId={campaign.id}
                        onView={() => onViewCampaign(campaign.id)}
                        onDelete={() => onDeleteCampaign(campaign.id)}
                        isDeleting={deleting === campaign.id}
                      />
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [campaigns, setCampaigns] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(
    new Set()
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filters, setFilters] = useState({
    contentTypes: [] as string[],
    dateRange: {
      start: "",
      end: "",
    },
  });

  // Toast management
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, type, message };
    setToasts((prev) => [...prev, toast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(
    async (search: string = "") => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: "50",
          offset: "0",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await fetch(`/api/content-generations?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        setCampaigns(data.campaigns);
        setTotal(data.total);
      } catch (err) {
        console.error("Fetch campaigns error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch campaigns"
        );
        setCampaigns([]);
        setTotal(0);
        addToast("error", "Failed to load campaigns. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  // Initial load
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCampaigns(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchCampaigns]);

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns.filter((campaign) => {
      // Content type filter
      if (filters.contentTypes.length > 0) {
        const contentTypes = getContentTypes(campaign);
        const hasMatchingType = filters.contentTypes.some((filter) =>
          contentTypes.some((type) =>
            type.toLowerCase().includes(filter.toLowerCase())
          )
        );
        if (!hasMatchingType) return false;
      }

      // Date range filter
      if (filters.dateRange.start) {
        const campaignDate = new Date(campaign.created_at);
        const startDate = new Date(filters.dateRange.start);
        if (campaignDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const campaignDate = new Date(campaign.created_at);
        const endDate = new Date(filters.dateRange.end);
        if (campaignDate > endDate) return false;
      }

      return true;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name":
          return a.campaign_name.localeCompare(b.campaign_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [campaigns, filters, sortBy]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedCampaigns.size === filteredCampaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(filteredCampaigns.map((c) => c.id)));
    }
  }, [selectedCampaigns.size, filteredCampaigns]);

  const handleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Navigation handlers
  const handleCreateNew = useCallback(() => {
    router.push("/generate-content");
  }, [router]);

  const handleViewCampaign = useCallback(
    (id: string) => {
      router.push(`/history/${id}`);
    },
    [router]
  );

  // Delete handlers
  const handleDeleteCampaign = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this campaign? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        setDeleting(id);
        const response = await fetch(`/api/content-generations/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete campaign");
        }

        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => prev - 1);
        setSelectedCampaigns((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        addToast("success", "Campaign deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        addToast("error", "Failed to delete campaign. Please try again.");
      } finally {
        setDeleting(null);
      }
    },
    [addToast]
  );

  const handleBulkDelete = useCallback(async () => {
    const selectedCount = selectedCampaigns.size;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedCount} campaign${selectedCount > 1 ? "s" : ""}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      const deletePromises = Array.from(selectedCampaigns).map((id) =>
        fetch(`/api/content-generations/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        setCampaigns((prev) =>
          prev.filter((c) => !selectedCampaigns.has(c.id))
        );
        setTotal((prev) => prev - successful);
        setSelectedCampaigns(new Set());
        addToast(
          "success",
          `Successfully deleted ${successful} campaign${successful > 1 ? "s" : ""}`
        );
      }

      if (failed > 0) {
        addToast(
          "error",
          `Failed to delete ${failed} campaign${failed > 1 ? "s" : ""}`
        );
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      addToast("error", "Failed to delete campaigns. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedCampaigns, addToast]);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      contentTypes: [],
      dateRange: { start: "", end: "" },
    });
  }, []);

  // Utility functions
  const getContentTypes = useCallback((campaign: ContentGeneration) => {
    const types: string[] = [];
    const content = campaign.generated_content;

    if (content?.article?.articles?.length > 0) types.push("Articles");
    if (content?.linkedin_posts?.posts?.length > 0) types.push("LinkedIn");
    if (content?.social_posts?.posts?.length > 0) types.push("Social");

    return types;
  }, []);

  const generateContentSummary = useCallback((campaign: ContentGeneration) => {
    const content = campaign.generated_content;
    const parts: string[] = [];

    if (content?.article?.articles?.length > 0) {
      parts.push(
        `${content.article.articles.length} article${content.article.articles.length > 1 ? "s" : ""}`
      );
    }
    if (content?.linkedin_posts?.posts?.length > 0) {
      parts.push(
        `${content.linkedin_posts.posts.length} LinkedIn post${content.linkedin_posts.posts.length > 1 ? "s" : ""}`
      );
    }
    if (content?.social_posts?.posts?.length > 0) {
      parts.push(
        `${content.social_posts.posts.length} social post${content.social_posts.posts.length > 1 ? "s" : ""}`
      );
    }

    return parts.join(", ") || "No content generated";
  }, []);

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />

      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className={`relative rounded-lg shadow-lg border px-4 py-3 max-w-sm ${
                  toast.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : toast.type === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {toast.type === "success" && (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    )}
                    {toast.type === "error" && (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="p-6 lg:p-8">
            {/* Enhanced Header with Breadcrumb */}
            <div className="mb-8">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Dashboard
                </button>
                <span>/</span>
                <span className="text-gray-900 font-medium">Content Kits</span>
              </nav>

              {/* Title and Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <ClockIcon className="h-9 w-9 text-blue-600" />
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                      Content Kits
                    </h1>
                  </div>
                  <p className="text-lg text-gray-600">
                    Manage your content generation campaigns and assets
                    {total > 0 && (
                      <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {total} {total === 1 ? "kit" : "kits"}
                      </span>
                    )}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Content Kit
                </motion.button>
              </div>
            </div>

            {/* Enhanced Search and Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search campaigns, whitepapers, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Alphabetical</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 text-sm font-medium border-l transition-colors ${
                        viewMode === "table"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "text-gray-700 hover:bg-gray-50 border-gray-300"
                      }`}
                    >
                      Table
                    </button>
                  </div>

                  {/* Filters Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      showFilters
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    disabled={loading}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.contentTypes.length > 0 ||
                      filters.dateRange.start ||
                      filters.dateRange.end) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {filters.contentTypes.length +
                          (filters.dateRange.start ? 1 : 0) +
                          (filters.dateRange.end ? 1 : 0)}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Content Type Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Content Types
                        </label>
                        <div className="space-y-3">
                          {["Articles", "LinkedIn Posts", "Social Posts"].map(
                            (type) => (
                              <label key={type} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.contentTypes.includes(type)}
                                  onChange={(e) => {
                                    const newTypes = e.target.checked
                                      ? [...filters.contentTypes, type]
                                      : filters.contentTypes.filter(
                                          (t) => t !== type
                                        );
                                    handleFilterChange({
                                      ...filters,
                                      contentTypes: newTypes,
                                    });
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm text-gray-700 font-medium">
                                  {type}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>

                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Date Range
                        </label>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              From
                            </label>
                            <input
                              type="date"
                              value={filters.dateRange.start}
                              onChange={(e) =>
                                handleFilterChange({
                                  ...filters,
                                  dateRange: {
                                    ...filters.dateRange,
                                    start: e.target.value,
                                  },
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              To
                            </label>
                            <input
                              type="date"
                              value={filters.dateRange.end}
                              onChange={(e) =>
                                handleFilterChange({
                                  ...filters,
                                  dateRange: {
                                    ...filters.dateRange,
                                    end: e.target.value,
                                  },
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Filter Actions */}
                      <div className="flex items-end">
                        <button
                          onClick={clearFilters}
                          disabled={
                            filters.contentTypes.length === 0 &&
                            !filters.dateRange.start &&
                            !filters.dateRange.end
                          }
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedCampaigns.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedCampaigns.size} campaign
                        {selectedCampaigns.size > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedCampaigns(new Set())}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                      >
                        Clear selection
                      </button>
                      <div className="h-4 border-l border-blue-300" />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                      >
                        {bulkDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete Selected
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Display */}
            {loading && filteredCampaigns.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">
                    Loading your content kits...
                  </p>
                </div>
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"
              >
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Unable to load content kits
                </h3>
                <p className="text-red-700 mb-6">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fetchCampaigns(searchQuery)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Try Again
                </motion.button>
              </motion.div>
            ) : filteredCampaigns.length === 0 && !loading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <SparklesIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {total === 0
                    ? "No content kits yet"
                    : "No kits match your search"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {total === 0
                    ? "Create your first content kit to get started with AI-powered content generation."
                    : "Try adjusting your search terms or filters to find what you're looking for."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {total === 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateNew}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all duration-200"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Kit
                    </motion.button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          clearFilters();
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Clear Search & Filters
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create New Kit
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign, index) => (
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
                      onView={handleViewCampaign}
                      onDelete={handleDeleteCampaign}
                      className={
                        deleting === campaign.id
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }
                      isSelectable={true}
                      isSelected={selectedCampaigns.has(campaign.id)}
                      onSelect={handleSelectCampaign}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Enhanced Table View */
              <EnhancedTableView
                campaigns={filteredCampaigns}
                selectedCampaigns={selectedCampaigns}
                onSelectAll={handleSelectAll}
                onSelectCampaign={handleSelectCampaign}
                onViewCampaign={handleViewCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                deleting={deleting}
                getContentTypes={getContentTypes}
                generateContentSummary={generateContentSummary}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
 