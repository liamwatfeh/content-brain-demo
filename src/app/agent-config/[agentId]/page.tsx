"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

interface AgentPrompt {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_description: string;
  model_name: string;
  system_prompt: string;
  user_prompt_template: string;
  status: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AgentConfigDetail() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<AgentPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedUserPrompt, setEditedUserPrompt] = useState("");
  const [editedModel, setEditedModel] = useState("");

  // Fetch agent details
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/agent-prompts?agentId=${agentId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Agent not found");
          }
          throw new Error(`Failed to fetch agent: ${response.statusText}`);
        }

        const data: AgentPrompt = await response.json();
        setAgent(data);
        setEditedPrompt(data.system_prompt);
        setEditedUserPrompt(data.user_prompt_template || "");
        setEditedModel(data.model_name);
      } catch (err) {
        console.error("Fetch agent error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch agent");
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  // Handle save changes
  const handleSave = async () => {
    if (!agent) return;

    try {
      setSaving(true);

      const response = await fetch("/api/agent-prompts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agent.agent_id,
          system_prompt: editedPrompt,
          user_prompt_template: editedUserPrompt,
          model_name: editedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update agent");
      }

      const result = await response.json();
      setAgent(result.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      alert(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    if (!agent) return;
    setEditedPrompt(agent.system_prompt);
    setEditedUserPrompt(agent.user_prompt_template || "");
    setEditedModel(agent.model_name);
    setIsEditing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              <p className="text-gray-600">Loading agent configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Agent Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                {error || "The requested agent could not be found."}
              </p>
              <button
                onClick={() => router.push("/agent-config")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Agent Config
              </button>
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
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => router.push("/agent-config")}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Agent Config
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {agent.agent_name}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {agent.agent_description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CpuChipIcon className="h-4 w-4 mr-1" />
                      <span>{agent.model_name}</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Version {agent.version}</span>
                    </div>
                    <div className="flex items-center">
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      <span>Updated {formatDate(agent.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancel}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Prompts
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Development Mode Notice */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Development Mode
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changes to system prompts will affect the agent's behavior
                    in real-time. Test carefully before deploying to production
                    workflows.
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Sections */}
            <div className="space-y-6">
              {/* Model Configuration */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CpuChipIcon className="h-5 w-5 mr-2" />
                  Model Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </label>
                    {isEditing ? (
                      <select
                        value={editedModel}
                        onChange={(e) => setEditedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="claude-sonnet-4-20250514">
                          Claude Sonnet 4
                        </option>
                        <option value="o3-2025-04-16">GPT-o3</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{agent.model_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  System Prompt
                </h3>

                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Instructions
                    </label>
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter the system prompt for this agent..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This defines the agent's role, capabilities, and behavior.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-md p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                      {agent.system_prompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* User Prompt Template */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  User Prompt Template
                </h3>

                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Input Template
                    </label>
                    <textarea
                      value={editedUserPrompt}
                      onChange={(e) => setEditedUserPrompt(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter the user prompt template (use {variable} for placeholders)..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Template for user inputs. Use {"{variable}"} syntax for
                      dynamic values.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-md p-4">
                    {agent.user_prompt_template ? (
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                        {agent.user_prompt_template}
                      </pre>
                    ) : (
                      <p className="text-gray-500 italic">
                        No user prompt template defined
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
