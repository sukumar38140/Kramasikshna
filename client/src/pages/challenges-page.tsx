import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Challenge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { CalendarDays, Calendar, Target, Timer, Clock, CheckCircle, PlusCircle, Loader2 } from "lucide-react";
import CreateChallengeModal from "@/components/create-challenge-modal";

export default function ChallengesPage() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch user's challenges
  const { data: challenges, isLoading, error } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  // Mark challenge as completed
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/challenges/${id}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Challenge completed",
        description: "Congratulations on completing your challenge!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load challenges. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDateFromISO = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Challenges</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Challenge
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      {challenges && challenges.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-primary-50 mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No challenges yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start by creating a new challenge to track your progress and build consistent habits.
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            Create Your First Challenge
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges?.map((challenge) => (
            <Card key={challenge.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{challenge.name}</CardTitle>
                  <Badge variant={challenge.isCompleted ? "default" : "outline"}>
                    {challenge.isCompleted ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <CardDescription>{challenge.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Started: {formatDateFromISO(challenge.startDate.toString())}</span>
                  </div>
                  {challenge.endDate && (
                    <div className="flex items-center text-sm">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Ends: {formatDateFromISO(challenge.endDate.toString())}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{challenge.duration} days duration</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" asChild>
                  <Link href={`/challenges/${challenge.id}`}>
                    View Details
                  </Link>
                </Button>
                {!challenge.isCompleted && (
                  <Button 
                    onClick={() => completeMutation.mutate(challenge.id)}
                    disabled={completeMutation.isPending}
                    size="sm"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Mark Complete
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateChallengeModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </div>
  );
}