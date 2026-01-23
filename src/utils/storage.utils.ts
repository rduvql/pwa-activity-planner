import type { Activity } from '../types';

export const ACTIVITIES_STORAGE_KEY = 'activities_storage_key';
export const BACKUPS_STORAGE_KEY = 'backups_storage_key';

export const OLD_ACTIVITIES_KEY = 'activity-planner-data';

export function formatDate(dateStr: string | Date | number, locale: string = 'FR-fr'): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const getLocalStorageSizeMB = () => {
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
