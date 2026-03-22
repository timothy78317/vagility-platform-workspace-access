import { useState } from 'react';
import { Card, PageLayout, Progress } from '@vagility/design-system';
import {
    Shield,
    Laptop,
    Key,
    FileText,
    Mail,
    User,
    LogOut,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLifecycleTasks, useUpdateTask } from '@/hooks/use-lifecycle-tasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PersonalOffboardViewProps {
    user: any;
    profile: any;
}

const iconMap: Record<string, any> = {
    Shield,
    Laptop,
    Key,
    FileText,
    Mail,
    User
};

export function PersonalOffboardView({ user, profile }: PersonalOffboardViewProps) {
    const { data: tasks = [], isLoading, refetch } = useLifecycleTasks(user?.id);
    const updateTask = useUpdateTask();

    // Filter tasks specifically for the offboarding type
    const offboardingTasks = tasks.filter((t: any) => t.type === 'offboarding');
    const completedCount = offboardingTasks.filter(t => t.completed).length;
    const progressPercent = offboardingTasks.length > 0 ? (completedCount / offboardingTasks.length) * 100 : 0;

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        await updateTask.mutateAsync({ taskId, completed: !currentStatus });
        refetch();
    };

    if (isLoading) return <div className="p-12 text-center text-foreground font-medium animate-pulse">Closing workspace perimeter...</div>;

    return (
        <PageLayout
            title={`Workspace Exit Protocol`}
            subtitle="Your account is scheduled for departure. Please complete the tasks below."
            noPadding
        >
            <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-destructive/20 pb-8">
                    <div className="space-y-1">
                        <Badge variant={"outline" as any} className="bg-destructive/10 text-destructive border-destructive/20 font-black px-3 py-1 text-[10px] uppercase tracking-widest mb-2">
                           Departure Mode Active
                        </Badge>
                        <h3 className="font-black text-4xl tracking-tighter uppercase italic text-foreground">
                            Goodbye, {profile?.first_name || 'Expert'}
                        </h3>
                        <p className="text-muted-foreground font-medium">Finalizing your workspace tenure.</p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 min-w-[240px] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">Exit Progress</span>
                            <span className="text-xs font-black text-foreground">{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2 bg-muted" />
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 flex items-start gap-5 border-l-8 border-l-destructive shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-left">
                        <h4 className="text-lg font-black text-foreground tracking-tight uppercase">Restricted Workspace Access</h4>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                            Your access has been limited to the Identity portal for exit task completion. All other modules are suspended.
                        </p>
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {offboardingTasks.length > 0 ? offboardingTasks.map((task) => {
                        const Icon = iconMap[task.icon] || FileText;
                        return (
                            <Card
                                key={task.id}
                                variant="elevated"
                                padding="none"
                                className={cn(
                                    "group transition-all duration-300 border-l-4 rounded-3xl overflow-hidden",
                                    task.completed ? "border-l-success bg-success/5" : "border-l-destructive bg-card hover:bg-muted/50"
                                )}
                            >
                                <div className="p-6 flex items-center gap-6">
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-sm",
                                        task.completed ? "bg-success/20 text-success" : "bg-destructive/10 text-destructive"
                                    )}>
                                        {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <h4 className={cn("font-bold text-base tracking-tight text-foreground", task.completed && "text-muted-foreground line-through")}>
                                            {task.label}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1 italic">{task.description}</p>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={task.completed ? "ghost" : "default"}
                                        className={cn(
                                            "rounded-xl px-5 font-black text-[10px] uppercase tracking-widest h-9 transition-all shadow-md",
                                            !task.completed && "bg-destructive hover:bg-destructive/90 shadow-destructive/10"
                                        )}
                                        onClick={() => handleToggleTask(task.id, task.completed)}
                                    >
                                        {task.completed ? "Verified" : "Action"}
                                    </Button>
                                </div>
                            </Card>
                        );
                    }) : (
                        <div className="col-span-full p-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20">
                            <p className="text-muted-foreground italic font-medium">No departure tasks detected.</p>
                        </div>
                    )}
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row gap-8 items-start justify-between">
                   <div className="space-y-4 text-left">
                      <h5 className="font-black flex items-center gap-2 text-foreground tracking-tighter uppercase text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Departure Protocol
                      </h5>
                      <p className="text-xs text-muted-foreground italic max-w-md leading-relaxed">
                          Once all verified, the system administrator will finalize your departure sequence and archive your record. 
                          We appreciate your service within the Vagility ecosystem.
                      </p>
                   </div>
                   <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] text-muted-foreground hover:text-destructive gap-2 font-black uppercase tracking-widest h-10 px-8 rounded-xl border border-border"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = "/auth";
                        }}
                    >
                        <LogOut className="h-3 w-3" />
                        Purge Credentials
                    </Button>
                </div>
            </div>
        </PageLayout>
    );
}
