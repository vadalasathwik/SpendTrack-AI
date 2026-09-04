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
} from "../services/authService";
import { SpendTrackApi } from "../services/api";

interface UserContextType {
  user: UserProfile | null;
  workspace: WorkspaceMetadata | null;
  jwt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (onStepProgress?: (stepIndex: number) => void) => Promise<SignInResult | null>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<WorkspaceMetadata | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUserProfile());
  const [workspace, setWorkspace] = useState<WorkspaceMetadata | null>(getStoredWorkspace());
  const [jwt, setJwt] = useState<string | null>(getStoredJWT());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(getStoredUserProfile());
        setWorkspace(getStoredWorkspace());
        setJwt(getStoredJWT());
      } else {
        setUser(null);
        setWorkspace(null);
        setJwt(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (
    onStepProgress?: (stepIndex: number) => void
  ): Promise<SignInResult | null> => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(onStepProgress);

      if (result) {
        setUser(result.user);
        setWorkspace(result.workspace);
        setJwt(result.token);
      }

      return result;
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
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkspace = async (): Promise<WorkspaceMetadata | null> => {
    if (!jwt) return null;

    try {
      const status = await SpendTrackApi.checkWorkspaceStatus();

      if (status?.spreadsheetId) {
        const updated: WorkspaceMetadata = {
          spreadsheetId: status.spreadsheetId,
          driveFolderId:
            status.driveFolders?.receiptsFolderId ??
            workspace?.driveFolderId ??
            "",
          calendarId: workspace?.calendarId ?? "primary",
        };

        setWorkspace(updated);
        return updated;
      }
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
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};