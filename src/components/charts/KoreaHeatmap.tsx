'use client'

import { useState, useMemo, useEffect } from 'react'

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

// 지역별 애니메이션 딜레이 (순차적으로 나타나기)
const REGION_DELAYS: Record<string, number> = {
  '서울': 0,
  '경기': 50,
  '인천': 100,
  '대전': 150,
  '대구': 200,
  '광주': 250,
  '울산': 300,
  '부산': 350,
  '제주': 400,
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
  const [isAnimating, setIsAnimating] = useState(true)
  const [prevDataKey, setPrevDataKey] = useState<string>('')
  
  // 데이터 변경 감지 → 애니메이션 트리거
  const dataKey = useMemo(() => data.map(d => `${d.name}:${d.value}`).join(','), [data])
  
  useEffect(() => {
    if (dataKey !== prevDataKey) {
      setIsAnimating(true)
      setPrevDataKey(dataKey)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [dataKey, prevDataKey])
  
  // 최소/최대값 계산
  const { min, max, topRegion } = useMemo(() => {
    const values = data.map(d => d.value)
    const maxVal = Math.max(...values)
    const top = data.find(d => d.value === maxVal)?.name || ''
    return {
      min: Math.min(...values),
      max: maxVal,
      topRegion: top,
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
  
  // 지역별 위치/크기 정보
  const regions = [
    { name: '경기', cx: 200, cy: 150, r: 60, labelY: 100, fontSize: 'text-xs' },
    { name: '서울', cx: 200, cy: 150, r: 35, labelY: 155, fontSize: 'text-sm font-bold' },
    { name: '인천', cx: 140, cy: 140, r: 28, labelY: 145, fontSize: 'text-xs' },
    { name: '대전', cx: 180, cy: 250, r: 32, labelY: 255, fontSize: 'text-xs' },
    { name: '대구', cx: 260, cy: 290, r: 35, labelY: 295, fontSize: 'text-xs' },
    { name: '광주', cx: 120, cy: 330, r: 30, labelY: 335, fontSize: 'text-xs' },
    { name: '울산', cx: 300, cy: 320, r: 28, labelY: 325, fontSize: 'text-xs' },
    { name: '부산', cx: 280, cy: 370, r: 38, labelY: 375, fontSize: 'text-sm' },
    { name: '제주', cx: 180, cy: 380, r: 32, labelY: 385, fontSize: 'text-xs' },
  ]

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
      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { 
            filter: url(#shadow) drop-shadow(0 0 8px currentColor);
            transform: scale(1);
          }
          50% { 
            filter: url(#shadow) drop-shadow(0 0 20px currentColor);
            transform: scale(1.05);
          }
        }
        @keyframes fade-scale-in {
          0% { 
            opacity: 0;
            transform: scale(0.5);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .region-circle {
          transform-origin: center;
          transform-box: fill-box;
        }
        .pulse-animation {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* 한국 지도 - 9개 주요 도시 원형 표시 */}
      <svg viewBox="0 0 400 420" className="w-full h-auto max-h-[500px]" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        {/* 한국 지도 윤곽선 (간략화된 버전) */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {/* 글로우 효과 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
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
          className="transition-opacity duration-500"
        />
        
        {/* 제주도 윤곽 */}
        <ellipse
          cx="180"
          cy="380"
          rx="50"
          ry="25"
          fill="#ffffff"
          fillOpacity="0.6"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        
        {/* 지역 원들 - 애니메이션 적용 */}
        {regions.map((region) => {
          const isTop = region.name === topRegion
          const isHovered = hoveredRegion === region.name
          const delay = REGION_DELAYS[region.name] || 0
          
          return (
            <g key={region.name}>
              {/* 메인 원 */}
              <circle
                cx={region.cx}
                cy={region.cy}
                r={region.r}
                fill={colorMap[region.name] || '#e5e7eb'}
                stroke={isTop ? '#fff' : 'none'}
                strokeWidth={isTop ? 3 : 0}
                filter={isHovered ? 'url(#glow)' : 'url(#shadow)'}
                onMouseMove={(e) => handleMouseMove(e, region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="region-circle cursor-pointer"
                style={{
                  opacity: isHovered ? 0.9 : 0.75,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: isAnimating ? `${delay}ms` : '0ms',
                  animation: isTop && !isHovered ? 'pulse-glow 2.5s ease-in-out infinite' : 'none',
                }}
              />
              
              {/* 1등 왕관 표시 */}
              {isTop && (
                <text
                  x={region.cx}
                  y={region.cy - region.r - 8}
                  textAnchor="middle"
                  className="text-lg pointer-events-none"
                  style={{
                    opacity: isAnimating ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    transitionDelay: '500ms',
                  }}
                >
                  👑
                </text>
              )}
            </g>
          )
        })}
        
        {/* 지역명 라벨 */}
        {regions.map((region) => (
          <text
            key={`label-${region.name}`}
            x={region.cx}
            y={region.labelY}
            textAnchor="middle"
            className={`${region.fontSize} font-medium pointer-events-none`}
            fill="white"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={region.name === '서울' || region.name === '부산' ? 3 : 2}
            paintOrder="stroke"
            style={{
              opacity: isAnimating ? 0 : 1,
              transition: 'opacity 0.3s ease',
              transitionDelay: `${(REGION_DELAYS[region.name] || 0) + 200}ms`,
            }}
          >
            {region.name}
          </text>
        ))}
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
