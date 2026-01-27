'use client'

import { useState, useEffect } from 'react'
import { useUserInputStore } from '@/store/userInputStore'
import { getRecommendations, weatherCodeToCondition, RecommendationResult } from '@/lib/recommend'
import Link from 'next/link'

interface Place {
  place_name: string
  address_name: string
  phone: string
  category: string
  link: string
}

export default function ResultPage() {
  const userInput = useUserInputStore()
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [places, setPlaces] = useState<Record<string, Place[]>>({})
  const [placesLoading, setPlacesLoading] = useState<Record<string, boolean>>({})
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState<{ code: number; temp: number } | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // 날씨 데이터 가져오기 (5초 타임아웃)
      let weatherInfo = { code: 0, temp: 15 } // 기본값
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userInput.location.lat}&longitude=${userInput.location.lng}&current=temperature_2m,weather_code&timezone=Asia/Seoul`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)
        
        const weatherJson = await weatherRes.json()
        weatherInfo = {
          code: weatherJson.current.weather_code,
          temp: weatherJson.current.temperature_2m,
        }
      } catch (weatherError) {
        console.log('날씨 API 실패, 기본값 사용:', weatherError)
      }
      setWeatherData(weatherInfo)
      
      // 추천 생성
      const weatherCondition = weatherCodeToCondition(weatherInfo.code, weatherInfo.temp)
      // 제외 메뉴: 원본 텍스트 그대로 전달 (부분 매칭 지원)
      // "찌개" 입력 시 → 김치찌개, 된장찌개 등 모두 제외됨
      const excludeIds = userInput.recentMeals
        .filter(m => m.exclude)
        .map(m => m.name)

      const results = getRecommendations({
        weatherCondition,
        mood: userInput.mood.preset,
        moodCustom: userInput.mood.custom,
        timeSlot: userInput.timeSlot,
        dietMode: userInput.diet.mode,
        dietOptions: userInput.diet.options,
        excludeMenuIds: excludeIds,
      })

      setRecommendations(results)
      setLoading(false)
      // 맛집 검색은 사용자가 버튼 클릭 시에만!
    }

    fetchData()
  }, [userInput])

  // 사용자가 "근처에서 찾기" 클릭 시 호출 (네이버 API)
  const handleFindNearby = async (menuId: string, menuName: string) => {
    // 이미 검색했으면 토글만
    if (places[menuId]) {
      setExpandedMenu(expandedMenu === menuId ? null : menuId)
      return
    }

    // 로딩 시작
    setPlacesLoading(prev => ({ ...prev, [menuId]: true }))
    setExpandedMenu(menuId)

    // 검색어: "선릉 우동 맛집" 형태로 변환
    const locationShort = userInput.location.name.replace('역', '') // "선릉역" → "선릉"
    const searchQuery = `${locationShort} ${menuName} 맛집`
    try {
      const placesRes = await fetch(`/api/places?query=${encodeURIComponent(searchQuery)}`)
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
          <div className="text-6xl mb-4 animate-bounce">🍽️</div>
          <p className="text-lg text-gray-600">맛있는 메뉴를 찾고 있어요...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-orange-100 transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">추천 결과</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 추천 조건 요약 */}
        <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">📍 {userInput.location.name}</span>
            {weatherData && (
              <span> · {weatherData.temp}°C</span>
            )}
            {userInput.mood.preset && (
              <span> · {getMoodEmoji(userInput.mood.preset)}</span>
            )}
            {userInput.diet.mode !== 'none' && (
              <span> · {getDietEmoji(userInput.diet.mode)}</span>
            )}
          </p>
        </div>

        {/* 추천 메뉴 카드들 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>🎯</span>
            <span>오늘의 추천 메뉴</span>
          </h2>

          {recommendations.map((result, index) => (
            <div
              key={result.menu.id}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden card-hover"
            >
              {/* 메뉴 헤더 */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-orange-500">{index + 1}</span>
                      <h3 className="text-xl font-bold text-gray-800">{result.menu.name}</h3>
                      {result.menu.controversial && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          ⚠️ {result.menu.controversialReason}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {result.menu.category} · {result.menu.subCategory}
                    </p>
                  </div>
                  {userInput.diet.showCalories && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      🔥 약 {result.menu.estimatedCalories}kcal
                    </span>
                  )}
                </div>

                {/* 추천 이유 */}
                {result.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* 트렌드 노트 (실제 사람들 의견) */}
                {result.menu.trendNote && (
                  <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <span>📈</span>
                      <span className="font-medium">트렌드:</span>
                      <span>{result.menu.trendNote}</span>
                    </p>
                  </div>
                )}

                {/* 키워드 태그 */}
                <div className="flex flex-wrap gap-1">
                  {result.menu.keywords.slice(0, 4).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* 근처에서 찾기 버튼 */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => handleFindNearby(result.menu.id, result.menu.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-orange-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    📍 {userInput.location.name} 근처에서 찾기
                  </span>
                  <span className="flex items-center gap-1 text-orange-500">
                    {placesLoading[result.menu.id] ? (
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg 
                        className={`w-5 h-5 transition-transform ${expandedMenu === result.menu.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* 펼쳐지는 맛집 리스트 */}
                {expandedMenu === result.menu.id && (
                  <div className="bg-gray-50 p-4 pt-0">
                    {placesLoading[result.menu.id] ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500">주변 맛집 검색 중...</p>
                      </div>
                    ) : places[result.menu.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {places[result.menu.id].map((place, i) => (
                          <a
                            key={i}
                            href={place.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white rounded-lg hover:bg-green-50 transition-colors shadow-sm border border-gray-100 hover:border-green-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{place.place_name}</p>
                                <p className="text-xs text-gray-500 mt-1">📍 {place.address_name}</p>
                                {place.phone && (
                                  <p className="text-xs text-gray-400 mt-1">📞 {place.phone}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ml-2">
                                <span>🗺️</span>
                                <span>지도</span>
                              </div>
                            </div>
                          </a>
                        ))}
                        <p className="text-xs text-center text-gray-400 pt-1">
                          클릭하면 네이버 지도에서 리뷰와 상세정보를 볼 수 있어요
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        😢 주변에 검색 결과가 없어요
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-lg mx-auto flex gap-3">
          <Link
            href="/"
            className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 font-bold text-center rounded-2xl hover:bg-gray-200 transition-colors"
          >
            ← 다시 설정
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-4 px-6 btn-gradient text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30"
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
    happy: '😊 기분좋음',
    sad: '😢 우울',
    stressed: '😤 스트레스',
    tired: '🤒 피곤',
    special: '🎉 특별한날',
    normal: '🤔 평범',
  }
  return emojis[mood] || mood
}

function getDietEmoji(diet: string): string {
  const emojis: Record<string, string> = {
    diet: '🏃 다이어트',
    bulk: '💪 벌크업',
    keto: '🥬 키토',
    lowfat: '🍚 저지방',
    vegan: '🌱 채식',
    healthy: '🩺 건강식',
  }
  return emojis[diet] || diet
}
