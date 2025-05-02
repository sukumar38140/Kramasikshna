import { Card, CardContent } from "@/components/ui/card";
import { Flame, CheckSquare, Clock, Award } from "lucide-react";

interface UserStats {
  activeChallenges: number;
  completedTasks: number;
  totalTasks: number;
  hoursLogged: number;
  badgesCount: number;
  longestStreak: number;
  currentStreak: number;
}

interface StatsOverviewProps {
  stats: UserStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-neutral-100 rounded-md p-3">
                  <div className="h-6 w-6"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                  <div className="mt-2 h-6 bg-neutral-100 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Active Challenges */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <Flame className="text-primary-600 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Active Challenges</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">{stats.activeChallenges}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View all challenges
            </a>
          </div>
        </div>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckSquare className="text-green-600 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Completed Tasks</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">
                    {stats.completedTasks} / {stats.totalTasks}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View details
            </a>
          </div>
        </div>
      </Card>

      {/* Hours Logged */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <Clock className="text-yellow-600 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Hours Logged</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">{stats.hoursLogged.toFixed(1)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View all logs
            </a>
          </div>
        </div>
      </Card>

      {/* Earned Badges */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-neutral-100 rounded-md p-3">
              <Award className="text-primary-600 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">Earned Badges</dt>
                <dd>
                  <div className="text-lg font-medium text-neutral-900">{stats.badgesCount}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              View achievements
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
