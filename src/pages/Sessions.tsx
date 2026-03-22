import { PageLayout, StatCard, StatsGrid, Card } from "@vagility/design-system";
import { Key, Activity, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  return (
    <PageLayout
      title="Session Control"
      description="Review and manage your active platform sessions and security tokens."
    >
      <StatsGrid>
        <StatCard title="Active Sessions" value="2" icon={Activity} iconVariant="accent" variant="compact" />
        <StatCard title="Last Login" value="Just now" icon={Clock} iconVariant="success" variant="compact" />
      </StatsGrid>

      <Card variant="elevated" padding="lg" className="mt-8 text-left bg-card border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Key className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">Current Workstation</p>
                <p className="text-sm text-muted-foreground italic font-medium">Windows 11 • Chrome 134 • 127.0.0.1</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20">Authorized</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                <Activity className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">Mobile Handset</p>
                <p className="text-sm text-muted-foreground italic font-medium">iOS 18 • Safari • Mobile Access</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-black uppercase tracking-widest border border-warning/20">Stale</span>
              <Button size="sm" variant="outline" className="h-9 px-4 text-destructive hover:bg-destructive/10 border-destructive/20 font-bold text-xs rounded-xl">
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
