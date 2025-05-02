import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Award, CheckCircle, XCircle, Clock, Calendar, Image } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SharePage() {
  const [, params] = useRoute("/share/:userId/:challengeId");
  const userId = params?.userId || "0";
  const challengeId = params?.challengeId || "0";
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/share/${userId}/${challengeId}`],
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900">Loading shared profile...</h2>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Profile Not Found</CardTitle>
            <CardDescription className="text-center">
              The shared profile you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = "/"}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { user, challenge, progress } = data;
  
  // Calculate completion stats
  const totalDays = challenge.duration;
  const totalTasks = progress.length;
  const completedTasks = progress.reduce((acc, item) => {
    const completedCount = item.progress.filter(p => p.status === 'completed').length;
    return acc + completedCount;
  }, 0);
  
  const completionPercentage = Math.round((completedTasks / (totalTasks * totalDays)) * 100);
  
  // Calculate total hours spent
  const totalHours = progress.reduce((acc, item) => {
    const hours = item.progress.reduce((sum, p) => {
      return sum + (p.hoursSpent ? p.hoursSpent / 60 : 0); // Convert minutes to hours
    }, 0);
    return acc + hours;
  }, 0);
  
  // Get category color
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
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Discipline Never Fails</h1>
              <p className="mt-1 text-primary-100">View-only shared profile</p>
            </div>
            <Button className="mt-4 md:mt-0" variant="secondary" onClick={() => window.location.href = "/"}>
              Create Your Own Challenge
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User and challenge info */}
        <div className={`rounded-lg overflow-hidden mb-8 bg-gradient-to-r ${getCategoryColor(challenge.category)}`}>
          <div className="p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{challenge.name}</h2>
                <p className="text-lg mt-1">by {user.name}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span>{challenge.category}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{challenge.duration} days</span>
                  <span className="mx-2">&bull;</span>
                  <span>{challenge.isCompleted ? "Completed" : "In Progress"}</span>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0 text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white text-primary-700 font-medium text-sm">
                  {challenge.isCompleted ? "Challenge Completed" : `Day ${Math.min(
                    Math.floor((new Date().getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    challenge.duration
                  )} of ${challenge.duration}`}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Overall Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2 bg-white/20" />
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-md p-3 backdrop-blur-sm">
                <div className="text-xs">Started</div>
                <div className="font-medium">{format(new Date(challenge.startDate), "MMM d, yyyy")}</div>
              </div>
              <div className="bg-white/10 rounded-md p-3 backdrop-blur-sm">
                <div className="text-xs">End Date</div>
                <div className="font-medium">{format(new Date(challenge.endDate), "MMM d, yyyy")}</div>
              </div>
              <div className="bg-white/10 rounded-md p-3 backdrop-blur-sm">
                <div className="text-xs">Tasks Completed</div>
                <div className="font-medium">{completedTasks} / {totalTasks * totalDays}</div>
              </div>
              <div className="bg-white/10 rounded-md p-3 backdrop-blur-sm">
                <div className="text-xs">Hours Invested</div>
                <div className="font-medium">{totalHours.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tasks and progress */}
        <Tabs defaultValue="tasks">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-6">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Tasks</CardTitle>
                <CardDescription>All tasks and their completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {progress.map(({ task, progress }) => {
                    const completedCount = progress.filter(p => p.status === 'completed').length;
                    const progressPercentage = Math.round((completedCount / totalDays) * 100);
                    
                    return (
                      <div key={task.id} className="border rounded-lg p-4">
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
                            {completedCount} / {totalDays} days
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                            <span>Completion</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>Day by day completion history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group progress by date and present in reverse chronological order */}
                  {Array.from({ length: Math.min(totalDays, 30) }).map((_, dayIndex) => {
                    const currentDay = totalDays - dayIndex;
                    const date = new Date(challenge.startDate);
                    date.setDate(date.getDate() + currentDay - 1);
                    
                    const dateStr = format(date, "yyyy-MM-dd");
                    const dayProgress = progress.map(({ task, progress }) => {
                      const dayEntry = progress.find(p => format(new Date(p.date), "yyyy-MM-dd") === dateStr);
                      return { task, dayEntry };
                    });
                    
                    const hasEntries = dayProgress.some(dp => dp.dayEntry);
                    
                    if (!hasEntries && dayIndex > 10) return null; // Skip days with no entries after showing 10 days
                    
                    return (
                      <div key={dateStr} className="border rounded-lg overflow-hidden">
                        <div className="bg-neutral-100 px-4 py-2">
                          <div className="font-medium">
                            Day {currentDay}: {format(date, "MMMM d, yyyy")}
                          </div>
                        </div>
                        
                        <div className="divide-y">
                          {dayProgress.map(({ task, dayEntry }) => (
                            <div key={task.id} className="px-4 py-3 flex items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                dayEntry?.status === 'completed' 
                                  ? 'bg-green-100 text-green-600' 
                                  : dayEntry?.status === 'partial' 
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : dayEntry?.status === 'no-action'
                                  ? 'bg-red-100 text-red-600'  
                                  : 'bg-neutral-100 text-neutral-400'
                              }`}>
                                {dayEntry?.status === 'completed' && <CheckCircle />}
                                {dayEntry?.status === 'partial' && <i className="fas fa-adjust"></i>}
                                {dayEntry?.status === 'no-action' && <XCircle />}
                                {!dayEntry && <i className="fas fa-minus"></i>}
                              </div>
                              
                              <div className="ml-4 flex-1">
                                <div className="font-medium">{task.name}</div>
                                {dayEntry && (
                                  <div className="text-sm text-neutral-500 mt-1">
                                    {dayEntry.status === 'completed' && 'Completed'}
                                    {dayEntry.status === 'partial' && 'Partially completed'}
                                    {dayEntry.status === 'no-action' && 'No action taken'}
                                    {dayEntry.hoursSpent && ` • ${(dayEntry.hoursSpent / 60).toFixed(1)} hours spent`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Gallery</CardTitle>
                <CardDescription>Images uploaded as proof of completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.flatMap(({ task, progress }) => 
                    progress.filter(p => p.imageUrl).map((p, idx) => (
                      <div key={`${task.id}-${idx}`} className="border rounded-lg overflow-hidden">
                        <div className="aspect-w-3 aspect-h-2 bg-neutral-100 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={`Evidence for ${task.name}`}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Image className="text-neutral-400 h-16 w-16" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-neutral-900">{task.name}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {format(new Date(p.date), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {!progress.some(({ progress }) => progress.some(p => p.imageUrl)) && (
                    <div className="col-span-full text-center py-12 text-neutral-500">
                      <Image className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                      <p>No evidence images were uploaded for this challenge.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* CTA section */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="pt-6 pb-6">
              <h2 className="text-xl font-bold mb-4">Start Your Own Discipline Journey</h2>
              <p className="text-neutral-600 mb-6">
                Create your own challenges, build habits, and share your progress.
              </p>
              <Button size="lg" onClick={() => window.location.href = "/"}>
                Build Your Discipline
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">Discipline Never Fails</p>
          <p className="text-sm">Build Habits, Conquer Challenges, Become Unstoppable!</p>
        </div>
      </footer>
    </div>
  );
}
