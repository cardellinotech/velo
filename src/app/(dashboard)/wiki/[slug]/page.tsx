"use client";

import { use, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { ArrowLeft, Edit2, Trash2, Tag, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: queryKeys.wiki.detail(slug),
    queryFn: () => api.wiki.get(slug),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.wiki.delete(slug),
    onSuccess: () => {
      router.push("/wiki");
    },
  });

  const handleDelete = useCallback(() => {
    if (confirm(`"${page?.title}" wirklich löschen?`)) {
      deleteMutation.mutate();
    }
  }, [page?.title, deleteMutation]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Wiki
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/wiki/${slug}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Bearbeiten
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{page.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          {page.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          <span className="text-xs text-gray-400">
            Aktualisiert am {format(new Date(page.updatedAt), "dd. MMMM yyyy", { locale: de })}
          </span>
        </div>
      </div>

      {/* Markdown content */}
      {page.content ? (
        <div className="prose prose-sm prose-gray max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.content}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-gray-400 italic text-sm">Diese Seite hat noch keinen Inhalt.</p>
      )}
    </div>
  );
}
