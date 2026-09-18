"use client";

import { useState, useTransition } from "react";

import { setInterviewBookmark } from "@/app/interview/actions";

export function BookmarkButton({ questionId, initialBookmarked, signedIn }: { questionId: string; initialBookmarked: boolean; signedIn: boolean }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      setMessage("Sign in to save questions.");
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    setMessage("");
    startTransition(async () => {
      const result = await setInterviewBookmark(questionId, next);
      if (!result.ok) setBookmarked(!next);
      setMessage(result.message);
    });
  }

  return <div className="bookmark-control"><button type="button" className={`bookmark-button ${bookmarked ? "saved" : ""}`} onClick={toggle} disabled={pending} aria-pressed={bookmarked}>{bookmarked ? "★ Saved" : "☆ Save"}</button>{message && <span role="status">{message}</span>}</div>;
}
