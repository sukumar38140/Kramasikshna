import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

export default function TaskCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch user's challenges
  const { 
    data: challenges, 
    isLoading: challengesLoading 
  } = useQuery({
    queryKey: ["/api/challenges"],
  });
  
  // Fetch task progress data for the month
  const { 
    data: activityData, 
    isLoading: activityLoading 
  } = useQuery({
    queryKey: ["/api/user/activity"],
  });
  
  if (challengesLoading || activityLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Previous and next month handlers
  const prevMonth = () => {
    setCurrentMonth(addDays(monthStart, -30));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addDays(monthStart, 30));
  };
  
  // Helper to get status for a date
  const getDateStatus = (date: Date) => {
    if (!activityData) return null;
    
    // Find activities for this date
    const dateActivities = activityData.filter((activity: any) => 
      isSameDay(new Date(activity.date), date)
    );
    
    if (dateActivities.length === 0) return null;
    
    // Check if all activities are completed
    const allCompleted = dateActivities.every((activity: any) => 
      activity.type === 'completed'
    );
    
    if (allCompleted) return 'completed';
    
    // Check if any activities are missed
    const anyMissed = dateActivities.some((activity: any) => 
      activity.type === 'missed'
    );
    
    if (anyMissed) return 'missed';
    
    // If some completed, some missed
    return 'partial';
  };
  
  // Get today's tasks
  const getTodayTasks = () => {
    if (!challenges) return [];
    
    const activeChallenges = challenges.filter((c: any) => !c.isCompleted);
    const todayTasks: any[] = [];
    
    activeChallenges.forEach((challenge: any) => {
      if (challenge.tasks) {
        challenge.tasks.forEach((task: any) => {
          todayTasks.push({
            name: task.name,
            time: task.scheduledTime,
            challenge: challenge.name,
            category: challenge.category
          });
        });
      }
    });
    
    return todayTasks;
  };
  
  const todayTasks = getTodayTasks();
  
  return (
    <div className="sm:flex sm:items-center mb-4">
      <div className="sm:flex-auto">
        <h2 className="text-xl font-semibold text-neutral-900">{format(currentMonth, "MMMM yyyy")}</h2>
        <p className="mt-2 text-sm text-neutral-700">Your daily task completion calendar.</p>
      </div>
      
      <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={prevMonth}
            className="inline-flex items-center px-3 py-2 border border-neutral-300 shadow-sm text-sm leading-4 font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="inline-flex items-center px-3 py-2 border border-neutral-300 shadow-sm text-sm leading-4 font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card className="w-full mt-4">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-neutral-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-neutral-50 py-2">
                <div className="text-center text-sm font-medium text-neutral-500">{day}</div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-neutral-200">
            {days.map((day) => {
              const status = getDateStatus(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`bg-white p-3 h-32 ${
                    isCurrentDay ? 'bg-primary-50 border-2 border-primary-500' : ''
                  }`}
                >
                  <div className={`text-sm ${
                    isCurrentMonth 
                      ? isCurrentDay 
                        ? 'font-medium' 
                        : 'font-normal text-neutral-900' 
                      : 'text-neutral-400'
                  }`}>
                    {format(day, "d")}
                  </div>
                  
                  <div className="mt-2">
                    {!isCurrentMonth && (
                      <div className="bg-neutral-100 text-neutral-400 rounded-md p-2 text-xs">
                        {format(day, "MMMM")}
                      </div>
                    )}
                    
                    {isCurrentMonth && status === 'completed' && (
                      <div className="bg-green-100 text-green-800 rounded-md p-2 text-xs flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> All completed
                      </div>
                    )}
                    
                    {isCurrentMonth && status === 'missed' && (
                      <div className="bg-red-100 text-red-800 rounded-md p-2 text-xs flex items-center">
                        <XCircle className="h-3 w-3 mr-1" /> No Action
                      </div>
                    )}
                    
                    {isCurrentMonth && status === 'partial' && (
                      <div className="bg-yellow-100 text-yellow-800 rounded-md p-2 text-xs flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> Partial completion
                      </div>
                    )}
                    
                    {isCurrentDay && (
                      <div className="bg-white shadow rounded-md p-2 text-xs mt-1">
                        <span className="text-xs font-medium">Today's Tasks</span>
                        <div className="mt-1 text-xs text-neutral-700">
                          {todayTasks.slice(0, 3).map((task, index) => (
                            <div key={index} className="flex items-center">
                              <i className={`fas fa-circle text-${
                                task.category === 'fitness' ? 'green' : 
                                task.category === 'mindfulness' ? 'purple' : 
                                'primary'
                              }-500 text-xs mr-1`}></i>
                              {task.name} {task.time && `(${task.time})`}
                            </div>
                          ))}
                          
                          {todayTasks.length > 3 && (
                            <div className="text-xs text-neutral-500 mt-1">
                              +{todayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isCurrentMonth && !isCurrentDay && isSameDay(day, addDays(new Date(), 1)) && (
                      <div className="bg-neutral-100 rounded-md p-2 text-xs">
                        <span className="text-xs text-neutral-500">Upcoming</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
