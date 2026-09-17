import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "FrontendPrep — Learn, practice, interview", template: "%s · FrontendPrep" }, description: "Structured frontend learning, coding practice, and deadline-driven interview preparation." };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="en"><body>{children}</body></html>; }
