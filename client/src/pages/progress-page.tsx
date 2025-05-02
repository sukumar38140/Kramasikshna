import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import { Challenge, Badge } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Award, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export default function ProgressPage() {
  const { user } = useAuth();
  
  const { 
    data: challenges, 
    isLoading: challengesLoading 
  } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });
  
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/user/stats"],
  });
  
  const { 
    data: badges, 
    isLoading: badgesLoading 
  } = useQuery<Badge[]>({
    queryKey: ["/api/user/badges"],
  });
  
  const completedChallenges = challenges?.filter(c => c.isCompleted) || [];
  const activeChallenges = challenges?.filter(c => !c.isCompleted) || [];
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      {/* Hero section */}
      <div className="bg-primary-500">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Your Progress Journey</h1>
          <p className="mt-2 text-base text-primary-100">
            Track your accomplishments, badges, and discipline history
          </p>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <Clock className="text-primary-600 h-6 w-6" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">Current Streak</dt>
                      <dd className="text-lg font-medium text-neutral-900">{stats?.currentStreak || 0} days</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <i className="fas fa-trophy text-primary-600 text-xl"></i>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">Longest Streak</dt>
                      <dd className="text-lg font-medium text-neutral-900">{stats?.longestStreak || 0} days</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="text-green-600 h-6 w-6" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">Completed Tasks</dt>
                      <dd className="text-lg font-medium text-neutral-900">
                        {stats?.completedTasks || 0} / {stats?.totalTasks || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <i className="fas fa-clock text-yellow-600 text-xl"></i>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">Hours Logged</dt>
                      <dd className="text-lg font-medium text-neutral-900">{stats?.hoursLogged?.toFixed(1) || 0}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Achievements & Challenges */}
        <Tabs defaultValue="badges" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Your Earned Badges</CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : badges && badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {badges.map(badge => (
                      <div key={badge.id} className="flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                          <Award className="h-10 w-10 text-primary-600" />
                        </div>
                        <h3 className="font-medium text-neutral-900">{badge.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1">{badge.description}</p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {format(new Date(badge.earnedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100">
                      <Award className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-neutral-900">No badges yet</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      Complete challenges and maintain streaks to earn badges.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                {challengesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : completedChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedChallenges.map(challenge => (
                      <div key={challenge.id} className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
                          <h3 className="text-lg font-medium">{challenge.name}</h3>
                          <p className="text-sm text-green-100">{challenge.duration} Days • {challenge.category}</p>
                        </div>
                        <div className="px-4 py-4 sm:px-6">
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Started</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {format(new Date(challenge.startDate), "MMM d, yyyy")}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Completed</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {format(new Date(challenge.endDate), "MMM d, yyyy")}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-4 flex justify-center">
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100">
                      <i className="fas fa-flag-checkered text-neutral-400"></i>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-neutral-900">No completed challenges</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      Keep going with your active challenges to complete them.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                {challengesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activeChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeChallenges.map(challenge => (
                      <div key={challenge.id} className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                          <h3 className="text-lg font-medium">{challenge.name}</h3>
                          <p className="text-sm text-primary-100">{challenge.duration} Days • {challenge.category}</p>
                        </div>
                        <div className="px-4 py-4 sm:px-6">
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">Started</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {format(new Date(challenge.startDate), "MMM d, yyyy")}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-neutral-500">End Date</dt>
                              <dd className="mt-1 text-sm text-neutral-900">
                                {format(new Date(challenge.endDate), "MMM d, yyyy")}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-4 flex justify-center">
                            <Button size="sm">Continue Challenge</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100">
                      <i className="fas fa-flag text-neutral-400"></i>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-neutral-900">No active challenges</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      Start a new challenge to begin your discipline journey.
                    </p>
                    <div className="mt-6">
                      <Button>Create New Challenge</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Share section */}
        <Card>
          <CardHeader>
            <CardTitle>Share Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <p className="mb-4 text-neutral-600">Generate a shareable link to show your discipline journey with others.</p>
              <div className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md" 
                      value={`https://disciplineneverfails.com/share/${user?.id}/profile`}
                      readOnly
                    />
                  </div>
                  <Button className="flex-shrink-0">
                    <i className="fas fa-copy mr-2"></i> Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
