<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Activity, TodoItem } from './types';
import { saveActivities, loadActivities } from './utils/storage';
import { getMonthsBetween, isSameMonth } from './utils/dateUtils';
import MonthView from './components/MonthView.vue';

const activities = ref<Activity[]>([]);
const showAddForm = ref(false);
const newActivityTitle = ref('');
const newActivityDate = ref('');

onMounted(() => {
    activities.value = loadActivities();

    // Set default date to today if empty
    const today = new Date();
    newActivityDate.value = today.toISOString().split('T')[0];
});

const months = computed(() => {
    if (activities.value.length === 0) {
        // Show current month if no activities
        return [new Date()];
    }

    const dates = activities.value.map(a => new Date(a.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return getMonthsBetween(minDate, maxDate);
});

const getActivitiesForMonth = (month: Date): Activity[] => {
    return activities.value
        .filter(activity => isSameMonth(new Date(activity.date), month))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const addActivity = () => {
    if (!newActivityTitle.value.trim() || !newActivityDate.value) return;

    const defaultTodo: TodoItem[] = [{
        id: Date.now().toString(),
        text: "Ticket event",
        completed: false
    },
    {
        id: Date.now().toString() + 1000,
        text: "Train",
        completed: false
    }, {
        id: Date.now().toString() + 2000,
        text: "Hotel",
        completed: false
    }];

    const newActivity: Activity = {
        id: Date.now().toString(),
        title: newActivityTitle.value.trim(),
        date: newActivityDate.value,
        todos: defaultTodo,
        image: []
    };

    activities.value.push(newActivity);
    saveActivities(activities.value);

    newActivityTitle.value = '';
    newActivityDate.value = new Date().toISOString().split('T')[0];
    showAddForm.value = false;
};

const updateActivity = (updatedActivity: Activity) => {
    const index = activities.value.findIndex(a => a.id === updatedActivity.id);
    if (index !== -1) {
        activities.value[index] = updatedActivity;
        saveActivities(activities.value);
    }
};

const deleteActivity = (id: string) => {
    if (confirm('confirm ?')) {
        activities.value = activities.value.filter(a => a.id !== id);
        saveActivities(activities.value);
    }
};

function localStorageSizeMB() {
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
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <header class="mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-2"> Event Planner ({{ activities.length }}) </h1>
                <p class="text-gray-600">localStorage size ~ {{ localStorageSizeMB() }}</p>
            </header>

            <div class="mb-8">
                <button
                    v-if="!showAddForm"
                    @click="showAddForm = true"
                    class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition">
                    + New Activity
                </button>

                <div
                    v-else
                    class="bg-white rounded-lg shadow-md p-6 max-w-md border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">New Activity</h3>

                    <input
                        v-model="newActivityTitle"
                        type="text"
                        placeholder="Activity title"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input
                        v-model="newActivityDate"
                        type="date"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div class="flex gap-3">
                        <button
                            @click="addActivity"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
                            Create
                        </button>
                        <button
                            @click="showAddForm = false"
                            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div class="space-y-8">
                <MonthView
                    v-for="month in months"
                    :key="month.toISOString()"
                    :month="month"
                    :activities="getActivitiesForMonth(month)"
                    @update-activity="updateActivity"
                    @delete-activity="deleteActivity" />
            </div>
        </div>
    </div>
</template>
