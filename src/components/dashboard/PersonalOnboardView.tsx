import { useState } from 'react';
import { Card, PageLayout, Progress } from '@vagility/design-system';
import {
    Lock,
    UserCircle,
    FileCheck,
    ShieldCheck,
    Rocket,
    CheckCircle2,
    Clock,
    ArrowRight,
    Camera,
    Shield,
    User,
    PartyPopper,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLifecycleTasks, useUpdateTask } from '@/hooks/use-lifecycle-tasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalOnboardViewProps {
    user: any;
    profile: any;
}

export function PersonalOnboardView({ user, profile: initialProfile }: PersonalOnboardViewProps) {
    const { data: tasks = [], isLoading, refetch } = useLifecycleTasks(user?.id);
    const updateTask = useUpdateTask();
    const [profile, setProfile] = useState(initialProfile);

    // Modal States
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState(profile?.first_name || "");
    const [lastName, setLastName] = useState(profile?.last_name || "");

    // Filter tasks specifically for the employee
    const employeeTasks = tasks.filter((t: any) => t.isEmployeeTask);
    const completedCount = employeeTasks.filter(t => t.completed).length;
    const progressPercent = employeeTasks.length > 0 ? (completedCount / employeeTasks.length) * 100 : 0;

    const handleStartTask = (task: any) => {
        if (task.completed) {
            toast.info("Task already completed");
            return;
        }

        if (task.label.includes('Security')) {
            setActiveModal('security');
        } else if (task.label.includes('Identity')) {
            setActiveModal('identity');
        } else if (task.label.includes('Document')) {
            setActiveModal('documents');
        } else {
            handleToggleTask(task.id, false);
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        await updateTask.mutateAsync({ taskId, completed: !currentStatus });
        refetch();
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            const securityTask = employeeTasks.find(t => t.label.includes('Security'));
            if (securityTask) {
                await handleToggleTask(securityTask.id, false);
            }

            toast.success("Security credentials updated");
            setActiveModal(null);
        } catch (error: any) {
            toast.error("Update failed", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ first_name: firstName, last_name: lastName })
                .eq('id', user.id);

            if (error) throw error;

            setProfile({ ...profile, first_name: firstName, last_name: lastName });

            const identityTask = employeeTasks.find(t => t.label.includes('Identity'));
            if (identityTask) {
                await handleToggleTask(identityTask.id, false);
            }

            toast.success("Digital identity verified");
            setActiveModal(null);
        } catch (error: any) {
            toast.error("Update failed", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-foreground font-medium animate-pulse">Synchronizing deployment...</div>;

    return (
        <PageLayout 
            title={`Welcome, ${profile?.first_name || 'Expert'}!`} 
            description="Complete the following workspace activation sequence to gain full ERP access."
            noPadding
        >
          <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
            {/* Progress Visualization */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
                <div className="space-y-1">
                    <h3 className="font-black text-2xl tracking-tighter uppercase italic">Activation Lifecycle</h3>
                    <p className="text-muted-foreground font-medium">Progress to Full Identity Verification</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 min-w-[240px] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Path</span>
                        <span className="text-xs font-black text-foreground">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-muted" />
                </div>
            </div>

            {/* Success Deployment */}
            {progressPercent === 100 && (
                <Card variant="elevated" padding="none" className="rounded-[2rem] bg-gradient-to-br from-success/5 via-background to-background border-2 border-success/20 p-8 overflow-hidden animate-in zoom-in-95 duration-700 shadow-xl text-left">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="h-20 w-20 rounded-2xl bg-success flex items-center justify-center text-success-foreground shadow-lg shadow-success/20 shrink-0">
                            <PartyPopper className="h-10 w-10" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-foreground tracking-tight">Identity Fully Verified</h4>
                                <p className="text-muted-foreground font-medium leading-relaxed italic">
                                    Your security profile is active. You may now enter the platform dashboard.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                className="bg-success hover:bg-success/90 text-success-foreground font-black px-8 h-12 rounded-xl shadow-lg shadow-success/20 text-sm group transition-all"
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        const { error } = await supabase.rpc('complete_workspace_activation');
                                        if (error) throw error;
                                        window.location.href = "/";
                                    } catch (err: any) {
                                        toast.error("Handshake failed", { description: err.message });
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Syncing..." : "Enter Workspace"}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {employeeTasks.length > 0 ? employeeTasks.map((task) => (
                    <Card
                        key={task.id}
                        variant="elevated"
                        padding="none"
                        className={cn(
                            "group transition-all duration-300 border-l-4 rounded-3xl overflow-hidden",
                            task.completed ? "border-l-success bg-success/5" : "border-l-accent bg-card hover:border-l-accent/60"
                        )}
                    >
                        <div className="p-6 flex items-center gap-5">
                            <div className={cn(
                                "h-12 w-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-105 shrink-0",
                                task.completed ? "bg-success/20 text-success" : "bg-accent/10 text-accent"
                            )}>
                                {task.completed ? <CheckCircle2 className="h-6 w-6" /> :
                                    task.label.includes('Security') ? <Shield className="h-6 w-6" /> :
                                        task.label.includes('Identity') ? <User className="h-6 w-6" /> :
                                            <Clock className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 space-y-1">
                                <h4 className={cn("font-bold text-base tracking-tight", task.completed && "text-muted-foreground line-through")}>
                                    {task.label}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-1 italic">{task.description}</p>
                            </div>

                            <Button
                                size="sm"
                                variant={task.completed ? "ghost" : "default"}
                                className={cn(
                                    "rounded-xl px-4 font-bold text-[10px] h-9 transition-all uppercase tracking-widest",
                                    !task.completed && "bg-accent hover:bg-accent/90 shadow-md shadow-accent/10"
                                )}
                                onClick={() => handleStartTask(task)}
                            >
                                {task.completed ? "Verified" : "Action"}
                            </Button>
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-full p-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20">
                        <p className="text-muted-foreground italic font-medium">No activation tasks assigned yet.</p>
                    </div>
                )}
            </div>
            
            <div className="pt-8 border-t border-border flex flex-col md:flex-row gap-8 items-start">
               <div className="flex-1 space-y-4 text-left">
                  <h5 className="font-black flex items-center gap-2 text-foreground tracking-tighter uppercase text-sm">
                      <ShieldCheck className="h-4 w-4 text-success" />
                      Digital Perimeter
                  </h5>
                  <p className="text-sm text-muted-foreground italic max-w-lg">
                      Your workspace credentials and identity metadata are protected by the platform's core security layer. Complete the tasks above to finalize your integration.
                  </p>
               </div>
               <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-muted-foreground hover:text-destructive gap-2 font-black uppercase tracking-widest h-10 px-6 rounded-xl border border-border"
                    onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/auth";
                    }}
                >
                    <LogOut className="h-3 w-3" />
                    Sign Out & Abort
                </Button>
            </div>
          </div>

            {/* Modals */}
            <Dialog open={activeModal === 'security'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-md bg-card border-border rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <Shield className="h-5 w-5 text-accent" />
                            Security Credentials
                        </DialogTitle>
                        <DialogDescription className="text-left text-xs italic">
                            Provision your persistent password for the Vagility ERP.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-muted border-border h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-muted border-border h-12 rounded-xl"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-12 rounded-xl font-bold" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Seal Security"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeModal === 'identity'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-md bg-card border-border rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <User className="h-5 w-5 text-accent" />
                            Digital Identity
                        </DialogTitle>
                        <DialogDescription className="text-left text-xs italic">
                            Validate your primary identifier for workspace communications.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateIdentity} className="space-y-4 py-4 text-left">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First Name</Label>
                                <Input
                                    id="first-name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="bg-muted border-border h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last Name</Label>
                                <Input
                                    id="last-name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="bg-muted border-border h-12 rounded-xl"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-12 rounded-xl font-bold" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Verify Identity"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeModal === 'documents'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-md bg-card border-border rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <FileCheck className="h-5 w-5 text-accent" />
                            Standard Documentation
                        </DialogTitle>
                        <DialogDescription className="text-left text-xs italic">
                            Transmit your signed documentation for compliance auditing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-center space-y-4">
                        <div className="p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Select Files</p>
                            <Button variant="outline" size="sm" className="mt-4 rounded-xl font-bold">Browse Files</Button>
                        </div>
                        <Button
                            className="w-full bg-accent hover:bg-accent/90 h-12 rounded-xl font-bold"
                            onClick={async () => {
                                const docTask = employeeTasks.find(t => t.label.includes('Document'));
                                if (docTask) await handleToggleTask(docTask.id, false);
                                setActiveModal(null);
                                toast.success("Documents submitted");
                            }}
                        >
                            Complete Task
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
