import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JavaScriptLessonView } from "@/components/javascript-lesson-view";
import { getJavaScriptLesson, javascriptLessons } from "@/lib/curriculum";

type LessonPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return javascriptLessons.filter(({ slug }) => slug !== "variables-and-types").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getJavaScriptLesson(slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}

export default async function JavaScriptLessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = getJavaScriptLesson(slug);
  if (!lesson) notFound();
  return <JavaScriptLessonView lesson={lesson} />;
}
