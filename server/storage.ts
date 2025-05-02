import { 
  User, InsertUser, 
  Challenge, InsertChallenge, 
  Task, InsertTask, 
  TaskProgress, InsertTaskProgress, 
  Badge, InsertBadge 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Challenges
  getChallenge(id: number): Promise<Challenge | undefined>;
  getChallengesByUserId(userId: number): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  markChallengeCompleted(id: number): Promise<Challenge | undefined>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByChallengeId(challengeId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  
  // Task Progress
  getTaskProgress(id: number): Promise<TaskProgress | undefined>;
  getTaskProgressByTaskId(taskId: number): Promise<TaskProgress[]>;
  logTaskProgress(progress: InsertTaskProgress): Promise<TaskProgress>;
  
  // Badges
  getBadge(id: number): Promise<Badge | undefined>;
  getUserBadges(userId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  createBadgeIfNotExists(badge: InsertBadge): Promise<Badge | undefined>;
  
  // Stats & Activity
  getUserStats(userId: number): Promise<UserStats>;
  getUserActivity(userId: number): Promise<ActivityItem[]>;
  
  // Session
  sessionStore: session.SessionStore;
}

// Define types for stats and activity
export interface UserStats {
  activeChallenges: number;
  completedTasks: number;
  totalTasks: number;
  hoursLogged: number;
  badgesCount: number;
  longestStreak: number;
  currentStreak: number;
}

export interface ActivityItem {
  id: number;
  type: 'completed' | 'created' | 'missed' | 'badge';
  challengeId: number;
  challengeName: string;
  taskId?: number;
  taskName?: string;
  badgeId?: number;
  badgeName?: string;
  date: Date;
  hoursSpent?: number;
  status?: string;
}

// Implement Memory Storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private tasks: Map<number, Task>;
  private taskProgress: Map<number, TaskProgress>;
  private badges: Map<number, Badge>;
  
  private userIdCounter: number;
  private challengeIdCounter: number;
  private taskIdCounter: number;
  private progressIdCounter: number;
  private badgeIdCounter: number;
  
  public sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.tasks = new Map();
    this.taskProgress = new Map();
    this.badges = new Map();
    
    this.userIdCounter = 1;
    this.challengeIdCounter = 1;
    this.taskIdCounter = 1;
    this.progressIdCounter = 1;
    this.badgeIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Challenge methods
  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }
  
  async getChallengesByUserId(userId: number): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      (challenge) => challenge.userId === userId
    );
  }
  
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.challengeIdCounter++;
    const createdAt = new Date();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + insertChallenge.duration);
    
    const challenge: Challenge = {
      ...insertChallenge,
      id,
      createdAt,
      startDate,
      endDate,
      isCompleted: false
    };
    
    this.challenges.set(id, challenge);
    return challenge;
  }
  
  async markChallengeCompleted(id: number): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { ...challenge, isCompleted: true };
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByChallengeId(challengeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.challengeId === challengeId
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const createdAt = new Date();
    const task: Task = { ...insertTask, id, createdAt };
    this.tasks.set(id, task);
    return task;
  }
  
  // Task Progress methods
  async getTaskProgress(id: number): Promise<TaskProgress | undefined> {
    return this.taskProgress.get(id);
  }
  
  async getTaskProgressByTaskId(taskId: number): Promise<TaskProgress[]> {
    return Array.from(this.taskProgress.values()).filter(
      (progress) => progress.taskId === taskId
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async logTaskProgress(insertProgress: InsertTaskProgress): Promise<TaskProgress> {
    const id = this.progressIdCounter++;
    const createdAt = new Date();
    const progress: TaskProgress = { ...insertProgress, id, createdAt };
    this.taskProgress.set(id, progress);
    return progress;
  }
  
  // Badge methods
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getUserBadges(userId: number): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter(
      (badge) => badge.userId === userId
    );
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.badgeIdCounter++;
    const earnedAt = new Date();
    const badge: Badge = { ...insertBadge, id, earnedAt };
    this.badges.set(id, badge);
    return badge;
  }
  
  async createBadgeIfNotExists(insertBadge: InsertBadge): Promise<Badge | undefined> {
    // Check if user already has this badge for this challenge
    const existingBadge = Array.from(this.badges.values()).find(
      (badge) => 
        badge.userId === insertBadge.userId && 
        badge.name === insertBadge.name &&
        badge.challengeId === insertBadge.challengeId
    );
    
    if (existingBadge) {
      return existingBadge;
    }
    
    return this.createBadge(insertBadge);
  }
  
  // Stats and Activity methods
  async getUserStats(userId: number): Promise<UserStats> {
    const challenges = await this.getChallengesByUserId(userId);
    const activeChallenges = challenges.filter(c => !c.isCompleted).length;
    
    // Get all tasks from user's challenges
    const userTaskIds = new Set<number>();
    for (const challenge of challenges) {
      const tasks = await this.getTasksByChallengeId(challenge.id);
      tasks.forEach(task => userTaskIds.add(task.id));
    }
    
    // Count completed tasks and hours
    let completedTasks = 0;
    let hoursLogged = 0;
    
    for (const taskId of userTaskIds) {
      const progress = await this.getTaskProgressByTaskId(taskId);
      completedTasks += progress.filter(p => p.status === 'completed').length;
      
      for (const p of progress) {
        if (p.hoursSpent) {
          hoursLogged += p.hoursSpent / 60; // Convert minutes to hours
        }
      }
    }
    
    const badges = await this.getUserBadges(userId);
    
    // Calculate streaks
    const streaks = this.calculateStreaks(userId);
    
    return {
      activeChallenges,
      completedTasks,
      totalTasks: userTaskIds.size,
      hoursLogged,
      badgesCount: badges.length,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak
    };
  }
  
  async getUserActivity(userId: number): Promise<ActivityItem[]> {
    const challenges = await this.getChallengesByUserId(userId);
    const activities: ActivityItem[] = [];
    let activityId = 1;
    
    // Add challenge creations
    for (const challenge of challenges) {
      activities.push({
        id: activityId++,
        type: 'created',
        challengeId: challenge.id,
        challengeName: challenge.name,
        date: challenge.createdAt
      });
      
      // Get tasks for this challenge
      const tasks = await this.getTasksByChallengeId(challenge.id);
      
      // Add task completions and misses
      for (const task of tasks) {
        const progress = await this.getTaskProgressByTaskId(task.id);
        
        for (const p of progress) {
          activities.push({
            id: activityId++,
            type: p.status === 'completed' ? 'completed' : 'missed',
            challengeId: challenge.id,
            challengeName: challenge.name,
            taskId: task.id,
            taskName: task.name,
            date: p.date,
            hoursSpent: p.hoursSpent ? p.hoursSpent / 60 : undefined, // Convert minutes to hours
            status: p.status
          });
        }
      }
    }
    
    // Add badge earnings
    const badges = await this.getUserBadges(userId);
    for (const badge of badges) {
      const challenge = badge.challengeId ? await this.getChallenge(badge.challengeId) : undefined;
      
      activities.push({
        id: activityId++,
        type: 'badge',
        challengeId: badge.challengeId || 0,
        challengeName: challenge ? challenge.name : "General",
        badgeId: badge.id,
        badgeName: badge.name,
        date: badge.earnedAt
      });
    }
    
    // Sort by date, newest first
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Helper methods
  private calculateStreaks(userId: number): { currentStreak: number, longestStreak: number } {
    // This is a simplified implementation
    // A real implementation would need to check consecutive days
    return {
      currentStreak: Math.floor(Math.random() * 30) + 1, // Mock for demo
      longestStreak: Math.floor(Math.random() * 60) + 30  // Mock for demo
    };
  }
}

export const storage = new MemStorage();
