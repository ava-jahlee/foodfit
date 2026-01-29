'use client'

import { useState, useMemo } from 'react'

interface RegionData {
  name: string
  value: number
}

interface KoreaHeatmapProps {
  data: RegionData[]
}

interface TooltipPosition {
  x: number
  y: number
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
    // 낮음: 파랑계열 (#60a5fa → #93c5fd)
    const ratio = normalized / 0.3
    return `rgb(${96 + ratio * 51}, ${165 + ratio * 32}, ${250 + ratio * 3})`
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
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ x: 0, y: 0 })
  
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
  
  const handleMouseMove = (e: React.MouseEvent<SVGElement>, region: string) => {
    const svg = e.currentTarget.ownerSVGElement
    if (svg) {
      const rect = svg.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    setHoveredRegion(region)
  }
  
  return (
    <div className="relative">
      {/* 한국 지도 - 9개 주요 도시 원형 표시 */}
      <svg viewBox="0 0 400 500" className="w-full h-auto" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        {/* 한국 지도 윤곽선 (간략화된 버전) */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* 한국 지도 배경 (대략적인 윤곽) */}
        <path
          d="M 200 80 
             L 260 100 L 280 140 L 300 180 L 310 240 L 320 300 L 310 350 L 280 390 L 240 410 L 200 420
             L 160 410 L 120 380 L 90 340 L 80 290 L 90 240 L 110 190 L 140 150 L 170 110 Z"
          fill="#ffffff"
          fillOpacity="0.6"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        
        {/* 제주도 윤곽 */}
        <ellipse
          cx="180"
          cy="450"
          rx="50"
          ry="25"
          fill="#ffffff"
          fillOpacity="0.6"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        
        {/* 경기 (가장 큰 원, 중앙 상단) */}
        <circle
          cx="200"
          cy="150"
          r="60"
          fill={colorMap['경기'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '경기')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 서울 (경기 안쪽) */}
        <circle
          cx="200"
          cy="150"
          r="35"
          fill={colorMap['서울'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '서울')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 인천 (서울 왼쪽) */}
        <circle
          cx="140"
          cy="140"
          r="28"
          fill={colorMap['인천'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '인천')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 대전 (중앙) */}
        <circle
          cx="180"
          cy="250"
          r="32"
          fill={colorMap['대전'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '대전')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 대구 (중앙 우측 하단) */}
        <circle
          cx="260"
          cy="290"
          r="35"
          fill={colorMap['대구'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '대구')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 광주 (좌측 하단) */}
        <circle
          cx="120"
          cy="330"
          r="30"
          fill={colorMap['광주'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '광주')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 울산 (우측 하단) */}
        <circle
          cx="300"
          cy="320"
          r="28"
          fill={colorMap['울산'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '울산')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 부산 (우측 최하단) */}
        <circle
          cx="280"
          cy="370"
          r="38"
          fill={colorMap['부산'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '부산')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 제주 (최하단 중앙) */}
        <circle
          cx="180"
          cy="450"
          r="32"
          fill={colorMap['제주'] || '#e5e7eb'}
          stroke="#fff"
          strokeWidth="3"
          opacity="0.85"
          filter="url(#shadow)"
          onMouseMove={(e) => handleMouseMove(e, '제주')}
          onMouseLeave={() => setHoveredRegion(null)}
          className="cursor-pointer hover:opacity-100 transition-all hover:stroke-gray-400"
          style={{ transition: 'all 0.2s ease' }}
        />
        
        {/* 지역명 라벨 - 그림자 효과 추가 */}
        <text x="200" y="155" textAnchor="middle" className="text-sm font-bold pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="3" paintOrder="stroke">서울</text>
        <text x="140" y="145" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">인천</text>
        <text x="200" y="100" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">경기</text>
        <text x="180" y="255" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">대전</text>
        <text x="260" y="295" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">대구</text>
        <text x="120" y="335" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">광주</text>
        <text x="300" y="325" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">울산</text>
        <text x="280" y="375" textAnchor="middle" className="text-sm font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="3" paintOrder="stroke">부산</text>
        <text x="180" y="455" textAnchor="middle" className="text-xs font-medium pointer-events-none" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" paintOrder="stroke">제주</text>
      </svg>
      
      {/* 호버 툴팁 - 마우스 커서 근처에 표시 */}
      {hoveredRegion && (
        <div 
          className="absolute bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border-2 border-gray-200 pointer-events-none z-50 transition-all duration-150"
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y - 50}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <p className="text-xs font-bold text-gray-800 mb-0.5">{REGION_NAMES[hoveredRegion]}</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {valueMap[hoveredRegion]?.toFixed(1)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">평균 검색량</p>
        </div>
      )}
      
      {/* 색상 범례 */}
      <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-medium text-gray-600">낮음</span>
          <div className="flex h-5 w-56 rounded-full overflow-hidden shadow-inner border border-gray-200">
            <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-300" />
            <div className="flex-1 bg-gradient-to-r from-blue-300 to-yellow-300" />
            <div className="flex-1 bg-gradient-to-r from-yellow-300 to-yellow-400" />
            <div className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
            <div className="flex-1 bg-gradient-to-r from-orange-400 to-red-400" />
            <div className="flex-1 bg-gradient-to-r from-red-400 to-red-500" />
          </div>
          <span className="text-xs font-medium text-gray-600">높음</span>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-blue-600">{min.toFixed(1)}</span>
            <span className="mx-2 text-gray-400">~</span>
            <span className="font-medium text-red-600">{max.toFixed(1)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
