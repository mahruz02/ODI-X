import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { SystemRole } from "./questionnaire";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: SystemRole;
  organization_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: SystemRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (roles: SystemRole[]) => boolean;
  canManageOrg: (orgId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeSystemRole(role: unknown): SystemRole {
  if (role === "admin" || role === "super_admin") return "admin";
  return "hr";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check local session fallback first
    try {
      const savedLocal = localStorage.getItem("odix_local_session");
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed.user && parsed.profile) {
          setUser(parsed.user);
          setProfile(parsed.profile);
          setIsLoading(false);
        }
      }
    } catch {
      /* ignore storage errors */
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        // Only clear if no local fallback session exists
        if (!localStorage.getItem("odix_local_session")) {
          setProfile(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(user: User) {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as UserProfile);
      } else {
        const defaultRole: SystemRole = normalizeSystemRole(user.user_metadata?.role);
        const newProf: UserProfile = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Pengguna",
          role: defaultRole,
        };
        setProfile(newProf);
      }
    } catch {
      setProfile({
        id: user.id,
        email: user.email || "",
        name: user.email?.split("@")[0] || "Pengguna",
        role: "hr",
      });
    } finally {
      setIsLoading(false);
    }
  }


  async function signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        return { error: null };
      }

      if (error) return { error };
    } catch {
      return { error: new Error("Login gagal. Periksa koneksi atau konfigurasi Supabase.") };
    }

    return { error: new Error("Alamat email atau password tidak cocok.") };
  }

  async function signInWithOtp(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (!error) return { error: null };
    } catch {
      /* offline */
    }

    return { error: new Error("Gagal mengirim magic link. Periksa koneksi atau konfigurasi Supabase.") };
  }

  async function signUp(email: string, password: string, name: string, role: SystemRole = "hr") {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (!error && data.user) {
        await supabase.from("user_profiles").insert({
          id: data.user.id,
          email,
          name,
          role,
        });
        return { error: null };
      }
    } catch {
      /* offline fallback */
    }

    return { error: new Error("Pendaftaran gagal. Periksa koneksi atau konfigurasi Supabase.") };
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("odix_local_session");
    setProfile(null);
    setUser(null);
  }

  function hasRole(roles: SystemRole[]): boolean {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    return roles.includes(profile.role);
  }

  function canManageOrg(orgId: string): boolean {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    if (!profile.organization_id) return true;
    return profile.organization_id === orgId;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signInWithPassword,
        signInWithOtp,
        signUp,
        signOut,
        hasRole,
        canManageOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
