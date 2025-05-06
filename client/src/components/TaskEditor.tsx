import { useState, useEffect  } from "react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSyncTasks, useDeleteTask ,initializeGisClient,isGisInitialized} from "@/hooks/useTasks";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "./TagInput";


const SUGGESTED_TAGS = [
  "RD Sharma",
  "Ahaguru",
  "Fiitjee Package",
  "PhysicsWallah",
  "NCERT",
  "HC Verma",
  "Tab",
  "ChapTest",
  "DPP",
  "PYP",
];

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.enum(["Math","Physics","Chemistry"],{required_error: "Please select a subject"}),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  description: z.string().optional(),
  resources: z.array(z.string()).optional() ,
  scheduledDate: z.date({
    required_error: "Please select a date",
  }),
});

// Infer the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

// Component props
interface TaskEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task; // If provided, we're editing; otherwise, we're creating
  onSuccess: () => void; // Callback to refresh task list
}


export function TaskEditor({ isOpen, onOpenChange, task, onSuccess }: TaskEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  const syncTasksMutation = useSyncTasks();
  const deleteTaskMutation = useDeleteTask();

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: task
      ? {
          title: task.title,
          subject: task.subject as "Math" | "Physics" | "Chemistry",
          duration: task.duration,
          description: task.description || "",
          resources: task.resources ?task.resources.split(",").map(s=>s.trim()).filter(Boolean):[],
          scheduledDate: new Date(task.scheduledDate),
        }
      : {
          title: "",
          subject: "Math",
          duration: 30,
          description: "",
          resources: [],
          scheduledDate: new Date(),
        },
  });

  useEffect(() => {
    console.log('TaskEditor: Task prop:', task);
    console.log('TaskEditor: Form defaultValues:', form.getValues());
    if (task) {
      form.reset({
        title: task.title,
        subject: task.subject as "Math" | "Physics" | "Chemistry",
        duration: task.duration,
        description: task.description || "",
        resources: task.resources ? task.resources.split(",").map(s => s.trim()).filter(Boolean) : [],
        scheduledDate: new Date(task.scheduledDate),
      });
    }
  }, [task, form]);

  const ensureGisInitialized = async () => {
    if (!isGisInitialized) {
      try {
        await initializeGisClient();
      } catch (error) {
        console.error("TaskEditor: GIS initialization failed:", error);
        throw new Error("Failed to initialize Google Identity Services");
      }
    }
  };

 const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await ensureGisInitialized();
      await syncTasksMutation.mutateAsync({
        id: task?.id,
        title: values.title,
        subject: values.subject,
        duration: values.duration,
        description: values.description,
        resources: values.resources.join(","),
        scheduledDate: format(values.scheduledDate, "yyyy-MM-dd"),
        cloudId: task?.cloudId,
        status: task?.status,
      });
      toast({
        title: task ? "Task updated" : "Task created",
        description: `Your task has been ${task ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("TaskEditor: Mutation failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${task ? "update" : "create"} task. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("TaskEditor: Delete failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {task 
              ? "Update the details of your study task." 
              : "Fill in the details for your new study task."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Subject Field */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Math">Math</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Duration Field */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={30}
                      placeholder="e.g. 30" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date Field */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover  open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={isSubmitting}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={isSubmitting}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you need to study or accomplish"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Resources Field */}
            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resources</FormLabel>
                  <FormControl>
                    <TagInput value={field.value|| []} onChange={field.onChange} disabled={isSubmitting} suggestions={SUGGESTED_TAGS}                      
                      
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              {task && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : task ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}