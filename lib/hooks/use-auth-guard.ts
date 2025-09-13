"use client";

import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";

interface UseAuthGuardReturn {
  isAuthenticated: boolean;
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void) => void;
}

/**
 * Custom hook to guard actions behind authentication
 * Automatically shows auth modal for unauthenticated users
 */
export function useAuthGuard(): UseAuthGuardReturn {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Get current session status
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session && !isPending;

  // Open auth modal
  const openAuthModal = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  // Close auth modal and clear pending action
  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setPendingAction(null);
  }, []);

  // Require authentication before executing an action
  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        // User is authenticated, execute action immediately
        action();
      } else {
        // User is not authenticated, store action and show modal
        setPendingAction(() => action);
        setShowAuthModal(true);
      }
    },
    [isAuthenticated]
  );

  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    // Close modal
    setShowAuthModal(false);

    // Execute pending action if exists
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  return {
    isAuthenticated,
    showAuthModal,
    openAuthModal,
    closeAuthModal: closeAuthModal,
    requireAuth,
    // Internal method for handling auth success
    _handleAuthSuccess: handleAuthSuccess,
  } as UseAuthGuardReturn & { _handleAuthSuccess: () => void };
}
