'use client'

import { useState, useMemo } from 'react'

interface RegionData {
  name: string
  value: number
}

interface KoreaHeatmapProps {
  data: RegionData[]
}

// 지역명 매핑 (데이터 키 → 표시명)
const REGION_NAMES: Record<string, string> = {
  '서울': '서울특별시',
  '부산': '부산광역시',
  '대구': '대구광역시',
  '인천': '인천광역시',
  '광주': '광주광역시',
  '대전': '대전광역시',
  '울산': '울산광역시',
  '경기': '경기도',
  '제주': '제주도',
}

// 색상 계산 함수 (0-100 값을 파랑→노랑→빨강 그라데이션으로)
function getHeatmapColor(value: number, min: number, max: number): string {
  if (max === min) return '#93c5fd' // 모두 같으면 기본색
  
  const normalized = (value - min) / (max - min) // 0~1
  
  if (normalized < 0.3) {
    // 낮음: 파랑계열 (#3b82f6 → #60a5fa)
    const ratio = normalized / 0.3
    return `rgb(${59 + ratio * 37}, ${130 + ratio * 35}, ${246 - ratio * 26})`
  } else if (normalized < 0.7) {
    // 중간: 노랑계열 (#fbbf24 → #fcd34d)
    const ratio = (normalized - 0.3) / 0.4
    return `rgb(${251 - ratio * 3}, ${191 + ratio * 20}, ${36 + ratio * 41})`
  } else {
    // 높음: 빨강계열 (#f87171 → #ef4444)
    const ratio = (normalized - 0.7) / 0.3
    return `rgb(${248 - ratio * 9}, ${113 - ratio * 45}, ${113 - ratio * 45})`
  }
}

export default function KoreaHeatmap({ data }: KoreaHeatmapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  
  // 최소/최대값 계산
  const { min, max } = useMemo(() => {
    const values = data.map(d => d.value)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }, [data])
  
  // 지역별 색상 맵
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    data.forEach(({ name, value }) => {
      map[name] = getHeatmapColor(value, min, max)
    })
    return map
  }, [data, min, max])
  
  // 지역별 값 맵
  const valueMap = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach(({ name, value }) => {
      map[name] = value
    })
    return map
  }, [data])
  
  return (
    <div className="relative">
      {/* 간단한 한국 지도 - 9개 주요 도시 원형 표시 */}
      <svg viewBox="0 0 400 500" className="w-full h-auto">
        {/* 경기 (가장 큰 원, 중앙 상단) */}
        <circle
          cx="200"
          cy="150"
          r="60"
          fill={colorMap['경기'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('경기')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 서울 (경기 안쪽) */}
        <circle
          cx="200"
          cy="150"
          r="30"
          fill={colorMap['서울'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          onMouseEnter={() => setHoveredRegion('서울')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 인천 (서울 왼쪽) */}
        <circle
          cx="140"
          cy="140"
          r="25"
          fill={colorMap['인천'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('인천')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 대전 (중앙) */}
        <circle
          cx="180"
          cy="250"
          r="28"
          fill={colorMap['대전'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('대전')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 대구 (중앙 우측 하단) */}
        <circle
          cx="260"
          cy="290"
          r="30"
          fill={colorMap['대구'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('대구')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 광주 (좌측 하단) */}
        <circle
          cx="120"
          cy="330"
          r="28"
          fill={colorMap['광주'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('광주')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 울산 (우측 하단) */}
        <circle
          cx="300"
          cy="320"
          r="25"
          fill={colorMap['울산'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('울산')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 부산 (우측 최하단) */}
        <circle
          cx="280"
          cy="370"
          r="32"
          fill={colorMap['부산'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('부산')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 제주 (최하단 중앙) */}
        <circle
          cx="180"
          cy="450"
          r="28"
          fill={colorMap['제주'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="2"
          opacity="0.8"
          onMouseEnter={() => setHoveredRegion('제주')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-opacity"
        />
        
        {/* 지역명 라벨 */}
        <text x="200" y="155" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">서울</text>
        <text x="140" y="145" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">인천</text>
        <text x="200" y="110" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">경기</text>
        <text x="180" y="255" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">대전</text>
        <text x="260" y="295" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">대구</text>
        <text x="120" y="335" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">광주</text>
        <text x="300" y="325" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">울산</text>
        <text x="280" y="375" textAnchor="middle" className="text-xs font-medium fill-white pointer-events-none">부산</text>
        <text x="180" y="455" textAnchor="middle" className="text-[10px] font-medium fill-white pointer-events-none">제주</text>
      </svg>
      
      {/* 호버 정보 */}
      {hoveredRegion && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <p className="text-sm font-bold text-gray-800">{REGION_NAMES[hoveredRegion]}</p>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {valueMap[hoveredRegion]?.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">검색량 평균</p>
        </div>
      )}
      
      {/* 색상 범례 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500">낮음</span>
        <div className="flex h-4 w-48 rounded-full overflow-hidden">
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-blue-300" />
          <div className="flex-1 bg-yellow-300" />
          <div className="flex-1 bg-yellow-400" />
          <div className="flex-1 bg-orange-400" />
          <div className="flex-1 bg-red-400" />
          <div className="flex-1 bg-red-500" />
        </div>
        <span className="text-xs text-gray-500">높음</span>
      </div>
      
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">
          최소: {min.toFixed(1)} | 최대: {max.toFixed(1)}
        </p>
      </div>
    </div>
  )
}
