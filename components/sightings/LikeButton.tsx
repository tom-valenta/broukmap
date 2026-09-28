"use client";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function LikeButton({ id, userId, liked, count }: { id: string; userId: string | null; liked: boolean; count: number }) {
  const [pending, startTransition] = useTransition(); const [error, setError] = useState(""); const [currentLiked, setCurrentLiked] = useState(liked); const [currentCount, setCurrentCount] = useState(count); const router = useRouter();
  function toggle() { if (!userId || pending) return; const nextLiked = !currentLiked; setError(""); setCurrentLiked(nextLiked); setCurrentCount(value => Math.max(0, value + (nextLiked ? 1 : -1))); startTransition(async () => { try { const db = createClient(); const result = nextLiked ? await db.from("sighting_likes").insert({ sighting_id: id, user_id: userId }) : await db.from("sighting_likes").delete().eq("sighting_id", id).eq("user_id", userId); if (result.error && result.error.code !== "23505") throw result.error; router.refresh(); } catch { setCurrentLiked(!nextLiked); setCurrentCount(value => Math.max(0, value + (nextLiked ? -1 : 1))); setError("Lajk se nepodařilo uložit."); } }); }
  return <div><button aria-label={currentLiked ? "Odebrat lajk" : "Líbí se mi"} title={currentLiked ? "Odebrat lajk" : "Líbí se mi"} aria-pressed={currentLiked} disabled={pending || !userId} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-hover)] disabled:opacity-50 ${currentLiked ? "text-[var(--danger)]" : ""}`} onClick={toggle}><Heart className={`size-4 ${currentLiked ? "fill-current" : ""}`} aria-hidden="true" /><span>{currentCount}</span></button>{error && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error}</p>}</div>;
}
