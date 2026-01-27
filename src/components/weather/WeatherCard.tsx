'use client'

import { useState, useEffect } from 'react'
import { useUserInputStore } from '@/store/userInputStore'

interface WeatherData {
  temperature: number
  weatherCode: number
  description: string
  humidity: number
  rain: number
}

const weatherCodeMap: Record<number, { description: string; emoji: string }> = {
  0: { description: '맑음', emoji: '☀️' },
  1: { description: '대체로 맑음', emoji: '🌤️' },
  2: { description: '구름 조금', emoji: '⛅' },
  3: { description: '흐림', emoji: '☁️' },
  45: { description: '안개', emoji: '🌫️' },
  48: { description: '짙은 안개', emoji: '🌫️' },
  51: { description: '이슬비', emoji: '🌧️' },
  53: { description: '이슬비', emoji: '🌧️' },
  55: { description: '이슬비', emoji: '🌧️' },
  61: { description: '약한 비', emoji: '🌧️' },
  63: { description: '비', emoji: '🌧️' },
  65: { description: '강한 비', emoji: '⛈️' },
  71: { description: '약한 눈', emoji: '🌨️' },
  73: { description: '눈', emoji: '❄️' },
  75: { description: '강한 눈', emoji: '❄️' },
  77: { description: '싸락눈', emoji: '🌨️' },
  80: { description: '소나기', emoji: '🌦️' },
  81: { description: '소나기', emoji: '🌦️' },
  82: { description: '강한 소나기', emoji: '⛈️' },
  95: { description: '뇌우', emoji: '⛈️' },
  96: { description: '뇌우 + 우박', emoji: '⛈️' },
  99: { description: '뇌우 + 우박', emoji: '⛈️' },
}

function getWeatherInfo(code: number) {
  return weatherCodeMap[code] || { description: '알 수 없음', emoji: '❓' }
}

export default function WeatherCard() {
  const { location } = useUserInputStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,weather_code,relative_humidity_2m,rain&timezone=Asia/Seoul`
        )
        
        if (!response.ok) throw new Error('날씨 정보를 가져올 수 없습니다')
        
        const data = await response.json()
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          description: getWeatherInfo(data.current.weather_code).description,
          humidity: data.current.relative_humidity_2m,
          rain: data.current.rain || 0,
        })
      } catch (err) {
        setError('날씨 정보를 불러오는데 실패했습니다')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location.lat, location.lng])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/20 rounded"></div>
            <div className="h-8 w-24 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-center">{error || '날씨 정보를 불러올 수 없습니다'}</p>
      </div>
    )
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode)
  
  // 온도에 따른 배경색
  const getBgGradient = () => {
    if (weather.temperature >= 30) return 'from-orange-400 to-red-500'
    if (weather.temperature >= 20) return 'from-amber-400 to-orange-500'
    if (weather.temperature >= 10) return 'from-sky-400 to-blue-500'
    if (weather.temperature >= 0) return 'from-blue-400 to-indigo-500'
    return 'from-indigo-400 to-purple-500'
  }

  return (
    <div className={`bg-gradient-to-br ${getBgGradient()} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden`}>
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 opacity-10">
        <span className="text-[120px]">{weatherInfo.emoji}</span>
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-6xl animate-float">{weatherInfo.emoji}</span>
          <div>
            <p className="text-white/80 text-sm">{weather.description}</p>
            <p className="text-4xl font-bold">{weather.temperature}°C</p>
          </div>
        </div>
        
        <div className="text-right text-sm text-white/80 space-y-1">
          <p>💧 습도 {weather.humidity}%</p>
          {weather.rain > 0 && <p>🌧️ 강수 {weather.rain}mm</p>}
        </div>
      </div>
      
      {/* 날씨 기반 메뉴 힌트 */}
      <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/90">
        {weather.temperature >= 28 && '🥶 더운 날엔 시원한 냉면, 빙수 어때요?'}
        {weather.temperature >= 20 && weather.temperature < 28 && '😊 선선한 날씨, 뭐든 좋아요!'}
        {weather.temperature >= 10 && weather.temperature < 20 && '🍜 쌀쌀하니 따뜻한 국물 어때요?'}
        {weather.temperature < 10 && '🔥 추운 날엔 뜨끈한 찌개가 딱!'}
        {weather.rain > 0 && ' 비 오는 날엔 파전도 좋겠네요!'}
      </div>
    </div>
  )
}
