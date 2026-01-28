'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

// 분석 데이터 타입
interface TrendItem {
  keyword: string
  monthlyValues: { month: number; value: number }[]
  correlationWithTemp: number
  correlationWithRain: number
}

interface TrendData {
  generatedAt: string
  monthlyTemp: Record<string, number>
  monthlyRainyDays: Record<string, number>
  trends: TrendItem[]
}

// 색상 팔레트
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF6347', '#7B68EE', '#3CB371',
]

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// 다변량 분석 데이터 타입
interface MultivariateItem {
  keyword: string
  category: string
  correlations: {
    temp: number
    rain: number
    humidity: number
    sunshine: number
  }
  regression: {
    rSquared: number
  }
  optimalConditions: {
    tempRange: string
    bestMonths: number[]
  }
}

interface MultivariateData {
  generatedAt: string
  totalMenus: number
  categories: string[]
  results: MultivariateItem[]
  summary: {
    hotWeatherFoods: string[]
    coldWeatherFoods: string[]
    rainyDayFoods: string[]
    humidDayFoods: string[]
  }
}

// 지역별 분석 데이터 타입
interface RegionalTrend {
  keyword: string
  monthlyValues: { month: number; value: number }[]
  correlationWithTemp: number
  correlationWithRain: number
}

interface RegionalData {
  generatedAt: string
  regions: Record<string, {
    code: string
    lat: number
    lng: number
    weather: Record<string, { temp: number; rain: number }>
    trends: RegionalTrend[]
    summary: {
      hotWeatherFoods: string[]
      coldWeatherFoods: string[]
      rainyDayFoods: string[]
    }
  }>
  comparison: Record<string, Record<string, { avgSearchVolume: number; tempCorrelation: number }>>
}

export default function InsightsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [multiData, setMultiData] = useState<MultivariateData | null>(null)
  const [regionalData, setRegionalData] = useState<RegionalData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'trend' | 'correlation' | 'monthly' | 'multivariate' | 'regional' | 'insights'>('insights')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('서울')

  useEffect(() => {
    // 분석 데이터 로드
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => {
        setData(data)
        // 기본 선택: 상위 5개
        if (data.trends) {
          setSelectedKeywords(data.trends.slice(0, 5).map((t: TrendItem) => t.keyword))
        }
      })
      .catch(err => console.error('Failed to load insights:', err))
    
    // 다변량 분석 데이터 로드
    fetch('/api/insights?type=multivariate')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMultiData(data)
        }
      })
      .catch(err => console.error('Failed to load multivariate data:', err))
    
    // 지역별 분석 데이터 로드
    fetch('/api/insights?type=regional')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setRegionalData(data)
        }
      })
      .catch(err => console.error('Failed to load regional data:', err))
  }, [])

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">분석 데이터 로딩 중...</p>
        </div>
      </main>
    )
  }

  // 월별 트렌드 차트 데이터
  const trendChartData = MONTH_NAMES.map((name, i) => {
    const monthData: Record<string, any> = { name, month: i + 1 }
    monthData.temp = data.monthlyTemp[String(i + 1)]
    
    data.trends.forEach(trend => {
      if (selectedKeywords.includes(trend.keyword)) {
        const mv = trend.monthlyValues.find(v => v.month === i + 1)
        monthData[trend.keyword] = mv?.value || 0
      }
    })
    
    return monthData
  })

  // 상관관계 차트 데이터
  const correlationData = data.trends
    .map(t => ({
      keyword: t.keyword,
      temp: t.correlationWithTemp,
      rain: t.correlationWithRain,
      absTemp: Math.abs(t.correlationWithTemp),
    }))
    .sort((a, b) => b.absTemp - a.absTemp)

  // 레이더 차트 데이터 (기온 상관관계)
  const radarData = data.trends.map(t => ({
    keyword: t.keyword,
    기온상관: (t.correlationWithTemp + 1) * 50, // -1~1을 0~100으로 변환
    강수상관: (t.correlationWithRain + 1) * 50,
  }))

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  // 탭별 설명
  const tabDescriptions: Record<string, { title: string; desc: string; tip: string }> = {
    insights: {
      title: '💡 핵심 발견',
      desc: '구글 트렌드와 날씨 데이터를 분석해 발견한 흥미로운 사실들!',
      tip: '💬 "비 오면 파전" 정말일까요? 데이터로 확인해보세요!'
    },
    trend: {
      title: '📈 월별 트렌드',
      desc: '음식별 검색량이 월마다 어떻게 변하는지 확인하세요.',
      tip: '💬 키워드를 클릭해서 비교해보세요!'
    },
    correlation: {
      title: '🔬 상관관계 분석',
      desc: '기온/강수량과 음식 검색량의 상관관계를 분석했어요.',
      tip: '💬 +1에 가까울수록 양의 상관, -1에 가까울수록 음의 상관!'
    },
    regional: {
      title: '🗺️ 지역별 분석',
      desc: '서울, 부산, 대구, 광주, 대전의 음식 트렌드를 비교해요.',
      tip: '💬 같은 음식도 지역마다 인기 시즌이 달라요!'
    },
    multivariate: {
      title: '🧠 다변량 분석',
      desc: '기온+강수+습도+일조량을 모두 고려한 심층 분석이에요.',
      tip: '💬 R² 값이 높을수록 날씨로 예측이 잘 돼요!'
    },
    monthly: {
      title: '📅 월별 TOP 음식',
      desc: '매달 가장 많이 검색되는 음식 TOP 3를 확인하세요.',
      tip: '💬 계절마다 인기 음식이 확 달라요!'
    },
  }

  return (
    <main className="min-h-screen pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass-strong border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <span className="text-lg">←</span>
            <span className="text-sm">홈으로</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📊</span> 데이터 인사이트
          </h1>
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {new Date(data.generatedAt).toLocaleDateString('ko-KR')} 기준
          </div>
        </div>
      </header>

      {/* 페이지 소개 */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-blue-100 opacity-0 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔬</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-1">FoodFit 데이터 연구소</h2>
              <p className="text-sm text-gray-600 mb-2">
                구글 트렌드 + 날씨 API 데이터를 분석해서 <strong>음식과 날씨의 상관관계</strong>를 연구했어요!
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-white/80 px-2 py-1 rounded-full text-gray-500">📊 15개 음식 분석</span>
                <span className="bg-white/80 px-2 py-1 rounded-full text-gray-500">🗺️ 5개 도시</span>
                <span className="bg-white/80 px-2 py-1 rounded-full text-gray-500">📅 12개월 데이터</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 요약 카드 - 접을 수 있게 */}
        <details className="group opacity-0 animate-fade-in stagger-1" open>
          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
              ⚡ 한눈에 보기
            </span>
            <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-3 text-center hover:scale-105 transition-transform cursor-default">
              <div className="text-2xl mb-1">🔥</div>
              <h3 className="text-gray-700 font-bold text-xs mb-1">더운 날</h3>
              <p className="text-red-500 text-[10px] font-medium leading-tight">
                {correlationData.filter(d => d.temp > 0.5).map(d => d.keyword).slice(0, 3).join(', ') || '냉면, 빙수'}
              </p>
            </div>
            
            <div className="glass-card p-3 text-center hover:scale-105 transition-transform cursor-default">
              <div className="text-2xl mb-1">❄️</div>
              <h3 className="text-gray-700 font-bold text-xs mb-1">추운 날</h3>
              <p className="text-blue-500 text-[10px] font-medium leading-tight">
                {correlationData.filter(d => d.temp < -0.3).map(d => d.keyword).slice(0, 3).join(', ') || '김치찌개, 설렁탕'}
              </p>
            </div>
            
            <div className="glass-card p-3 text-center hover:scale-105 transition-transform cursor-default">
              <div className="text-2xl mb-1">🌧️</div>
              <h3 className="text-gray-700 font-bold text-xs mb-1">비 오는 날</h3>
              <p className="text-teal-500 text-[10px] font-medium leading-tight">
                {correlationData.filter(d => d.rain > 0.3).map(d => d.keyword).slice(0, 3).join(', ') || '파전, 막걸리'}
              </p>
            </div>
          </div>
        </details>

        {/* 탭 네비게이션 */}
        <div className="opacity-0 animate-fade-in stagger-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'insights', label: '💡 핵심', fullLabel: '핵심 발견' },
              { id: 'trend', label: '📈 트렌드', fullLabel: '월별 트렌드' },
              { id: 'correlation', label: '🔬 상관', fullLabel: '상관관계' },
              { id: 'regional', label: '🗺️ 지역', fullLabel: '지역별' },
              { id: 'multivariate', label: '🧠 다변량', fullLabel: '다변량 분석' },
              { id: 'monthly', label: '📅 TOP', fullLabel: '월별 TOP' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white/60 text-gray-500 hover:bg-white/90 hover:text-gray-700'
                }`}
              >
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.label.split(' ')[0]} {tab.fullLabel}</span>
              </button>
            ))}
          </div>
          
          {/* 선택된 탭 설명 */}
          <div className="mt-3 bg-white/40 rounded-xl p-3 border border-white/60">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{tabDescriptions[activeTab].title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{tabDescriptions[activeTab].desc}</p>
              </div>
              <div className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-1 rounded-lg border border-yellow-200 whitespace-nowrap">
                {tabDescriptions[activeTab].tip}
              </div>
            </div>
          </div>
        </div>

        {/* 💡 핵심 발견 탭 */}
        {activeTab === 'insights' && (
          <div className="space-y-6 opacity-0 animate-fade-in stagger-3">
            {/* 주요 인사이트 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔬</span> 데이터가 밝힌 진실
              </h2>
              
              <div className="space-y-4">
                {/* 인사이트 1 */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🤔</span> &ldquo;비 오면 파전&rdquo;은 마케팅?
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">파전의 강수량 상관계수</p>
                      <p className="text-2xl font-bold text-cyan-500">+0.06 <span className="text-sm font-normal text-gray-400">(거의 무관)</span></p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">파전의 기온 상관계수</p>
                      <p className="text-2xl font-bold text-red-500">+0.42 <span className="text-sm font-normal text-gray-400">(양의 상관)</span></p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    → 실제로는 <strong className="text-red-500">&ldquo;따뜻한 날&rdquo;</strong>에 더 많이 검색됨! 비보다는 기온의 영향이 큼.
                  </p>
                </div>
                
                {/* 인사이트 2 */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-2xl">☕</span> 라떼 vs 아메리카노
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">라떼 기온 상관계수</p>
                      <p className="text-2xl font-bold text-blue-500">-0.41 <span className="text-sm font-normal text-gray-400">(추운 날 ↑)</span></p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">아메리카노 기온 상관계수</p>
                      <p className="text-2xl font-bold text-red-500">+0.75 <span className="text-sm font-normal text-gray-400">(더운 날 ↑)</span></p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    → 추울 땐 따뜻한 라떼, 더울 땐 시원한 아이스 아메리카노!
                  </p>
                </div>
                
                {/* 인사이트 3 */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-2xl">📊</span> 예측력의 차이
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">더운 날 음식 R²</p>
                      <p className="text-2xl font-bold text-green-500">0.70~0.83 <span className="text-sm font-normal text-gray-400">(높은 예측력)</span></p>
                      <p className="text-xs text-gray-500 mt-1">빙수, 냉면, 콩국수 등</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">추운 날 음식 R²</p>
                      <p className="text-2xl font-bold text-orange-500">0.20~0.30 <span className="text-sm font-normal text-gray-400">(낮은 예측력)</span></p>
                      <p className="text-xs text-gray-500 mt-1">김치찌개, 설렁탕, 라면 등</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    → 추운 날은 선택지가 많아서 분산됨! 더운 날은 &ldquo;시원한 것&rdquo; 하나로 수렴.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 지역별 특색 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🗺️</span> 지역별 특색
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌊</span>
                    <h3 className="font-bold text-gray-800">부산</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">밀면 기온 상관계수</p>
                  <p className="text-xl font-bold text-blue-600">+0.82</p>
                  <p className="text-xs text-gray-500 mt-2">지역 특산물의 강한 계절성!</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <h3 className="font-bold text-gray-800">대구</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">막창, 설렁탕, 막걸리</p>
                  <p className="text-xl font-bold text-orange-600">추운 날 인기 ❄️</p>
                  <p className="text-xs text-gray-500 mt-2">겨울 음식 선호도 높음</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌿</span>
                    <h3 className="font-bold text-gray-800">대전</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">냉면 기온 상관계수</p>
                  <p className="text-xl font-bold text-green-600">+0.88 (전국 최고!)</p>
                  <p className="text-xs text-gray-500 mt-2">기온에 가장 민감한 지역</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎭</span>
                    <h3 className="font-bold text-gray-800">광주</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">국밥 기온 상관계수</p>
                  <p className="text-xl font-bold text-purple-600">-0.33</p>
                  <p className="text-xs text-gray-500 mt-2">추운 날 국밥 선호!</p>
                </div>
                
                <div className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-4 border border-rose-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏙️</span>
                    <h3 className="font-bold text-gray-800">서울</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">막걸리 기온 상관계수</p>
                  <p className="text-xl font-bold text-rose-600">+0.39</p>
                  <p className="text-xs text-gray-500 mt-2">따뜻한 날 막걸리 인기!</p>
                </div>
              </div>
            </div>
            
            {/* 알고리즘 적용 */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚙️</span> FoodFit 알고리즘 적용
              </h2>
              <p className="text-gray-600 mb-4">
                이 인사이트들은 FoodFit의 추천 알고리즘에 반영되어 있어요!
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <h3 className="font-bold text-red-500 mb-2">🔥 더운 날 (25°C+)</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 빙수, 냉면: +25% 가중치</li>
                    <li>• 콩국수, 아이스 음료: +20%</li>
                    <li>• 국물 요리: -15%</li>
                  </ul>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <h3 className="font-bold text-blue-500 mb-2">❄️ 추운 날 (5°C-)</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 김치찌개, 설렁탕: +20%</li>
                    <li>• 라면, 칼국수: +15%</li>
                    <li>• 냉면, 빙수: -30%</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 데이터 출처 */}
            <div className="text-center text-gray-500 text-sm">
              <p>📊 데이터 출처: Google Trends (2024~2025년 한국)</p>
              <p>🌡️ 기온 데이터: Open-Meteo API (서울, 부산, 대구, 광주, 대전)</p>
              <p>🔄 마지막 분석: {data ? new Date(data.generatedAt).toLocaleDateString('ko-KR') : '-'}</p>
            </div>
          </div>
        )}

        {/* 🗺️ 지역별 분석 탭 */}
        {activeTab === 'regional' && regionalData && (
          <div className="space-y-6 opacity-0 animate-fade-in stagger-3">
            {/* 지역 선택 */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(regionalData.regions).map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedRegion === region
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  {region === '서울' && '🏙️'}
                  {region === '부산' && '🌊'}
                  {region === '대구' && '🔥'}
                  {region === '광주' && '🎭'}
                  {region === '대전' && '🌿'}
                  {' '}{region}
                </button>
              ))}
            </div>
            
            {/* 선택된 지역 요약 */}
            {regionalData.regions[selectedRegion] && (
              <div className="glass-card p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {selectedRegion} 음식 트렌드
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="text-sm text-gray-600 mb-1">더운 날 인기</div>
                    <div className="text-xs font-medium text-red-600">
                      {regionalData.regions[selectedRegion].summary.hotWeatherFoods.join(', ') || '데이터 부족'}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-2xl mb-2">❄️</div>
                    <div className="text-sm text-gray-600 mb-1">추운 날 인기</div>
                    <div className="text-xs font-medium text-blue-600">
                      {regionalData.regions[selectedRegion].summary.coldWeatherFoods.join(', ') || '데이터 부족'}
                    </div>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-4 text-center border border-cyan-200">
                    <div className="text-2xl mb-2">🌧️</div>
                    <div className="text-sm text-gray-600 mb-1">비 오는 날</div>
                    <div className="text-xs font-medium text-cyan-600">
                      {regionalData.regions[selectedRegion].summary.rainyDayFoods.join(', ') || '데이터 부족'}
                    </div>
                  </div>
                </div>
                
                {/* 상관관계 테이블 */}
                <h3 className="text-md font-bold text-gray-700 mb-3">📊 {selectedRegion} 음식별 상관계수</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200">
                        <th className="text-left py-2 px-2">음식</th>
                        <th className="text-center py-2 px-2">🌡️ 기온</th>
                        <th className="text-center py-2 px-2">🌧️ 강수</th>
                        <th className="text-center py-2 px-2">평균 검색량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.regions[selectedRegion].trends
                        .filter(t => t.correlationWithTemp !== 0 || t.correlationWithRain !== 0)
                        .sort((a, b) => Math.abs(b.correlationWithTemp) - Math.abs(a.correlationWithTemp))
                        .map(trend => {
                          const avgSearch = Math.round(
                            trend.monthlyValues.reduce((sum, v) => sum + v.value, 0) / 12
                          )
                          return (
                            <tr key={trend.keyword} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-2 text-gray-800 font-medium">{trend.keyword}</td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  trend.correlationWithTemp > 0.5 ? 'bg-red-100 text-red-600' :
                                  trend.correlationWithTemp < -0.3 ? 'bg-blue-100 text-blue-600' :
                                  'text-gray-500'
                                }`}>
                                  {trend.correlationWithTemp > 0 ? '+' : ''}{trend.correlationWithTemp.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  trend.correlationWithRain > 0.5 ? 'bg-cyan-100 text-cyan-600' :
                                  'text-gray-500'
                                }`}>
                                  {trend.correlationWithRain > 0 ? '+' : ''}{trend.correlationWithRain.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center text-gray-600">{avgSearch}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 지역 비교 차트 */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🔄 지역 비교: 밀면</h2>
              <p className="text-gray-500 text-sm mb-4">같은 음식도 지역마다 검색 패턴이 달라요!</p>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(regionalData.comparison['밀면'] || {}).map(([region, data]) => ({
                      region,
                      검색량: data.avgSearchVolume,
                      상관계수: data.tempCorrelation,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="region" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="검색량" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="상관계수" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-gray-500 text-xs mt-2">
                부산에서 밀면은 지역 특산물! 서울에서도 인기 상승 중 📈
              </p>
            </div>
          </div>
        )}

        {/* 월별 트렌드 차트 */}
        {activeTab === 'trend' && (
          <div className="glass-card p-5 opacity-0 animate-fade-in stagger-3">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📈 월별 검색량 트렌드</h2>
            
            {/* 키워드 선택 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {data.trends.map((trend, i) => (
                <button
                  key={trend.keyword}
                  onClick={() => toggleKeyword(trend.keyword)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedKeywords.includes(trend.keyword)
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedKeywords.includes(trend.keyword)
                      ? COLORS[i % COLORS.length]
                      : undefined,
                  }}
                >
                  {trend.keyword}
                </button>
              ))}
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ color: '#6b7280' }} />
                  {selectedKeywords.map((keyword, i) => {
                    const colorIndex = data.trends.findIndex(t => t.keyword === keyword)
                    return (
                      <Line
                        key={keyword}
                        type="monotone"
                        dataKey={keyword}
                        stroke={COLORS[colorIndex % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 기온 서브차트 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm mb-2">📊 월별 평균 기온 (서울)</p>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <XAxis dataKey="name" stroke="#d1d5db" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
                      {trendChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.temp > 20 ? '#FF6B6B' : entry.temp < 5 ? '#45B7D1' : '#96CEB4'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 상관관계 분석 */}
        {activeTab === 'correlation' && (
          <div className="space-y-6">
            {/* 기온 상관관계 */}
            <div className="glass-card p-5">
              <h2 className="text-xl font-bold text-gray-700 mb-4">🌡️ 기온과의 상관관계</h2>
              <p className="text-gray-400 text-sm mb-4">
                +1.0 = 기온↑ 검색↑ (더울수록 인기) | -1.0 = 기온↓ 검색↑ (추울수록 인기)
              </p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correlationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#d1d5db" />
                    <YAxis dataKey="keyword" type="category" stroke="#d1d5db" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [Number(value).toFixed(2), '상관계수']}
                    />
                    <Bar dataKey="temp" radius={[0, 4, 4, 0]}>
                      {correlationData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.temp > 0 ? '#FF6B6B' : '#45B7D1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 강수량 상관관계 */}
            <div className="glass-card p-5">
              <h2 className="text-xl font-bold text-gray-700 mb-4">🌧️ 강수량과의 상관관계</h2>
              <p className="text-gray-400 text-sm mb-4">
                +1.0 = 비↑ 검색↑ (비 올수록 인기) | 0 = 관계 없음
              </p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...correlationData].sort((a, b) => b.rain - a.rain)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#d1d5db" />
                    <YAxis dataKey="keyword" type="category" stroke="#d1d5db" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [Number(value).toFixed(2), '상관계수']}
                    />
                    <Bar dataKey="rain" radius={[0, 4, 4, 0]}>
                      {correlationData.map((entry, i) => (
                        <Cell key={i} fill="#4ECDC4" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 월별 TOP */}
        {activeTab === 'monthly' && (
          <div className="glass-card p-5">
            <h2 className="text-xl font-bold text-gray-700 mb-6">📅 월별 검색량 TOP 3</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const month = monthIndex + 1
                const temp = data.monthlyTemp[String(month)]
                const tempEmoji = temp > 20 ? '🔥' : temp < 5 ? '❄️' : '🌤️'
                
                // 해당 월의 TOP 3 메뉴
                const monthTop = data.trends
                  .map(t => ({
                    keyword: t.keyword,
                    value: t.monthlyValues.find(v => v.month === month)?.value || 0,
                  }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)

                return (
                  <div
                    key={month}
                    className="bg-white/5 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-800 font-bold">{monthName}</span>
                      <span className="text-gray-400 text-sm">{temp}°C {tempEmoji}</span>
                    </div>
                    <div className="space-y-2">
                      {monthTop.map((item, rank) => (
                        <div key={item.keyword} className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            rank === 0 ? 'bg-yellow-500 text-yellow-900' :
                            rank === 1 ? 'bg-gray-300 text-gray-700' :
                            'bg-orange-400 text-orange-900'
                          }`}>
                            {rank + 1}
                          </span>
                          <span className="text-gray-700 text-sm">{item.keyword}</span>
                          <span className="text-gray-700/30 text-xs ml-auto">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 다변량 분석 */}
        {activeTab === 'multivariate' && multiData && (
          <div className="space-y-6">
            {/* 요약 통계 */}
            <div className="glass-card p-5">
              <h2 className="text-xl font-bold text-gray-700 mb-4">🧠 다변량 분석 개요</h2>
              <p className="text-gray-700/60 mb-4">
                기온 + 강수량 + 습도 + 일조시간을 동시에 고려한 분석 (총 {multiData.totalMenus}개 메뉴)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-gray-800 font-bold">{multiData.summary.hotWeatherFoods.length}개</div>
                  <div className="text-gray-400 text-sm">더운 날 메뉴</div>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">❄️</div>
                  <div className="text-gray-800 font-bold">{multiData.summary.coldWeatherFoods.length}개</div>
                  <div className="text-gray-400 text-sm">추운 날 메뉴</div>
                </div>
                <div className="bg-cyan-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🌧️</div>
                  <div className="text-gray-800 font-bold">{multiData.summary.rainyDayFoods.length}개</div>
                  <div className="text-gray-400 text-sm">비 오는 날 메뉴</div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">💧</div>
                  <div className="text-gray-800 font-bold">{multiData.summary.humidDayFoods.length}개</div>
                  <div className="text-gray-400 text-sm">습한 날 메뉴</div>
                </div>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-purple-500 text-gray-700' 
                    : 'bg-white/10 text-gray-500 hover:bg-white/20'
                }`}
              >
                전체
              </button>
              {multiData.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-purple-500 text-gray-700' 
                      : 'bg-white/10 text-gray-500 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 다변량 상관관계 테이블 */}
            <div className="glass-card p-5 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-700 mb-4">📊 변수별 상관계수</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-3 px-2">메뉴</th>
                    <th className="text-center py-3 px-2">🌡️ 기온</th>
                    <th className="text-center py-3 px-2">🌧️ 강수</th>
                    <th className="text-center py-3 px-2">💧 습도</th>
                    <th className="text-center py-3 px-2">☀️ 일조</th>
                    <th className="text-center py-3 px-2">R²</th>
                    <th className="text-left py-3 px-2">최적 조건</th>
                  </tr>
                </thead>
                <tbody>
                  {multiData.results
                    .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
                    .sort((a, b) => b.regression.rSquared - a.regression.rSquared)
                    .slice(0, 20)
                    .map(item => (
                      <tr key={item.keyword} className="border-b border-gray-50 hover:bg-white/5">
                        <td className="py-3 px-2 text-gray-700 font-medium">{item.keyword}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.temp > 0.5 ? 'bg-red-500/30 text-red-300' :
                            item.correlations.temp < -0.3 ? 'bg-blue-500/30 text-blue-300' :
                            'text-gray-400'
                          }`}>
                            {item.correlations.temp > 0 ? '+' : ''}{item.correlations.temp.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.rain > 0.3 ? 'bg-cyan-500/30 text-cyan-300' :
                            'text-gray-400'
                          }`}>
                            {item.correlations.rain > 0 ? '+' : ''}{item.correlations.rain.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.humidity > 0.5 ? 'bg-purple-500/30 text-purple-300' :
                            'text-gray-400'
                          }`}>
                            {item.correlations.humidity > 0 ? '+' : ''}{item.correlations.humidity.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400">
                          {item.correlations.sunshine > 0 ? '+' : ''}{item.correlations.sunshine.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${
                            item.regression.rSquared > 0.5 ? 'text-green-400' :
                            item.regression.rSquared > 0.2 ? 'text-yellow-400' :
                            'text-gray-700/30'
                          }`}>
                            {item.regression.rSquared.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 text-xs">
                          {item.optimalConditions.tempRange}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 히트맵 */}
            <div className="glass-card p-5">
              <h3 className="text-lg font-bold text-gray-700 mb-2">🔥 상관관계 히트맵</h3>
              <p className="text-gray-400 text-sm mb-4">색상이 진할수록 상관관계가 강함 (빨강=양의 상관, 파랑=음의 상관)</p>
              
              <div className="overflow-x-auto">
                {/* 헤더 */}
                <div className="flex items-center gap-1 mb-1 ml-24">
                  <div className="w-16 text-center text-gray-400 text-xs">🌡️기온</div>
                  <div className="w-16 text-center text-gray-400 text-xs">🌧️강수</div>
                  <div className="w-16 text-center text-gray-400 text-xs">💧습도</div>
                  <div className="w-16 text-center text-gray-400 text-xs">☀️일조</div>
                </div>
                
                {/* 히트맵 그리드 */}
                <div className="space-y-1">
                  {multiData.results
                    .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
                    .sort((a, b) => b.regression.rSquared - a.regression.rSquared)
                    .slice(0, 15)
                    .map(item => {
                      const getHeatColor = (value: number) => {
                        if (value > 0.7) return 'bg-red-500';
                        if (value > 0.5) return 'bg-red-400';
                        if (value > 0.3) return 'bg-orange-400';
                        if (value > 0.1) return 'bg-orange-300/50';
                        if (value > -0.1) return 'bg-gray-500/30';
                        if (value > -0.3) return 'bg-cyan-300/50';
                        if (value > -0.5) return 'bg-blue-400';
                        return 'bg-blue-500';
                      };
                      
                      return (
                        <div key={item.keyword} className="flex items-center gap-1">
                          <div className="w-24 text-gray-700 text-xs truncate pr-2">{item.keyword}</div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-gray-700 ${getHeatColor(item.correlations.temp)}`}
                            title={`기온: ${item.correlations.temp.toFixed(2)}`}
                          >
                            {item.correlations.temp.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-gray-700 ${getHeatColor(item.correlations.rain)}`}
                            title={`강수: ${item.correlations.rain.toFixed(2)}`}
                          >
                            {item.correlations.rain.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-gray-700 ${getHeatColor(item.correlations.humidity)}`}
                            title={`습도: ${item.correlations.humidity.toFixed(2)}`}
                          >
                            {item.correlations.humidity.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-gray-700 ${getHeatColor(item.correlations.sunshine)}`}
                            title={`일조: ${item.correlations.sunshine.toFixed(2)}`}
                          >
                            {item.correlations.sunshine.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* 범례 */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                  <span className="text-gray-400">음의 상관</span>
                  <div className="flex gap-0.5">
                    <div className="w-6 h-4 bg-blue-500 rounded-l"></div>
                    <div className="w-6 h-4 bg-blue-400"></div>
                    <div className="w-6 h-4 bg-cyan-300/50"></div>
                    <div className="w-6 h-4 bg-gray-500/30"></div>
                    <div className="w-6 h-4 bg-orange-300/50"></div>
                    <div className="w-6 h-4 bg-orange-400"></div>
                    <div className="w-6 h-4 bg-red-400"></div>
                    <div className="w-6 h-4 bg-red-500 rounded-r"></div>
                  </div>
                  <span className="text-gray-400">양의 상관</span>
                </div>
              </div>
            </div>

            {/* R² 설명력 차트 */}
            <div className="glass-card p-5">
              <h3 className="text-lg font-bold text-gray-700 mb-2">🏆 날씨 예측력 TOP 10</h3>
              <p className="text-gray-400 text-sm mb-4">R² = 날씨 변수로 검색량을 얼마나 설명할 수 있는가 (높을수록 날씨 영향 큼)</p>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={multiData.results
                      .sort((a, b) => b.regression.rSquared - a.regression.rSquared)
                      .slice(0, 10)
                      .map(r => ({ name: r.keyword, rSquared: r.regression.rSquared }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis type="number" domain={[0, 1]} stroke="#d1d5db" />
                    <YAxis dataKey="name" type="category" stroke="#d1d5db" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [Number(value).toFixed(2), 'R²']}
                    />
                    <Bar dataKey="rSquared" radius={[0, 4, 4, 0]}>
                      {multiData.results
                        .sort((a, b) => b.regression.rSquared - a.regression.rSquared)
                        .slice(0, 10)
                        .map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 의외의 발견 */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-700 mb-4">🤔 의외의 발견!</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-yellow-300 font-semibold mb-2">&ldquo;비 오면 파전&rdquo;은 마케팅?</h4>
                  <p className="text-gray-500 text-sm">
                    파전의 강수량 상관계수: <span className="text-yellow-300 font-bold">+0.06</span><br/>
                    파전의 기온 상관계수: <span className="text-red-300 font-bold">+0.42</span><br/>
                    → 실제로는 &ldquo;따뜻한 날&rdquo;에 더 많이 검색!
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2">라떼는 추운 날 인기</h4>
                  <p className="text-gray-500 text-sm">
                    라떼의 기온 상관계수: <span className="text-blue-300 font-bold">-0.41</span><br/>
                    아메리카노 기온 상관계수: <span className="text-red-300 font-bold">+0.75</span><br/>
                    → 따뜻한 라떼 vs 시원한 아메리카노!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA 섹션 */}
        <div className="mt-8 glass-card p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">🍽️ 오늘 뭐 먹지?</h2>
          <p className="text-gray-500 text-sm mb-4">
            이 분석 결과가 FoodFit 추천 알고리즘에 적용되어 있어요!
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all"
          >
            <span>🍜</span> 오늘의 메뉴 추천받기
          </Link>
        </div>

        {/* 데이터 출처 */}
        <div className="mt-6 glass-card p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">📚</span>
            <span className="text-sm font-medium text-gray-700">데이터 출처</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500">
            <span className="bg-white/60 px-3 py-1 rounded-full">📊 Google Trends API</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">🌡️ Open-Meteo API</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">🗓️ 2024~2025 데이터</span>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3">
            이 분석은 참고용이며, 실제 소비 패턴과 다를 수 있습니다.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-gray-700">🍽️ FoodFit</p>
              <p className="text-xs text-gray-400">데이터 기반 음식 추천 서비스</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <Link href="/" className="hover:text-gray-700 transition-colors">홈</Link>
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">개인정보처리방침</Link>
              <a href="https://github.com/ava-jahlee/foodfit" target="_blank" rel="noopener" className="hover:text-gray-700 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
