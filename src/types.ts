export interface Activity {
    id: string;
    title: string;
    dateStart: string;
    dateEnd: string;
    todos: ActivityTodoItem[];
    image: string[];
    color: string;
}

export interface ActivityTodoItem {
    id: string;
    text: string;
    completed: boolean;
}


export interface BackupEntry {
    timestamp: number;
    name: string;
    activities: Activity[];
}
