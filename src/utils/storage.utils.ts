import type { Activity } from '../types';

// const STORAGE_KEY = 'activity-planner-data';

// export const saveActivities = (activities: Activity[]): void => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
// };

// export const loadActivities = (): Activity[] => {
//     const data = localStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : [];
// };

function useLocalStorage() {

    const STORAGE_KEY = 'activity-planner-data';

    const saveActivities = (activities: Activity[]): void => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    };

    const loadActivities = (): Activity[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    };

    const listBackupEntries = (): string[] => {
        return Object.keys(localStorage)
            .filter(s => s.startsWith("bak-"))
            .toSorted((a, b) => {
                let aa = a.replace("bak-", "");
                let bb = b.replace("bak-", "");
                // last created first
                return Number(bb) - Number(aa);
            });
    };

    const createBackupEntry = () => {
        const backupKey = `bak-${Date.now()}`;
        const data = JSON.stringify(loadActivities());
        localStorage.setItem(backupKey, data);
    };

    const removeBackupEntry = (key: string) => {
        localStorage.removeItem(key);
    };

    const restoreBackupEntry = (key: string) => {
        const data = localStorage.getItem(key);
        if (data) {
            saveActivities(JSON.parse(data));
        }
    };

    const getLocalStorageSizeMB = () => {
        let total = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += key.length + value.length;
                }
            }
        }

        // convert bytes => MB
        return (total / (1024 * 1024)).toFixed(3);
    };

    return {
        saveActivities,
        loadActivities,
        listBackupEntries,
        createBackupEntry,
        removeBackupEntry,
        restoreBackupEntry,
        getLocalStorageSizeMB
    };
}

export const localStorageUtils = useLocalStorage();
