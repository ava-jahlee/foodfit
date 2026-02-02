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


// Lag + 주말 효과 분석 데이터 타입 (파전 인사이트용)
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

// 네이버 실시간 트렌드 데이터 타입
interface NaverTrendItem {
  keyword: string
  currentValue: number
  history: { keyword: string; value: number; date: string }[]
}

interface NaverTrendsData {
  generatedAt: string
  source: string
  lastUpdated: string
  trends: NaverTrendItem[]
}

export default function InsightsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [lagWeekdayData, setLagWeekdayData] = useState<LagWeekdayData | null>(null)
  const [naverTrends, setNaverTrends] = useState<NaverTrendsData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'realtime' | 'insights' | 'weather' | 'monthly'>('realtime')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

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
    
    // Lag + 주말 효과 분석 데이터 로드 (파전 인사이트용)
    fetch('/api/insights?type=lag-weekday')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setLagWeekdayData(data)
        }
      })
      .catch(err => console.error('Failed to load lag-weekday data:', err))
    
    // 네이버 실시간 트렌드 데이터 로드
    fetch('/api/insights?type=naver-trends')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setNaverTrends(data)
        }
      })
      .catch(err => console.error('Failed to load naver trends:', err))
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

  // 탭 정보 - 4개로 간소화
  const tabs = [
    { id: 'realtime', icon: '🔥', label: '실시간 트렌드' },
    { id: 'insights', icon: '💡', label: '재밌는 발견' },
    { id: 'weather', icon: '🌡️', label: '날씨 × 음식' },
    { id: 'monthly', icon: '📅', label: '월별 트렌드' },
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
          {/* 폴더 탭 - 모바일 스크롤 가능 */}
          <div className="flex -mb-px relative z-10 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 relative px-3 sm:px-4 py-2 text-xs font-medium transition-all rounded-t-xl border-t border-l border-r ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-800 border-gray-200 z-20'
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* 컨텐츠 카드 */}
          <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-200 shadow-sm p-3 sm:p-5">

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
                  
                </div>
                
                {/* 인구통계 인사이트 - 한줄 요약 */}
                <h3 className="text-sm font-bold text-gray-700 mt-4 border-b border-gray-100 pb-2">👥 인구통계 × 음식</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-amber-50 rounded-lg text-center">
                    <span className="text-lg">🧓</span>
                    <p className="font-medium text-amber-700 mt-1">고령↑</p>
                    <p className="text-amber-600">국밥, 막걸리</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg text-center">
                    <span className="text-lg">🏠</span>
                    <p className="font-medium text-pink-700 mt-1">1인가구↑</p>
                    <p className="text-pink-600">김치찌개, 치킨</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg text-center">
                    <span className="text-lg">👶</span>
                    <p className="font-medium text-cyan-700 mt-1">청년↑</p>
                    <p className="text-cyan-600">막걸리↓, 국밥↓</p>
                  </div>
                </div>
              </div>
            )}

            {/* 🔥 실시간 트렌드 탭 (네이버 데이터랩) */}
            {activeTab === 'realtime' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🔥</span>
                    <span>실시간 음식 트렌드</span>
                  </h2>
                  
                  {/* 데이터 소스 & 업데이트 시간 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium text-green-700">네이버 데이터랩 기준</span>
                    </div>
                    <span className="text-xs text-green-600">
                      📅 {naverTrends?.lastUpdated || '로딩 중...'}
                    </span>
                  </div>
                  
                  {!naverTrends ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500">트렌드 데이터 로딩 중...</p>
                    </div>
                  ) : naverTrends.trends.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">아직 수집된 데이터가 없어요.</p>
                      <p className="text-xs text-gray-400 mt-1">데이터 수집 스크립트를 실행해주세요!</p>
                    </div>
                  ) : (
                    <>
                      {/* TOP 5 카드 - 모바일 스크롤 */}
                      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
                        {naverTrends.trends.slice(0, 5).map((trend, idx) => {
                          const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
                          const bgColors = [
                            'bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-300',
                            'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-300',
                            'bg-gradient-to-br from-orange-100 to-amber-50 border-orange-300',
                            'bg-white border-gray-200',
                            'bg-white border-gray-200',
                          ]
                          return (
                            <div 
                              key={trend.keyword}
                              className={`flex-shrink-0 w-20 sm:w-auto sm:flex-1 rounded-xl p-2 sm:p-3 text-center border-2 ${bgColors[idx]} transition-transform hover:scale-105`}
                            >
                              <div className="text-lg sm:text-xl mb-1">{medals[idx]}</div>
                              <div className="text-xs sm:text-sm font-bold text-gray-800 truncate">{trend.keyword}</div>
                              <div className="text-base sm:text-lg font-black text-blue-600">{trend.currentValue}</div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* 전체 순위 바차트 */}
                      <h3 className="text-sm font-bold text-gray-700 mb-3">📊 전체 검색량 순위</h3>
                      <div className="h-[350px] sm:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={naverTrends.trends.slice(0, 15)} 
                            layout="vertical"
                            margin={{ left: 10, right: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis 
                              dataKey="keyword" 
                              type="category" 
                              stroke="#9ca3af" 
                              width={70}
                              tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} 
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                              }}
                              formatter={(value) => [value, '검색량']}
                            />
                            <Bar dataKey="currentValue" radius={[0, 8, 8, 0]}>
                              {naverTrends.trends.slice(0, 15).map((_, index) => {
                                // 순위별 그라데이션 색상
                                const colors = [
                                  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                                  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
                                  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
                                ]
                                return <Cell key={`cell-${index}`} fill={colors[index]} />
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* 계절 인사이트 */}
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                          <h4 className="text-sm font-bold text-red-800 mb-2">🔥 겨울 인기 메뉴</h4>
                          <div className="flex flex-wrap gap-1">
                            {naverTrends.trends
                              .filter(t => ['김치찌개', '칼국수', '국밥', '설렁탕', '라면'].includes(t.keyword))
                              .slice(0, 4)
                              .map(t => (
                                <span key={t.keyword} className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {t.keyword} {t.currentValue}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="text-sm font-bold text-blue-800 mb-2">❄️ 여름 메뉴 (현재)</h4>
                          <div className="flex flex-wrap gap-1">
                            {naverTrends.trends
                              .filter(t => ['냉면', '빙수', '콩국수', '아이스아메리카노'].includes(t.keyword))
                              .slice(0, 4)
                              .map(t => (
                                <span key={t.keyword} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {t.keyword} {t.currentValue}
                                </span>
                              ))
                            }
                          </div>
                          <p className="text-xs text-blue-600 mt-2">겨울이라 검색량이 낮아요!</p>
                        </div>
                      </div>
                      
                      {/* 데이터 설명 */}
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                        <p className="font-medium text-gray-700 mb-1">📊 데이터 설명</p>
                        <ul className="space-y-1 pl-4">
                          <li>• 검색량은 <span className="font-medium">상대값 (0~100)</span>으로, 가장 많이 검색된 키워드가 100</li>
                          <li>• 네이버 데이터랩 기준 최근 7일 평균 검색량</li>
                          <li>• 매일 자동 업데이트됩니다</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

        {/* 월별 트렌드 (TOP 3 + 라인차트 통합) */}
        {/* 날씨 × 음식 분석 */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            {/* 한줄 요약 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-full border border-red-100">
                <span>🔥</span>
                <span className="text-xs text-red-600 font-medium">더울 때: {correlationData.filter(d => d.temp > 0.5).map(d => d.keyword).slice(0, 2).join(', ') || '냉면, 빙수'}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full border border-blue-100">
                <span>❄️</span>
                <span className="text-xs text-blue-600 font-medium">추울 때: {correlationData.filter(d => d.temp < -0.3).map(d => d.keyword).slice(0, 2).join(', ') || '김치찌개'}</span>
              </div>
              <div className="flex items-center gap-2 bg-cyan-50 px-3 py-2 rounded-full border border-cyan-100">
                <span>🌧️</span>
                <span className="text-xs text-cyan-600 font-medium">비 올 때: {correlationData.filter(d => d.rain > 0.3).map(d => d.keyword).slice(0, 2).join(', ') || '파전'}</span>
              </div>
            </div>

            {/* 기온 상관관계 */}
            <div className="glass-card p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3">🌡️ 기온 × 음식</h2>
              <p className="text-gray-400 text-[10px] sm:text-xs mb-3 sm:mb-4">
                양수 = 더울수록 검색↑ | 음수 = 추울수록 검색↑
              </p>
              
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correlationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#d1d5db" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="keyword" type="category" stroke="#d1d5db" width={60} tick={{ fontSize: 11 }} />
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
            <div className="glass-card p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3">🌧️ 비 × 음식</h2>
              <p className="text-gray-400 text-[10px] sm:text-xs mb-3 sm:mb-4">
                양수 = 비 올수록 검색↑ | 0에 가까움 = 관계 없음
              </p>
              
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...correlationData].sort((a, b) => b.rain - a.rain)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#d1d5db" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="keyword" type="category" stroke="#d1d5db" width={60} tick={{ fontSize: 11 }} />
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

        {/* 월별 트렌드 (TOP 3 + 라인차트 통합) */}
        {activeTab === 'monthly' && (
          <div className="space-y-6">
            {/* 월별 TOP 3 그리드 */}
            <div className="glass-card p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">🏆 월별 검색량 TOP 3</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {MONTH_NAMES.map((monthName, monthIndex) => {
                  const month = monthIndex + 1
                  const temp = data.monthlyTemp[String(month)]
                  const tempEmoji = temp > 20 ? '🔥' : temp < 5 ? '❄️' : '🌤️'
                  
                  const monthTop = data.trends
                    .map(t => ({
                      keyword: t.keyword,
                      value: t.monthlyValues.find(v => v.month === month)?.value || 0,
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)

                  return (
                    <div key={month} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-800 font-bold text-sm">{monthName}</span>
                        <span className="text-gray-400 text-xs">{tempEmoji}</span>
                      </div>
                      <div className="space-y-1">
                        {monthTop.map((item, rank) => (
                          <div key={item.keyword} className="flex items-center gap-1">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              rank === 0 ? 'bg-yellow-400 text-yellow-900' :
                              rank === 1 ? 'bg-gray-300 text-gray-700' :
                              'bg-orange-300 text-orange-900'
                            }`}>
                              {rank + 1}
                            </span>
                            <span className="text-gray-600 text-xs truncate">{item.keyword}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 월별 트렌드 라인차트 */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-bold text-gray-700 mb-4">📈 월별 검색량 변화</h2>
              
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {selectedKeywords.map((keyword) => {
                      const colorIndex = data.trends.findIndex(t => t.keyword === keyword)
                      return (
                        <Line
                          key={keyword}
                          type="monotone"
                          dataKey={keyword}
                          stroke={COLORS[colorIndex % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 키워드 선택 */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {data.trends.map((trend, i) => (
                  <button
                    key={trend.keyword}
                    onClick={() => toggleKeyword(trend.keyword)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
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
            <span className="bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full font-medium text-green-700">🆕 네이버 데이터랩 API</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">🌡️ Open-Meteo API</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">📅 일별 자동 업데이트</span>
            <span className="bg-white/60 px-3 py-1 rounded-full">💾 Supabase DB</span>
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
