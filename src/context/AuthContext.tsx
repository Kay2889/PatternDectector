import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Profile, ADMIN_EMAIL } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, options?: { name?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string, options?: { name?: string }) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

interface AuthError extends Error {
  message: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || profile?.role === 'admin';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else {
        // Create profile if it doesn't exist
        const currentUser = user || (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          const isAdminUser = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          const phone = currentUser.phone || undefined;
          const newProfile = {
            id: userId,
            full_name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || (phone ? `User ${phone.slice(-4)}` : 'User'),
            phone: phone || null,
            role: isAdminUser ? 'admin' as const : 'user' as const,
          };
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select()
            .maybeSingle();
          if (createdProfile) {
            setProfile(createdProfile as Profile);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: { name?: string }) => {
    try {
      const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: options?.name || email.split('@')[0],
            role,
          },
        },
      });

      if (!error) {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from('profiles').upsert({
            id: newUser.id,
            full_name: options?.name || email.split('@')[0],
            role,
          });
        }
      }

      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            role: 'admin',
          }, { onConflict: 'id' });
        }
      }

      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app/dashboard',
        },
      });

      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signInWithPhone = async (phone: string, options?: { name?: string }) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
          data: options?.name ? { name: options.name } : undefined,
        },
      });

      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error as AuthError | null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value = {
    session,
    user,
    profile,
    isAdmin,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
