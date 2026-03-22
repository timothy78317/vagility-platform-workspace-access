import { useState } from 'react';
import { OffboardingChecklist } from '@/components/offboarding/OffboardingChecklist';
import { Employee, OffboardingReason, offboardingReasonLabels } from '@/types/employee';
import { PageLayout, StatCard, StatsGrid, Card } from '@vagility/design-system';
import { ArrowLeft, Search, UserMinus, Clock, GraduationCap, AlertTriangle, CheckCircle2, Shield, Mail, Laptop, FileText, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEmployees } from '@/hooks/use-employees';
import { useBulkCreateTasks } from '@/hooks/use-lifecycle-tasks';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Offboarding = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading, refetch } = useEmployees();
  const createTasks = useBulkCreateTasks();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [employeeToOffboard, setEmployeeToOffboard] = useState<Employee | null>(null);
  const [selectedReason, setSelectedReason] = useState<OffboardingReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [completedEmployee, setCompletedEmployee] = useState<Employee | null>(null);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);

  const activeEmployees = employees.filter(e =>
    e.status === 'active' &&
    (searchQuery === '' ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingOffboardingEmployees = employees.filter(e =>
    e.status === 'pending_offboarding' &&
    (searchQuery === '' ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const offboardedEmployees = employees.filter(e => e.status === 'offboarded');

  const handleOpenReasonDialog = (employee: Employee) => {
    setEmployeeToOffboard(employee);
    if (employee.role.toLowerCase().includes('intern')) {
      setSelectedReason('internship_end');
    } else {
      setSelectedReason('');
    }
    setReasonNotes('');
    setShowReasonDialog(true);
  };

  const handleConfirmOffboarding = async () => {
    if (!employeeToOffboard || !selectedReason) return;

    try {
      const { error: privateError } = await supabase
        .from('profiles_private')
        .update({
          onboarding_status: 'pending_offboarding',
          offboarding_reason: selectedReason,
          end_date: new Date().toISOString(),
          archived_at: new Date().toISOString(),
        })
        .eq('id', employeeToOffboard.id);

      if (privateError) throw privateError;

      const { data: roleData } = await supabase
        .from('platform_roles')
        .select('id')
        .eq('name', 'Offboarding')
        .maybeSingle();

      if (roleData) {
        await supabase.from('profile_roles').delete().eq('profile_id', employeeToOffboard.id);
        await supabase.from('profile_roles').insert({
          profile_id: employeeToOffboard.id,
          role_id: roleData.id
        });
      }

      await supabase
        .from('lifecycle_tasks')
        .delete()
        .eq('profile_id', employeeToOffboard.id)
        .eq('is_completed', false);

      const defaultTasks = [
        { label: 'Revoke SSO & Platform Access', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'Shield', description: 'Disable Okta/SSO and primary cloud accounts.' },
        { label: 'Deactivate Company Email', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'Mail', description: 'Disable email and set auto-responder if needed.' },
        { label: 'Recover Company Hardware', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'Laptop', description: 'Collect laptop, monitors, and peripherals.' },
        { label: 'Conduct Exit Interview', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'User', description: 'Schedule meeting with HR and direct manager.' },
        { label: 'Final Payroll Clearance', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'FileText', description: 'Process final working hours and vacation payout.' },
        { label: 'Collect Security Badge', type: 'offboarding', profile_id: employeeToOffboard.id, icon: 'Key', description: 'Deactivate and retrieve physical access badge.' },
      ];

      await createTasks.mutateAsync(defaultTasks);

      toast.success(`Offboarding started for ${employeeToOffboard.firstName} ${employeeToOffboard.lastName}`);

      setShowReasonDialog(false);
      refetch();
      setSelectedEmployee({
        ...employeeToOffboard,
        status: 'pending_offboarding',
        offboardingReason: selectedReason as OffboardingReason
      });
      setEmployeeToOffboard(null);
    } catch (error: any) {
      toast.error('Failed to start offboarding', { description: error.message });
    }
  };

  const getReasonIcon = (reason?: OffboardingReason) => {
    switch (reason) {
      case 'internship_end':
        return <GraduationCap className="h-3.5 w-3.5" />;
      case 'termination':
      case 'layoff':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const handleOffboardingCompleted = (employee: Employee, tasks: any[]) => {
    setSelectedEmployee(null);
    setCompletedEmployee(employee);
    setCompletedTasks(tasks);
  };

  if (completedEmployee) {
    return (
      <PageLayout
        title="Offboarding Complete"
        description={`${completedEmployee.firstName} ${completedEmployee.lastName} has been successfully offboarded.`}
      >
        <div className="space-y-6">
          <div className="bg-success/10 border border-success/20 rounded-2xl p-6 flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div className="text-left">
              <h3 className="text-lg font-bold text-success">Offboarding Finalized</h3>
              <p className="text-sm text-success/80 mt-1">All tasks completed, access revoked, record archived.</p>
            </div>
          </div>

          <Card variant="elevated" padding="lg" className="bg-card border-border text-left">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Employee Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{completedEmployee.firstName} {completedEmployee.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">{completedEmployee.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{completedEmployee.role}</p>
              </div>
            </div>
          </Card>

          <Button variant="outline" onClick={() => { setCompletedEmployee(null); refetch(); }}>
            Back to Offboarding Hub
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) return <div className="p-12 text-center animate-pulse font-black uppercase tracking-tighter italic">Loading Lifecycle Control...</div>;

  return (
    <PageLayout
      title={selectedEmployee ? `Offboarding: ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Lifecycle Control Hub"}
      description={selectedEmployee ? `Executing departure sequence...` : "Manage employee lifecycle, departures, and access revocation."}
      noPadding
    >
      {!selectedEmployee ? (
        <div className="space-y-8 p-8">
          <StatsGrid>
            <StatCard title="Pending" value={pendingOffboardingEmployees.length} icon={Clock} iconVariant="destructive" variant="compact" />
            <StatCard title="Active" value={activeEmployees.length} icon={UserMinus} iconVariant="success" variant="compact" />
            <StatCard title="Archived" value={offboardedEmployees.length} icon={CheckCircle2} iconVariant="accent" variant="compact" />
          </StatsGrid>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="start">Active Force</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {pendingOffboardingEmployees.map(e => (
                  <Card key={e.id} variant="elevated" padding="lg" onClick={() => setSelectedEmployee(e)} className="cursor-pointer border-destructive/20 bg-destructive/5 hover:border-destructive/40 transition-all group rounded-[2rem]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{e.firstName} {e.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{e.role}</p>
                        {e.endDate && <p className="text-xs text-destructive mt-2 font-bold uppercase">Last Day: {format(e.endDate, 'PP')}</p>}
                      </div>
                      <div className="p-2 rounded-xl bg-destructive/10 text-destructive"><Clock className="h-5 w-5" /></div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="start">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {activeEmployees.map(e => (
                  <Card key={e.id} variant="elevated" padding="lg" onClick={() => handleOpenReasonDialog(e)} className="cursor-pointer border-border/40 hover:border-destructive/30 transition-all group rounded-[2rem]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{e.firstName} {e.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{e.role}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:text-destructive transition-colors"><UserMinus className="h-5 w-5" /></div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-8">
          <OffboardingChecklist employee={selectedEmployee} onComplete={handleOffboardingCompleted} />
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-left font-black tracking-tighter uppercase italic">Initiate Departure Protocol</DialogTitle>
            <DialogDescription className="text-left text-xs italic">Select the primary vector for this lifecycle termination.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <Label>Termination Vector</Label>
              <Select value={selectedReason} onValueChange={(v) => setSelectedReason(v as OffboardingReason)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(offboardingReasonLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Protocol Notes</Label>
              <Textarea value={reasonNotes} onChange={(e) => setReasonNotes(e.target.value)} className="bg-muted border-border" placeholder="Additional vector details..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonDialog(false)}>Abort</Button>
            <Button onClick={handleConfirmOffboarding} className="bg-destructive hover:bg-destructive/90 text-white font-bold" disabled={!selectedReason}>
              Execute Protocol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Offboarding;
