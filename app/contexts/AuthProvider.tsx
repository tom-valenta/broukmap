"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type ProfileRole = "user" | "moderator" | "admin";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  has_set_username: boolean;
  role: ProfileRole;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isModeratorOrAdmin: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: ReactNode;
  initialUser: User | null;
  initialProfile: Profile | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const currentUserId = useRef(initialUser?.id ?? null);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, has_set_username, role")
      .eq("id", userId)
      .single();
    if (currentUserId.current === userId) setProfile(data ?? null);
  }, []);

  // Slouží k ručnímu obnovení profilu po mutaci (např. po completeProfile)
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchProfile(user.id);
    setLoading(false);
  }, [user, fetchProfile]);

  // Sleduje změny přihlášení (login/logout v jiné tabu, token refresh, ...)
  useEffect(() => {
    const supabase = createClient();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // The callback runs inside Supabase's auth lock. Awaiting a database
        // request here can deadlock every map query waiting for the same session.
        const userId = session?.user.id ?? null;
        const changedUser = currentUserId.current !== userId;
        currentUserId.current = userId;
        setUser(session?.user ?? null);
        if (changedUser || !userId) setProfile(null);
        if (!userId && timer) clearTimeout(timer);
        if (userId && (changedUser || event === "USER_UPDATED" || (event === "INITIAL_SESSION" && !initialProfile))) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => { void fetchProfile(userId); }, 0);
        }
      }
    );
    return () => { if (timer) clearTimeout(timer); listener.subscription.unsubscribe(); };

  }, [fetchProfile, initialProfile]);

const isAdmin = useMemo(() => profile?.role === "admin", [profile]);
const isModeratorOrAdmin = useMemo(
  () => profile?.role === "admin" || profile?.role === "moderator",
  [profile]
);

return (
  <AuthContext.Provider
    value={{ user, profile, loading, isAdmin, isModeratorOrAdmin, refreshProfile }}
  >
    {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musí být použit uvnitř <AuthProvider>");
  return ctx;
}