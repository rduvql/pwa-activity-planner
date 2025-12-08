<script setup lang="ts">
import { ref } from 'vue';
import type { Activity, TodoItem } from '../types';
import { formatDate } from '../utils/dateUtils';

const props = defineProps<{
    activity: Activity;
}>();

const emit = defineEmits<{
    update: [activity: Activity];
    delete: [id: string];
}>();

const newTodoText = ref('');
const isEditing = ref(false);
const editTitle = ref(props.activity.title);
const editDate = ref(props.activity.date);

const addTodo = () => {
    if (!newTodoText.value.trim()) return;

    const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTodoText.value.trim(),
        completed: false
    };

    emit('update', {
        ...props.activity,
        todos: [...props.activity.todos, newTodo]
    });

    newTodoText.value = '';
};

const toggleTodo = (todoId: string) => {
    emit('update', {
        ...props.activity,
        todos: props.activity.todos.map(todo =>
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        )
    });
};

const deleteTodo = (todoId: string) => {
    if (confirm("Confirm removal ?")) {
        emit('update', {
            ...props.activity,
            todos: props.activity.todos.filter(todo => todo.id !== todoId)
        });
    }
};

const saveEdit = () => {
    if (!editTitle.value.trim()) return;

    emit('update', {
        ...props.activity,
        title: editTitle.value.trim(),
        date: editDate.value
    });

    isEditing.value = false;
};

const cancelEdit = () => {
    editTitle.value = props.activity.title;
    editDate.value = props.activity.date;
    isEditing.value = false;
};

const isTodoLink = (todoItem: TodoItem): boolean => {
    return todoItem.text.startsWith("http");
};

const getHostName = (todoItem: string): string => {
    let { host } = new URL(todoItem);
    return host;
};

const getTodos = () => {
    return props.activity.todos
        .filter(todo => !isTodoLink(todo));
};

const getTodosLink = () => {
    return props.activity.todos
        .filter(todo => isTodoLink(todo));
};

const isDraft = (): boolean => {
    return props.activity.title.includes("wip") || props.activity.title.includes("draft");
};

const isValidated = (): boolean => {
    return props.activity.title.includes("OK");
};
</script>

<template>
    <div class="rounded-lg shadow-md p-4 border border-gray-200" :class="{
        'bg-yellow-100': isDraft(),
        'bg-green-100': isValidated(),
        'bg-white': !isDraft() && !isValidated(),
    }">
        <div v-if="!isEditing" class="flex items-start justify-between mb-3">
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800">{{ activity.title }}</h3>
                <p class="text-sm text-gray-500">{{ formatDate(activity.date) }}</p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="isEditing = true"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Edit
                </button>
                <button
                    @click="emit('delete', activity.id)"
                    class="text-red-600 hover:text-red-700 text-sm font-medium">
                    Delete
                </button>
            </div>
        </div>

        <div v-else class="mb-3">
            <input
                v-model="editTitle"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Activity title"
                @keypress.enter="saveEdit"/>
            <input
                v-model="editDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div class="flex gap-2">
                <button
                    @click="saveEdit"
                    class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                    Save
                </button>
                <button
                    @click="cancelEdit"
                    class="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm">
                    Cancel
                </button>
            </div>
        </div>

        <!-- TODO checkbox -->
        <div class="space-y-2 mb-3">
            <div
                v-for="todo in getTodos()"
                :key="todo.id"
                class="flex items-center gap-2 group">
                <input
                    type="checkbox"
                    :checked="todo.completed"
                    @change="toggleTodo(todo.id)"
                    class="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
                <span
                    :class="[
                        'flex-1 text-sm',
                        todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                    ]">
                    {{ todo.text }}
                </span>
                <button
                    @click="deleteTodo(todo.id)"
                    class="text-red-500 hover:text-red-600 text-xs">
                    Remove
                </button>
            </div>
        </div>

        <!-- Links display -->
        <div class="space-y-2 mb-3">
            <div
                v-for="todo in getTodosLink()"
                :key="todo.id"
                class="flex items-center gap-2 group">

                <span
                    :class="[
                        'flex-1 text-sm text-blue-600 underline',
                    ]">
                    <a target="_blank" :href="todo.text">{{ getHostName(todo.text) }}</a>
                </span>
                <button
                    @click="deleteTodo(todo.id)"
                    class="text-red-500 hover:text-red-600 text-xs">
                    Remove
                </button>
            </div>
        </div>

        <!-- BUTTON add -->
        <div class="flex gap-2">
            <input
                v-model="newTodoText"
                @keyup.enter="addTodo"
                type="text"
                placeholder="Add a todo..."
                class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button
                @click="addTodo"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                Add
            </button>
        </div>
    </div>
</template>
