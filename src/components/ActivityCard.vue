<script setup lang="ts">
import { mdiAlert } from '@mdi/js';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import type { Activity, ActivityLinkItem, ActivityTaskItem } from '../types';
import { formatDate } from '../utils/dateUtils';
import { ACTIVITIES_STORAGE_KEY } from '../utils/storage.utils';
import { googleCalendarLink, safeParseUrl } from '../utils/utils';

const COLORS_CLASS_MAPPING = {
    "white": {
        bg: 'bg-white',
        btn: 'bg-white-300'
    },
    'blue': {
        bg: 'bg-blue-100',
        btn: 'bg-blue-300'
    },
    'green': {
        bg: 'bg-green-100',
        btn: 'bg-green-300'
    },
    'yellow': {
        bg: 'bg-yellow-100',
        btn: 'bg-yellow-300'
    },
    'red': {
        bg: 'bg-red-100',
        btn: 'bg-red-300'
    }
};

//
//
//

const props = defineProps<{
    activity: Activity;
}>();

const emit = defineEmits<{
    update: [activity: Activity];
    delete: [id: string];
}>();

const state$ = reactive({
    newEntry: "",
    isEditing: false,
    editTitle: props.activity.title,
    editStartDate: props.activity.dateStart,
    editEndDate: props.activity.dateEnd,

});

const taskToDelete = ref<string | null>(null);
const imageToDelete = ref<string | null>(null);
const confirmDelete = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string[]>(props.activity.image || []);
const imageZoom = ref<string | undefined>(undefined);

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

//
//
//

const colorIndex = ref<keyof typeof COLORS_CLASS_MAPPING>(props.activity.color as any || "white");

const cycleColor = () => {
    const colorKeys = Object.keys(COLORS_CLASS_MAPPING) as (keyof typeof COLORS_CLASS_MAPPING)[];
    const currentIndex = colorKeys.indexOf(colorIndex.value);
    colorIndex.value = colorKeys[((currentIndex + 1) % colorKeys.length)];
    emit('update', {
        ...props.activity,
        color: colorIndex.value
    });
};

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

const addTaskOrLink = () => {
    if (state$.newEntry.trim() === "") return;

    const isLink = state$.newEntry.startsWith("http");

    if (isLink) {
        const newLink: ActivityLinkItem = {
            id: Date.now().toString(),
            url: state$.newEntry.trim(),
        };

        emit('update', {
            ...props.activity,
            links: [...props.activity.links, newLink]
        });

    } else {
        const newTask: ActivityTaskItem = {
            id: Date.now().toString(),
            text: state$.newEntry.trim(),
            completed: false
        };

        emit('update', {
            ...props.activity,
            tasks: [...props.activity.tasks, newTask]
        });
    }

    state$.newEntry = '';
};

const toggleTaskCheckbox = (taskId: string) => {
    emit('update', {
        ...props.activity,
        tasks: props.activity.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        )
    });
};

const handleDeleteActivity = (event: MouseEvent) => {
    console.log("handleDeleteActivity");
    event.stopPropagation();

    if (confirmDelete.value) {
        emit('delete', props.activity.id);
        confirmDelete.value = false;
    } else {
        confirmDelete.value = true;
    }
};

const handleDeleteTask = (id: string, event: MouseEvent) => {
    console.log("handleDeleteTask");
    event.stopPropagation();

    if (taskToDelete.value === id) {
        emit('update', {
            ...props.activity,
            tasks: props.activity.tasks.filter(task => task.id !== id)
        });
        taskToDelete.value = null;
    } else {
        taskToDelete.value = id;
    }
};

const handleDeleteLink = (id: string, event: MouseEvent) => {
    console.log("handleDeleteLink");
    event.stopPropagation();

    if (taskToDelete.value === id) {
        emit('update', {
            ...props.activity,
            links: props.activity.links.filter(link => link.id !== id)
        });
        taskToDelete.value = null;
    } else {
        taskToDelete.value = id;
    }
};

const handleDeleteImage = (index: number, event: MouseEvent) => {
    console.log("handleDeleteImage");
    event.stopPropagation();

    if (imageToDelete.value === `${index}`) {

        imagePreview.value.splice(index, 1);

        emit('update', {
            ...props.activity,
            image: imagePreview.value
        });
        if (fileInput.value) {
            fileInput.value.value = '';
        }
        imageToDelete.value = null;
    } else {
        imageToDelete.value = `${index}`;
    }
};

const saveEdit = () => {
    if (!state$.editTitle.trim()) return;

    emit('update', {
        ...props.activity,
        title: state$.editTitle.trim(),
        dateStart: state$.editStartDate,
        dateEnd: state$.editEndDate
    });

    state$.isEditing = false;
};

const cancelEdit = () => {
    state$.editTitle = props.activity.title;
    state$.editStartDate = props.activity.dateStart;
    state$.editEndDate = props.activity.dateEnd;
    state$.isEditing = false;
};


const formatLink = (link: string): string => {
    let url = safeParseUrl(link);
    if (url) {
        return `${url.href.replace(url.protocol + "//", "")}`;
    } else {
        return "ERR_URL";
    }
};


const isDraft = (): boolean => {
    return props.activity.title.includes("wip") || props.activity.title.includes("draft");
};

const isValidated = (): boolean => {
    return props.activity.title.includes("OK");
};

const handleClickOutside = (event: MouseEvent) => {
    // console.log(event);
    const target = event.target as HTMLElement;
    // Check if click is not on a trash icon button
    if (!target.closest('button[data-delete-task]')) {
        taskToDelete.value = null;
    }
    if (!target.closest("button[data-delete-image]")) {
        imageToDelete.value = null;
    }
    if (!target.closest("button[data-delete-activity]")) {
        confirmDelete.value = false;
    }
};

const getConflictingActivities = (activity: Activity): Activity[] => {
    const startDate = new Date(activity.dateStart);
    const endDate = new Date(activity.dateEnd);

    return (JSON.parse(localStorage.getItem(ACTIVITIES_STORAGE_KEY) || '[]') as Activity[]).filter(a => {
        if (a.id === activity.id) return false; // skip self

        const aStart = new Date(a.dateStart);
        const aEnd = new Date(a.dateEnd);

        return (aStart <= endDate) && (aEnd >= startDate);
    });
};

const daysFromNow = (date: number | string | Date): string => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
};

</script>

<template>
    <div :class="['rounded-lg shadow-md p-4 border border-gray-200 w-full', COLORS_CLASS_MAPPING[colorIndex].bg]">

        <div v-if="!state$.isEditing" class="flex items-start justify-between mb-2">

            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <button
                        @click="cycleColor"
                        :class="['w-8 h-8 rounded border border-gray-300', COLORS_CLASS_MAPPING[colorIndex].btn]"
                        title="Cycle color">
                    </button>

                    <h3 class="text-lg font-semibold">
                        {{ activity.title }}
                    </h3>
                </div>

            </div>

            <!-- BUTTONS -->
            <div class="flex gap-8">
                <button data-delete-task
                    @click="state$.isEditing = true"
                    class="text-blue-600 hover:text-blue-700 text-md font-medium">
                    Edit
                </button>
                <button data-delete-activity
                    @click="handleDeleteActivity($event)"
                    class="text-red-600 hover:text-red-700 text-md font-medium">
                    {{ confirmDelete ? 'Confirm ?' : 'Delete' }}
                </button>
            </div>

        </div>

        <!-- DATE -->
        <div class="flex items-center gap-2 text-md mb-4">
            <svg v-if="getConflictingActivities(props.activity).length > 0"
                class="w-[1.5em] h-[1.5em] flex-shrink-0" viewBox="0 0 24 24">
                <path :d="mdiAlert" />
            </svg>

            <a target="_blank"
                class="text-blue-500 underline"
                :href="googleCalendarLink({ fromstr: activity.dateStart, tostr: activity.dateEnd, title: activity.title })">
                {{ formatDate(activity.dateStart) }} - {{ formatDate(activity.dateEnd) }}
            </a>

            <span> [In {{ daysFromNow(props.activity.dateStart) }} days] </span>
        </div>

        <div v-if="state$.isEditing" class="mb-3">
            <input
                v-model="state$.editTitle"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Activity title"
                @keypress.enter="saveEdit" />
            <input
                v-model="state$.editStartDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input
                v-model="state$.editEndDate"
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

        <div>
            <!--               -->
            <!-- checkbox list -->
            <!--               -->
            <div v-if="!isDraft() && !isValidated()" class="space-y-2 mb-3">
                <div v-for="task in props.activity.tasks"
                    :key="task.id"
                    :class="[
                        'flex items-center gap-2 p-1 rounded transition-colors duration-200',
                        taskToDelete === task.id ? 'bg-red-900/30 border border-red-500/50' : ''
                    ]">

                    <input :id="task.id"
                        type="checkbox"
                        :checked="task.completed"
                        @change="toggleTaskCheckbox(task.id)"
                        class="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />

                    <label :for="task.id"
                        :class="[
                            'flex-1 text-sm',
                            'select-none',
                            task.completed ? 'line-through text-gray-400' : 'text-gray-700'
                        ]">
                        {{ task.text }}
                    </label>

                    <!-- DELETE button -->
                    <button
                        @click="handleDeleteTask(task.id, $event)"
                        :class="[
                            'rounded transition-all duration-200',
                            taskToDelete === task.id
                                ? 'text-red-400 hover:text-red-300 opacity-100'
                                : 'text-black-500 hover:text-black-400 '
                        ]">

                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                            </path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Separator -->
            <hr v-if="props.activity.tasks?.length > 0 && props.activity.links?.length > 0"
                class="my-4 border-gray-300" />

            <!--               -->
            <!-- Links display -->
            <!--               -->
            <div class="space-y-2 mb-3">
                <div
                    v-for="link in props.activity.links"
                    :key="link.id"
                    :class="[
                        'flex items-center gap-2 p-1 rounded transition-colors duration-200',
                        taskToDelete === link.id ? 'bg-red-900/30 border border-red-500/50' : ''
                    ]">

                    <span
                        :class="[
                            'flex-1 text-sm text-blue-600 underline text-ellipsis overflow-hidden whitespace-nowrap',
                        ]">
                        <a target="_blank" :href="link.url">{{ formatLink(link.url) }}</a>
                    </span>

                    <!-- DELETE button -->
                    <button
                        @click="handleDeleteLink(link.id, $event)"
                        :class="[
                            'rounded transition-all duration-200',
                            taskToDelete === link.id
                                ? 'text-red-400 hover:text-red-300 opacity-100'
                                : 'text-black-500 hover:text-black-400 '
                        ]"
                        :title="taskToDelete === link.id ? 'Click again to confirm deletion' : 'Delete task'">

                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                            </path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
                        data-delete-image
                        @click="handleDeleteImage(idx, $event)"
                        class="top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm  group-hover:opacity-100 transition">
                        {{ `${idx}` === imageToDelete ? 'Cofnirm ?' : 'Remove' }}
                    </button>
                </div>
            </div>

            <!-- image viewer "modal" -->
            <div v-if="imageZoom" class="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50"
                @click="imageZoom = undefined">

                <img
                    :src="imageZoom"
                    alt="Full page view"
                    class="max-w-full max-h-full object-contain" />
            </div>

            <!-- BUTTON add -->
            <div class="flex gap-2 mt-4">
                <input
                    v-model="state$.newEntry"
                    @keyup.enter="addTaskOrLink"
                    type="text"
                    placeholder="Add task or link"
                    class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                <button
                    @click="addTaskOrLink"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                    Add
                </button>

                <button
                    @click="fileInput?.click()"
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


    </div>
</template>
