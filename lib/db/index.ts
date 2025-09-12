import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Export database schema tables
export { project, version, user, chat, message } from "./schema";

// Export query functions
export {
  projectQueries,
  versionQueries,
  projectUtils,
  chatQueries,
  messageQueries,
} from "./queries";

// Export validation schemas
export * from "./zod";

// Export types
export type * from "../types/project";
export type * from "../types/chat";
