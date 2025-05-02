import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import StatsOverview from "@/components/stats-overview";
import ChallengeCard from "@/components/challenge-card";
import TaskCalendar from "@/components/task-calendar";
import ActivityFeed from "@/components/activity-feed";
import CreateChallengeModal from "@/components/create-challenge-modal";
import { Challenge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Share2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
    data: activity, 
    isLoading: activityLoading 
  } = useQuery({
    queryKey: ["/api/user/activity"],
  });
  
  const activeChallenges = challenges?.filter(c => !c.isCompleted) || [];
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      
      {/* Hero section with welcome */}
      <div className="bg-primary-500">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome back, {user?.name.split(' ')[0]}!</h1>
            <p className="mt-1 text-sm text-primary-100">Your discipline streak: <span className="font-bold">{stats?.currentStreak || 0} days</span></p>
            <p className="mt-2 text-base text-primary-50 italic">"Discipline is the bridge between goals and accomplishment."</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Challenge
            </Button>
            <Button variant="default" className="bg-primary-600 hover:bg-primary-700">
              <Share2 className="mr-2 h-4 w-4" /> Share Progress
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats overview */}
        <div className="px-4 sm:px-0 mb-8">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <StatsOverview stats={stats} />
          )}
        </div>
        
        {/* Active Challenges */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="sm:flex sm:items-center mb-4">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-neutral-900">Active Challenges</h2>
              <p className="mt-2 text-sm text-neutral-700">Your ongoing challenges and their progress.</p>
            </div>
          </div>
          
          {challengesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeChallenges.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeChallenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <i className="fas fa-flag text-primary-500"></i>
              </div>
              <h3 className="mt-4 text-lg font-medium text-neutral-900">No active challenges</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Start your discipline journey by creating your first challenge.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Challenge
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Task Calendar */}
        <div className="px-4 sm:px-0 mb-8">
          <TaskCalendar />
        </div>
        
        {/* Recent Activity */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="sm:flex sm:items-center mb-4">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-neutral-900">Recent Activity</h2>
              <p className="mt-2 text-sm text-neutral-700">Your recent task completions and updates.</p>
            </div>
          </div>
          
          {activityLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ActivityFeed activity={activity || []} />
          )}
        </div>
      </div>
      
      {/* Modals */}
      <CreateChallengeModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
