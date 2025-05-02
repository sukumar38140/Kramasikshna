import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(), // in days
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  name: text("name").notNull(),
  scheduledTime: text("scheduled_time"), // Format: "HH:MM"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskProgress = pgTable("task_progress", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'completed', 'no-action', 'partial'
  hoursSpent: integer("hours_spent"), // in minutes
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// User connections table for managing connections between users
export const userConnections = pgTable("user_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectedUserId: integer("connected_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table for sharing task progress notes with connected users
export const sharedNotes = pgTable("shared_notes", {
  id: serial("id").primaryKey(),
  taskProgressId: integer("task_progress_id").notNull().references(() => taskProgress.id),
  sharedByUserId: integer("shared_by_user_id").notNull().references(() => users.id),
  sharedWithUserId: integer("shared_with_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({ 
  id: true, 
  isCompleted: true, 
  endDate: true, 
  createdAt: true
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true
});

export const insertTaskProgressSchema = createInsertSchema(taskProgress).omit({ 
  id: true, 
  createdAt: true
});

export const insertBadgeSchema = createInsertSchema(badges).omit({ 
  id: true, 
  earnedAt: true
});

export const insertUserConnectionSchema = createInsertSchema(userConnections).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedNoteSchema = createInsertSchema(sharedNotes).omit({
  id: true,
  createdAt: true,
});

// Custom schemas for client-side validation
export const createChallengeSchema = z.object({
  name: z.string().min(3, "Challenge name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  duration: z.number().int().min(1, "Duration must be at least 1 day"),
  tasks: z.array(z.object({
    name: z.string().min(1, "Task name is required"),
    scheduledTime: z.string().optional(),
  })).min(1, "At least one task is required"),
  enableReminders: z.boolean().default(false),
});

export const logProgressSchema = z.object({
  taskId: z.number(),
  date: z.date(),
  status: z.enum(["completed", "no-action", "partial"]),
  hoursSpent: z.number().min(0).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

// User connection schemas
export const searchUsersSchema = z.object({
  query: z.string().min(1, "Search query is required").max(50),
});

export const connectionRequestSchema = z.object({
  connectedUserId: z.number().int().positive("User ID must be a positive number"),
});

export const updateConnectionSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "Status must be either 'accepted' or 'rejected'" }),
  }),
});

// Shared note schemas
export const shareNoteSchema = z.object({
  taskProgressId: z.number().int().positive("Task progress ID must be a positive number"),
  sharedWithUserId: z.number().int().positive("User ID must be a positive number"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskProgress = z.infer<typeof insertTaskProgressSchema>;
export type TaskProgress = typeof taskProgress.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;
export type UserConnection = typeof userConnections.$inferSelect;

export type InsertSharedNote = z.infer<typeof insertSharedNoteSchema>;
export type SharedNote = typeof sharedNotes.$inferSelect;

export type CreateChallenge = z.infer<typeof createChallengeSchema>;
export type LogProgress = z.infer<typeof logProgressSchema>;
