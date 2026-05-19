"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Plus, Search, BookOpen, Tag, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { WikiPage } from "@/types";

export default function WikiPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: queryKeys.wiki.list({ tag: selectedTag ?? undefined, search: search || undefined }),
    queryFn: () => api.wiki.list({ tag: selectedTag ?? undefined, search: search || undefined }),
  });

  // Collect all unique tags from pages
  const allTags = Array.from(
    new Set((pages ?? []).flatMap((p) => p.tags))
  ).sort();

  function getExcerpt(content: string) {
    return content.replace(/[#*`>\[\]]/g, "").slice(0, 100).trim();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Wiki</h1>
        </div>
        <Link
          href="/wiki/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Seite
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Seiten durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedTag(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedTag === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Alle
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !pages || pages.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            {search || selectedTag
              ? "Keine Seiten gefunden."
              : "Noch keine Wiki-Seiten. Erstelle deine erste Seite!"}
          </p>
          {!search && !selectedTag && (
            <Link
              href="/wiki/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Erste Seite erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page: WikiPage) => (
            <div
              key={page.id}
              onClick={() => router.push(`/wiki/${page.slug}`)}
              className="group p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                    {page.title}
                  </h2>
                  {page.content && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {getExcerpt(page.content)}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {page.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400">
                      {format(new Date(page.updatedAt), "dd.MM.yyyy")}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 shrink-0 mt-1 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
