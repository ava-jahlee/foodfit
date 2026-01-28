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

export default function InsightsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'trend' | 'correlation' | 'monthly'>('trend')

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
