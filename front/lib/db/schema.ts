import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

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
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
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
});
