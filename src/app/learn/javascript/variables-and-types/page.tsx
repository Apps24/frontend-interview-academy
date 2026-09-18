import type { Metadata } from "next";

import { JavaScriptLessonView } from "@/components/javascript-lesson-view";
import { variablesLesson } from "@/lib/curriculum";

export const metadata: Metadata = { title: variablesLesson.title, description: variablesLesson.summary };

export default function VariablesAndTypesLessonPage() {
  return <JavaScriptLessonView lesson={variablesLesson} />;
}
