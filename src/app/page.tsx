"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  CpuChipIcon,
  DocumentTextIcon,
  KeyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, openPasswordModal } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Already authenticated, go directly to dashboard
      router.push('/dashboard');
    } else {
      // Show password modal
      openPasswordModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7ff]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/bn-logo.png"
              alt="BrilliantNoise"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="font-bold text-xl text-gray-900">Content Brain</div>
          </div>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors focus-visible:focus"
          >
            Developer Start
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Transform White Papers into Complete Marketing Campaigns
            </h1>
            
            {/* BrilliantNoise Branding */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-lg text-gray-600 font-medium">Powered by</span>
              <Image
                src="/bn-blue.png"
                alt="BrilliantNoise"
                width={120}
                height={48}
                className="object-contain"
              />
            </div>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              AI-powered platform that converts your research documents into
              articles, LinkedIn posts, and social media content in minutes.
            </p>
            <div className="mt-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl focus-visible:focus"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Demo Information Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Content Brain Demo Platform
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                This demonstration showcases the complete Content Brain workflow for transforming 
                research documents into comprehensive marketing campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Explore the Dashboard
                </h3>
                <p className="text-gray-600">
                  Navigate through the main dashboard to see how Content Brain organizes 
                  your whitepapers, tracks content generation progress, and manages your 
                  marketing campaigns.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <CpuChipIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  AI Content Generation
                </h3>
                <p className="text-gray-600">
                  Experience the multi-agent AI workflow that analyzes your documents, 
                  generates marketing briefs, and creates targeted content for different 
                  platforms and audiences.
                </p>
              </div>
            </div>

            <div className="bg-[#f6f7ff] rounded-xl p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to Explore?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                The demo includes sample whitepapers, generated content examples, and 
                interactive workflows to help you understand how Content Brain can 
                streamline your marketing content creation process.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Access Demo Now
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src="/bn-logo.png"
                  alt="BrilliantNoise"
                  width={24}
                  height={24}
                  className="object-contain filter brightness-0 invert"
                />
                <div className="font-bold text-xl">Content Brain</div>
              </div>
              <p className="text-gray-400 text-sm">
                Transform white papers into marketing campaigns
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Powered by BrilliantNoise
              </p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400 text-sm">
            © 2024 Content Brain by BrilliantNoise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
