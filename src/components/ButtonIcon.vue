<script setup lang="ts">

export type ButtonIconProps = {
    text: string;
    icon: string;
};
const props = defineProps<ButtonIconProps>();

</script>

<template>
    <button
        class="group py-4 bg-white border-2 rounded-lg font-medium shadow-sm">
        <div class="flex items-center justify-center gap-2">
            <span class="text-xl">
                <svg :width="'24px'" :height="'24px'" viewBox="0 0 24 24">
                    <path :d="props.icon" />
                </svg>
            </span>
            <span class=""> {{ props.text }} </span>
        </div>
    </button>
</template>
