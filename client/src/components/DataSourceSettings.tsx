import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSyncTasks } from "@/hooks/useTasks";
import { DEFAULT_DATA_SOURCE } from "@/lib/constants";
import { Lightbulb, Database } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  dataSourceUrl: z.string().url("Please enter a valid URL"),
});

type FormValues = z.infer<typeof formSchema>;

interface DataSourceSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataSourceSettings({ isOpen, onOpenChange }: DataSourceSettingsProps) {
  const { toast } = useToast();
  const syncTasksMutation = useSyncTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("external");

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataSourceUrl: DEFAULT_DATA_SOURCE,
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await syncTasksMutation.mutateAsync(values.dataSourceUrl);
      toast({
        title: "Data source updated",
        description: "Your study plan has been synchronized with the new data source.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Synchronization failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to sync with the data source. Please check the URL and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to default source
  const resetToDefault = () => {
    form.setValue("dataSourceUrl", DEFAULT_DATA_SOURCE);
  };

  // Use sample data
  const useSampleData = async () => {
    setIsSubmitting(true);
    try {
      await syncTasksMutation.mutateAsync("sample");
      toast({
        title: "Sample data loaded",
        description: "Your study plan has been populated with sample data for demonstration.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load sample data",
        description: "An error occurred while loading sample data.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Data Source Settings</DialogTitle>
          <DialogDescription>
            Configure the data source for your study plan.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              External Source
            </TabsTrigger>
            <TabsTrigger value="sample" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Sample Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="external" className="space-y-4 mt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataSourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of your study plan Google Data Sheet.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex justify-between sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetToDefault}
                    disabled={isSubmitting}
                  >
                    Reset to Default
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Syncing..." : "Save & Sync"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="sample" className="space-y-4 mt-2">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Using Sample Data</h3>
                <p className="text-sm text-blue-700">
                  This will load a set of sample tasks to demonstrate the application's features. 
                  Any existing tasks will be kept, with new sample tasks added.
                </p>
              </div>
              
              <DialogFooter className="flex justify-end">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={useSampleData}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Loading..." : "Load Sample Data"}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}