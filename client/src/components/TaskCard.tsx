import { Task, TaskStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/dates";
import { STATUS_CONFIG } from "@/lib/constants";
import { useUpdateTaskStatus,isSignedIn,signIn, initializeGisClient } from "@/hooks/useTasks";
import { Book, Clock, Edit2,Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { mutateAsync: updateTaskStatus, isPending } = useUpdateTaskStatus();
  const { toast } = useToast();
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!isSignedIn()) {
      await initializeGisClient();
      await signIn();
      return;
    }
    try {
      await updateTaskStatus({ taskId: task.id, status: newStatus });
      toast({
        title: "Status updated",
        description: `Task "${task.title}" status updated to ${STATUS_CONFIG[newStatus].label}.`,
      });
    } catch (error) {
      console.error('TaskCard: Status update failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task status. Please try again.",
      });
    }
  };
  
  const currentStatus = task.status;
  const statusConfig = STATUS_CONFIG[currentStatus];
  // Parse resources into tags
const resourceTags = task.resources
? task.resources.split(",").map(s => s.trim()).filter(Boolean)
: [];

  // Determine if the task is dimmed (for not_needed status)
  const isDimmed = currentStatus === 'not_needed';

  return (
    <Card className="overflow-hidden">
      <div className={`border-l-4 ${statusConfig.borderColor}`}>
        <div className="p-4">
          {/* Task header */}
          <div className="flex justify-between items-start">
            <div className={isDimmed ? "opacity-70" : ""}>
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
            <div className={`${statusConfig.bgColor} text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center`}>
            {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {statusConfig.label}
              </div>
              <div
                onClick={onEdit}
                className="h-8 w-8 bg-white bg-opacity-80 shadow-sm rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                role="button"
                aria-label="Edit task"
              >
                <Edit2 className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors duration-200" />
              </div>
              </div>
          </div>
          
          {/* Task metadata */}
          <div className="flex items-center mt-3 text-sm">
            <Clock className="text-gray-500 h-4 w-4 mr-1" />
            <span className="text-gray-500">{formatDuration(task.duration)}</span>
            
            {resourceTags.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <div className="flex items-center flex-wrap gap-1">
                  <Book className="text-gray-500 h-4 w-4 mr-1" />
                  {resourceTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Status buttons */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex space-x-2">
              <StatusButton 
                status="completed"
                isActive={currentStatus === 'completed'}
                onClick={() => handleStatusChange('completed')}
                isDisabled={updateTaskStatus.isPending}
              />
              <StatusButton 
                status="partial"
                isActive={currentStatus === 'partial'}
                onClick={() => handleStatusChange('partial')}
                isDisabled={updateTaskStatus.isPending}
              />
              <StatusButton 
                status="not_started"
                isActive={currentStatus === 'not_started'}
                onClick={() => handleStatusChange('not_started')}
                isDisabled={updateTaskStatus.isPending}
              />
              <StatusButton 
                status="not_needed"
                isActive={currentStatus === 'not_needed'}
                onClick={() => handleStatusChange('not_needed')}
                isDisabled={updateTaskStatus.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface StatusButtonProps {
  status: TaskStatus;
  isActive: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}

function StatusButton({ status, isActive, onClick, isDisabled = false }: StatusButtonProps) {
  const statusConfig = STATUS_CONFIG[status];
  const label = statusConfig.label;
  
  // Determine button styles based on active state
  const buttonClasses = isActive
    ? `${statusConfig.bgColor} ${statusConfig.textColor}`
    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700";
    
  return (
    <Button
      className={`flex-1 py-2 px-3 text-sm font-medium ${buttonClasses}`}
      onClick={onClick}
      disabled={isDisabled}
      variant="ghost"
    >
      {label}
    </Button>
  );
}
