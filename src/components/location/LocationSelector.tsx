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
        className="w-full glass-card p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <span className="text-lg">📍</span>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400 font-medium">현재 위치</p>
            <p className="font-semibold text-gray-800">{location.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-orange-500 transition-colors">
          <span className="text-sm">변경</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl overflow-hidden z-50 animate-scale-in shadow-xl">
          <div className="p-2 max-h-64 overflow-y-auto">
            {popularLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleSelect(loc)}
                className={`w-full px-4 py-3 text-left rounded-xl transition-all flex items-center gap-3 ${
                  location.name === loc.name
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-gray-100/50 text-gray-700'
                }`}
              >
                <span className="text-base">
                  {location.name === loc.name ? '✓' : '○'}
                </span>
                <span className="font-medium">{loc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
