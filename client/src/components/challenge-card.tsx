import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Challenge, Task } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LogProgressModal from "./log-progress-modal";
import { format, formatDistance } from "date-fns";

interface ChallengeCardProps {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [, navigate] = useLocation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  
  const { data: tasksData } = useQuery<Task[]>({
    queryKey: [`/api/challenges/${challenge.id}/tasks`],
  });
  
  // Calculate days elapsed
  const startDate = new Date(challenge.startDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsed = Math.min(daysDiff, challenge.duration);
  const progressPercentage = Math.round((daysElapsed / challenge.duration) * 100);
  
  // Get today's task if available
  const todayTask = tasksData && tasksData.length > 0 ? tasksData[0] : null;
  
  const getCategoryColorClass = (category: string) => {
    const colorMap: Record<string, string> = {
      learning: "from-primary-500 to-primary-600",
      fitness: "from-green-500 to-green-600",
      mindfulness: "from-purple-500 to-purple-600",
      productivity: "from-yellow-500 to-yellow-600",
      health: "from-red-500 to-red-600",
    };
    
    return colorMap[category.toLowerCase()] || "from-primary-500 to-primary-600";
  };
  
  return (
    <>
      <Card className="overflow-hidden shadow">
        <div className={`px-4 py-5 sm:px-6 bg-gradient-to-r ${getCategoryColorClass(challenge.category)}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-white">{challenge.name}</h3>
              <p className="mt-1 max-w-2xl text-sm text-primary-100">
                {challenge.duration}-Day {challenge.category} Challenge
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-primary-800">
              Day {daysElapsed} of {challenge.duration}
            </span>
          </div>
        </div>
        
        <CardContent className="pt-5">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-neutral-700">Progress</span>
              <span className="text-sm font-medium text-neutral-700">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-2">Today's Task</h4>
            <div className="bg-neutral-50 p-3 rounded-md">
              {todayTask ? (
                <>
                  <p className="text-sm text-neutral-800">{todayTask.name}</p>
                  {todayTask.scheduledTime && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Scheduled for {todayTask.scheduledTime}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-500">No tasks available</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (todayTask) {
                    setSelectedTask(todayTask);
                    setShowLogModal(true);
                  }
                }}
                disabled={!todayTask}
              >
                <i className="fas fa-check mr-1"></i> Log Progress
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/challenges/${challenge.id}`)}
              >
                <i className="fas fa-info-circle mr-1"></i> Details
              </Button>
            </div>
            
            <div className="text-xs text-neutral-500">
              <i className="fas fa-fire text-yellow-500"></i> {daysElapsed}-day streak!
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedTask && (
        <LogProgressModal 
          open={showLogModal} 
          onOpenChange={setShowLogModal} 
          task={selectedTask}
          challengeId={challenge.id}
        />
      )}
    </>
  );
}
