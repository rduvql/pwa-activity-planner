<script setup lang="ts">
import type { Activity } from '../types'
import { formatMonthYear } from '../utils/dateUtils'
import ActivityCard from './ActivityCard.vue'

defineProps<{
  month: Date
  activities: Activity[]
}>()

const emit = defineEmits<{
  updateActivity: [activity: Activity]
  deleteActivity: [id: string]
}>()
</script>

<template>
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-600">
      {{ formatMonthYear(month) }}
    </h2>

    <div v-if="activities.length === 0" class="text-gray-400 italic py-4">
      No activities planned for this month
    </div>

    <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <ActivityCard
        v-for="activity in activities"
        :key="activity.id"
        :activity="activity"
        @update="emit('updateActivity', $event)"
        @delete="emit('deleteActivity', $event)"
      />
    </div>
  </div>
</template>
