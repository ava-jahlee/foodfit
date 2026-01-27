'use client'

import { useUserInputStore, FoodCategory } from '@/store/userInputStore'

const categories: { id: FoodCategory; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '🍽️' },
  { id: 'korean', label: '한식', emoji: '🍲' },
  { id: 'western', label: '양식', emoji: '🍝' },
  { id: 'asian', label: '아시안', emoji: '🍜' },
  { id: 'light', label: '가볍게', emoji: '🥗' },
]

export default function CategorySelector() {
  const { foodCategory, setFoodCategory, adventureMode, setAdventureMode } = useUserInputStore()

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        🍴 오늘 뭐 끌려?
      </h3>
      
      {/* 카테고리 칩들 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFoodCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              foodCategory === cat.id
                ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white/70 border border-white/40'
            }`}
          >
            <span className="mr-1">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* 모험 모드 토글 */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={adventureMode}
            onChange={(e) => setAdventureMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200/80 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-400 peer-checked:to-pink-400"></div>
        </div>
        <span className={`text-sm font-medium transition-colors ${
          adventureMode ? 'text-purple-600' : 'text-gray-600'
        }`}>
          ✨ 오늘은 색다른 거 도전!
        </span>
      </label>
      
      {adventureMode && (
        <p className="mt-2 text-xs text-purple-500 animate-fade-in">
          타코, 포케, 케밥 같은 특별한 메뉴를 추천받아요
        </p>
      )}
    </div>
  )
}
