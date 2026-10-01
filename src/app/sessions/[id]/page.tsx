import React from "react";
import { notFound } from "next/navigation";
import { fetchSessionByIdOrSlug } from "@/lib/db";
import { PhotobookViewer } from "@/components/detail/PhotobookViewer";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await fetchSessionByIdOrSlug(id);
  if (!session) return { title: "출사를 찾을 수 없습니다" };

  return {
    title: `${session.title} — PHOTO ARCHIVE`,
    description: session.description || `${session.location} (${session.date}) 출사 사진집`,
    openGraph: {
      title: session.title,
      description: session.description,
      images: session.coverImageUrl ? [{ url: session.coverImageUrl }] : [],
    },
  };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await fetchSessionByIdOrSlug(id);

  if (!session) {
    notFound();
  }

  return <PhotobookViewer key={session.id} session={session} />;
}
