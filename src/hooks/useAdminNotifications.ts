import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export interface ActivityLog {
    id: string;
    userId: string;
    action: string;
    details: any;
    ipAddress: string;
    isRead: boolean;
    createdAt: string;
    user: {
        email: string;
        profile: {
            fullName: string | null;
        } | null;
    };
}

export const useAdminNotifications = (isAdmin: boolean) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [latestActivity, setLatestActivity] = useState<ActivityLog | null>(null);
    // Track the ID of the last processed activity to avoid duplicate popups
    const lastProcessedActivityIdRef = useRef<string | null>(null);

    // Poll for unread count
    const { data: unreadCountData } = useQuery({
        queryKey: ['adminUnreadCount'],
        queryFn: async () => {
            const { data } = await api.get('/admin/activity-logs/unread-count');
            return data;
        },
        enabled: isAdmin,
        refetchInterval: 30000, // Poll every 30 seconds
        refetchOnWindowFocus: true,
    });

    // Poll for latest activities to detect high-priority events
    useQuery({
        queryKey: ['adminLatestActivities'],
        queryFn: async () => {
            // Fetch only unread logs to check for new important events
            const { data } = await api.get('/admin/activity-logs?unreadOnly=true');
            return data;
        },
        enabled: isAdmin,
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    // Effect to watch for changes in activities and trigger modal
    // We use a separate effect/query combo or just inspect the cache, but simple approach:
    // We can attach a side effect to the query above, but useQuery v5 doesn't have onSuccess.
    // Instead, let's just make a separate polling or handle it in the component.
    // actually, let's keep it simple: fetching the unread logs is fine.
    // We need to see if there's a *new* high priority log.

    useEffect(() => {
        // This effect runs when the query cache updates if we were invalidating,
        // but here we are polling. 
        // Let's manually fetch latest unread logs in the interval or trust the query data.
        // If we want to be "real-timeish", we check the data from the query.

        // Better approach with React Query:
        const data = queryClient.getQueryData<ActivityLog[]>(['adminLatestActivities']);

        if (data && data.length > 0) {
            const topActivity = data[0]; // Assuming sorted by desc createdAt

            // If this is a new activity we haven't seen in this session
            if (topActivity.id !== lastProcessedActivityIdRef.current) {
                lastProcessedActivityIdRef.current = topActivity.id;

                // Check if it's high priority
                const highPriorityActions = [
                    'user_registered',
                    'deposit_created',
                    'withdrawal_created',
                    'grant_application_created',
                    'algo_application_created',
                    'algo_access_granted',
                ];

                if (highPriorityActions.includes(topActivity.action)) {
                    setLatestActivity(topActivity);
                    setShowNotificationModal(true);

                    // Optional: sound or toast
                    // toast({ title: "New Activity", description: `New ${topActivity.action.replace('_', ' ')}` });
                }
            }
        }
    }, [unreadCountData]); // Depend on unread count changing as a signal, or the data directly

    const markAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.patch('/admin/activity-logs/read');
        },
        onSuccess: () => {
            queryClient.setQueryData(['adminUnreadCount'], { count: 0 });
            queryClient.invalidateQueries({ queryKey: ['adminLatestActivities'] });
            // Also invalidate main activity logs if they are being viewed
            queryClient.invalidateQueries({ queryKey: ['adminActivityLogs'] });
        },
    });

    const markAllAsRead = () => {
        markAsReadMutation.mutate();
    };

    const unreadCount = unreadCountData?.count || 0;

    return {
        unreadCount,
        showNotificationModal,
        setShowNotificationModal,
        latestActivity,
        markAllAsRead,
    };
};
