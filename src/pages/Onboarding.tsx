import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PersonalOnboardView } from "@/components/dashboard/PersonalOnboardView";

export default function OnboardingPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*, profiles_private(onboarding_status)')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileData) {
                    const status = (profileData.profiles_private as any)?.[0]?.onboarding_status || 'pending';
                    setProfile({
                        ...profileData,
                        status
                    });
                }
            } else {
                navigate("/auth");
            }
            setLoading(false);
        };
        checkSession();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="animate-pulse font-black uppercase tracking-tighter italic">Initializing Activation Portal...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-muted/5">
            <PersonalOnboardView user={currentUser} profile={profile} />
        </div>
    );
}
