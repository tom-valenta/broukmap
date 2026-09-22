"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, has_set_username, role")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

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