import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  UserProfile,
  WorkspaceMetadata,
  SignInResult,
  getStoredJWT,
  getStoredUserProfile,
  getStoredWorkspace,
  signInWithGoogle,
  signOutApp,
  onAuthStateChange,
  refreshAccessToken,
  handleOAuthHashCallback,
} from "../services/authService";
import { SpendTrackApi } from "../services/api";

export interface UserContextType {
  user: UserProfile | null;
  workspace: WorkspaceMetadata | null;
  jwt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<WorkspaceMetadata | null>;
}

const defaultContext: UserContextType = {
  user: null,
  workspace: null,
  jwt: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshWorkspace: async () => null,
};

export const UserContext = createContext<UserContextType>(defaultContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUserProfile());
  const [workspace, setWorkspace] = useState<WorkspaceMetadata | null>(() => getStoredWorkspace());
  const [jwt, setJwt] = useState<string | null>(() => getStoredJWT());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Check if OAuth callback hash present (#access_token=...)
        const oauthUser = await handleOAuthHashCallback();
        if (oauthUser && isMounted) {
          setUser(oauthUser);
          setJwt(getStoredJWT());
          setIsLoading(false);
          return;
        }

        // 2. Otherwise perform silent refresh via HTTP-only cookie
        const token = await refreshAccessToken();
        if (token && isMounted) {
          setUser(getStoredUserProfile());
          setJwt(token);
        } else if (isMounted) {
          setUser(null);
          setJwt(null);
        }
      } catch (err) {
        console.warn("Auth initialization notice:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChange((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser);
        setJwt(getStoredJWT());
        setWorkspace(getStoredWorkspace());
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await signOutApp();
      setUser(null);
      setWorkspace(null);
      setJwt(null);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkspace = async (): Promise<WorkspaceMetadata | null> => {
    if (!jwt) return null;
    try {
      await SpendTrackApi.checkWorkspaceStatus();
    } catch (err) {
      console.warn("Refresh workspace failed:", err);
    }
    return workspace;
  };

  const value: UserContextType = {
    user,
    workspace,
    jwt,
    isAuthenticated: Boolean(user && jwt),
    isLoading,
    signIn,
    signOut,
    refreshWorkspace,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    console.warn("useUser used outside UserProvider, returning fallback context.");
    return defaultContext;
  }
  return context;
}

export default UserProvider;