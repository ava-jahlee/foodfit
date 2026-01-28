'use client'

import { useState, useEffect } from 'react'
import { useUserInputStore } from '@/store/userInputStore'
import { getRecommendations, weatherCodeToCondition, RecommendationResult } from '@/lib/recommend'
import { SelectionLog } from '@/lib/supabase'
import Link from 'next/link'
import Footer from '@/components/common/Footer'
import DarkModeToggle from '@/components/common/DarkModeToggle'

interface Place {
  place_name: string
  address_name: string
  phone: string
  category: string
  link: string
  distanceText?: string  // 거리 (예: "500m", "1.2km")
}

// 네이버 지도 앱으로 열기 (모바일) 또는 웹으로 열기 (데스크톱)
function openNaverMap(placeName: string, webLink: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const encodedQuery = encodeURIComponent(placeName)
  
  if (isMobile) {
    // 네이버 지도 앱 딥링크
    const appLink = `nmap://search?query=${encodedQuery}&appname=com.foodfit.app`
    const webFallback = `https://map.naver.com/v5/search/${encodedQuery}`
    
    // 앱 열기 시도
    const startTime = Date.now()
    window.location.href = appLink
    
    // 앱이 없으면 웹으로 (2초 후)
    setTimeout(() => {
      // 페이지가 아직 보이면 앱이 안 열린 것
      if (Date.now() - startTime < 2500) {
        window.open(webFallback, '_blank')
      }
    }, 2000)
  } else {
    // 데스크톱은 웹으로
    window.open(webLink || `https://map.naver.com/v5/search/${encodedQuery}`, '_blank')
  }
}

export default function ResultPage() {
  const userInput = useUserInputStore()
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [places, setPlaces] = useState<Record<string, Place[]>>({})
  const [placesLoading, setPlacesLoading] = useState<Record<string, boolean>>({})
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState<{ code: number; temp: number } | null>(null)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [weatherCondition, setWeatherCondition] = useState<string>('normal')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      let weatherInfo = { code: 0, temp: 15, humidity: 50, rain: 0 }
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userInput.location.lat}&longitude=${userInput.location.lng}&current=temperature_2m,weather_code,relative_humidity_2m,rain&timezone=Asia/Seoul`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)
        
        const weatherJson = await weatherRes.json()
        weatherInfo = {
          code: weatherJson.current.weather_code,
          temp: weatherJson.current.temperature_2m,
          humidity: weatherJson.current.relative_humidity_2m || 50,
          rain: weatherJson.current.rain || 0,
        }
      } catch (weatherError) {
        console.log('날씨 API 실패, 기본값 사용:', weatherError)
      }
      setWeatherData(weatherInfo)
      
      const condition = weatherCodeToCondition(weatherInfo.code, weatherInfo.temp)
      setWeatherCondition(condition)
      
      const excludeIds = userInput.recentMeals
        .filter(m => m.exclude)
        .map(m => m.name)

      // 🔥 다변량 분석 파라미터 포함
      const results = getRecommendations({
        weatherCondition: condition,
        temperature: weatherInfo.temp,
        humidity: weatherInfo.humidity,
        precipitation: weatherInfo.rain,
        mood: userInput.mood.preset,
        moodCustom: userInput.mood.custom,
        timeSlot: userInput.timeSlot,
        dietMode: userInput.diet.mode,
        dietOptions: userInput.diet.options,
        excludeMenuIds: excludeIds,
        foodCategory: userInput.foodCategory,
        adventureMode: userInput.adventureMode,
      })

      setRecommendations(results)
      setLoading(false)
    }

    fetchData()
  }, [userInput])

  const getTimeBasedKeyword = () => {
    const hour = new Date().getHours()
    // 심야/새벽에만 24시 키워드, 나머지는 맛집
    if (hour >= 23 || hour < 6) return '24시'
    return '맛집'
  }

  const handleFindNearby = async (menuId: string, menuName: string, menuCategory: string) => {
    if (places[menuId]) {
      setExpandedMenu(expandedMenu === menuId ? null : menuId)
      return
    }

    if (!selectedMenuId || selectedMenuId !== menuId) {
      setSelectedMenuId(menuId)
      
      const logData = {
      weather_condition: weatherCondition,
      temperature: weatherData?.temp || 15,
      mood: userInput.mood.preset || 'normal',
      mood_custom: userInput.mood.custom,
      time_slot: userInput.timeSlot,
      diet_mode: userInput.diet.mode,
        selected_menu: menuName,
        selected_menu_category: menuCategory,
      location: userInput.location.name,
      was_recommended: true,
    }

    try {
      await fetch('/api/log-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      })
    } catch (err) {
      console.error('선택 로그 저장 실패:', err)
    }
  }

    setPlacesLoading(prev => ({ ...prev, [menuId]: true }))
    setExpandedMenu(menuId)

    // 위치 이름 정제 (역 제거, GPS 위치는 전체 사용)
    const isGPS = userInput.location.region === 'GPS'
    const locationName = isGPS 
      ? userInput.location.name  // GPS: "강남구 역삼동" 그대로 사용
      : userInput.location.name.replace('역', '')  // 역: "선릉역" → "선릉"
    
    const timeKeyword = getTimeBasedKeyword()
    const searchQuery = `${locationName} ${menuName} ${timeKeyword}`
    
    try {
      // 좌표도 함께 전송해서 거리순 정렬
      const { lat, lng } = userInput.location
      const placesRes = await fetch(
        `/api/places?query=${encodeURIComponent(searchQuery)}&lat=${lat}&lng=${lng}`
      )
      const placesJson = await placesRes.json()
      
      setPlaces(prev => ({
        ...prev,
        [menuId]: placesJson.places || []
      }))
    } catch (err) {
      console.error('Failed to fetch places:', err)
      setPlaces(prev => ({
        ...prev,
        [menuId]: []
      }))
    } finally {
      setPlacesLoading(prev => ({ ...prev, [menuId]: false }))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🍽️</div>
          <p className="text-gray-500">맛있는 메뉴를 찾고 있어요...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">추천 결과</h1>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 추천 조건 요약 */}
        <div className="glass-card p-4 opacity-0 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <span className="font-medium">📍 {userInput.location.name}</span>
            {weatherData && (
              <span className="text-gray-400">· {weatherData.temp}°C</span>
            )}
            {userInput.mood.preset && (
              <span className="text-gray-400">· {getMoodEmoji(userInput.mood.preset)}</span>
            )}
            {userInput.diet.mode !== 'none' && (
              <span className="text-gray-400">· {getDietLabel(userInput.diet.mode)}</span>
            )}
          </div>
        </div>

        {/* 추천 메뉴 카드들 */}
        <div className="space-y-3">
          {recommendations.map((result, index) => (
            <div
              key={result.menu.id}
              className="glass-card overflow-hidden opacity-0 animate-slide-up"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              {/* 메뉴 헤더 */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-orange-500">{index + 1}</span>
                  <div>
                      <h3 className="text-lg font-bold text-gray-800">{result.menu.name}</h3>
                      <p className="text-xs text-gray-400">
                        {result.menu.category} · {result.menu.subCategory}
                      </p>
                    </div>
                  </div>
                  {userInput.diet.showCalories && (
                    <span className="text-xs text-gray-400 bg-gray-100/80 px-2 py-1 rounded-lg">
                      {result.menu.estimatedCalories}kcal
                    </span>
                  )}
                </div>

                {/* 추천 이유 태그 */}
                {result.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.reasons.slice(0, 3).map((reason, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* 키워드 */}
                <div className="flex flex-wrap gap-1">
                  {result.menu.keywords.slice(0, 4).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs text-gray-400"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* 이거 먹으러 갈래! 버튼 */}
              <div className="px-5 pb-4">
                <button
                  onClick={() => handleFindNearby(result.menu.id, result.menu.name, result.menu.category)}
                  className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    selectedMenuId === result.menu.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
                  }`}
                >
                  {placesLoading[result.menu.id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>찾는 중...</span>
                    </>
                  ) : selectedMenuId === result.menu.id ? (
                    <>
                      <span>📍 {userInput.location.name} 근처 맛집</span>
                    </>
                  ) : (
                    <>
                      <span>이거 먹으러 갈래!</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

                {/* 펼쳐지는 맛집 리스트 */}
              {expandedMenu === result.menu.id && !placesLoading[result.menu.id] && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-fade-in">
                  {places[result.menu.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {places[result.menu.id].map((place, i) => (
                          <button
                            key={i}
                            onClick={() => openNaverMap(place.place_name, place.link)}
                            className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all border border-gray-100 dark:border-slate-700"
                          >
                          <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{place.place_name}</p>
                                  {place.distanceText && (
                                    <span className="text-xs text-blue-500 font-medium">
                                      📍 {place.distanceText}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{place.address_name}</p>
                              </div>
                            <span className="text-xs text-orange-500 font-medium flex-shrink-0">
                              지도 앱 →
                            </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      주변에 검색 결과가 없어요
                      </p>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <Footer />
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pointer-events-none" />
        <div className="max-w-lg mx-auto flex gap-3 relative">
          <Link
            href="/"
            className="flex-1 py-3.5 px-6 glass text-gray-600 font-medium text-center rounded-xl hover:bg-white transition-colors"
          >
            ← 다시 설정
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3.5 px-6 btn-primary rounded-xl"
          >
            🔄 다시 추천
          </button>
        </div>
      </div>
    </main>
  )
}

function getMoodEmoji(mood: string): string {
  const emojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    stressed: '😤',
    tired: '🤒',
    special: '🎉',
    normal: '🤔',
  }
  return emojis[mood] || mood
}

function getDietLabel(diet: string): string {
  const labels: Record<string, string> = {
    diet: '다이어트',
    bulk: '벌크업',
    keto: '키토',
    lowfat: '저지방',
    vegan: '채식',
    healthy: '건강식',
  }
  return labels[diet] || diet
}
