import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Task, WeeklyProgress, SubjectProgress, UpcomingTask } from "@/types";
import { getCurrentWeekDates, getShortDayName, getRelativeDayDescription } from "@/lib/dates";
import { formatDuration } from "@/lib/dates";

interface OverviewProps {
  tasks: Task[];
}

export function Overview({ tasks }: OverviewProps) {
  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    const weekDates = getCurrentWeekDates();
    
    return weekDates.map(date => {
      // Format date for comparison (YYYY-MM-DD)
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        // Handle both string dates and Date objects
        const taskDate = typeof task.scheduledDate === 'string' 
          ? task.scheduledDate.split('T')[0]  // For string ISO dates
          : new Date(task.scheduledDate).toISOString().split('T')[0];  // For Date objects
        
        return taskDate === dateStr;
      });
      
      const totalTasks = dayTasks.length;
      if (totalTasks === 0) return { 
        day: date.toISOString(), 
        shortDay: getShortDayName(date), 
        percentage: 0 
      };
      
      const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
      const partialTasks = dayTasks.filter(task => task.status === 'partial').length;
      
      const percentage = Math.round((completedTasks + (partialTasks * 0.5)) / totalTasks * 100);
      
      return {
        day: date.toISOString(),
        shortDay: getShortDayName(date),
        percentage
      };
    });
  }, [tasks]);
  
  // Calculate subject breakdown
  const subjectProgress = useMemo(() => {
    const subjects = new Map<string, { total: number; completed: number; partial: number }>();
    
    tasks.forEach(task => {
      if (!subjects.has(task.subject)) {
        subjects.set(task.subject, { total: 0, completed: 0, partial: 0 });
      }
      
      const subjectData = subjects.get(task.subject)!;
      subjectData.total++;
      
      if (task.status === 'completed') {
        subjectData.completed++;
      } else if (task.status === 'partial') {
        subjectData.partial++;
      }
    });
    
    return Array.from(subjects.entries()).map(([subject, data]) => {
      const percentage = Math.round(
        (data.completed + (data.partial * 0.5)) / data.total * 100
      );
      
      return {
        subject,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [tasks]);
  
  // Calculate upcoming tasks
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter for tasks after today and sort by date
    const filteredTasks = tasks
      .filter(task => {
        // Handle both string dates and Date objects
        const taskDate = typeof task.scheduledDate === 'string' 
          ? task.scheduledDate.split('T')[0]  // For string ISO dates
          : new Date(task.scheduledDate).toISOString().split('T')[0];  // For Date objects
          
        return taskDate > todayStr && task.status === 'not_started';
      })
      .sort((a, b) => {
        // Convert both to strings for comparison
        const aDate = typeof a.scheduledDate === 'string'
          ? a.scheduledDate
          : new Date(a.scheduledDate).toISOString();
          
        const bDate = typeof b.scheduledDate === 'string'
          ? b.scheduledDate
          : new Date(b.scheduledDate).toISOString();
          
        return aDate.localeCompare(bDate);
      });
    
    // Take the first 5 tasks
    return filteredTasks.slice(0, 5).map(task => {
      // Convert scheduledDate to string if it's a Date object
      const dateStr = typeof task.scheduledDate === 'string'
        ? task.scheduledDate
        : new Date(task.scheduledDate).toISOString();
        
      return {
        id: task.id,
        title: task.title,
        date: dateStr,
        relativeDay: getRelativeDayDescription(dateStr),
        duration: task.duration,
        status: task.status
      };
    });
  }, [tasks]);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Study Plan Overview</h2>
      
      {/* Weekly Progress */}
      <Card className="p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Weekly Progress</h3>
        <div className="flex justify-between mb-1">
          {weeklyProgress.map((day) => (
            <div key={day.day} className="flex-1 mx-1 text-center">
              <div className="text-xs text-gray-500 mb-1">{day.shortDay}</div>
              <div className="relative pt-1">
                <div className="h-16 bg-gray-200 rounded">
                  <div 
                    className={`${getProgressBarColor(day.percentage)} h-full rounded-t`} 
                    style={{ height: `${day.percentage || 0}%` }} 
                    title={`${day.percentage}%`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Subject Breakdown */}
      <Card className="p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Subject Breakdown</h3>
        <div className="space-y-4">
          {subjectProgress.map((subject) => (
            <div key={subject.subject}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{subject.subject}</span>
                <span className="text-sm text-gray-500">{subject.percentage}%</span>
              </div>
              <Progress value={subject.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </Card>
      
      {/* Upcoming Tasks */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-500">Upcoming Tasks</h3>
        </div>
        
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.relativeDay}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {formatDuration(task.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-3">
            No upcoming tasks
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper to get color based on percentage
function getProgressBarColor(percentage: number): string {
  if (percentage === 0) return 'bg-gray-200';
  if (percentage < 40) return 'bg-red-500';
  if (percentage < 70) return 'bg-orange-500';
  return 'bg-green-500';
}
