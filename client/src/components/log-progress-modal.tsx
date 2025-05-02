import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task, logProgressSchema } from "@shared/schema";

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
import { Loader2 } from "lucide-react";

// Extend the schema for this form
const formSchema = z.object({
  hoursSpent: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Hours must be a positive number",
    })
    .optional(),
  status: z.enum(["completed", "partial", "no-action"]),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LogProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  challengeId: number;
}

export default function LogProgressModal({
  open,
  onOpenChange,
  task,
  challengeId,
}: LogProgressModalProps) {
  const { toast } = useToast();
  const [imageUploading, setImageUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hoursSpent: "",
      status: "completed",
      notes: "",
      imageUrl: "",
    },
  });

  const logProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/tasks/${task.id}/progress`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/activity"] });
      toast({
        title: "Progress logged!",
        description: "Your progress has been recorded successfully.",
      });
      onOpenChange(false);
      form.reset();
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Convert hours to minutes for storage
    const hoursSpent = values.hoursSpent ? parseFloat(values.hoursSpent) * 60 : undefined; // Convert to minutes
    
    const progressData = {
      taskId: task.id,
      date: new Date(),
      status: values.status,
      hoursSpent,
      notes: values.notes,
      imageUrl: values.imageUrl || previewUrl,
    };

    logProgressMutation.mutate(progressData);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload to server/S3 here
    // For this demo, we'll use a local preview
    setImageUploading(true);

    // Simulate upload delay
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        form.setValue("imageUrl", "uploaded-image-url.jpg"); // In reality, this would be the URL from your server
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Today's Progress</DialogTitle>
          <DialogDescription>
            Record your progress for <span className="font-medium">{task.name}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hoursSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent</FormLabel>
                  <FormControl>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        className="pr-12"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-neutral-500 sm:text-sm">hours</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="partial">Partially Completed</SelectItem>
                      <SelectItem value="no-action">No Action</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Evidence (Optional)</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md relative">
                {imageUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                <div className="space-y-1 text-center">
                  {previewUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-32 w-auto object-contain mb-2" 
                      />
                      <p className="text-xs text-neutral-500">
                        Image uploaded (cannot be deleted once saved)
                      </p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-neutral-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileUpload}
                            accept="image/*"
                            disabled={imageUploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-neutral-500">
                        PNG, JPG, GIF up to 10MB (cannot be deleted once uploaded)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes about today's progress" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setPreviewUrl(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={logProgressMutation.isPending || imageUploading}
              >
                {logProgressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Progress"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
