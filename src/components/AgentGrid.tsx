"use client";

import { useState, useEffect } from "react";
import AgentCard from "./AgentCard";

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
}

export default function AgentGrid() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/agent-prompts");

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform data to match AgentCard interface
        const transformedAgents = data.map((agent: any) => ({
          id: agent.agent_id,
          name: agent.agent_name,
          description: agent.agent_description,
          model: agent.model_name,
          status: agent.status,
        }));

        setAgents(transformedAgents);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch agents");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Content Generation Workflow
          </h3>
          <p className="text-sm text-gray-600">
            Loading agent configurations...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Content Generation Workflow
          </h3>
          <p className="text-sm text-red-600">Error loading agents: {error}</p>
        </div>

        <div className="text-center py-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Content Generation Workflow
        </h3>
        <p className="text-sm text-gray-600">
          Agents are executed in chronological order. Click any agent to
          configure its system prompt and view its inputs/outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} stepNumber={index + 1} />
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Development Mode
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              You can modify system prompts in real-time to test and refine
              agent behavior. Changes are saved to the database and will persist
              across sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
