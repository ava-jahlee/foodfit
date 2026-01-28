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

export default function InsightsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [multiData, setMultiData] = useState<MultivariateData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'trend' | 'correlation' | 'monthly' | 'multivariate'>('trend')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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
  }, [])

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">분석 데이터 로딩 중...</p>
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <span className="text-xl">←</span>
            <span>돌아가기</span>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span> 날씨-음식 인사이트
          </h1>
          <div className="text-sm text-white/50">
            {new Date(data.generatedAt).toLocaleDateString('ko-KR')} 기준
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="text-white font-bold mb-1">더운 날 인기</h3>
            <p className="text-purple-300 text-lg font-semibold">
              {correlationData.filter(d => d.temp > 0.5).map(d => d.keyword).join(', ') || '냉면, 빙수'}
            </p>
            <p className="text-white/50 text-sm mt-2">기온 ↑ = 검색량 ↑</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">❄️</div>
            <h3 className="text-white font-bold mb-1">추운 날 인기</h3>
            <p className="text-blue-300 text-lg font-semibold">
              {correlationData.filter(d => d.temp < -0.3).map(d => d.keyword).join(', ') || '김치찌개, 설렁탕'}
            </p>
            <p className="text-white/50 text-sm mt-2">기온 ↓ = 검색량 ↑</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🌧️</div>
            <h3 className="text-white font-bold mb-1">비 오는 날 인기</h3>
            <p className="text-cyan-300 text-lg font-semibold">
              {correlationData.filter(d => d.rain > 0.5).map(d => d.keyword).slice(0, 3).join(', ') || '파전, 막걸리'}
            </p>
            <p className="text-white/50 text-sm mt-2">강수량 ↑ = 검색량 ↑</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'trend', label: '📈 월별 트렌드', emoji: '📈' },
            { id: 'correlation', label: '🔬 상관관계 분석', emoji: '🔬' },
            { id: 'monthly', label: '📅 월별 TOP', emoji: '📅' },
            { id: 'multivariate', label: '🧠 다변량 분석', emoji: '🧠' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 월별 트렌드 차트 */}
        {activeTab === 'trend' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📈 월별 검색량 트렌드</h2>
            
            {/* 키워드 선택 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {data.trends.map((trend, i) => (
                <button
                  key={trend.keyword}
                  onClick={() => toggleKeyword(trend.keyword)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedKeywords.includes(trend.keyword)
                      ? 'text-white shadow-md'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
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
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/50 text-sm mb-2">📊 월별 평균 기온 (서울)</p>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🌡️ 기온과의 상관관계</h2>
              <p className="text-white/50 text-sm mb-4">
                +1.0 = 기온↑ 검색↑ (더울수록 인기) | -1.0 = 기온↓ 검색↑ (추울수록 인기)
              </p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correlationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" domain={[-1, 1]} stroke="rgba(255,255,255,0.5)" />
                    <YAxis dataKey="keyword" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🌧️ 강수량과의 상관관계</h2>
              <p className="text-white/50 text-sm mb-4">
                +1.0 = 비↑ 검색↑ (비 올수록 인기) | 0 = 관계 없음
              </p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...correlationData].sort((a, b) => b.rain - a.rain)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" domain={[-1, 1]} stroke="rgba(255,255,255,0.5)" />
                    <YAxis dataKey="keyword" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">📅 월별 검색량 TOP 3</h2>
            
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
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-bold">{monthName}</span>
                      <span className="text-white/50 text-sm">{temp}°C {tempEmoji}</span>
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
                          <span className="text-white text-sm">{item.keyword}</span>
                          <span className="text-white/30 text-xs ml-auto">{item.value}</span>
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🧠 다변량 분석 개요</h2>
              <p className="text-white/60 mb-4">
                기온 + 강수량 + 습도 + 일조시간을 동시에 고려한 분석 (총 {multiData.totalMenus}개 메뉴)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-white font-bold">{multiData.summary.hotWeatherFoods.length}개</div>
                  <div className="text-white/50 text-sm">더운 날 메뉴</div>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">❄️</div>
                  <div className="text-white font-bold">{multiData.summary.coldWeatherFoods.length}개</div>
                  <div className="text-white/50 text-sm">추운 날 메뉴</div>
                </div>
                <div className="bg-cyan-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🌧️</div>
                  <div className="text-white font-bold">{multiData.summary.rainyDayFoods.length}개</div>
                  <div className="text-white/50 text-sm">비 오는 날 메뉴</div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">💧</div>
                  <div className="text-white font-bold">{multiData.summary.humidDayFoods.length}개</div>
                  <div className="text-white/50 text-sm">습한 날 메뉴</div>
                </div>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 다변량 상관관계 테이블 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 overflow-x-auto">
              <h3 className="text-lg font-bold text-white mb-4">📊 변수별 상관계수</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
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
                      <tr key={item.keyword} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2 text-white font-medium">{item.keyword}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.temp > 0.5 ? 'bg-red-500/30 text-red-300' :
                            item.correlations.temp < -0.3 ? 'bg-blue-500/30 text-blue-300' :
                            'text-white/50'
                          }`}>
                            {item.correlations.temp > 0 ? '+' : ''}{item.correlations.temp.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.rain > 0.3 ? 'bg-cyan-500/30 text-cyan-300' :
                            'text-white/50'
                          }`}>
                            {item.correlations.rain > 0 ? '+' : ''}{item.correlations.rain.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded ${
                            item.correlations.humidity > 0.5 ? 'bg-purple-500/30 text-purple-300' :
                            'text-white/50'
                          }`}>
                            {item.correlations.humidity > 0 ? '+' : ''}{item.correlations.humidity.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-white/50">
                          {item.correlations.sunshine > 0 ? '+' : ''}{item.correlations.sunshine.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${
                            item.regression.rSquared > 0.5 ? 'text-green-400' :
                            item.regression.rSquared > 0.2 ? 'text-yellow-400' :
                            'text-white/30'
                          }`}>
                            {item.regression.rSquared.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-white/70 text-xs">
                          {item.optimalConditions.tempRange}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 히트맵 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-2">🔥 상관관계 히트맵</h3>
              <p className="text-white/50 text-sm mb-4">색상이 진할수록 상관관계가 강함 (빨강=양의 상관, 파랑=음의 상관)</p>
              
              <div className="overflow-x-auto">
                {/* 헤더 */}
                <div className="flex items-center gap-1 mb-1 ml-24">
                  <div className="w-16 text-center text-white/50 text-xs">🌡️기온</div>
                  <div className="w-16 text-center text-white/50 text-xs">🌧️강수</div>
                  <div className="w-16 text-center text-white/50 text-xs">💧습도</div>
                  <div className="w-16 text-center text-white/50 text-xs">☀️일조</div>
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
                          <div className="w-24 text-white text-xs truncate pr-2">{item.keyword}</div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getHeatColor(item.correlations.temp)}`}
                            title={`기온: ${item.correlations.temp.toFixed(2)}`}
                          >
                            {item.correlations.temp.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getHeatColor(item.correlations.rain)}`}
                            title={`강수: ${item.correlations.rain.toFixed(2)}`}
                          >
                            {item.correlations.rain.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getHeatColor(item.correlations.humidity)}`}
                            title={`습도: ${item.correlations.humidity.toFixed(2)}`}
                          >
                            {item.correlations.humidity.toFixed(2)}
                          </div>
                          <div 
                            className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getHeatColor(item.correlations.sunshine)}`}
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
                  <span className="text-white/50">음의 상관</span>
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
                  <span className="text-white/50">양의 상관</span>
                </div>
              </div>
            </div>

            {/* R² 설명력 차트 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-2">🏆 날씨 예측력 TOP 10</h3>
              <p className="text-white/50 text-sm mb-4">R² = 날씨 변수로 검색량을 얼마나 설명할 수 있는가 (높을수록 날씨 영향 큼)</p>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={multiData.results
                      .sort((a, b) => b.regression.rSquared - a.regression.rSquared)
                      .slice(0, 10)
                      .map(r => ({ name: r.keyword, rSquared: r.regression.rSquared }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" domain={[0, 1]} stroke="rgba(255,255,255,0.5)" />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
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
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">🤔 의외의 발견!</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-yellow-300 font-semibold mb-2">&ldquo;비 오면 파전&rdquo;은 마케팅?</h4>
                  <p className="text-white/70 text-sm">
                    파전의 강수량 상관계수: <span className="text-yellow-300 font-bold">+0.06</span><br/>
                    파전의 기온 상관계수: <span className="text-red-300 font-bold">+0.42</span><br/>
                    → 실제로는 &ldquo;따뜻한 날&rdquo;에 더 많이 검색!
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2">라떼는 추운 날 인기</h4>
                  <p className="text-white/70 text-sm">
                    라떼의 기온 상관계수: <span className="text-blue-300 font-bold">-0.41</span><br/>
                    아메리카노 기온 상관계수: <span className="text-red-300 font-bold">+0.75</span><br/>
                    → 따뜻한 라떼 vs 시원한 아메리카노!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인사이트 요약 */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">💡 알고리즘 적용 인사이트</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-purple-300 font-semibold mb-2">🔥 더운 날 (25°C+) 가중치</h3>
              <ul className="text-white/70 text-sm space-y-1">
                {correlationData.filter(d => d.temp > 0.5).map(d => (
                  <li key={d.keyword}>• {d.keyword}: +{Math.round(d.temp * 30)}%</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-blue-300 font-semibold mb-2">❄️ 추운 날 (5°C-) 가중치</h3>
              <ul className="text-white/70 text-sm space-y-1">
                {correlationData.filter(d => d.temp < -0.3).map(d => (
                  <li key={d.keyword}>• {d.keyword}: +{Math.round(Math.abs(d.temp) * 30)}%</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 데이터 출처 */}
        <div className="mt-6 text-center text-white/30 text-sm">
          <p>📊 데이터 출처: Google Trends (2024년 한국)</p>
          <p>🌡️ 기온 데이터: 서울 월별 평균 기온</p>
        </div>
      </div>
    </main>
  )
}
