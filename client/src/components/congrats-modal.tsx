import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Challenge } from "@shared/schema";
import { useLocation } from "wouter";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CongratsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
}

export default function CongratsModal({
  open,
  onOpenChange,
  challenge,
}: CongratsModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Get the domain from environment
  const domain = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Generate a share URL
  const shareUrl = `${domain}/share/${challenge.userId}/${challenge.id}`;
  
  // Create a new challenge mutation
  const newChallengeMutation = useMutation({
    mutationFn: async () => {
      onOpenChange(false);
      // Navigate to homepage for creating a new challenge
      navigate("/");
    },
    onSuccess: () => {
      toast({
        title: "Ready for a new challenge!",
        description: "Let's create another challenge to keep your momentum going.",
      });
    },
  });
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopiedLink(true);
        toast({
          title: "Copied to clipboard!",
          description: "Share link copied. Now you can share your achievement with others.",
        });
        
        // Reset the "Copied" state after 3 seconds
        setTimeout(() => setCopiedLink(false), 3000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Please copy the link manually.",
          variant: "destructive",
        });
      });
  };
  
  // Calculate stats
  const stats = {
    completionRate: 95, // This would normally come from API
    daysCompleted: challenge.duration,
    hoursSpent: 21.5, // This would normally come from API
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 -m-6 p-6 rounded-t-lg">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-white sm:mx-0 sm:h-16 sm:w-16">
              <img src="/images/discipline-icon.svg" alt="Discipline icon" className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-xl font-bold text-white">
                Congratulations!
              </DialogTitle>
              <div className="mt-2">
                <p className="text-lg text-primary-100">
                  Your Discipline Never Fails!
                </p>
                <p className="mt-2 text-sm text-white">
                  You've successfully completed the <span className="font-medium">{challenge.name}</span>. Your dedication has paid off!
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <div className="flex justify-center mb-4">
            <div className="h-48 flex flex-col items-center justify-center">
              <img src="/images/congrats-trophy.svg" alt="Trophy" className="h-40" />
              <div className="mt-2 text-primary-700 font-semibold text-lg">Achievement Unlocked!</div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-medium text-neutral-900">Challenge Summary</h4>
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-3 rounded-md">
                <div className="text-sm font-medium text-neutral-500">Duration</div>
                <div className="text-lg font-semibold text-neutral-800">{challenge.duration} Days</div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-md">
                <div className="text-sm font-medium text-neutral-500">Completion</div>
                <div className="text-lg font-semibold text-green-600">{stats.completionRate}%</div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-md">
                <div className="text-sm font-medium text-neutral-500">Hours Spent</div>
                <div className="text-lg font-semibold text-neutral-800">{stats.hoursSpent}</div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-medium text-neutral-900">Badges Earned</h4>
            <div className="mt-2 flex justify-center space-x-6">
              <div className="flex flex-col items-center">
                <img src="/images/streak-flame.svg" alt="Streak flame" className="h-14 w-14" />
                <span className="mt-2 text-xs text-neutral-700 font-medium">{challenge.duration}-Day Streak</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/images/calendar-check.svg" alt="Perfect week" className="h-14 w-14" />
                <span className="mt-2 text-xs text-neutral-700 font-medium">Perfect Week</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/images/achievement-badge.svg" alt="Achievement badge" className="h-14 w-14" />
                <span className="mt-2 text-xs text-neutral-700 font-medium">Dedication</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 mb-2">
              Want to share your achievement? Generate a link to show your journey!
            </p>
            <div className="flex items-center">
              <input 
                type="text" 
                readOnly 
                className="flex-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-neutral-300 rounded-md" 
                value={shareUrl}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={copyShareLink}
              >
                <i className={`fas fa-${copiedLink ? 'check' : 'copy'} mr-1`}></i> 
                {copiedLink ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => newChallengeMutation.mutate()}
            disabled={newChallengeMutation.isPending}
          >
            {newChallengeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Create New Challenge"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
