import { PageLayout, StatCard, StatsGrid, Card } from "@vagility/design-system";
import { Laptop, Smartphone, Monitor, ShieldCheck, Activity, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DevicesPage() {
  return (
    <PageLayout
      title="Hardware Perimeter"
      description="Manage the physical devices registered to your workspace identity."
    >
      <StatsGrid>
        <StatCard title="Registered" value="2" icon={Laptop} iconVariant="accent" variant="compact" />
        <StatCard title="Healthy" value="100%" icon={Activity} iconVariant="success" variant="compact" />
      </StatsGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card variant="elevated" padding="lg" className="border-border bg-card">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Laptop className="h-8 w-8" />
            </div>
            <div className="text-left space-y-1">
              <h4 className="font-black text-xl tracking-tighter text-foreground uppercase">Workstation Alpha</h4>
              <p className="text-sm text-muted-foreground font-medium italic">Latitude 7420 • Windows 11 Enterprise</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success/5 rounded-2xl border border-success/20">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-sm font-bold text-success uppercase tracking-widest">Device Trusted</span>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest h-11 rounded-xl">View System Report</Button>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="border-border bg-card">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="text-left space-y-1">
              <h4 className="font-black text-xl tracking-tighter text-foreground uppercase">Primary Handset</h4>
              <p className="text-sm text-muted-foreground font-medium italic">iPhone 16 Pro • Vagility Authenticator</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Not Detected</span>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs font-black uppercase tracking-widest h-11 rounded-xl">Register New Mobile</Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
