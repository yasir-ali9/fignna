"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Header from "./_components/header";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-bk-50 flex items-center justify-center">
        <div className="text-fg-60">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return (
      <div className="min-h-screen bg-bk-50 flex items-center justify-center">
        <div className="text-fg-60">Redirecting to sign in...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bk-50">
      {/* Header with session data */}
      <Header
        user={{
          ...session.user,
          image: session.user.image ?? undefined,
        }}
      />

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {/* Content will be added here */}
      </main>
    </div>
  );
}
