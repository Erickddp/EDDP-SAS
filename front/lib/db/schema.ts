import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user"), // user, guest, admin
  professionalProfile: text("professional_profile"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  planType: text("plan_type").default("gratis"),
  status: text("status").default("active"),
  provider: text("provider").default("stripe"), // stripe, google, etc.
  providerSubscriptionId: text("provider_subscription_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  expertiseLevel: text("expertise_level").default('principiante'), // principiante, contador, empresario, abogado
  preferredTone: text("preferred_tone").default('explicativo'),   // directo, explicativo, académico
  industryContext: text("industry_context"),                       // RESICO, comercio, asalariado
  additionalContext: text("additional_context"),                   // Texto libre
  isProfileComplete: boolean("is_profile_complete").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
    id: text("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    mode: text("mode").notNull(), // casual, profesional
    detailLevel: text("detail_level").notNull(), // sencilla, detallada, tecnica
    archived: boolean("archived").default(false),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }),
    role: text("role").notNull(), // user, assistant, system
    content: jsonb("content").notNull(),
    sources: jsonb("sources"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
    return {
        conversationIdIndex: index("conversation_id_idx").on(table.conversationId),
    };
});

// Original Legal Schema Restoration
export const documents = pgTable("documents", {
    id: text("id").primaryKey(),
    documentName: text("document_name").notNull(),
    filename: text("filename").notNull(),
    abbreviation: text("abbreviation"),
    category: text("category"),
    source: text("source"),
    status: text("status").default("vigente"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id, { onDelete: 'cascade' }),
    articleNumber: text("article_number").notNull(),
    title: text("title"),
    text: text("text").notNull(),
    embedding: text("embedding"), // PostgreSQL vector stored via type casting in scripts
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
    return {
        documentIdIndex: index("idx_articles_document_id").on(table.documentId),
        articleNumberIndex: index("idx_articles_article_number").on(table.articleNumber),
    };
});

// SaaS Tracking Tables Restoration
export const usageLogs = pgTable("usage_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    ipAddress: text("ip_address"),
    conversationId: text("conversation_id").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    modelVersion: text("model_version"),
    executionTimeMs: integer("execution_time_ms"),
    status: text("status"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const userUsageCounters = pgTable("user_usage_counters", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    currentMonthCount: integer("current_month_count").default(0),
    lastResetDate: timestamp("last_reset_date").defaultNow(),
});

// Motor V2 - Memory Graph Persistence
export const userMemories = pgTable("user_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  factText: text("fact_text").notNull(),
  embedding: text("embedding"), // Store as text for now or vector
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => {
    return {
        userIdIndex: index("user_memories_user_id_idx").on(table.userId),
    };
});
