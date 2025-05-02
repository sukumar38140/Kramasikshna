import { Card } from "@/components/ui/card";
import { format, formatDistance } from "date-fns";
import { CheckCircle, XCircle, Upload, Trophy, Clock } from "lucide-react";

interface ActivityItem {
  id: number;
  type: 'completed' | 'created' | 'missed' | 'badge';
  challengeId: number;
  challengeName: string;
  taskId?: number;
  taskName?: string;
  badgeId?: number;
  badgeName?: string;
  date: string | Date;
  hoursSpent?: number;
  status?: string;
}

interface ActivityFeedProps {
  activity: ActivityItem[];
}

export default function ActivityFeed({ activity }: ActivityFeedProps) {
  if (!activity || activity.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-neutral-900">No recent activity</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Start tracking your progress to see your activity here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul role="list" className="divide-y divide-neutral-200">
        {activity.slice(0, 5).map((item) => (
          <li key={item.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {item.type === 'completed' && (
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="text-white h-5 w-5" />
                    </div>
                  )}
                  {item.type === 'missed' && (
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="text-white h-5 w-5" />
                    </div>
                  )}
                  {item.type === 'created' && (
                    <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                      <i className="fas fa-plus text-white"></i>
                    </div>
                  )}
                  {item.type === 'badge' && (
                    <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Trophy className="text-white h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-neutral-900">
                    {item.type === 'completed' && `Completed ${item.taskName}`}
                    {item.type === 'missed' && `Missed ${item.taskName}`}
                    {item.type === 'created' && `Created new challenge: ${item.challengeName}`}
                    {item.type === 'badge' && `Earned "${item.badgeName}" badge`}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {item.challengeName} {item.type !== 'created' && `• ${
                      item.type === 'badge' ? '' : 'Day ' 
                    }`}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">
                  {formatDistance(new Date(item.date), new Date(), { addSuffix: true })}
                </div>
                <div className="mt-1 flex items-center">
                  {item.type === 'completed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.hoursSpent ? `${item.hoursSpent} hour${item.hoursSpent !== 1 ? 's' : ''} logged` : 'Completed'}
                    </span>
                  )}
                  {item.type === 'missed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      No Action
                    </span>
                  )}
                  {item.type === 'created' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      New Challenge
                    </span>
                  )}
                  {item.type === 'badge' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Achievement
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {activity.length > 5 && (
        <div className="bg-neutral-50 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View all activity
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
