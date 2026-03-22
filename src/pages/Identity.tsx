import { PageLayout, StatCard, StatsGrid, Card } from "@vagility/design-system";
import { ShieldCheck, UserCheck, Fingerprint, ShieldAlert } from "lucide-react";

export default function IdentityPage() {
  return (
    <PageLayout
      title="Workspace Identity"
      subtitle="Manage your personal security profile and biometric verification."
    >
      <StatsGrid>
        <StatCard title="Security Level" value="High" icon={ShieldCheck} iconVariant="success" variant="compact" />
        <StatCard title="MFA Status" value="Active" icon={UserCheck} iconVariant="accent" variant="compact" />
        <StatCard title="Biometrics" value="Trusted" icon={Fingerprint} iconVariant="warning" variant="compact" />
      </StatsGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card variant="elevated" padding="lg" className="text-left bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Identity Verification</h3>
          <p className="text-muted-foreground mb-6">Your identity has been verified via the platform activation protocol.</p>
          <div className="flex items-center gap-3 p-4 bg-success/10 text-success rounded-lg border border-success/20">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Identity Verified</span>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="text-left bg-card border-border">
          <h3 className="text-lg font-semibold mb-4 text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Security Alerts
          </h3>
          <p className="text-muted-foreground">No recent security alerts detected for your identity profile.</p>
        </Card>
      </div>
    </PageLayout>
  );
}
