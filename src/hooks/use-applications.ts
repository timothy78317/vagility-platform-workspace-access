import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { toast } from "sonner";

export interface Application {
  id: string;
  name: string;
  icon: string;
  category: 'communication' | 'productivity' | 'development' | 'security' | 'hr' | 'core' | 'finance' | 'analytics' | 'marketing';
  isEnabled?: boolean;
  config?: Record<string, any>;
}

export function useApplications() {
    return useQuery({
        queryKey: ["system_applications"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("system_applications")
                .select("*")
                .order("name");

            if (error) throw error;
            return data.map((item: any) => ({
                id: item.id,
                name: item.name,
                icon: item.icon,
                category: item.category,
                isEnabled: item.is_enabled,
                config: item.config,
            })) as Application[];
        },
    });
}

export function useUpdateAppAccess() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ profileId, applicationId, granted }: { profileId: string; applicationId: string; granted: boolean }) => {
            const { error } = await supabase
                .from("employee_access")
                .upsert({
                    profile_id: profileId,
                    application_id: applicationId,
                    is_granted: granted,
                    granted_at: granted ? new Date().toISOString() : undefined,
                    revoked_at: !granted ? new Date().toISOString() : undefined,
                }, { onConflict: 'profile_id,application_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Access updated successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to update access", {
                description: error.message,
            });
        },
    });
}
