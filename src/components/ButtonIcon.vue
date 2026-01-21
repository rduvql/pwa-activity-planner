<script setup lang="ts">

export type ButtonIconProps = {
    text: string;
    icon: string;
};
const props = defineProps<ButtonIconProps>();

</script>

<template>
    <button class="group py-2 border-2 rounded-lg font-medium">

        <div class="flex items-center justify-center gap-1">
            <span class="text-md">
                <svg :width="'24px'" :height="'24px'" viewBox="0 0 24 24">
                    <path :d="props.icon" />
                </svg>
            </span>

            <span class=""> {{ props.text }} </span>
        </div>
    </button>
</template>
