import { create } from 'zustand'

export type TimeSlot = 'breakfast' | 'lunch' | 'dinner' | 'latenight'
export type MoodType = 'happy' | 'sad' | 'stressed' | 'tired' | 'special' | 'normal'
export type DietMode = 'diet' | 'bulk' | 'keto' | 'lowfat' | 'vegan' | 'healthy' | 'none'
export type FoodCategory = 'all' | 'korean' | 'western' | 'asian' | 'light'

interface Location {
  name: string
  lat: number
  lng: number
  region?: string  // 지역 구분 (서울, 부산, GPS 등)
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

// 날씨 정보 (다변량 분석용)
interface WeatherData {
  temperature: number      // 기온 (°C)
  humidity: number         // 습도 (%)
  precipitation: number    // 강수량 (mm)
  weatherCode: number      // 날씨 코드
  condition: string        // 날씨 상태 (hot, cold, rainy 등)
}

interface UserInputState {
  // 위치
  location: Location
  setLocation: (location: Location) => void
  
  // 날씨 (다변량 분석용)
  weather: WeatherData
  setWeather: (weather: Partial<WeatherData>) => void
  
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
  
  // 음식 카테고리
  foodCategory: FoodCategory
  setFoodCategory: (category: FoodCategory) => void
  
  // 모험 모드 (색다른 거 도전)
  adventureMode: boolean
  setAdventureMode: (mode: boolean) => void
  
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
    region: '서울',
  },
  weather: {
    temperature: 15,
    humidity: 50,
    precipitation: 0,
    weatherCode: 0,
    condition: 'cloudy',
  } as WeatherData,
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
  foodCategory: 'all' as FoodCategory,
  adventureMode: false,
  recentMeals: [] as RecentMeal[],
}

export const useUserInputStore = create<UserInputState>((set) => ({
  ...initialState,
  
  setLocation: (location) => set({ location }),
  
  setWeather: (weatherUpdate) => set((state) => ({
    weather: { ...state.weather, ...weatherUpdate }
  })),
  
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
  
  setFoodCategory: (foodCategory) => set({ foodCategory }),
  
  setAdventureMode: (adventureMode) => set({ adventureMode }),
  
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
