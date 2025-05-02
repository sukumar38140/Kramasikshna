import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createChallengeSchema } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Extending schema for form validation
const formSchema = z.object({
  name: z.string().min(3, "Challenge name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  duration: z.union([
    z.literal("21"),
    z.literal("45"),
    z.literal("90"),
    z.literal("180"),
    z.literal("365"),
    z.literal("custom"),
  ]),
  customDays: z.string().optional(),
  taskList: z.string().min(1, "At least one task is required"),
  enableReminders: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateChallengeModal({
  open,
  onOpenChange,
}: CreateChallengeModalProps) {
  const { toast } = useToast();
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "learning",
      duration: "21",
      customDays: "",
      taskList: "",
      enableReminders: true,
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/challenges", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Challenge created!",
        description: "Your new challenge has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Parse task list from text area (one task per line)
    const taskLines = values.taskList.split("\n").filter(line => line.trim() !== "");
    const tasks = taskLines.map(line => {
      const match = line.match(/(.+?)(?:\s*\((.+?)\))?$/);
      if (match) {
        return {
          name: match[1].trim(),
          scheduledTime: match[2]?.trim() || null,
        };
      }
      return { name: line.trim(), scheduledTime: null };
    });

    // Calculate duration based on selection
    let durationInDays: number;
    if (values.duration === "custom") {
      durationInDays = parseInt(values.customDays || "0", 10);
      if (isNaN(durationInDays) || durationInDays <= 0) {
        form.setError("customDays", {
          type: "manual",
          message: "Please enter a valid number of days",
        });
        return;
      }
    } else {
      durationInDays = parseInt(values.duration, 10);
    }

    const challenge = {
      name: values.name,
      category: values.category,
      duration: durationInDays,
      tasks,
      enableReminders: values.enableReminders,
    };

    createChallengeMutation.mutate(challenge);
  };

  // Handle duration change to show/hide custom days input
  const handleDurationChange = (value: string) => {
    form.setValue("duration", value as any);
    setShowCustomDuration(value === "custom");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Challenge</DialogTitle>
          <DialogDescription>
            Define your challenge details. Once created, tasks cannot be deleted.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Learn Python, Morning Workout" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select
                    onValueChange={handleDurationChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="21">21 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                      <SelectItem value="90">3 months (90 days)</SelectItem>
                      <SelectItem value="180">6 months (180 days)</SelectItem>
                      <SelectItem value="365">1 year (365 days)</SelectItem>
                      <SelectItem value="custom">Custom duration</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomDuration && (
              <FormField
                control={form.control}
                name="customDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        placeholder="Enter number of days"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="taskList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasks (Cannot be deleted once created)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="One task per line, e.g.:&#10;Learn Python loops (8:00 AM)&#10;Practice coding (2:00 PM)"
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    One task per line. You can specify time in parentheses.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Email Reminders</FormLabel>
                    <FormDescription>
                      Receive daily email reminders for your tasks
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createChallengeMutation.isPending}
              >
                {createChallengeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Challenge"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
