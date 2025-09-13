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
    <div className="min-h-screen flex items-center justify-center bg-bk-60 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-bk-40 rounded-lg p-6 border border-bd-50">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-medium text-fg-30 mb-2">
              Welcome to fignna.com
            </h1>
            <p className="text-fg-60 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Authentication Form */}
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
