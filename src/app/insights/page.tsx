'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import KoreaHeatmap from '@/components/charts/KoreaHeatmap'
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

// Lag + 주말 효과 분석 데이터 타입
interface LagWeekdayResult {
  keyword: string
  totalDays: number
  rainEffect: {
    sampleSize: number
    rainDayAvg: number
    beforeRainAvg: number
    afterRainAvg: number
    noRainAvg: number
    rainDayLift: number
    beforeToRainLift: number
    rainToAfterLift: number
  }
  weekdayEffect: {
    weekdayAvg: number
    weekendAvg: number
    weekendLift: number
    mondayAvg: number
    fridayAvg: number
    saturdayAvg: number
    sundayAvg: number
  }
}

interface LagWeekdayData {
  generatedAt: string
  year: number
  totalDays: number
  rainyDays: number
  results: LagWeekdayResult[]
}

export default function InsightsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [multiData, setMultiData] = useState<MultivariateData | null>(null)
  const [regionalData, setRegionalData] = useState<RegionalData | null>(null)
  const [lagWeekdayData, setLagWeekdayData] = useState<LagWeekdayData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'trend' | 'correlation' | 'monthly' | 'multivariate' | 'regional' | 'insights' | 'heatmap'>('insights')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('서울')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [heatmapKeyword, setHeatmapKeyword] = useState<string>('냉면')

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
    
    // Lag + 주말 효과 분석 데이터 로드
    fetch('/api/insights?type=lag-weekday')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setLagWeekdayData(data)
        }
      })
      .catch(err => console.error('Failed to load lag-weekday data:', err))
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

  // 탭 정보 - 직관적인 이름으로!
  const tabs = [
    { id: 'insights', icon: '💡', label: '재밌는 발견' },
    { id: 'heatmap', icon: '🗺️', label: '지역 히트맵' },
    { id: 'correlation', icon: '🌡️', label: '날씨 영향' },
    { id: 'regional', icon: '📍', label: '지역 차이' },
    { id: 'trend', icon: '📈', label: '월별 변화' },
    { id: 'monthly', icon: '🏆', label: '월별 1위' },
    { id: 'multivariate', icon: '🔬', label: '심층 분석' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors text-sm">
            ← 홈
          </Link>
          <h1 className="text-base font-bold text-gray-800">📊 인사이트</h1>
          <span className="text-[10px] text-gray-400">
            {new Date(data.generatedAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 요약 - 한 줄로 */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100 whitespace-nowrap">
            <span>🔥</span>
            <span className="text-xs text-red-600 font-medium">
              더운 날: {correlationData.filter(d => d.temp > 0.5).map(d => d.keyword).slice(0, 2).join(', ') || '냉면, 빙수'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 whitespace-nowrap">
            <span>❄️</span>
            <span className="text-xs text-blue-600 font-medium">
              추운 날: {correlationData.filter(d => d.temp < -0.3).map(d => d.keyword).slice(0, 2).join(', ') || '김치찌개'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-full border border-cyan-100 whitespace-nowrap">
            <span>🌧️</span>
            <span className="text-xs text-cyan-600 font-medium">
              비: {correlationData.filter(d => d.rain > 0.3).map(d => d.keyword).slice(0, 2).join(', ') || '파전'}
            </span>
          </div>
        </div>

        {/* 📁 폴더 탭 + 컨텐츠 카드 */}
        <div className="relative">
          {/* 폴더 탭 */}
          <div className="flex -mb-px relative z-10">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 text-xs font-medium transition-all rounded-t-xl border-t border-l border-r ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-800 border-gray-200 z-20'
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-50 -ml-1'
                }`}
                style={{ marginLeft: i > 0 && activeTab !== tab.id ? '-4px' : '0' }}
              >
                <span className="mr-1">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* 컨텐츠 카드 */}
          <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-200 shadow-sm p-5">

            {/* 💡 핵심 발견 탭 */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">
                  🔬 데이터가 밝힌 진실
                </h2>
                
                {/* 인사이트 카드들 */}
                <div className="space-y-3">
                  {/* 파전 - 토글 (일별 데이터로 업데이트) */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg overflow-hidden border-2 border-yellow-200">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'pajeon' ? null : 'pajeon')}
                      className="w-full flex items-center gap-4 p-3 text-left hover:bg-yellow-100 transition-colors"
                    >
                      <span className="text-2xl">🔥</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">&ldquo;비 오면 파전&rdquo; = 실제로 맞음! 🎯</p>
                        <p className="text-xs text-orange-600 font-medium">비 오는 날 검색량 +345.4% 증가!</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${expandedInsight === 'pajeon' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedInsight === 'pajeon' && (
                      <div className="px-4 pb-4 pt-1 border-t border-yellow-200 text-xs text-gray-600 space-y-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="font-medium text-blue-800 mb-1">💧 비 오는 날 효과</p>
                          <div className="space-y-1 text-[11px]">
                            <p>• 평소 대비 <strong className="text-blue-700">+345.4%</strong> 검색량 증가</p>
                            <p>• 비 오기 전날: +20.6% (미리 준비하는 사람들)</p>
                            <p>• 비 온 다음날: -42.2% (이미 먹어서!)</p>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="font-medium text-purple-800 mb-1">📅 주말 효과</p>
                          <div className="space-y-1 text-[11px]">
                            <p>• 평일 대비 <strong className="text-purple-700">+138.4%</strong> 증가</p>
                            <p className="text-gray-600">→ 주말엔 특히 파전이 생각나는군요!</p>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-2 mt-2">
                          <p className="font-medium text-green-800">📊 데이터 출처:</p>
                          <p className="text-green-700">366일 일별 검색 데이터 분석 (Google Trends)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 📊 데이터 시각화 - 파전 효과 차트 */}
                  {lagWeekdayData && lagWeekdayData.results.find(r => r.keyword === '파전') && (
                    <div className="mt-4 space-y-4">
                      {(() => {
                        const pajeonData = lagWeekdayData.results.find(r => r.keyword === '파전')!
                        
                        // 비 오는 날 효과 차트 데이터
                        const rainChartData = [
                          { name: '평소', value: pajeonData.rainEffect.noRainAvg, fill: '#94a3b8' },
                          { name: '전날', value: pajeonData.rainEffect.beforeRainAvg, fill: '#60a5fa' },
                          { name: '비 오는 날', value: pajeonData.rainEffect.rainDayAvg, fill: '#f59e0b' },
                          { name: '다음날', value: pajeonData.rainEffect.afterRainAvg, fill: '#38bdf8' },
                        ]
                        
                        // 요일별 효과 차트 데이터
                        const weekdayChartData = [
                          { name: '월', value: pajeonData.weekdayEffect.mondayAvg, fill: '#cbd5e1' },
                          { name: '화', value: (pajeonData.weekdayEffect.weekdayAvg * 5 - pajeonData.weekdayEffect.mondayAvg - pajeonData.weekdayEffect.fridayAvg) / 3, fill: '#cbd5e1' },
                          { name: '수', value: (pajeonData.weekdayEffect.weekdayAvg * 5 - pajeonData.weekdayEffect.mondayAvg - pajeonData.weekdayEffect.fridayAvg) / 3, fill: '#cbd5e1' },
                          { name: '목', value: (pajeonData.weekdayEffect.weekdayAvg * 5 - pajeonData.weekdayEffect.mondayAvg - pajeonData.weekdayEffect.fridayAvg) / 3, fill: '#cbd5e1' },
                          { name: '금', value: pajeonData.weekdayEffect.fridayAvg, fill: '#94a3b8' },
                          { name: '토', value: pajeonData.weekdayEffect.saturdayAvg, fill: '#f59e0b' },
                          { name: '일', value: pajeonData.weekdayEffect.sundayAvg, fill: '#f97316' },
                        ]
                        
                        return (
                          <>
                            {/* 비 오는 날 vs 평소 */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                              <h3 className="text-sm font-bold text-gray-800 mb-3">💧 비 오는 날 파전 검색량 변화</h3>
                              <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={rainChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                      }}
                                      formatter={(value) => [value ? Number(value).toFixed(1) : '0', '검색량']}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                      {rainChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-2">
                                🔥 비 오는 날은 평소의 <span className="font-bold text-orange-600">4.5배</span>!
                              </p>
                            </div>

                            {/* 요일별 효과 */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                              <h3 className="text-sm font-bold text-gray-800 mb-3">📅 요일별 파전 검색량</h3>
                              <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={weekdayChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                      }}
                                      formatter={(value) => [value ? Number(value).toFixed(1) : '0', '검색량']}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                      {weekdayChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-2">
                                🎉 주말은 평일의 <span className="font-bold text-purple-600">2.4배</span>! 특히 일요일이 최고!
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                  
                  {/* 커피 - 토글 */}
                  <div className="bg-blue-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'coffee' ? null : 'coffee')}
                      className="w-full flex items-center gap-4 p-3 text-left hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-2xl">☕</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">라떼 vs 아메리카노: 완전 반대!</p>
                        <p className="text-xs text-gray-500">라떼 -0.41 (추운 날) vs 아메리카노 +0.75 (더운 날)</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${expandedInsight === 'coffee' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedInsight === 'coffee' && (
                      <div className="px-4 pb-4 pt-1 border-t border-blue-200 text-xs text-gray-600 space-y-2">
                        <p className="font-medium text-gray-700">🔍 왜 그럴까?</p>
                        <div className="space-y-1 pl-2">
                          <p><strong>아이스 아메리카노</strong>: 더울수록 시원한 음료 ↑</p>
                          <p><strong>라떼</strong>: 추울수록 따뜻하고 부드러운 음료 ↑</p>
                        </div>
                        <div className="bg-blue-100 rounded p-2 mt-2">
                          <p className="text-blue-700">💡 같은 커피인데 <strong>계절 선호가 정반대</strong>! 카페 운영자라면 계절별 메뉴 푸시 전략에 참고할 만 함</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 예측력 - 토글 */}
                  <div className="bg-green-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'predict' ? null : 'predict')}
                      className="w-full flex items-center gap-4 p-3 text-left hover:bg-green-100 transition-colors"
                    >
                      <span className="text-2xl">📊</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">더운 날 음식이 예측 쉬움</p>
                        <p className="text-xs text-gray-500">더운 날 R² 0.7~0.8 vs 추운 날 R² 0.2~0.3</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${expandedInsight === 'predict' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedInsight === 'predict' && (
                      <div className="px-4 pb-4 pt-1 border-t border-green-200 text-xs text-gray-600 space-y-2">
                        <p className="font-medium text-gray-700">🔍 R² (결정계수)란?</p>
                        <p className="pl-2">날씨로 음식 선택을 얼마나 설명할 수 있는지 (0~1)</p>
                        <div className="space-y-1 pl-2 mt-2">
                          <p><strong>여름 (R² 높음)</strong>: 냉면, 빙수, 아이스커피 → 예측 쉬움!</p>
                          <p><strong>겨울 (R² 낮음)</strong>: 선택지가 분산됨 (찌개? 탕? 전골? 라면?)</p>
                        </div>
                        <div className="bg-green-100 rounded p-2 mt-2">
                          <p className="text-green-700">💡 추운 날은 &ldquo;뭐든 따뜻하면 OK&rdquo; → 선택지 분산 → 예측 어려움</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 서울 - 토글 (새로 추가) */}
                  <div className="bg-purple-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'seoul' ? null : 'seoul')}
                      className="w-full flex items-center gap-4 p-3 text-left hover:bg-purple-100 transition-colors"
                    >
                      <span className="text-2xl">🏙️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">서울만 상관계수가 0?!</p>
                        <p className="text-xs text-gray-500">지방이 오히려 계절 특색 뚜렷함</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${expandedInsight === 'seoul' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {expandedInsight === 'seoul' && (
                      <div className="px-4 pb-4 pt-1 border-t border-purple-200 text-xs text-gray-600 space-y-2">
                        <p className="font-medium text-gray-700">🔍 왜 서울만 특이할까?</p>
                        <div className="space-y-1 pl-2">
                          <p><strong>1. 베이스라인 높음</strong>: 항상 검색량 많아서 계절 변동폭 상대적으로 작음</p>
                          <p><strong>2. 다양한 인구</strong>: 계절 무관 모든 음식 꾸준히 검색</p>
                          <p><strong>3. 옵션 많음</strong>: 배달/외식 선택지 풍부 → 날씨 영향 분산</p>
                        </div>
                        <div className="bg-purple-100 rounded p-2 mt-2">
                          <p className="text-purple-700">💡 반면 지방은 <strong>계절 음식 선호 뚜렷</strong>! (부산 밀면 +0.82, 대전 냉면 +0.88)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 지역별 한줄 요약 */}
                <h3 className="text-sm font-bold text-gray-700 mt-4 border-b border-gray-100 pb-2">🗺️ 지역별</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <span>🌊 부산</span><br/>
                    <span className="text-blue-600 font-medium">밀면 +0.87</span>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg text-center">
                    <span>🔥 대구</span><br/>
                    <span className="text-orange-600 font-medium">막창 +0.66</span>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-center">
                    <span>🌿 대전</span><br/>
                    <span className="text-green-600 font-medium">냉면 +0.82</span>
                  </div>
                  <div className="p-2 bg-teal-50 rounded-lg text-center">
                    <span>🏝️ 제주</span><br/>
                    <span className="text-teal-600 font-medium">냉면 -0.31!</span>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg text-center">
                    <span>🏭 울산</span><br/>
                    <span className="text-indigo-600 font-medium">상관↓ (산업)</span>
                  </div>
                  <div className="p-2 bg-violet-50 rounded-lg text-center">
                    <span>🏙️ 경기</span><br/>
                    <span className="text-violet-600 font-medium">서울과 유사</span>
                  </div>
                </div>
                
                {/* 제주 특이점 - 토글 */}
                <div className="bg-teal-50 rounded-lg overflow-hidden mt-3">
                  <button 
                    onClick={() => setExpandedInsight(expandedInsight === 'jeju' ? null : 'jeju')}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-teal-100 transition-colors"
                  >
                    <span className="text-xl">🏝️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">제주만 냉면이 반대?!</p>
                      <p className="text-xs text-gray-500">냉면 -0.31 (다른 지역은 +0.8 이상)</p>
                    </div>
                    <span className={`text-gray-400 transition-transform text-xs ${expandedInsight === 'jeju' ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expandedInsight === 'jeju' && (
                    <div className="px-4 pb-3 text-xs text-gray-600 border-t border-teal-200">
                      <p className="font-medium text-gray-700 mt-2">🔍 왜 제주만 반대일까?</p>
                      <div className="space-y-1 pl-2 mt-1">
                        <p><strong>1. 따뜻한 겨울</strong>: 1월 평균 6°C (서울 -2°C)</p>
                        <p><strong>2. 관광객 특성</strong>: 겨울 관광객이 &ldquo;제주 냉면&rdquo; 검색?</p>
                        <p><strong>3. 연중 가능</strong>: 따뜻해서 겨울에도 냉면 OK</p>
                      </div>
                      <div className="bg-teal-100 rounded p-2 mt-2">
                        <p className="text-teal-700">💡 <strong>유일하게 음의 상관!</strong> 제주의 독특한 기후가 식문화에 영향</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 인구통계 인사이트 - 토글 */}
                <h3 className="text-sm font-bold text-gray-700 mt-4 border-b border-gray-100 pb-2">👥 인구통계 × 음식</h3>
                <div className="space-y-2">
                  {/* 고령 */}
                  <div className="bg-amber-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'elderly' ? null : 'elderly')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-amber-100 transition-colors"
                    >
                      <span className="text-xl">🧓</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">고령 인구 ↑ → 국밥 +0.87</p>
                        <p className="text-xs text-gray-500">나이 들수록 전통 음식 선호</p>
                      </div>
                      <span className={`text-gray-400 transition-transform text-xs ${expandedInsight === 'elderly' ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {expandedInsight === 'elderly' && (
                      <div className="px-4 pb-3 text-xs text-gray-600 border-t border-amber-200">
                        <div className="flex gap-2 mt-2">
                          <span className="bg-amber-100 px-2 py-1 rounded">국밥 +0.87</span>
                          <span className="bg-amber-100 px-2 py-1 rounded">막걸리 +0.61</span>
                          <span className="bg-amber-100 px-2 py-1 rounded">밀면 +0.60</span>
                        </div>
                        <p className="mt-2 text-gray-500">부산(고령22%) &gt; 대구(20%) &gt; 서울(18.5%)</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 1인가구 */}
                  <div className="bg-pink-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'single' ? null : 'single')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-pink-100 transition-colors"
                    >
                      <span className="text-xl">🏠</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">1인가구 ↑ → 김치찌개 +0.99</p>
                        <p className="text-xs text-gray-500">혼밥러들의 간편 메뉴</p>
                      </div>
                      <span className={`text-gray-400 transition-transform text-xs ${expandedInsight === 'single' ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {expandedInsight === 'single' && (
                      <div className="px-4 pb-3 text-xs text-gray-600 border-t border-pink-200">
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-pink-100 px-2 py-1 rounded">김치찌개 +0.99</span>
                          <span className="bg-pink-100 px-2 py-1 rounded">냉면 +0.99</span>
                          <span className="bg-pink-100 px-2 py-1 rounded">치킨 +0.91</span>
                        </div>
                        <p className="mt-2 text-gray-500">서울 1인가구 35% (전국 최고)</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 청년 */}
                  <div className="bg-cyan-50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setExpandedInsight(expandedInsight === 'youth' ? null : 'youth')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-cyan-100 transition-colors"
                    >
                      <span className="text-xl">👶</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">청년 ↑ → 막걸리 -0.85</p>
                        <p className="text-xs text-gray-500">젊을수록 전통주 기피?!</p>
                      </div>
                      <span className={`text-gray-400 transition-transform text-xs ${expandedInsight === 'youth' ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {expandedInsight === 'youth' && (
                      <div className="px-4 pb-3 text-xs text-gray-600 border-t border-cyan-200">
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-cyan-100 px-2 py-1 rounded">막걸리 -0.85</span>
                          <span className="bg-cyan-100 px-2 py-1 rounded">국밥 -0.76</span>
                          <span className="bg-cyan-100 px-2 py-1 rounded">밀면 -0.74</span>
                        </div>
                        <p className="mt-2 text-gray-500">대전 청년14% &gt; 광주13% &gt; 대구11.5%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🗺️ 지역 히트맵 탭 */}
            {activeTab === 'heatmap' && regionalData && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🗺️</span>
                    <span>지역별 인기도 히트맵</span>
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">
                    메뉴를 선택하면 전국 주요 도시의 검색량을 색상으로 확인할 수 있어요!
                  </p>
                  
                  {/* 메뉴 선택 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🍽️ 메뉴 선택
                    </label>
                    <select
                      value={heatmapKeyword}
                      onChange={(e) => setHeatmapKeyword(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(regionalData.regions)
                        .flatMap(region => 
                          regionalData.regions[region].trends.map(t => t.keyword)
                        )
                        .filter((keyword, index, self) => self.indexOf(keyword) === index)
                        .sort()
                        .map(keyword => (
                          <option key={keyword} value={keyword}>
                            {keyword}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  
                  {/* 히트맵 */}
                  <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    <KoreaHeatmap 
                      data={Object.keys(regionalData.regions).map(region => {
                        const trend = regionalData.regions[region].trends.find(
                          t => t.keyword === heatmapKeyword
                        )
                        const avgValue = trend 
                          ? trend.monthlyValues.reduce((sum, v) => sum + v.value, 0) / trend.monthlyValues.length
                          : 0
                        return {
                          name: region,
                          value: avgValue,
                        }
                      })}
                    />
                  </div>
                  
                  {/* 설명 */}
                  <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
                    <p className="font-medium text-blue-800 mb-1">💡 히트맵 설명</p>
                    <ul className="space-y-1 pl-4">
                      <li>• <span className="text-blue-600 font-medium">파란색</span>: 검색량이 적은 지역</li>
                      <li>• <span className="text-yellow-600 font-medium">노란색</span>: 검색량이 보통인 지역</li>
                      <li>• <span className="text-red-600 font-medium">빨간색</span>: 검색량이 많은 지역</li>
                      <li>• 원 위에 마우스를 올리면 정확한 수치를 볼 수 있어요!</li>
                    </ul>
                  </div>
                  
                  {/* 재밌는 발견 */}
                  {heatmapKeyword === '밀면' && (
                    <div className="mt-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-sm font-bold text-orange-800 mb-1">🔥 부산의 자랑!</p>
                      <p className="text-xs text-gray-600">
                        밀면은 부산이 압도적! 다른 지역 대비 <span className="font-bold text-orange-600">3배 이상</span> 검색량이 높아요.
                      </p>
                    </div>
                  )}
                  
                  {heatmapKeyword === '냉면' && (
                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm font-bold text-blue-800 mb-1">❄️ 여름의 국민 메뉴!</p>
                      <p className="text-xs text-gray-600">
                        냉면은 전국적으로 고른 인기! 특히 <span className="font-bold text-blue-600">여름(6-8월)</span>에 폭발적으로 증가해요.
                      </p>
                    </div>
                  )}
                  
                  {heatmapKeyword === '막걸리' && (
                    <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-sm font-bold text-purple-800 mb-1">🍶 전통주의 귀환!</p>
                      <p className="text-xs text-gray-600">
                        막걸리는 주말과 공휴일에 인기 폭발! 특히 <span className="font-bold text-purple-600">파전</span>과 찰떡궁합이에요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 📍 지역별 분석 탭 */}
            {activeTab === 'regional' && regionalData && (
              <div className="space-y-4">
                {/* 신뢰도 주의 문구 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  ⚠️ <span className="font-medium">데이터 신뢰도 안내:</span> 광주, 울산, 제주 지역은 검색량이 적어 상관계수가 부정확할 수 있어요. 
                  <span className="text-amber-500">(회색 = 표본 부족)</span>
                </div>
                
                {/* 지역 선택 */}
                <div className="flex gap-1 border-b border-gray-100 pb-3 overflow-x-auto">
                  {Object.keys(regionalData.regions).map(region => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        selectedRegion === region
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {region === '서울' && '🏙️'}
                      {region === '부산' && '🌊'}
                      {region === '대구' && '🔥'}
                      {region === '인천' && '🌉'}
                      {region === '광주' && '🎭'}
                      {region === '대전' && '🌿'}
                      {region === '울산' && '🏭'}
                      {region === '경기' && '🏘️'}
                      {region === '제주' && '🏝️'}
                      {' '}{region}
                    </button>
                  ))}
                </div>
                
                {/* 선택된 지역 요약 */}
                {regionalData.regions[selectedRegion] && (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <div className="text-lg">🔥</div>
                        <div className="text-[10px] text-red-600 font-medium">
                          {regionalData.regions[selectedRegion].summary.hotWeatherFoods.slice(0,2).join(', ') || '-'}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-lg">❄️</div>
                        <div className="text-[10px] text-blue-600 font-medium">
                          {regionalData.regions[selectedRegion].summary.coldWeatherFoods.slice(0,2).join(', ') || '-'}
                        </div>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-2 text-center">
                        <div className="text-lg">🌧️</div>
                        <div className="text-[10px] text-cyan-600 font-medium">
                          {regionalData.regions[selectedRegion].summary.rainyDayFoods.slice(0,2).join(', ') || '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* 상관관계 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-200">
                            <th className="text-left py-2 px-2">음식</th>
                            <th className="text-center py-2 px-2">🌡️ 기온</th>
                            <th className="text-center py-2 px-2">🌧️ 강수</th>
                            <th className="text-center py-2 px-2">📊 n</th>
                          </tr>
                        </thead>
                    <tbody>
                      {regionalData.regions[selectedRegion].trends
                        .sort((a, b) => {
                          // 표본 수로 정렬 (많은 순) 후, 상관계수로 정렬
                          const avgA = a.monthlyValues.reduce((sum, v) => sum + v.value, 0) / 12
                          const avgB = b.monthlyValues.reduce((sum, v) => sum + v.value, 0) / 12
                          if (avgA < 10 && avgB >= 10) return 1
                          if (avgA >= 10 && avgB < 10) return -1
                          return Math.abs(b.correlationWithTemp) - Math.abs(a.correlationWithTemp)
                        })
                        .map(trend => {
                          const avgSearch = Math.round(
                            trend.monthlyValues.reduce((sum, v) => sum + v.value, 0) / 12
                          )
                          const isLowSample = avgSearch < 10
                          return (
                            <tr 
                              key={trend.keyword} 
                              className={`border-b border-gray-100 ${
                                isLowSample ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className={`py-2 px-2 font-medium ${isLowSample ? 'text-gray-400' : 'text-gray-800'}`}>
                                {trend.keyword}
                                {isLowSample && <span className="ml-1 text-[10px]">⚠️</span>}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  isLowSample ? 'text-gray-400' :
                                  trend.correlationWithTemp > 0.5 ? 'bg-red-100 text-red-600' :
                                  trend.correlationWithTemp < -0.3 ? 'bg-blue-100 text-blue-600' :
                                  'text-gray-500'
                                }`}>
                                  {trend.correlationWithTemp > 0 ? '+' : ''}{trend.correlationWithTemp.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  isLowSample ? 'text-gray-400' :
                                  trend.correlationWithRain > 0.5 ? 'bg-cyan-100 text-cyan-600' :
                                  'text-gray-500'
                                }`}>
                                  {trend.correlationWithRain > 0 ? '+' : ''}{trend.correlationWithRain.toFixed(2)}
                                </span>
                              </td>
                              <td className={`py-2 px-2 text-center ${isLowSample ? 'text-gray-400' : 'text-gray-600'}`}>
                                {avgSearch}
                              </td>
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
                    data={Object.entries(regionalData.comparison['밀면'] || {})
                      .filter(([_, data]) => data.avgSearchVolume >= 10) // 표본 < 10 제외
                      .map(([region, data]) => ({
                        region,
                        검색량: data.avgSearchVolume,
                        상관계수: Math.round(data.tempCorrelation * 100) / 100,
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
                <br/>
                <span className="text-gray-400">(검색량 10 미만 지역 제외)</span>
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
              <h3 className="text-lg font-bold text-gray-700 mb-4">💡 재밌는 발견!</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-yellow-300 font-semibold mb-2">&ldquo;비 오면 파전&rdquo; 실제로 맞음!</h4>
                  <p className="text-gray-500 text-sm">
                    비 오는 날 검색량: <span className="text-yellow-300 font-bold">+345%</span><br/>
                    주말 검색량: <span className="text-orange-300 font-bold">+138%</span><br/>
                    → 비 오는 날 + 주말이면 대박! 🔥
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2">커피 선호도가 정반대</h4>
                  <p className="text-gray-500 text-sm">
                    라떼: <span className="text-blue-300 font-bold">추운 날 인기</span><br/>
                    아메리카노: <span className="text-red-300 font-bold">더운 날 인기</span><br/>
                    → 계절별 메뉴 전략의 핵심!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

          </div> {/* 컨텐츠 카드 닫기 */}
        </div> {/* relative 닫기 */}

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
            <span className="bg-white/60 px-3 py-1 rounded-full">📊 Google Trends API (일별)</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">🌡️ Open-Meteo API</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">📅 366일 일별 데이터</span>
            <span className="bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 rounded-full font-medium text-orange-600">🔥 NEW: 일별 분석!</span>
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
