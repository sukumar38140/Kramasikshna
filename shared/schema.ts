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

export type CreateChallenge = z.infer<typeof createChallengeSchema>;
export type LogProgress = z.infer<typeof logProgressSchema>;
