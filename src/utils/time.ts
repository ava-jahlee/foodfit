import { TimeSlot } from '@/store/userInputStore'

export function getTimeSlotLabel(timeSlot: TimeSlot): string {
  const labels: Record<TimeSlot, string> = {
    breakfast: '아침 시간이에요!',
    lunch: '점심 시간이에요!',
    dinner: '저녁 시간이에요!',
    latenight: '야식 시간이에요!',
  }
  return labels[timeSlot]
}

export function getTimeSlotEmoji(timeSlot: TimeSlot): string {
  const emojis: Record<TimeSlot, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌆',
    latenight: '🌙',
  }
  return emojis[timeSlot]
}

export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 15 && hour < 21) return 'dinner'
  return 'latenight'
}
