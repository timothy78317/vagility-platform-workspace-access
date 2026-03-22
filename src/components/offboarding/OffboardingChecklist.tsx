import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Employee, LifecycleTask } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  AlertTriangle,
  Shield,
  Laptop,
  Key,
  FileText,
  Mail,
  User,
  UserPlus,
  Check,
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card } from '@vagility/design-system';
import { useLifecycleTasks, useUpdateTask } from '@/hooks/use-lifecycle-tasks';
import { useApplications, useUpdateAppAccess } from '@/hooks/use-applications';
import { useEmployees, useUpdateEmployeeRoles, useDeleteEmployee } from '@/hooks/use-employees';
import { supabase } from '@/integrations/supabase/client';

interface OffboardingChecklistProps {
  employee?: Employee;
  onComplete?: (employee: Employee, completedTasks: any[]) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Laptop,
  Key,
  FileText,
  Mail,
};

export function OffboardingChecklist({ employee, onComplete }: OffboardingChecklistProps) {
  const { data: tasks = [], refetch: refetchTasks } = useLifecycleTasks(employee?.id);
  const { data: applications = [] } = useApplications();
  const { data: teamMembers = [] } = useEmployees();
  const updateTask = useUpdateTask();
  const updateAccess = useUpdateAppAccess();
  const updateRoles = useUpdateEmployeeRoles();
  const deleteEmployee = useDeleteEmployee();
  const navigate = useNavigate();

  const [endDate, setEndDate] = useState<Date | undefined>(employee?.endDate);
  const [isPurgeSelected, setIsPurgeSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setEndDate(employee.endDate);
    }
  }, [employee]);

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask.mutate({ taskId, completed: !completed });
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      const { error } = await supabase
        .from('lifecycle_tasks')
        .update({ assignee_id: assigneeId === 'unassigned' ? null : assigneeId })
        .eq('id', taskId);

      if (error) throw error;

      const assignee = teamMembers.find(m => m.id === assigneeId);
      if (assignee) {
        toast.success(`Task assigned to ${assignee.firstName}`);
      } else {
        toast.info('Task unassigned');
      }
      refetchTasks();
    } catch (error: any) {
      toast.error('Failed to assign task', { description: error.message });
    }
  };

  const handleBulkAssign = async (assigneeId: string) => {
    if (assigneeId === 'unassigned') return;

    try {
      const { error } = await supabase
        .from('lifecycle_tasks')
        .update({ assignee_id: assigneeId })
        .eq('profile_id', employee!.id)
        .eq('type', 'offboarding');

      if (error) throw error;

      toast.success(`All tasks assigned to ${teamMembers.find(m => m.id === assigneeId)?.firstName}`);
      refetchTasks();
    } catch (error: any) {
      toast.error('Failed to bulk assign tasks', { description: error.message });
    }
  };

  const handleRevokeApp = async (appId: string, currentlyGranted: boolean) => {
    try {
      await updateAccess.mutateAsync({ profileId: employee!.id, applicationId: appId, granted: !currentlyGranted });
      if (currentlyGranted) {
        toast.success("Application access revoked");
      } else {
        toast.info("Application access restored");
      }
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleRevokeAll = async () => {
    const activeApps = employee?.access?.filter(a => a.granted) || [];
    if (activeApps.length === 0) return;

    try {
      for (const access of activeApps) {
        await updateAccess.mutateAsync({ profileId: employee!.id, applicationId: access.applicationId, granted: false });
      }
      toast.success('All active application access has been revoked');
    } catch (err) {
      toast.error('Failed to revoke all access');
    }
  };

  const offboardingTasks = tasks.filter(t => t.type === 'offboarding');
  const allTasksCompleted = offboardingTasks.every(task => task.completed);
  const completedTasksCount = offboardingTasks.filter(t => t.completed).length;

  const handleSubmit = async () => {
    if (!allTasksCompleted) {
      toast.error('Cannot complete offboarding', {
        description: 'All tasks must be marked as done before completing the offboarding.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRoles.mutateAsync({ profileId: employee!.id, roleIds: [] });

      if (isPurgeSelected) {
        await deleteEmployee.mutateAsync(employee!.id);
        toast.success('Member record permanently purged from platform');
        navigate('..'); 
        return;
      }

      const { error } = await supabase
        .from('profiles_private')
        .update({
          onboarding_status: 'offboarded',
          end_date: endDate?.toISOString() || new Date().toISOString(),
          archived_at: new Date().toISOString()
        })
        .eq('id', employee!.id);

      if (error) throw error;

      toast.success('Offboarding completed and roles revoked', {
        description: `${employee?.access?.filter(a => !a.granted).length || 0} system apps revoked and all platform roles cleared.`,
      });

      if (onComplete && employee) {
        onComplete(employee, offboardingTasks);
      } else {
        navigate('..');
      }
    } catch (error: any) {
      toast.error('Failed to complete offboarding', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Warning Banner */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-left">
          <h4 className="font-semibold text-destructive">Offboarding Action Required</h4>
          <p className="text-sm text-destructive/80 mt-1">
            This action will permanently revoke access to all selected applications and cannot be undone.
          </p>
        </div>
      </div>

      {employee && (
        <Card variant="elevated" padding="lg" className="bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground text-left">Employee Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{employee.firstName} {employee.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium text-foreground">{employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">{employee.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium text-foreground">{format(employee.startDate, 'MMM d, yyyy')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Checklist */}
      <Card variant="elevated" padding="lg" className="bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-foreground">Offboarding Checklist</h3>
            <Select onValueChange={handleBulkAssign}>
              <SelectTrigger className="h-8 text-[10px] w-48 bg-muted/50 border-border uppercase font-black tracking-widest text-muted-foreground">
                <SelectValue placeholder="Bulk Assign All Tasks" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id} className="text-xs">
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant={allTasksCompleted ? "default" : "secondary"} className={cn(
            allTasksCompleted && "bg-success text-success-foreground"
          )}>
            {completedTasksCount}/{offboardingTasks.length} completed
          </Badge>
        </div>

        <div className="space-y-4">
          {offboardingTasks.map(task => {
            const Icon = iconMap[task.icon] || FileText;
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  task.completed
                    ? "bg-success/5 border-success/20"
                    : "border-border"
                )}
              >
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                  className="mt-1"
                />
                <Icon className={cn(
                  "h-5 w-5 mt-0.5",
                  task.completed ? "text-success" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0 text-left">
                  <Label
                    htmlFor={task.id}
                    className={cn(
                      "font-medium cursor-pointer block text-foreground",
                      task.completed && "line-through text-muted-foreground font-normal"
                    )}
                  >
                    {task.label}
                  </Label>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                  )}
                </div>

                <div className="flex-shrink-0 w-44">
                  <Select
                    value={task.assigneeId || 'unassigned'}
                    onValueChange={(value) => handleAssignTask(task.id, value)}
                  >
                    <SelectTrigger className="h-9 text-sm bg-muted border-border text-foreground">
                      <div className="flex items-center gap-2">
                        {task.assigneeId ? (
                          <>
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue />
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Assign</span>
                          </>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('..')}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !allTasksCompleted}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          {isSubmitting ? 'Processing...' : 'Complete Offboarding'}
        </Button>
      </div>
    </div>
  );
}
