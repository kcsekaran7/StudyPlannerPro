import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings, RefreshCw, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/TaskCard";
import { DateNavigation } from "@/components/DateNavigation";
import { ProgressSummary } from "@/components/ProgressSummary";
import { Overview } from "@/components/Overview";
import { DataSourceSettings } from "@/components/DataSourceSettings";
import { TaskEditor } from "@/components/TaskEditor";
import { useTasksByDate, useAllTasks, useSyncTasks, signIn, isSignedIn  } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Task } from "@shared/schema";
import { TestPanel } from "@/components/TestPanel";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'daily' | 'overview'>('daily');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const { toast } = useToast();
  
  // Fetch tasks for selected date
  const { 
    data: dailyTasks = [], 
    isLoading: isDailyTasksLoading, 
    isError: isDailyTasksError,
    error: dailyTasksError,
    refetch: refetchDailyTasks
  } = useTasksByDate(selectedDate);
  
  // Fetch all tasks for overview
  const { 
    data: allTasks = [], 
    isLoading: isAllTasksLoading, 
    isError: isAllTasksError,
    error: allTasksError,
    refetch: refetchAllTasks
  } = useAllTasks();
  
  // Sync tasks mutation
  const syncTasksMutation = useSyncTasks();
  
  // Determine if any data is loading
  const isLoading = isDailyTasksLoading || isAllTasksLoading || syncTasksMutation.isPending;
  
  // Debug logs
  console.log('Home.tsx: isLoading:', isLoading);
  console.log('Home.tsx: hasError:', isDailyTasksError || isAllTasksError);
  console.log('Home.tsx: dailyTasks:', dailyTasks);
  console.log('Home.tsx: allTasks:', allTasks);
  console.log('Home.tsx: selectedDate:', selectedDate.toISOString());
  console.log('Home.tsx: activeTab:', activeTab);

  // Handle sign-in
const handleSignIn = async () => {
  try {
    await signIn();
    toast({
      title: "Signed in",
      description: "Successfully signed in with Google.",
    });
    // Refetch tasks after sign-in
    refetchDailyTasks();
    refetchAllTasks();
  } catch (error: any) {
    console.error("Sign-in failed:", error);
    toast({
      variant: "destructive",
      title: "Sign-in failed",
      description: error.message || "Could not sign in with Google. Please try again.",
    });
  }
};
  // Handle refresh/sync button click
  const handleSyncTasks = async () => {
    if (!isSignedIn()) {
      await handleSignIn();
      return;
    }
    try {
      await Promise.all([refetchDailyTasks(), refetchAllTasks()]);
      toast({
        title: "Study plan synchronized",
        description: "Your study plan has been updated with the latest data.",
      });
    } catch (error) {
      console.error("Home.tsx: handleSyncTasks failed:", error);
      toast({
        variant: "destructive",
        title: "Synchronization failed",
        description: "Could not sync your study plan. Please try again.",
      });
    }
  };

  // Open task editor for creating a new task
  const handleAddTask = () => {
  setEditingTask(undefined);
  setIsTaskEditorOpen(true);
};

const handleEditTask = (task: Task) => {
  setEditingTask(task);
  setIsTaskEditorOpen(true);
};
 
// Handle task creation/edit success
  const handleTaskSuccess = () => {
    // Refresh the tasks
    refetchDailyTasks();
    refetchAllTasks();
    setIsTaskEditorOpen(false);
  setEditingTask(undefined);
  };
  
  // Refetch data when tab changes
  useEffect(() => {
    if (isSignedIn()) {
    if (activeTab === 'daily') {
      refetchDailyTasks();
    } else {
      refetchAllTasks();
    }}
  }, [activeTab, refetchDailyTasks, refetchAllTasks, isSignedIn]);
  
  // Handle errors
  const hasError = isDailyTasksError || isAllTasksError;
  const errorMessage = (dailyTasksError || allTasksError)?.toString() || "Failed to load study plan data";
  
  
  // Unauthenticated state
  if (!isSignedIn()) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Study Plan Tracker</h1>
        <Button onClick={handleSignIn} className="gap-1">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-blue-700">Study Plan Tracker</h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSyncTasks}
              disabled={isLoading || isDailyTasksLoading || isAllTasksLoading}
              aria-label="Refresh data"
            >
              <RefreshCw 
                className={`h-5 w-5 text-blue-700 ${isDailyTasksLoading || isAllTasksLoading ? 'animate-spin' : ''}`} 
              />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 px-4 text-center border-b-2 ${
              activeTab === 'daily' 
                ? 'border-blue-700 text-blue-700 font-medium' 
                : 'border-transparent text-gray-500 font-medium hover:text-blue-700'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            Daily Plan
          </button>
          <button 
            className={`flex-1 py-3 px-4 text-center border-b-2 ${
              activeTab === 'overview' 
                ? 'border-blue-700 text-blue-700 font-medium' 
                : 'border-transparent text-gray-500 font-medium hover:text-blue-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Full Overview
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="container mx-auto px-4 py-6 flex">
          <div className="flex-1 p-6">
            {/* Loading State */}
            {isLoading ? (
              <LoadingState />
            ) : hasError ? (
              /* Error State */
              <ErrorState message={errorMessage} onRetry={activeTab === 'daily' ? refetchDailyTasks : refetchAllTasks} />
            ) : (
              /* Content based on active tab */
              <>
                {activeTab === 'daily' ? (
                  /* Daily Tab */
                  <>
                    {/* Date Navigation */}
                    <div className="flex justify-between items-center mb-6">
                      <DateNavigation
                        currentDate={selectedDate}
                        onDateChange={setSelectedDate}
                      />
            
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAddTask}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
            
                    {/* Progress Summary */}
                    {dailyTasks.length > 0 ? (
                      <ProgressSummary tasks={dailyTasks} />
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 text-center text-gray-500">
                        No tasks scheduled for this day
                      </div>
                    )}
            
                    {/* Task List */}
                    <div className="space-y-4">
                      {dailyTasks.map(task => (
                        <div key={task.id} className="cursor-pointer relative group">
                          <TaskCard task={task} onEdit={() => handleEditTask(task)} />
                        </div>
                      ))}
            
                      {dailyTasks.length === 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                          <p className="text-gray-500">No tasks scheduled for {selectedDate.toLocaleDateString()}</p>
                          <div className="flex justify-center space-x-3 mt-4">
                            <Button
                              variant="default"
                              onClick={handleAddTask}
                              className="gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add Task
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleSyncTasks}
                            >
                              Sync Study Plan
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Overview Tab */
                  <Overview tasks={allTasks || []} />
                )}
              </>
            )}
          </div>
          <div className="w-1/4 p-6 bg-gray-50 border-l border-gray-200 lg:block">
            <TestPanel />
          </div>
        </div>
      </main>
      
      {/* Data Source Settings Dialog */}
      <DataSourceSettings 
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      
      {/* Task Editor Dialog */}
      <TaskEditor
        isOpen={isTaskEditorOpen}
        onOpenChange={setIsTaskEditorOpen}
        task={editingTask}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full mb-2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex items-center mt-3 mb-3">
          <div className="h-4 bg-gray-200 rounded w-24 mr-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-px bg-gray-200 mb-3"></div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex items-center mt-3 mb-3">
          <div className="h-4 bg-gray-200 rounded w-24 mr-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-px bg-gray-200 mb-3"></div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        <Button 
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
