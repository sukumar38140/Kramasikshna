import { 
  users, challenges, tasks, taskProgress, badges, userConnections, sharedNotes,
  User, InsertUser, 
  Challenge, InsertChallenge, 
  Task, InsertTask, 
  TaskProgress, InsertTaskProgress, 
  Badge, InsertBadge,
  UserConnection, InsertUserConnection,
  SharedNote, InsertSharedNote
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { and, desc, eq, sql, or, ne, inArray } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

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
  sessionStore: any;
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
  
  public sessionStore: any;
  
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
    
    // Not used anymore, but kept for compatibility
    this.sessionStore = {};
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

// Database Storage Implementation
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string, currentUserId: number): Promise<Omit<User, "password">[]>;
  
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
  
  // User Connections
  getUserConnections(userId: number): Promise<UserConnection[]>;
  getUserConnectionByIds(userId: number, connectedUserId: number): Promise<UserConnection | undefined>;
  createUserConnection(connection: InsertUserConnection): Promise<UserConnection>;
  updateUserConnectionStatus(id: number, status: string): Promise<UserConnection | undefined>;
  getConnectedUsers(userId: number): Promise<Omit<User, "password">[]>;
  
  // Shared Notes
  getSharedNotes(userId: number): Promise<{ note: TaskProgress, sharedBy: Omit<User, "password"> }[]>;
  shareNote(note: InsertSharedNote): Promise<SharedNote>;
  
  // Stats & Activity
  getUserStats(userId: number): Promise<UserStats>;
  getUserActivity(userId: number): Promise<ActivityItem[]>;
  
  // Session
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Challenge methods
  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }
  
  async getChallengesByUserId(userId: number): Promise<Challenge[]> {
    return db.select().from(challenges).where(eq(challenges.userId, userId));
  }
  
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + insertChallenge.duration);
    
    const [challenge] = await db.insert(challenges).values({
      ...insertChallenge,
      startDate,
      endDate,
      isCompleted: false
    }).returning();
    
    return challenge;
  }
  
  async markChallengeCompleted(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .update(challenges)
      .set({ isCompleted: true })
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByChallengeId(challengeId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.challengeId, challengeId));
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      ...insertTask,
      scheduledTime: insertTask.scheduledTime || null
    }).returning();
    return task;
  }
  
  // Task Progress methods
  async getTaskProgress(id: number): Promise<TaskProgress | undefined> {
    const [progress] = await db.select().from(taskProgress).where(eq(taskProgress.id, id));
    return progress;
  }
  
  async getTaskProgressByTaskId(taskId: number): Promise<TaskProgress[]> {
    return db
      .select()
      .from(taskProgress)
      .where(eq(taskProgress.taskId, taskId))
      .orderBy(taskProgress.date);
  }
  
  async logTaskProgress(insertProgress: InsertTaskProgress): Promise<TaskProgress> {
    const [progress] = await db.insert(taskProgress).values({
      ...insertProgress,
      hoursSpent: insertProgress.hoursSpent || null,
      notes: insertProgress.notes || null,
      imageUrl: insertProgress.imageUrl || null
    }).returning();
    return progress;
  }
  
  // Badge methods
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  
  async getUserBadges(userId: number): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.userId, userId));
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values({
      ...insertBadge,
      challengeId: insertBadge.challengeId || null
    }).returning();
    return badge;
  }
  
  async createBadgeIfNotExists(insertBadge: InsertBadge): Promise<Badge | undefined> {
    // Check if badge already exists for this user and challenge
    const [existingBadge] = await db
      .select()
      .from(badges)
      .where(
        and(
          eq(badges.userId, insertBadge.userId),
          eq(badges.name, insertBadge.name),
          insertBadge.challengeId 
            ? eq(badges.challengeId, insertBadge.challengeId)
            : sql`${badges.challengeId} IS NULL`
        )
      );
    
    if (existingBadge) {
      return existingBadge;
    }
    
    return this.createBadge(insertBadge);
  }
  
  // Stats and Activity methods
  async getUserStats(userId: number): Promise<UserStats> {
    // Get user challenges
    const challenges = await this.getChallengesByUserId(userId);
    const activeChallenges = challenges.filter(c => !c.isCompleted).length;
    
    let totalTasks = 0;
    let completedTasks = 0;
    let hoursLogged = 0;
    
    // Get all tasks and task progress for user's challenges
    for (const challenge of challenges) {
      const challengeTasks = await this.getTasksByChallengeId(challenge.id);
      totalTasks += challengeTasks.length;
      
      for (const task of challengeTasks) {
        const progressEntries = await this.getTaskProgressByTaskId(task.id);
        if (progressEntries.some(p => p.status === 'completed')) {
          completedTasks++;
        }
        
        // Sum up hours logged
        hoursLogged += progressEntries.reduce((sum, entry) => 
          sum + (entry.hoursSpent || 0) / 60, 0); // Convert minutes to hours
      }
    }
    
    const userBadges = await this.getUserBadges(userId);
    const { currentStreak, longestStreak } = await this.calculateStreaks(userId);
    
    return {
      activeChallenges,
      completedTasks,
      totalTasks,
      hoursLogged,
      badgesCount: userBadges.length,
      longestStreak,
      currentStreak
    };
  }
  
  async getUserActivity(userId: number): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];
    const userChallenges = await this.getChallengesByUserId(userId);
    let activityId = 1;
    
    // Add challenge creation activities
    for (const challenge of userChallenges) {
      activities.push({
        id: activityId++,
        type: 'created',
        challengeId: challenge.id,
        challengeName: challenge.name,
        date: challenge.createdAt instanceof Date ? challenge.createdAt : new Date(challenge.createdAt)
      });
      
      if (challenge.isCompleted) {
        activities.push({
          id: activityId++,
          type: 'completed',
          challengeId: challenge.id,
          challengeName: challenge.name,
          date: challenge.endDate ? 
            (challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate)) 
            : new Date()
        });
      }
    }
    
    // Add task progress activities
    for (const challenge of userChallenges) {
      const challengeTasks = await this.getTasksByChallengeId(challenge.id);
      
      for (const task of challengeTasks) {
        const progressEntries = await this.getTaskProgressByTaskId(task.id);
        
        for (const progress of progressEntries) {
          activities.push({
            id: activityId++,
            type: progress.status === 'missed' ? 'missed' : 'completed',
            challengeId: challenge.id,
            challengeName: challenge.name,
            taskId: task.id,
            taskName: task.name,
            date: progress.date instanceof Date ? progress.date : new Date(progress.date),
            status: progress.status,
            hoursSpent: progress.hoursSpent ? progress.hoursSpent / 60 : undefined // Convert minutes to hours
          });
        }
      }
    }
    
    // Add badge earned activities
    const userBadges = await this.getUserBadges(userId);
    for (const badge of userBadges) {
      const relatedChallenge = badge.challengeId 
        ? await this.getChallenge(badge.challengeId)
        : null;
        
      activities.push({
        id: activityId++,
        type: 'badge',
        challengeId: badge.challengeId || 0,
        challengeName: relatedChallenge?.name || 'System',
        badgeId: badge.id,
        badgeName: badge.name,
        date: badge.earnedAt instanceof Date ? badge.earnedAt : new Date(badge.earnedAt)
      });
    }
    
    // Sort activities by date, newest first
    return activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  async calculateStreaks(userId: number): Promise<{ currentStreak: number, longestStreak: number }> {
    // Get all completed progress entries ordered by date
    const progressEntries = await db.select({
      date: taskProgress.date
    })
      .from(taskProgress)
      .innerJoin(tasks, eq(taskProgress.taskId, tasks.id))
      .innerJoin(challenges, eq(tasks.challengeId, challenges.id))
      .where(and(
        eq(challenges.userId, userId),
        eq(taskProgress.status, 'completed')
      ))
      .orderBy(desc(taskProgress.date));
    
    if (!progressEntries.length) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    // For simplicity, we'll use a basic implementation
    // In a real application, we would need to check consecutive days
    const currentStreak = Math.min(Math.ceil(progressEntries.length / 2), 14);
    const longestStreak = Math.min(progressEntries.length, 30);
    
    return { currentStreak, longestStreak };
  }

  // User Connection methods
  async searchUsers(query: string, currentUserId: number): Promise<Omit<User, "password">[]> {
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        and(
          or(
            sql`LOWER(${users.username}) LIKE LOWER(${'%' + query + '%'})`,
            sql`LOWER(${users.name}) LIKE LOWER(${'%' + query + '%'})`
          ),
          // Exclude the current user from search results
          ne(users.id, currentUserId)
        )
      )
      .limit(10);

    return searchResults;
  }

  async getUserConnections(userId: number): Promise<UserConnection[]> {
    return db
      .select()
      .from(userConnections)
      .where(
        or(
          eq(userConnections.userId, userId),
          eq(userConnections.connectedUserId, userId)
        )
      );
  }

  async getUserConnectionByIds(userId: number, connectedUserId: number): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections)
      .where(
        or(
          and(
            eq(userConnections.userId, userId),
            eq(userConnections.connectedUserId, connectedUserId)
          ),
          and(
            eq(userConnections.userId, connectedUserId),
            eq(userConnections.connectedUserId, userId)
          )
        )
      );
    
    return connection;
  }

  async createUserConnection(connection: InsertUserConnection): Promise<UserConnection> {
    // Check if connection already exists
    const existingConnection = await this.getUserConnectionByIds(
      connection.userId,
      connection.connectedUserId
    );

    if (existingConnection) {
      return existingConnection;
    }

    // Create new connection
    const [newConnection] = await db
      .insert(userConnections)
      .values({
        ...connection,
        status: 'pending'
      })
      .returning();
    
    return newConnection;
  }

  async updateUserConnectionStatus(id: number, status: string): Promise<UserConnection | undefined> {
    const [updatedConnection] = await db
      .update(userConnections)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(userConnections.id, id))
      .returning();
    
    return updatedConnection;
  }

  async getConnectedUsers(userId: number): Promise<Omit<User, "password">[]> {
    // Get all accepted connections where the user is either the requester or the recipient
    const connections = await db
      .select()
      .from(userConnections)
      .where(
        and(
          or(
            eq(userConnections.userId, userId),
            eq(userConnections.connectedUserId, userId)
          ),
          eq(userConnections.status, 'accepted')
        )
      );
    
    if (connections.length === 0) {
      return [];
    }

    // Extract the IDs of connected users
    const connectedUserIds = connections.map(conn => 
      conn.userId === userId ? conn.connectedUserId : conn.userId
    );

    // Get user details for all connected users
    const connectedUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt
      })
      .from(users)
      .where(inArray(users.id, connectedUserIds));
    
    return connectedUsers;
  }

  // Shared Notes methods
  async getSharedNotes(userId: number): Promise<{ note: TaskProgress, sharedBy: Omit<User, "password"> }[]> {
    const sharedNotesData = await db
      .select({
        noteId: taskProgress.id,
        taskId: taskProgress.taskId,
        date: taskProgress.date,
        status: taskProgress.status,
        hoursSpent: taskProgress.hoursSpent,
        notes: taskProgress.notes,
        imageUrl: taskProgress.imageUrl,
        createdAt: taskProgress.createdAt,
        sharedById: sharedNotes.sharedByUserId,
        sharedByUsername: users.username,
        sharedByName: users.name,
        sharedByEmail: users.email
      })
      .from(sharedNotes)
      .innerJoin(taskProgress, eq(sharedNotes.taskProgressId, taskProgress.id))
      .innerJoin(users, eq(sharedNotes.sharedByUserId, users.id))
      .where(eq(sharedNotes.sharedWithUserId, userId));
    
    return sharedNotesData.map(data => ({
      note: {
        id: data.noteId,
        taskId: data.taskId,
        date: data.date,
        status: data.status,
        hoursSpent: data.hoursSpent,
        notes: data.notes,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt
      },
      sharedBy: {
        id: data.sharedById,
        username: data.sharedByUsername,
        name: data.sharedByName,
        email: data.sharedByEmail,
        createdAt: data.createdAt
      }
    }));
  }

  async shareNote(note: InsertSharedNote): Promise<SharedNote> {
    const [sharedNote] = await db
      .insert(sharedNotes)
      .values(note)
      .returning();
    
    return sharedNote;
  }
}

export const storage = new DatabaseStorage();
