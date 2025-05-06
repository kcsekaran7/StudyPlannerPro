import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useAllTasks } from '@/hooks/useTasks';
import { Task } from '../../../shared/schema';

export function TestPanel() {
  const { data: tasks = [] } = useAllTasks();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const testTasks = tasks?.filter((task: Task) => {
    const isTestInTitle = /test|chaptest|phasetest|aits/i.test(task.title);
    const isTestInResources = task.resources ? /test|chaptest|phasetest|aits/i.test(task.resources) : false;
    const taskDate = new Date(task.scheduledDate);
    taskDate.setHours(0, 0, 0, 0);
    const isUpcoming = taskDate >= today;
    return (isTestInTitle || isTestInResources) && isUpcoming;
  }).sort((a: Task, b: Task) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()) ?? [];

  if (testTasks.length === 0) {
    return null;
  }

  return (
    <div className="h-full border-r bg-background">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          <h2 className="text-sm font-medium mb-4 text-muted-foreground">Upcoming Tests ({testTasks.length})</h2>
          {testTasks.map((task: Task) => (
            <Card key={task.id} className="border-t-4 border-blue-500 p-3">
              <div>
                <h3 className="font-small text-xs">{task.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(task.scheduledDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
