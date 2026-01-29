'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WeatherCard from '@/components/weather/WeatherCard'
import MoodSelector from '@/components/mood/MoodSelector'
import DietSelector from '@/components/diet/DietSelector'
import RecentMealInput from '@/components/menu/RecentMealInput'
import LocationSelector from '@/components/location/LocationSelector'
import CategorySelector from '@/components/category/CategorySelector'
import Footer from '@/components/common/Footer'
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
    setTimeout(() => {
      router.push('/result')
    }, 800)
  }

  return (
    <main className="min-h-screen pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span>FoodFit</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/insights"
              className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium hover:from-blue-100 hover:to-purple-100 transition-all border border-blue-200"
            >
              📊 인사이트
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getTimeSlotEmoji(timeSlot)}</span>
              <span className="hidden sm:inline">{getTimeSlotLabel(timeSlot)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 위치 + 날씨 */}
        <div className="opacity-0 animate-fade-in stagger-1">
        <LocationSelector />
        </div>

        <div className="opacity-0 animate-fade-in stagger-2">
        <WeatherCard />
            </div>

        {/* 음식 카테고리 선택 */}
        <div className="opacity-0 animate-fade-in stagger-3">
          <CategorySelector />
        </div>

        {/* 기분 선택 */}
        <div className="opacity-0 animate-fade-in stagger-4">
        <MoodSelector />
        </div>

        {/* 식단 관리 모드 */}
        <div className="opacity-0 animate-fade-in stagger-5">
        <DietSelector />
        </div>

        {/* 최근 먹은 메뉴 */}
        <div className="opacity-0 animate-fade-in stagger-6">
        <RecentMealInput />
        </div>

        {/* 푸터 */}
        <Footer />
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pointer-events-none" />
        <div className="max-w-lg mx-auto relative">
          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className="w-full py-4 px-6 btn-primary text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>추천 중...</span>
              </>
            ) : (
              <>
                <span>메뉴 추천받기</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
