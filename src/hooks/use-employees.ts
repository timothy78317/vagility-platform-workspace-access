import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee, EmployeeStatus } from "@/types/employee";
import { toast } from "sonner";

export function useEmployees() {
    return useQuery({
        queryKey: ["employees"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                  id,
                  first_name,
                  last_name,
                  email,
                  department,
                  department_id,
                  role_title,
                  job_title_id,
                  manager_id,
                  manager:manager_id(first_name, last_name, email),
                  created_at,
                  updated_at,
                  profiles_private(
                    activation_pin, 
                    pin_expires_at,
                    onboarding_status,
                    start_date,
                    end_date,
                    archived_at
                  ),
                  departments:department_id(name),
                  employee_access(
                    application_id,
                    is_granted
                  ),
                  profile_roles(
                    role_id,
                    role:platform_roles(
                      role_applications(application_id)
                    )
                  )
                `);

            if (error) throw error;

            return data.map((item: any) => {
                const roleApps = item.profile_roles?.flatMap((pr: any) =>
                    pr.role?.role_applications?.map((ra: any) => ra.application_id) || []
                ) || [];

                const overrides = item.employee_access || [];

                const allAppIds = Array.from(new Set([
                    ...roleApps,
                    ...overrides.map((o: any) => o.application_id)
                ]));

                const access = allAppIds.map(appId => {
                    const manualOverride = overrides.find((o: any) => o.application_id === appId);
                    const isInherited = roleApps.includes(appId);

                    return {
                        applicationId: appId as string,
                        granted: manualOverride ? manualOverride.is_granted : isInherited
                    };
                });

                return {
                    id: item.id,
                    firstName: item.first_name || item.email?.split('@')[0] || 'Unknown',
                    lastName: item.last_name || '',
                    email: item.email || '',
                    department: item.departments?.name || item.department || 'Unassigned',
                    departmentId: item.department_id,
                    role: item.role_title || 'Employee',
                    jobTitleId: item.job_title_id,
                    roleIds: item.profile_roles?.map((pr: any) => pr.role_id) || [],
                    status: (item.profiles_private?.[0]?.onboarding_status || 'pending') as EmployeeStatus,
                    startDate: item.profiles_private?.[0]?.start_date ? new Date(item.profiles_private[0].start_date) : new Date(item.created_at),
                    endDate: item.profiles_private?.[0]?.end_date ? new Date(item.profiles_private[0].end_date) : undefined,
                    archivedAt: item.profiles_private?.[0]?.archived_at ? new Date(item.profiles_private[0].archived_at) : undefined,
                    manager: item.manager ? (item.manager.first_name || item.manager.last_name ? `${item.manager.first_name || ''} ${item.manager.last_name || ''}`.trim() : item.manager.email) : 'Unassigned',
                    managerId: item.manager_id,
                    access,
                    activationPin: (item.profiles_private as any)?.[0]?.activation_pin,
                    pinExpiresAt: (item.profiles_private as any)?.[0]?.pin_expires_at ? new Date((item.profiles_private as any)?.[0]?.pin_expires_at) : undefined,
                    createdAt: new Date(item.created_at),
                    updatedAt: new Date(item.updated_at),
                };
            }) as Employee[];
        },
    });
}

export function useUpdateEmployeeRoles() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ profileId, roleIds }: { profileId: string; roleIds: string[] }) => {
            const { error: delError } = await supabase
                .from("profile_roles")
                .delete()
                .eq("profile_id", profileId);

            if (delError) throw delError;

            if (roleIds.length > 0) {
                const { error: insError } = await supabase
                    .from("profile_roles")
                    .insert(roleIds.map(rid => ({ profile_id: profileId, role_id: rid })));

                if (insError) throw insError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employee roles updated");
        }
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error: functionError } = await supabase.functions.invoke('admin-users', {
                body: { action: 'delete', userId: id }
            });

            if (functionError) {
                console.error("Purge failure:", functionError);
                throw new Error(functionError.message || "Failed to fully purge member record");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Member record purged from system");
        },
        onError: (err: any) => {
            toast.error("Failed to purge member", { description: err.message });
        }
    });
}
