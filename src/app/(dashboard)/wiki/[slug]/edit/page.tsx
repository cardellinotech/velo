"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { ArrowLeft, Save, Tag, X } from "lucide-react";

export default function WikiEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: queryKeys.wiki.detail(slug),
    queryFn: () => api.wiki.get(slug),
  });

  // Pre-fill form once page loads
  useEffect(() => {
    if (page && !initialized) {
      setTitle(page.title);
      setContent(page.content);
      setTags(page.tags);
      setInitialized(true);
    }
  }, [page, initialized]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.wiki.update(slug, { title: title.trim(), content, tags }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wiki.list() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(slug) });
      router.push(`/wiki/${slug}`);
    },
  });

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    updateMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Seite nicht gefunden.</p>
        <Link href="/wiki" className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/wiki/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Seite
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/wiki/${slug}`}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
          <button
            onClick={handleSave}
            disabled={!title.trim() || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Seitentitel..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 text-2xl font-bold border-0 border-b border-gray-200 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Tag hinzufügen (Enter oder Komma)..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div>
          <textarea
            placeholder="Inhalt (Markdown unterstützt)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-y"
          />
        </div>

        {updateMutation.isError && (
          <p className="text-sm text-red-600">
            Fehler beim Speichern. Bitte versuche es erneut.
          </p>
        )}
      </div>
    </div>
  );
}
