import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertChallengeSchema, 
  insertTaskSchema, 
  insertTaskProgressSchema, 
  logProgressSchema,
  searchUsersSchema, 
  connectionRequestSchema,
  updateConnectionSchema,
  shareNoteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challenges = await storage.getChallengesByUserId(req.user.id);
    res.json(challenges);
  });

  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate challenge data
      const validatedData = insertChallengeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Create challenge
      const challenge = await storage.createChallenge(validatedData);
      
      // Create tasks
      if (req.body.tasks && Array.isArray(req.body.tasks)) {
        for (const task of req.body.tasks) {
          const validatedTask = insertTaskSchema.parse({
            ...task,
            challengeId: challenge.id
          });
          await storage.createTask(validatedTask);
        }
      }
      
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    const challenge = await storage.getChallenge(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    
    if (challenge.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const tasks = await storage.getTasksByChallengeId(challengeId);
    res.json({ ...challenge, tasks });
  });

  // Task routes
  app.get("/api/challenges/:challengeId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.challengeId);
    const challenge = await storage.getChallenge(challengeId);
    
    if (!challenge || challenge.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const tasks = await storage.getTasksByChallengeId(challengeId);
    res.json(tasks);
  });

  // Task progress routes
  app.post("/api/tasks/:taskId/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const challenge = await storage.getChallenge(task.challengeId);
      
      if (!challenge || challenge.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Validate progress data
      const validatedData = insertTaskProgressSchema.parse({
        ...req.body,
        taskId
      });
      
      const progress = await storage.logTaskProgress(validatedData);
      
      // Check if we need to award badges
      await checkAndAwardBadges(req.user.id, task.challengeId);
      
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to log progress" });
    }
  });

  app.get("/api/tasks/:taskId/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = parseInt(req.params.taskId);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const challenge = await storage.getChallenge(task.challengeId);
    
    if (!challenge || challenge.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const progress = await storage.getTaskProgressByTaskId(taskId);
    res.json(progress);
  });

  // User activity
  app.get("/api/user/activity", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const activity = await storage.getUserActivity(req.user.id);
    res.json(activity);
  });

  // User badges
  app.get("/api/user/badges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const badges = await storage.getUserBadges(req.user.id);
    res.json(badges);
  });

  // Stats
  app.get("/api/user/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const stats = await storage.getUserStats(req.user.id);
    res.json(stats);
  });

  // Share profile (public)
  app.get("/api/share/:userId/:challengeId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge || challenge.userId !== userId) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      const tasks = await storage.getTasksByChallengeId(challengeId);
      const progress = await Promise.all(
        tasks.map(async (task) => {
          const taskProgress = await storage.getTaskProgressByTaskId(task.id);
          return { task, progress: taskProgress };
        })
      );
      
      // Return sanitized user data (no password)
      const { password, ...safeUser } = user;
      
      res.json({
        user: safeUser,
        challenge,
        progress
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared profile" });
    }
  });

  // Helper function for badge awarding
  async function checkAndAwardBadges(userId: number, challengeId: number) {
    // Get all the user's task progress for this challenge
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) return;
    
    const tasks = await storage.getTasksByChallengeId(challengeId);
    
    // Calculate streak
    const startDate = new Date(challenge.startDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Award streak badges
    if (daysDiff >= 7) {
      await storage.createBadgeIfNotExists({
        userId,
        challengeId,
        name: "7-Day Streak",
        description: "Completed 7 consecutive days of tasks"
      });
    }
    
    if (daysDiff >= 21) {
      await storage.createBadgeIfNotExists({
        userId,
        challengeId,
        name: "21-Day Streak",
        description: "Completed 21 consecutive days of tasks - habit formed!"
      });
    }
    
    if (daysDiff >= 30) {
      await storage.createBadgeIfNotExists({
        userId,
        challengeId,
        name: "30-Day Milestone",
        description: "Completed a full month of tasks"
      });
    }
    
    // Check if challenge is completed
    if (challenge.duration <= daysDiff + 1) {
      await storage.markChallengeCompleted(challengeId);
      
      await storage.createBadgeIfNotExists({
        userId,
        challengeId,
        name: "Challenge Completed",
        description: `Completed the ${challenge.name} challenge`
      });
    }
  }

  // User Connection Routes
  app.get("/api/user/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connections = await storage.getUserConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user connections" });
    }
  });
  
  app.get("/api/user/connected-users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connectedUsers = await storage.getConnectedUsers(req.user.id);
      res.json(connectedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connected users" });
    }
  });

  app.post("/api/user/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = searchUsersSchema.parse(req.body);
      const users = await storage.searchUsers(validatedData.query, req.user.id);
      res.json(users);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/user/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = connectionRequestSchema.parse(req.body);
      
      // Check if connection already exists
      const existingConnection = await storage.getUserConnectionByIds(
        req.user.id,
        validatedData.connectedUserId
      );
      
      if (existingConnection) {
        return res.status(400).json({ message: "Connection already exists" });
      }
      
      // Check if target user exists
      const targetUser = await storage.getUser(validatedData.connectedUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create connection
      const connection = await storage.createUserConnection({
        userId: req.user.id,
        connectedUserId: validatedData.connectedUserId,
        status: 'pending'
      });
      
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.patch("/api/user/connections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connectionId = parseInt(req.params.id);
      const validatedData = updateConnectionSchema.parse(req.body);
      
      // Get the connection to check if the user is the recipient
      const connection = await storage.getUserConnections(req.user.id)
        .then(connections => connections.find(conn => conn.id === connectionId));
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      // Ensure the current user is the recipient (can update the connection)
      if (connection.connectedUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this connection" });
      }
      
      // Update connection status
      const updatedConnection = await storage.updateUserConnectionStatus(
        connectionId,
        validatedData.status
      );
      
      res.json(updatedConnection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  // Shared Notes Routes
  app.get("/api/user/shared-notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sharedNotes = await storage.getSharedNotes(req.user.id);
      res.json(sharedNotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared notes" });
    }
  });

  app.post("/api/user/share-note", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = shareNoteSchema.parse(req.body);
      
      // Verify the task progress exists and belongs to the user
      const progress = await storage.getTaskProgress(validatedData.taskProgressId);
      if (!progress) {
        return res.status(404).json({ message: "Task progress not found" });
      }
      
      const task = await storage.getTask(progress.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const challenge = await storage.getChallenge(task.challengeId);
      if (!challenge || challenge.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to share this note" });
      }
      
      // Verify the target user exists and is connected
      const connection = await storage.getUserConnectionByIds(req.user.id, validatedData.sharedWithUserId);
      if (!connection || connection.status !== 'accepted') {
        return res.status(403).json({ message: "You can only share notes with connected users" });
      }
      
      // Create the shared note
      const sharedNote = await storage.shareNote({
        taskProgressId: validatedData.taskProgressId,
        sharedByUserId: req.user.id,
        sharedWithUserId: validatedData.sharedWithUserId
      });
      
      res.status(201).json(sharedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to share note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
