<script setup lang="ts">
import { mdiCheckCircleOutline, mdiContentSaveOutline, mdiDownloadOutline, mdiListBoxOutline, mdiPlusCircleOutline, mdiUploadOutline } from '@mdi/js';
import { useLocalStorage } from '@vueuse/core';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import ButtonIcon from './components/ButtonIcon.vue';
import MonthView from './components/MonthView.vue';
import type { Activity, ActivityTaskItem, BackupEntry } from './types';
import { getMonthsBetween, isSameMonth } from './utils/dateUtils';
import { ACTIVITIES_STORAGE_KEY, BACKUPS_STORAGE_KEY, formatDate, getLocalStorageSizeMB, OLD_ACTIVITIES_KEY } from './utils/storage.utils';
import { createDownloadLink } from './utils/utils';

const activities$ = useLocalStorage<Activity[]>(ACTIVITIES_STORAGE_KEY, []);
const backups$ = useLocalStorage<BackupEntry[]>(BACKUPS_STORAGE_KEY, []);

const newActivityState = reactive({
    showAddForm: false,
    title: '',
    startDate: '',
    endDate: ''
});

const displayedBackupList = ref<boolean>(false);
const backupIcon = ref(mdiContentSaveOutline);

const monthList = computed(() => {
    if (activities$.value.length === 0) {
        // Show current month if no activities
        return [new Date()];
    }

    const dates = activities$.value.map(a => new Date(a.dateStart));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return getMonthsBetween(minDate, maxDate);
});

const backupsList = computed(() => {
    return backups$.value.toSorted((a, b) => b.timestamp - a.timestamp);
});

watch(() => newActivityState.startDate, (newDate) => {
    if (newActivityState.endDate === "") {
        newActivityState.endDate = newActivityState.startDate;
    }
});

onMounted(() => {
    // migration stuffs of old values

    let data: Activity[] = JSON.parse(localStorage.getItem(OLD_ACTIVITIES_KEY) || "[]");
    if (data.length > 0) {
        activities$.value = data;
        localStorage.removeItem(OLD_ACTIVITIES_KEY);
    }
    activities$.value.forEach(activity => {
        if (!activity.tasks) {
            activity.tasks = (activity as any)["todos"]?.filter((t: any) => !t.text.startsWith('http')).map((t: any) => ({
                id: t.id,
                text: t.text,
                completed: t.completed
            })) || [];
        }
        if (!activity.links) {
            activity.links = (activity as any)["todos"]?.filter((t: any) => t.text.startsWith('http')).map((t: any) => ({
                id: t.id,
                url: t.text
            })) || [];
        }
        delete (activity as any)["todos"];
    });
});

//
//
//

const MAIN_BUTTON_ACTIONS = {

    createBackupEntry: () => {
        backupIcon.value = mdiCheckCircleOutline;

        backups$.value.push({
            timestamp: Date.now(),
            name: `${formatDate(new Date())} [${activities$.value.length}]`,
            activities: JSON.parse(JSON.stringify(activities$.value))
        });

        setTimeout(() => {
            backupIcon.value = mdiContentSaveOutline;
        }, 2000);
    },

    displayBackupList: () => {
        displayedBackupList.value = true;
    },

    exportJSON: () => {
        const data = JSON.stringify(activities$.value, null, 2);
        createDownloadLink(data, `activity-planner-export-${Date.now()}.json`, 'application/json');
    },

    importJSON: (event: Event) => {
        const save = (jsonData: string) => {
            try {
                const importedActivities: Activity[] = JSON.parse(jsonData);
                activities$.value = importedActivities;
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
        newActivityState.showAddForm = true;
    }
};

const BACKUP_LIST_ACTIONS = {

    restoreBackupEntry: (key: number) => {
        activities$.value = backups$.value.find(b => b.timestamp === key)?.activities || [];
        displayedBackupList.value = false;
    },

    removeBackupEntry: (key: number) => {
        backups$.value = backups$.value.filter(b => b.timestamp !== key);
    },
};

//
//
//

const getActivitiesListForMonth = (month: Date): Activity[] => {
    return activities$.value
        .filter(activity => isSameMonth(new Date(activity.dateStart), month))
        .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
};

const addActivitySubmit = () => {
    if (!newActivityState.title.trim() || !newActivityState.startDate) return;

    const defaultTodo: ActivityTaskItem[] = [{
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
        title: newActivityState.title.trim(),
        dateStart: newActivityState.startDate,
        dateEnd: newActivityState.endDate || newActivityState.startDate,
        links: [],
        tasks: [],
        image: [],
        color: "white"
    };

    activities$.value.push(newActivity);

    // reset
    newActivityState.title = "";
    newActivityState.startDate = "";
    newActivityState.endDate = "";
    newActivityState.showAddForm = false;
};

const updateActivity = (updatedActivity: Activity) => {
    const index = activities$.value.findIndex(a => a.id === updatedActivity.id);
    if (index !== -1) {
        activities$.value[index] = updatedActivity;
    }
};

const deleteActivity = (id: string) => {
    activities$.value = activities$.value.filter(a => a.id !== id);
};
</script>

<template>
    <!-- backup viewer "modal" -->
    <div v-if="displayedBackupList"
        class="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50"
        @click="displayedBackupList = false">

        <!-- display the backups -->
        <div
            @click.stop="() => { /* prevent closing modal on click inside */ }">

            <h2 class="text-2xl font-bold text-white mb-4"> Backups ({{ backups$.length }}) </h2>

            <ul class="space-y-2 max-h-96 overflow-y-auto">
                <li v-for="backupKey in backupsList" :key="backupKey.timestamp"
                    class="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center gap-4">
                    <span class="">
                        {{ backupKey.name }}
                    </span>

                    <button
                        @click.stop="() => BACKUP_LIST_ACTIONS.restoreBackupEntry(backupKey.timestamp)"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                        Restore
                    </button>

                    <button
                        @click.stop="() => BACKUP_LIST_ACTIONS.removeBackupEntry(backupKey.timestamp)"
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
                <h1 class="text-4xl font-bold text-gray-800 mb-2"> Event Planner ({{ activities$.length }}) </h1>
                <p class="text-gray-600">localStorage size ~ {{ getLocalStorageSizeMB() }}</p>
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
                        v-if="!newActivityState.showAddForm"
                        class="border-green-600 text-green-700 bg-green-50"
                        @click="MAIN_BUTTON_ACTIONS.addActivity()"
                        text="Add"
                        :icon="mdiPlusCircleOutline">
                    </ButtonIcon>
                </div>
            </div>

            <div v-if="newActivityState.showAddForm" class="mb-8">
                <div
                    class="bg-white rounded-lg shadow-md p-6 max-w-md border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">New Activity</h3>

                    <input
                        v-model="newActivityState.title"
                        type="text"
                        placeholder="Activity title"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input
                        v-model="newActivityState.startDate"
                        type="date"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input
                        v-model="newActivityState.endDate"
                        type="date"
                        class="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                    <div class="flex gap-3">
                        <button
                            @click="addActivitySubmit"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
                            Create
                        </button>
                        <button
                            @click="() => newActivityState.showAddForm = false"
                            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div class="space-y-8">
                <MonthView
                    v-for="month in monthList"
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
