import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const project = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id") // Link to user table
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  files: jsonb("files").$type<Record<string, string>>().notNull().default({}), // File Storage (JSONB for performance)
  sandboxId: text("sandbox_id"),
  previewUrl: text("preview_url"),
  version: integer("version").default(1),
  lastSavedAt: timestamp("last_saved_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  activeChatId: text("active_chat_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// projects version history
export const version = pgTable("version", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  // snapshot data
  files: jsonb("files").$type<Record<string, string>>().notNull(),
  dependencies: jsonb("dependencies")
    .$type<Record<string, string>>()
    .default({}),
  // version metadata
  version: integer("version").notNull(),
  message: text("message"), // Optional commit message
  changeType: text("change_type")
    .$type<"manual" | "auto" | "sync">()
    .default("manual"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// chat threads/conversations
export const chat = pgTable("chat", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id") // Link to project
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("New Chat"),
  messageCount: integer("message_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Individual messages within chats
export const message = pgTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chat_id") // Link to chat
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant" | "system">().notNull(),
  content: text("content").notNull(),
  sequence: integer("sequence").notNull(),
  metadata: jsonb("metadata").$type<{
    model?: string;
    generatedCode?: string;
    appliedFiles?: string[];
    status?: "pending" | "streaming" | "completed" | "failed";
    errorMessage?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add relations
export const userRelations = relations(user, ({ many }) => ({
  projects: many(project),
  sessions: many(session),
  accounts: many(account),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  versions: many(version),
  chats: many(chat),
  activeChat: one(chat, {
    fields: [project.activeChatId],
    references: [chat.id],
  }),
}));

export const versionRelations = relations(version, ({ one }) => ({
  project: one(project, {
    fields: [version.projectId],
    references: [project.id],
  }),
}));

// Chat relations
export const chatRelations = relations(chat, ({ one, many }) => ({
  project: one(project, {
    fields: [chat.projectId],
    references: [project.id],
  }),
  messages: many(message),
}));

// Message relations
export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
