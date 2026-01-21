<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Activity, TodoItem } from './types';
import { getMonthsBetween, isSameMonth } from './utils/dateUtils';
import MonthView from './components/MonthView.vue';
import ButtonIcon from './components/ButtonIcon.vue';
import { mdiCheckCircleOutline, mdiCheckOutline, mdiContentSaveOutline, mdiDownloadOutline, mdiListBoxOutline, mdiPlusCircleMultipleOutline, mdiPlusCircleOutline, mdiPlusOutline, mdiUploadOutline } from '@mdi/js';
import { localStorageUtils } from './utils/storage.utils';

const activities = ref<Activity[]>([]);
const showAddForm = ref(false);
const newActivityTitle = ref('');
const newActivityStartDate = ref('');
const newActivityEndDate = ref('');
const displayedBackupList = ref<string[]>([]);
const backupIcon = ref(mdiContentSaveOutline);

const months = computed(() => {
    if (activities.value.length === 0) {
        // Show current month if no activities
        return [new Date()];
    }

    const dates = activities.value.map(a => new Date(a.dateStart));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return getMonthsBetween(minDate, maxDate);
});

watch(newActivityStartDate, (newDate) => {
    if (newActivityEndDate.value === "") {
        newActivityEndDate.value = newActivityStartDate.value;
    }
});

onMounted(() => {
    activities.value = localStorageUtils.loadActivities();
});

//
//
//

const MAIN_BUTTON_ACTIONS = {

    createBackupEntry: () => {
        backupIcon.value = mdiCheckCircleOutline;
        localStorageUtils.createBackupEntry();
        setTimeout(() => {
            backupIcon.value = mdiContentSaveOutline;
        }, 2000);
    },

    displayBackupList: () => {
        displayedBackupList.value = localStorageUtils.listBackupEntries();
    },

    exportJSON: () => {
        const data = JSON.stringify(activities.value, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-planner-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importJSON: (event: Event) => {
        const save = (jsonData: string) => {
            try {
                const importedActivities: Activity[] = JSON.parse(jsonData);
                activities.value = importedActivities;
                localStorageUtils.saveActivities(activities.value);
            } catch (error) {
                console.error('Invalid JSON data', error);
            }
        };

        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    save(e.target.result as string);
                }
            };
            reader.readAsText(file);
        }
    },

    addActivity: () => {
        showAddForm.value = true;
    }
};


const getActivitiesListForMonth = (month: Date): Activity[] => {
    return activities.value
        .filter(activity => isSameMonth(new Date(activity.dateStart), month))
        .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
};

const addActivitySubmit = () => {
    if (!newActivityTitle.value.trim() || !newActivityStartDate.value) return;

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
        dateStart: newActivityStartDate.value,
        dateEnd: newActivityEndDate.value || newActivityStartDate.value,
        todos: defaultTodo,
        image: [],
        color: "white"
    };

    activities.value.push(newActivity);
    localStorageUtils.saveActivities(activities.value);

    // reset
    newActivityTitle.value = "";
    newActivityStartDate.value = "";
    newActivityEndDate.value = "";
    showAddForm.value = false;
};

const updateActivity = (updatedActivity: Activity) => {
    const index = activities.value.findIndex(a => a.id === updatedActivity.id);
    if (index !== -1) {
        activities.value[index] = updatedActivity;
        localStorageUtils.saveActivities(activities.value);
    }
};

const deleteActivity = (id: string) => {
    if (confirm('confirm ?')) {
        activities.value = activities.value.filter(a => a.id !== id);
        localStorageUtils.saveActivities(activities.value);
    }
};

const BACKUP_LIST_ACTIONS = {

    restoreBackupEntry: (key: string) => {
        localStorageUtils.restoreBackupEntry(key);
        displayedBackupList.value = [];
        activities.value = localStorageUtils.loadActivities();
    },

    removeBackupEntry: (key: string) => {
        localStorageUtils.removeBackupEntry(key);
        displayedBackupList.value = localStorageUtils.listBackupEntries();
    },
};
</script>

<template>
    <!-- backup viewer "modal" -->
    <div v-if="displayedBackupList.length > 0"
        class="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50"
        @click="displayedBackupList = []">

        <!-- display the backups -->
        <div
            @click.stop="() => { /* prevent closing modal on click inside */ }">

            <h2 class="text-2xl font-bold text-white mb-4"> Backups ({{ displayedBackupList.length }}) </h2>

            <ul class="space-y-2 max-h-96 overflow-y-auto">
                <li v-for="backupKey in displayedBackupList" :key="backupKey"
                    class="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center gap-4">
                    <span class="">
                        {{ backupKey }}
                    </span>

                    <button
                        @click.stop="() => BACKUP_LIST_ACTIONS.restoreBackupEntry(backupKey)"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                        Restore
                    </button>

                    <button
                        @click.stop="() => BACKUP_LIST_ACTIONS.removeBackupEntry(backupKey)"
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
                        Delete
                    </button>
                </li>
            </ul>
        </div>
    </div>

    <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">

        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <header class="mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-2"> Event Planner ({{ activities.length }}) </h1>
                <p class="text-gray-600">localStorage size ~ {{ localStorageUtils.getLocalStorageSizeMB() }}</p>
            </header>

            <!-- Action Menu -->
            <div class="mb-8 p-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Backup Actions -->
                    <ButtonIcon
                        class="border-blue-600 text-blue-700 bg-blue-50"
                        @click="MAIN_BUTTON_ACTIONS.createBackupEntry()"
                        text="Backup"
                        :icon="backupIcon">
                    </ButtonIcon>

                    <ButtonIcon
                        @click="MAIN_BUTTON_ACTIONS.displayBackupList()"
                        class="border-blue-600 text-blue-700 bg-blue-50"
                        text="Backups"
                        :icon="mdiListBoxOutline">
                    </ButtonIcon>

                    <!-- Export -->
                    <ButtonIcon
                        @click="MAIN_BUTTON_ACTIONS.exportJSON()"
                        class="border-purple-600 text-purple-700 bg-purple-50"
                        text="Export"
                        :icon="mdiUploadOutline">
                    </ButtonIcon>

                    <!-- Import  -->
                    <ButtonIcon
                        @click="($refs.fileInput as HTMLInputElement)!.click()"
                        class="border-purple-600 text-purple-700 bg-purple-50"
                        text="Import"
                        :icon="mdiDownloadOutline">
                    </ButtonIcon>

                    <!-- Add Activity -->
                    <ButtonIcon
                        v-if="!showAddForm"
                        class="border-green-600 text-green-700 bg-green-50"
                        @click="MAIN_BUTTON_ACTIONS.addActivity()"
                        text="Add"
                        :icon="mdiPlusCircleOutline">
                    </ButtonIcon>
                </div>
            </div>

            <div v-if="showAddForm" class="mb-8">
                <div
                    class="bg-white rounded-lg shadow-md p-6 max-w-md border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">New Activity</h3>

                    <input
                        v-model="newActivityTitle"
                        type="text"
                        placeholder="Activity title"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input
                        v-model="newActivityStartDate"
                        type="date"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input
                        v-model="newActivityEndDate"
                        type="date"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                    <div class="flex gap-3">
                        <button
                            @click="addActivitySubmit"
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
                    :activities="getActivitiesListForMonth(month)"
                    @update-activity="updateActivity"
                    @delete-activity="deleteActivity" />
            </div>
        </div>

        <input
            ref="fileInput"
            type="file"
            accept="application/json"
            class="hidden"
            @change="MAIN_BUTTON_ACTIONS.importJSON($event)" />
    </div>
</template>
