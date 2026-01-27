'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WeatherCard from '@/components/weather/WeatherCard'
import MoodSelector from '@/components/mood/MoodSelector'
import DietSelector from '@/components/diet/DietSelector'
import RecentMealInput from '@/components/menu/RecentMealInput'
import LocationSelector from '@/components/location/LocationSelector'
import { useUserInputStore } from '@/store/userInputStore'
import { getTimeSlotLabel, getTimeSlotEmoji } from '@/utils/time'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { location, timeSlot, setTimeSlot } = useUserInputStore()
  
  // 현재 시간대 자동 감지
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) {
      setTimeSlot('breakfast')
    } else if (hour >= 11 && hour < 15) {
      setTimeSlot('lunch')
    } else if (hour >= 15 && hour < 21) {
      setTimeSlot('dinner')
    } else {
      setTimeSlot('latenight')
    }
  }, [setTimeSlot])

  const handleRecommend = async () => {
    setIsLoading(true)
    // SPA 방식으로 페이지 이동 (Zustand store 상태 유지)
    setTimeout(() => {
      router.push('/result')
    }, 1000)
  }

  return (
    <main className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            🍽️ FoodFit
          </h1>
          <button className="p-2 rounded-full hover:bg-orange-100 transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 위치 선택 */}
        <LocationSelector />

        {/* 날씨 카드 */}
        <WeatherCard />

        {/* 시간대 표시 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getTimeSlotEmoji(timeSlot)}</span>
            <div>
              <p className="text-sm text-gray-500">현재 시간대</p>
              <p className="font-semibold text-gray-800">{getTimeSlotLabel(timeSlot)}</p>
            </div>
          </div>
        </div>

        {/* 기분 선택 */}
        <MoodSelector />

        {/* 식단 관리 모드 */}
        <DietSelector />

        {/* 최근 먹은 메뉴 */}
        <RecentMealInput />
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className="w-full py-4 px-6 btn-gradient text-white font-bold text-lg rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>추천 중...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>메뉴 추천받기!</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
