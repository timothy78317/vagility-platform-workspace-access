import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LifecycleTask, LifecycleTaskType } from "@/types/employee";
import { toast } from "sonner";

export function useLifecycleTasks(employeeId?: string) {
    return useQuery({
        queryKey: ["lifecycle_tasks", employeeId],
        queryFn: async () => {
            let query = supabase
                .from("lifecycle_tasks")
                .select(`
          *,
          assignee:assignee_id(first_name,last_name),
          employee:profile_id(first_name,last_name)
        `);

            if (employeeId) {
                query = query.eq("profile_id", employeeId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                label: item.label,
                description: item.description,
                type: item.type,
                employeeId: item.profile_id,
                assigneeId: item.assignee_id,
                assigneeName: item.assignee ? `${item.assignee.first_name} ${item.assignee.last_name}` : undefined,
                completed: item.is_completed,
                completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
                completedBy: item.completed_by_id, 
                icon: item.icon,
                isEmployeeTask: item.is_employee_task,
                createdAt: new Date(item.created_at),
            })) as LifecycleTask[];
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("lifecycle_tasks")
                .update({
                    is_completed: completed,
                    completed_at: completed ? new Date().toISOString() : null,
                    completed_by_id: completed ? user?.id : null
                })
                .eq("id", taskId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lifecycle_tasks"] });
            toast.success("Task updated");
        },
    });
}
