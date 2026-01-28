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

// 날씨 코드를 condition으로 변환
function weatherCodeToCondition(code: number, temperature: number): string {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return 'rainy'
  if ([71, 73, 75, 77].includes(code)) return 'cold'
  if (temperature >= 28) return 'hot'
  if (temperature >= 20) return 'sunny'
  if (temperature >= 10) return 'cloudy'
  return 'cold'
}

export default function WeatherCard() {
  const { location, setWeather: setStoreWeather } = useUserInputStore()
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
        
        const temp = Math.round(data.current.temperature_2m)
        const code = data.current.weather_code
        const humidity = data.current.relative_humidity_2m
        const rain = data.current.rain || 0
        
        setWeather({
          temperature: temp,
          weatherCode: code,
          description: getWeatherInfo(code).description,
          humidity: humidity,
          rain: rain,
        })
        
        // 🔥 Store에 날씨 정보 저장 (다변량 분석용)
        setStoreWeather({
          temperature: temp,
          humidity: humidity,
          precipitation: rain,
          weatherCode: code,
          condition: weatherCodeToCondition(code, temp),
        })
      } catch (err) {
        setError('날씨 정보를 불러오는데 실패했습니다')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location.lat, location.lng, setStoreWeather])

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200/50 rounded-2xl"></div>
          <div className="space-y-2 flex-1">
            <div className="h-3 w-16 bg-gray-200/50 rounded"></div>
            <div className="h-7 w-24 bg-gray-200/50 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="glass-card p-5">
        <p className="text-center text-gray-500 text-sm">{error || '날씨 정보를 불러올 수 없습니다'}</p>
      </div>
    )
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode)
  
  // 온도에 따른 악센트 색상
  const getAccentColor = () => {
    if (weather.temperature >= 30) return 'text-red-500'
    if (weather.temperature >= 20) return 'text-orange-500'
    if (weather.temperature >= 10) return 'text-blue-500'
    return 'text-indigo-500'
  }

  // 날씨 힌트 메시지
  const getWeatherHint = () => {
    if (weather.rain > 0) return '비 오는 날엔 따끈한 국물이 생각나요'
    if (weather.temperature >= 28) return '더운 날엔 시원한 메뉴가 좋겠어요'
    if (weather.temperature >= 20) return '야외에서 먹기 좋은 날씨예요'
    if (weather.temperature >= 10) return '쌀쌀하니 따뜻한 음식 어때요?'
    return '추운 날엔 뜨끈한 국물이 최고!'
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 날씨 아이콘 + 온도 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
            <span className="text-3xl">{weatherInfo.emoji}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">{weather.description}</p>
            <p className={`text-3xl font-bold ${getAccentColor()}`}>
              {weather.temperature}°
            </p>
          </div>
        </div>
        
        {/* 오른쪽: 습도 등 */}
        <div className="text-right text-sm text-gray-400 space-y-0.5">
          <p>습도 {weather.humidity}%</p>
          {weather.rain > 0 && <p>강수 {weather.rain}mm</p>}
        </div>
      </div>
      
      {/* 날씨 기반 힌트 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          💡 {getWeatherHint()}
        </p>
      </div>
    </div>
  )
}
