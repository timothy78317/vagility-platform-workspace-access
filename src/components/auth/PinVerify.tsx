import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@vagility/design-system";
import { toast } from "sonner";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PinVerify - The primary identity verification gate for the platform.
 * 
 * Users who have been invited/onboarded but not yet activated are channeled here
 * to enter their 6-digit PIN. Successful verification activates their profile
 * and grants them full workspace access.
 */
interface PinVerifyProps {
    onVerified?: () => void;
}

export default function PinVerify({ onVerified }: PinVerifyProps) {
    const [activationPin, setActivationPin] = useState("");
    const [pinError, setPinError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                // Check if they are already active
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('profiles_private(onboarding_status)')
                    .eq('id', user.id)
                    .maybeSingle();

                const status = (profileData?.profiles_private as any)?.[0]?.onboarding_status || 'pending';
                
                // If already active, send them to the main dashboard
                if (status === 'active') {
                    navigate("/"); // Host will handle the redirection to /app/dashboard
                }
            } else {
                // Not logged in at all? Redirect to Auth
                navigate("/auth");
            }
            setLoading(false);
        };
        checkSession();
    }, [navigate]);

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setPinError(false);

        try {
            const { data, error } = await supabase.rpc('verify_activation_pin', {
                p_user_id: currentUser.id,
                p_pin: activationPin
            });

            if (error) throw error;

            if (data === true) {
                toast.success("Identity verified successfully!");
                if (onVerified) {
                    onVerified();
                } else {
                    // Fallback to navigation if no callback provided
                    navigate("/"); 
                }
            } else {
                setPinError(true);
                toast.error("Invalid activation PIN", { description: "Please check with your Admin." });
            }
        } catch (error: any) {
            toast.error("Verification failed", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse">Loading identity check...</div>
      </div>
    );

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <Card variant="elevated" padding="lg" className="space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent mb-2">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Verify Your Identity</h1>
                        <p className="text-muted-foreground font-medium text-left">
                            To activate your workspace, please enter the 6-digit PIN provided by your Administrator.
                        </p>
                    </div>

                    <form onSubmit={handleVerifyPin} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="pin">6-Digit Activation PIN</Label>
                            <Input
                                id="pin"
                                type="text"
                                maxLength={6}
                                required
                                value={activationPin}
                                onChange={(e) => setActivationPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className={cn(
                                    "bg-muted/50 border-border text-center text-3xl font-black tracking-[0.5em] h-16",
                                    pinError && "border-destructive text-destructive"
                                )}
                            />
                        </div>

                        <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-start gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground text-left">
                                <p className="font-semibold text-foreground">Don't have a PIN?</p>
                                <p>Contact your System Administrator or Manager to request your unique activation code.</p>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11"
                            disabled={isSubmitting || activationPin.length !== 6}
                        >
                            {isSubmitting ? "Verifying..." : "Verify Identity"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
