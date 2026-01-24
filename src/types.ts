export interface Activity {
    id: string;
    title: string;
    dateStart: string;
    dateEnd: string;

    tasks: ActivityTaskItem[];
    links: ActivityLinkItem[];

    image: string[];
    color: string;
}

export interface ActivityTaskItem {
    id: string;
    text: string;
    completed: boolean;
}
export interface ActivityLinkItem {
    id: string;
    url: string;
}

export interface BackupEntry {
    timestamp: number;
    name: string;
    activities: Activity[];
}
