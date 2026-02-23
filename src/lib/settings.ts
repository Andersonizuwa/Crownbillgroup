import api from "./api";

export interface AppSettings {
    usdtAddress: string;
    btcAddress: string;
    whatsappNumber: string;
}

export const getAppSettings = async (): Promise<AppSettings> => {
    try {
        const response = await api.get('/settings');
        return response.data;
    } catch (error) {
        console.error('Error fetching app settings:', error);
        // Fallback to default values if API fails
        return {
            usdtAddress: "TScRwtiYR6A1nufXed2Hw6cVkvpyUAhChv",
            btcAddress: "bc1qhf7jrcwtadxeudx5fpvh94njlxqlgw4h5p4xql",
            whatsappNumber: "+1 (646) 233-7202"
        };
    }
};

export const updateAppSettings = async (settings: AppSettings): Promise<void> => {
    try {
        await api.put('/admin/settings', settings);
    } catch (error: any) {
        const message = error.response?.data?.error || error.message || 'Failed to update settings';
        throw new Error(message);
    }
};
