import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PersonalOnboardView } from "@/components/dashboard/PersonalOnboardView";
import { PersonalOffboardView } from "@/components/dashboard/PersonalOffboardView";
import PinVerify from "@/components/auth/PinVerify";

interface LifecycleWrapperProps {
    children: React.ReactNode;
}

export function LifecycleWrapper({ children }: LifecycleWrapperProps) {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pinVerified, setPinVerified] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            try {
                // Use getSession instead of getUser for reduced overhead in remote modules
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                
                if (!isMounted) return;
                setCurrentUser(user);

                if (user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*, profiles_private(onboarding_status)')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (!isMounted) return;

                    if (profileData) {
                        const privateData = Array.isArray(profileData.profiles_private) 
                            ? profileData.profiles_private[0] 
                            : profileData.profiles_private;
                            
                        const status = privateData?.onboarding_status || 'pending';

                        // If user is already verified/active, eject them from the activation portal.
                        if (status === 'active' && window.location.pathname.includes('/activate')) {
                            navigate("/", { replace: true });
                            return;
                        }

                        setProfile({ ...profileData, status });
                    }
                } else if (!window.location.pathname.includes('/auth')) {
                    navigate("/auth", { replace: true });
                }
            } catch (error) {
                console.error("Secure Session Error:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        checkSession();
        return () => { isMounted = false; };
    }, []); // Empty dependency array - run once on mount

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="animate-pulse font-black uppercase tracking-tighter italic text-left">Initializing Secure Workspace...</div>
        </div>
    );

    // GATEKEEPING LOGIC
    // Only show checklist/gate if the status is EXPLICITLY 'pending' or 'pending_offboarding'.
    // If the user is the Tenant Owner or already onboarded, the status will likely be 'active' or null.
    
    if (profile?.status === 'pending') {
        // SECURITY GATE 1: Identity PIN Verification
        if (!pinVerified) {
            return <PinVerify onVerified={() => {
                setPinVerified(true);
                setProfile({ ...profile, status: 'onboarding' });
            }} />;
        }
    }

    if (profile?.status === 'onboarding') {
        // SECURITY GATE 2: Onboarding Task Checklist (Persistent after PIN)
        return <PersonalOnboardView user={currentUser} profile={profile} />;
    }

    if (profile?.status === 'pending_offboarding') {
        return <PersonalOffboardView user={currentUser} profile={profile} />;
    }

    // Default: Show the normal Identity/Devices/Sessions pages (Active Identity)
    return <>{children}</>;
}
