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

const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string[]>(props.activity.image || []);
const imageZoom = ref<string | undefined>(undefined);

const handleImageUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Check file size (max 2MB to avoid localStorage issues)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image too large! Please choose an image smaller than 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target?.result as string;
        imagePreview.value = [...imagePreview.value, base64];

        emit('update', {
            ...props.activity,
            image: [...props.activity.image, base64]
        });
    };
    reader.readAsDataURL(file);
};

const removeImage = (index: number) => {
    imagePreview.value.splice(index, 1);
    emit('update', {
        ...props.activity,
        image: imagePreview.value
    });

    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

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

        <div v-if="imagePreview.length" class="relative group grid grid-cols-4">
            <div v-for="(imgg, idx) in imagePreview" class="mb-4">
                <img
                    :src="imgg"
                    alt="Activity image"
                    class="h-14 w-14 object-cover rounded-md mb-4"
                    @click="imageZoom = imgg" />

                <button
                    @click="removeImage(idx)"
                    class="top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm  group-hover:opacity-100 transition">
                    Remove
                </button>
            </div>
        </div>

        <!-- image viewer -->
        <div v-if="imageZoom" class="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50"
            @click="imageZoom = undefined">

            <img
                :src="imageZoom"
                alt="Full page view"
                class="max-w-full max-h-full object-contain" />
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

            <button
                @click="triggerFileInput"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>

            <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden" />
        </div>

    </div>
</template>
