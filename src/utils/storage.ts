import type { Activity } from '../types';

const STORAGE_KEY = 'activity-planner-data';

export const saveActivities = (activities: Activity[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
};

export const loadActivities = (): Activity[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};
