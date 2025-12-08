export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Activity {
    id: string;
    title: string;
    date: string;
    todos: TodoItem[];
}
