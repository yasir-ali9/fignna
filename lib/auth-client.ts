import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // since we are on same domain, so we don't need base url of server.
  // baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
