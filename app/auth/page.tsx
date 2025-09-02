import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AuthForm from "./_components/form";

// Server component to check authentication status
export default async function AuthPage() {
  // Get session from server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect if already authenticated
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bk-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-bk-40 rounded-lg shadow-lg p-8 border border-bd-50">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fg-70 mb-2">
              Welcome to fignna.com
            </h1>
            <p className="text-fg-60">Sign in to your account to continue</p>
          </div>

          {/* Authentication Form */}
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
