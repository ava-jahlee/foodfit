import { create } from 'zustand'

export type TimeSlot = 'breakfast' | 'lunch' | 'dinner' | 'latenight'
export type MoodType = 'happy' | 'sad' | 'stressed' | 'tired' | 'special' | 'normal'
export type DietMode = 'diet' | 'bulk' | 'keto' | 'lowfat' | 'vegan' | 'healthy' | 'none'

interface Location {
  name: string
  lat: number
  lng: number
}

interface RecentMeal {
  id: string
  name: string
  exclude: boolean
}

interface DietOptions {
  lowSodium: boolean
  noLateNight: boolean
  noAlcohol: boolean
}

interface UserInputState {
  // 위치
  location: Location
  setLocation: (location: Location) => void
  
  // 시간대
  timeSlot: TimeSlot
  setTimeSlot: (timeSlot: TimeSlot) => void
  
  // 기분
  mood: {
    preset: MoodType | null
    custom: string
  }
  setMoodPreset: (preset: MoodType | null) => void
  setMoodCustom: (custom: string) => void
  
  // 식단 관리
  diet: {
    mode: DietMode
    options: DietOptions
    showCalories: boolean
  }
  setDietMode: (mode: DietMode) => void
  setDietOption: (key: keyof DietOptions, value: boolean) => void
  setShowCalories: (show: boolean) => void
  
  // 최근 먹은 메뉴
  recentMeals: RecentMeal[]
  addRecentMeal: (name: string) => void
  removeRecentMeal: (id: string) => void
  toggleMealExclude: (id: string) => void
  
  // 리셋
  reset: () => void
}

const initialState = {
  location: {
    name: '선릉역',
    lat: 37.5045,
    lng: 127.0494,
  },
  timeSlot: 'lunch' as TimeSlot,
  mood: {
    preset: null as MoodType | null,
    custom: '',
  },
  diet: {
    mode: 'none' as DietMode,
    options: {
      lowSodium: false,
      noLateNight: false,
      noAlcohol: false,
    },
    showCalories: false,
  },
  recentMeals: [] as RecentMeal[],
}

export const useUserInputStore = create<UserInputState>((set) => ({
  ...initialState,
  
  setLocation: (location) => set({ location }),
  
  setTimeSlot: (timeSlot) => set({ timeSlot }),
  
  setMoodPreset: (preset) => set((state) => ({
    mood: { ...state.mood, preset, custom: '' }
  })),
  
  setMoodCustom: (custom) => set((state) => ({
    mood: { ...state.mood, custom, preset: null }
  })),
  
  setDietMode: (mode) => set((state) => ({
    diet: { ...state.diet, mode }
  })),
  
  setDietOption: (key, value) => set((state) => ({
    diet: {
      ...state.diet,
      options: { ...state.diet.options, [key]: value }
    }
  })),
  
  setShowCalories: (showCalories) => set((state) => ({
    diet: { ...state.diet, showCalories }
  })),
  
  addRecentMeal: (name) => set((state) => ({
    recentMeals: [
      ...state.recentMeals,
      {
        id: Date.now().toString(),
        name,
        exclude: true,
      }
    ]
  })),
  
  removeRecentMeal: (id) => set((state) => ({
    recentMeals: state.recentMeals.filter((meal) => meal.id !== id)
  })),
  
  toggleMealExclude: (id) => set((state) => ({
    recentMeals: state.recentMeals.map((meal) =>
      meal.id === id ? { ...meal, exclude: !meal.exclude } : meal
    )
  })),
  
  reset: () => set(initialState),
}))
