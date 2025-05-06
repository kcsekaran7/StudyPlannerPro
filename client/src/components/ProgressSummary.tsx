import { Task } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface ProgressSummaryProps {
  tasks: Task[];
}

export function ProgressSummary({ tasks }: ProgressSummaryProps) {
  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const partialTasks = tasks.filter(task => task.status === 'partial').length;
  
  // Count partial tasks as half completed for progress calculation
  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks + (partialTasks * 0.5)) / totalTasks * 100) 
    : 0;
  
  // We'll consider tasks that are either completed or partial as "done" for the counter
  const doneTasks = completedTasks + partialTasks;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Progress</h3>
      <Progress 
        value={progressPercentage} 
        className="h-2.5 mb-2" 
      />
      <div className="flex justify-between text-sm">
        <span>{progressPercentage}% complete</span>
        <span>{doneTasks}/{totalTasks} tasks</span>
      </div>
    </div>
  );
}
