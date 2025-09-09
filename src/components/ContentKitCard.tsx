"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  EyeIcon,
  CalendarDaysIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon as DocumentTextSolidIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/20/solid";

interface ContentKitCardProps {
  id: string;
  campaignName: string;
  whitepaperTitle: string;
  whitepaperFilename: string;
  createdAt: string;
  contentTypes: string[];
  contentSummary?: string;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
  // Selection props
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

// Enhanced content type badge component with icons
function ContentTypeBadges({ types }: { types: string[] }) {
  const getBadgeConfig = (type: string) => {
    const baseStyles =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-200 hover:shadow-md";

    switch (type.toLowerCase()) {
      case "articles":
        return {
          className: `${baseStyles} bg-emerald-600 text-white border-emerald-700`,
          icon: <DocumentTextSolidIcon className="h-3.5 w-3.5 mr-1.5" />,
          label: "Articles",
          ariaLabel: "Articles content type",
        };
      case "linkedin":
        return {
          className: `${baseStyles} bg-blue-600 text-white border-blue-700`,
          icon: <UserGroupIcon className="h-3.5 w-3.5 mr-1.5" />,
          label: "LinkedIn",
          ariaLabel: "LinkedIn posts content type",
        };
      case "social":
        return {
          className: `${baseStyles} bg-purple-600 text-white border-purple-700`,
          icon: <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 mr-1.5" />,
          label: "Social",
          ariaLabel: "Social media posts content type",
        };
      default:
        return {
          className: `${baseStyles} bg-gray-600 text-white border-gray-700`,
          icon: <DocumentTextIcon className="h-3.5 w-3.5 mr-1.5" />,
          label: type,
          ariaLabel: `${type} content type`,
        };
    }
  };

  if (types.length === 0) {
    return (
      <div className="flex justify-start">
        <span
          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300"
          aria-label="No content generated"
        >
          No content
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-start">
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

// Enhanced date display component
function DateDisplay({ dateString }: { dateString: string }) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const getRelativeTime = () => {
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <div className="flex items-center text-sm text-gray-600">
      <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-500" />
      <time
        dateTime={dateString}
        title={`Created on ${date.toLocaleDateString()}`}
        className="font-medium"
      >
        {getRelativeTime()}
      </time>
    </div>
  );
}

// Custom styled checkbox component
function CustomCheckbox({
  checked,
  onChange,
  campaignName,
}: {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  campaignName: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e as unknown as React.MouseEvent);
  };

  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        onClick={onChange}
        className="sr-only"
        aria-label={`Select ${campaignName}`}
      />
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onChange}
        className={`
          w-5 h-5 rounded-md border-2 cursor-pointer transition-all duration-200 flex items-center justify-center
          ${
            checked
              ? "bg-blue-600 border-blue-600 shadow-sm"
              : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm"
          }
        `}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChange(e as any);
          }
        }}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <CheckIcon className="h-3 w-3 text-white stroke-2" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Prominent action button component
function ViewDetailsButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm
        ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        }
      `}
      aria-label="View campaign details"
    >
      <EyeIcon className="h-4 w-4 mr-2" />
      View Details
    </motion.button>
  );
}

export default function ContentKitCard({
  id,
  campaignName,
  whitepaperTitle,
  whitepaperFilename,
  createdAt,
  contentTypes,
  contentSummary,
  onView,
  onDelete,
  className = "",
  isSelectable = false,
  isSelected = false,
  onSelect,
}: ContentKitCardProps) {
  const handleView = () => {
    onView(id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleCardClick = () => {
    if (isSelectable && onSelect) {
      onSelect(id);
    } else {
      handleView();
    }
  };

  // Generate content breakdown text
  const generateContentBreakdown = () => {
    const parts: string[] = [];

    // Count content from contentSummary or infer from contentTypes
    if (contentSummary && contentSummary !== "No content generated") {
      return contentSummary;
    }

    // Fallback: generate basic breakdown from types
    contentTypes.forEach((type) => {
      switch (type.toLowerCase()) {
        case "articles":
          parts.push("1 article");
          break;
        case "linkedin":
          parts.push("4 LinkedIn posts");
          break;
        case "social":
          parts.push("8 social posts");
          break;
      }
    });

    return parts.length > 0 ? parts.join(", ") : "No content generated";
  };

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative cursor-pointer overflow-hidden transition-all duration-300
        bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-xl shadow-sm hover:shadow-lg
        ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 border-blue-300"
            : ""
        } 
        ${className}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Content kit: ${campaignName}`}
    >
      {/* Increased padding for better spacing */}
      <div className="p-8">
        {/* Top section: Checkbox */}
        {isSelectable && (
          <div className="mb-6">
            <CustomCheckbox
              checked={isSelected}
              onChange={handleSelect}
              campaignName={campaignName}
            />
          </div>
        )}

        {/* Campaign Title - Visually Dominant */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">
            {campaignName}
          </h3>
        </div>

        {/* Meta Information Group - Smaller, Lighter Font */}
        <div className="mb-6 space-y-2">
          {/* Document Source */}
          <div className="flex items-start text-sm text-gray-600">
            <DocumentTextIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-500" />
            <div className="min-w-0 flex-1">
              <p
                className="font-medium text-gray-700 truncate"
                title={whitepaperTitle}
              >
                {whitepaperTitle}
              </p>
              <p
                className="text-xs text-gray-500 truncate mt-0.5"
                title={whitepaperFilename}
              >
                {whitepaperFilename}
              </p>
            </div>
          </div>

          {/* Creation Date */}
          <div className="ml-6">
            <DateDisplay dateString={createdAt} />
          </div>
        </div>

        {/* Content Breakdown - Single Line */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 font-medium">
            {generateContentBreakdown()}
          </p>
        </div>

        {/* Content Type Badges - Horizontal Row */}
        <div className="mb-8">
          <ContentTypeBadges types={contentTypes} />
        </div>

        {/* Horizontal Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Actions Section */}
        <div className="flex items-center justify-end">
          <ViewDetailsButton onClick={handleView} />
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[28px] border-l-transparent border-t-[28px] border-t-blue-500">
          <div className="absolute -top-7 -right-1 text-white text-sm">
            <CheckIcon className="h-4 w-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
