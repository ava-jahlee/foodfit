'use client'

import { useState } from 'react'
import { useUserInputStore } from '@/store/userInputStore'

const popularLocations = [
  { name: '선릉역', lat: 37.5045, lng: 127.0494 },
  { name: '강남역', lat: 37.4979, lng: 127.0276 },
  { name: '역삼역', lat: 37.5006, lng: 127.0366 },
  { name: '삼성역', lat: 37.5089, lng: 127.0631 },
  { name: '교대역', lat: 37.4934, lng: 127.0146 },
  { name: '신논현역', lat: 37.5045, lng: 127.0252 },
  { name: '논현역', lat: 37.5110, lng: 127.0216 },
  { name: '학동역', lat: 37.5146, lng: 127.0320 },
]

export default function LocationSelector() {
  const { location, setLocation } = useUserInputStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (loc: typeof popularLocations[0]) => {
    setLocation(loc)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center justify-between hover:border-orange-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div className="text-left">
            <p className="text-xs text-gray-500">현재 위치</p>
            <p className="font-semibold text-gray-800">{location.name} 근처</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-orange-500">
          <span className="text-sm font-medium">변경</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden z-50">
          <div className="p-2 max-h-64 overflow-y-auto">
            {popularLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleSelect(loc)}
                className={`w-full px-4 py-3 text-left rounded-xl transition-colors flex items-center gap-3 ${
                  location.name === loc.name
                    ? 'bg-orange-100 text-orange-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-lg">
                  {location.name === loc.name ? '✓' : '📍'}
                </span>
                <span className="font-medium">{loc.name}</span>
              </button>
            ))}
          </div>
          
          {/* 직접 검색 안내 */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              🔍 더 많은 위치는 추후 업데이트 예정!
            </p>
          </div>
        </div>
      )}

      {/* 오버레이 (드롭다운 바깥 클릭 시 닫기) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
