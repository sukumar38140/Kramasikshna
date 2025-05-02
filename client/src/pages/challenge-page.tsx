import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import LogProgressModal from "@/components/log-progress-modal";
import CongratsModal from "@/components/congrats-modal";
import { Challenge, Task, TaskProgress } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Camera, Clock, Image, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO, isToday, isFuture, isPast, formatDistance } from "date-fns";

export default function ChallengePage() {
  const [, params] = useRoute("/challenges/:id");
  const challengeId = params?.id ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  
  const { 
    data: challengeData, 
    isLoading 
  } = useQuery<{
    id: number;
    name: string;
    category: string;
    duration: number;
    startDate: string;
    endDate: string;
    isCompleted: boolean;
    userId: number;
    createdAt: string;
    tasks: Task[];
  }>({
    queryKey: [`/api/challenges/${challengeId}`],
    onSuccess: (data) => {
      if (data.isCompleted && !showCongratsModal) {
        setShowCongratsModal(true);
      }
    },
  });
  
  // Fetch task progress for each task
  const taskProgressQueries = challengeData?.tasks ? challengeData.tasks.map(task => 
    useQuery<TaskProgress[]>({
      queryKey: [`/api/tasks/${task.id}/progress`],
      enabled: !!challengeData,
    })
  ) : [];
  
  const isTaskProgressLoading = taskProgressQueries.some(query => query.isLoading);
  
  // Calculate days elapsed since start and completion percentage
  const startDate = challengeData ? new Date(challengeData.startDate) : new Date();
  const endDate = challengeData ? new Date(challengeData.endDate) : new Date();
  const today = new Date();
  
  const totalDays = challengeData?.duration || 0;
  const daysElapsed = Math.min(
    Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    totalDays
  );
  
  const progressPercentage = Math.min(Math.round((daysElapsed / totalDays) * 100), 100);
  
  // Calculate completion stats
  const calculateCompletionStats = () => {
    if (!challengeData || isTaskProgressLoading) return { completed: 0, total: 0, percentage: 0 };
    
    let completedTasks = 0;
    let totalTaskDays = 0;
    
    taskProgressQueries.forEach((query, index) => {
      if (query.data) {
        completedTasks += query.data.filter(p => p.status === 'completed').length;
        
        // Count total days that should have tasks (only count past days)
        const taskDays = Math.min(
          daysElapsed,
          totalDays
        );
        totalTaskDays += taskDays;
      }
    });
    
    return {
      completed: completedTasks,
      total: totalTaskDays,
      percentage: totalTaskDays > 0 ? Math.round((completedTasks / totalTaskDays) * 100) : 0
    };
  };
  
  const stats = calculateCompletionStats();
  
  // Mutation for completing challenge
  const completeChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setShowCongratsModal(true);
      toast({
        title: "Challenge completed!",
        description: "Congratulations on completing your challenge!"
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (!challengeData) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900">Challenge not found</h2>
            <p className="mt-2 text-neutral-600">The challenge you're looking for doesn't exist or you don't have access to it.</p>
            <Button className="mt-6" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fitness: "from-green-500 to-green-600",
      learning: "from-primary-500 to-primary-600",
      mindfulness: "from-purple-500 to-purple-600",
      productivity: "from-yellow-500 to-yellow-600",
      health: "from-red-500 to-red-600",
      default: "from-primary-500 to-primary-600"
    };
    
    return colors[category.toLowerCase()] || colors.default;
  };
  
  const getTaskStatus = (task: Task, date: Date) => {
    if (!taskProgressQueries || !challengeData || !challengeData.tasks) return "pending";
    
    const taskIndex = challengeData.tasks.findIndex(t => t.id === task.id);
    if (taskIndex === -1 || !taskProgressQueries[taskIndex]) return "pending";
    
    const progressData = taskProgressQueries[taskIndex]?.data;
    if (!progressData) return "pending";
    
    const dateProgress = progressData.find(p => 
      format(new Date(p.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    
    if (!dateProgress) {
      if (isPast(date) && !isToday(date)) return "no-action";
      if (isToday(date)) return "pending";
      return "future";
    }
    
    return dateProgress.status;
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      {/* Challenge header */}
      <div className={`bg-gradient-to-r ${getCategoryColor(challengeData.category)}`}>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{challengeData.name}</h1>
              <div className="mt-2 flex items-center text-primary-100">
                <span className="capitalize">{challengeData.category}</span>
                <span className="mx-2">&bull;</span>
                <span>{challengeData.duration} days</span>
                <span className="mx-2">&bull;</span>
                <span>Started {format(startDate, "MMM d, yyyy")}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-primary-700">
                Day {daysElapsed} of {totalDays}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs text-white mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Progress</CardTitle>
                <CardDescription>
                  Track your tasks and daily completions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tasks">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tasks">
                    <div className="space-y-4">
                      {challengeData.tasks.map((task, index) => {
                        const taskIndex = challengeData.tasks.findIndex(t => t.id === task.id);
                        const progressData = taskProgressQueries[taskIndex]?.data || [];
                        const todayProgress = progressData.find(p => 
                          format(new Date(p.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                        );
                        
                        const completedDays = progressData.filter(p => p.status === 'completed').length;
                        const taskProgressPercentage = Math.round((completedDays / totalDays) * 100);
                        
                        return (
                          <div key={task.id} className="bg-white border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-neutral-900">{task.name}</h3>
                                {task.scheduledTime && (
                                  <p className="text-sm text-neutral-500 flex items-center mt-1">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Scheduled for {task.scheduledTime}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {completedDays} / {totalDays} days
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                                <span>Progress</span>
                                <span>{taskProgressPercentage}%</span>
                              </div>
                              <Progress value={taskProgressPercentage} className="h-1.5" />
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center">
                              <div>
                                {todayProgress ? (
                                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    todayProgress.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : todayProgress.status === 'partial' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {todayProgress.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {todayProgress.status === 'partial' && <AlertCircle className="h-3 w-3 mr-1" />}
                                    {todayProgress.status === 'no-action' && <XCircle className="h-3 w-3 mr-1" />}
                                    {todayProgress.status === 'completed' ? 'Completed today' : 
                                     todayProgress.status === 'partial' ? 'Partially completed' : 'No action today'}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    Pending today
                                  </div>
                                )}
                              </div>
                              
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowLogModal(true);
                                }} 
                                variant={todayProgress ? "outline" : "default"}
                              >
                                {todayProgress ? "Update Progress" : "Log Progress"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="calendar">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="grid grid-cols-7 gap-px bg-neutral-200 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                          <div key={day} className="bg-neutral-50 py-2">
                            <div className="text-center text-sm font-medium text-neutral-500">{day}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar rows would go here - simplified */}
                      <div className="text-center py-8 text-neutral-500">
                        Calendar view coming soon...
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="evidence">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {taskProgressQueries.map((query, taskIndex) => 
                          query.data?.filter(p => p.imageUrl).map((progress, progressIndex) => (
                            <div key={`${taskIndex}-${progressIndex}`} className="border rounded-lg overflow-hidden">
                              <div className="aspect-w-3 aspect-h-2 bg-neutral-100 flex items-center justify-center">
                                {progress.imageUrl ? (
                                  <img
                                    src={progress.imageUrl}
                                    alt="Task evidence"
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <Image className="text-neutral-400 h-16 w-16" />
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-sm font-medium text-neutral-900">
                                  {challengeData.tasks[taskIndex].name}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {format(new Date(progress.date), "MMMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        
                        {!isTaskProgressLoading && !taskProgressQueries.some(q => q.data?.some(p => p.imageUrl)) && (
                          <div className="col-span-full text-center py-8 text-neutral-500">
                            <Camera className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                            <p>No evidence images uploaded yet.</p>
                            <p className="text-sm">Log your progress and attach images to track your journey.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Challenge Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-neutral-500">Start Date</div>
                      <div className="text-lg font-semibold text-neutral-900">{format(startDate, "MMM d, yyyy")}</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-neutral-500">End Date</div>
                      <div className="text-lg font-semibold text-neutral-900">{format(endDate, "MMM d, yyyy")}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-neutral-500">Completion</div>
                      <div className="text-lg font-semibold text-green-600">{stats.percentage}%</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-neutral-500">Tasks</div>
                      <div className="text-lg font-semibold text-neutral-900">{challengeData.tasks.length}</div>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-neutral-500">Status</div>
                    <div className="text-lg font-semibold">
                      {challengeData.isCompleted ? (
                        <span className="text-green-600">Completed</span>
                      ) : today > endDate ? (
                        <span className="text-red-600">Expired</span>
                      ) : (
                        <span className="text-blue-600">In Progress</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challengeData.tasks.map(task => {
                    const taskIndex = challengeData.tasks.findIndex(t => t.id === task.id);
                    const progressData = taskProgressQueries[taskIndex]?.data || [];
                    const todayProgress = progressData.find(p => 
                      format(new Date(p.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    );
                    
                    return (
                      <div key={task.id} className="flex items-center p-2 border rounded-md">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          todayProgress?.status === 'completed' 
                            ? 'bg-green-100 text-green-600' 
                            : todayProgress?.status === 'partial' 
                            ? 'bg-yellow-100 text-yellow-600'
                            : todayProgress?.status === 'no-action'
                            ? 'bg-red-100 text-red-600'  
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {todayProgress?.status === 'completed' && <CheckCircle />}
                          {todayProgress?.status === 'partial' && <AlertCircle />}
                          {todayProgress?.status === 'no-action' && <XCircle />}
                          {!todayProgress && <Clock />}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-neutral-900">{task.name}</p>
                          {task.scheduledTime && (
                            <p className="text-xs text-neutral-500">{task.scheduledTime}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowLogModal(true);
                          }}
                        >
                          Log
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Badges Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center">
                  {/* This would be populated from actual badges data */}
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="fas fa-fire text-primary-600 text-xl"></i>
                    </div>
                    <span className="mt-2 text-xs text-neutral-700">7-Day Streak</span>
                  </div>
                  {daysElapsed >= 21 && (
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <i className="fas fa-check-double text-green-600 text-xl"></i>
                      </div>
                      <span className="mt-2 text-xs text-neutral-700">21-Day Habit</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/progress")}
                >
                  View All Achievements
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {selectedTask && (
        <LogProgressModal 
          open={showLogModal} 
          onOpenChange={setShowLogModal} 
          task={selectedTask}
          challengeId={challengeId}
        />
      )}
      
      <CongratsModal 
        open={showCongratsModal} 
        onOpenChange={setShowCongratsModal}
        challenge={challengeData}
      />
    </div>
  );
}
