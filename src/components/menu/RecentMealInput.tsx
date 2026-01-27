'use client'

import { useState } from 'react'
import { useUserInputStore } from '@/store/userInputStore'

export default function RecentMealInput() {
  const { recentMeals, addRecentMeal, removeRecentMeal, toggleMealExclude } = useUserInputStore()
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim()) {
      addRecentMeal(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        최근에 뭐 드셨어요?
      </h3>

      {/* 입력 필드 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="예: 김치찌개, 돈까스..."
          className="input-glass flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
        >
          추가
        </button>
      </div>

      {/* 추가된 메뉴 리스트 */}
      {recentMeals.length > 0 && (
        <div className="space-y-2">
          {recentMeals.map((meal) => (
            <div
              key={meal.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                meal.exclude
                  ? 'bg-red-50/80 border border-red-200/50'
                  : 'bg-white/50 border border-gray-200/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMealExclude(meal.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    meal.exclude
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {meal.exclude ? '✕' : '○'}
                </button>
                <span className={`font-medium ${
                  meal.exclude ? 'text-red-600 line-through' : 'text-gray-700'
                }`}>
                  {meal.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  meal.exclude
                    ? 'bg-red-100/80 text-red-600'
                    : 'bg-gray-100/80 text-gray-500'
                }`}>
                  {meal.exclude ? '제외' : '포함'}
                </span>
                <button
                  onClick={() => removeRecentMeal(meal.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          <p className="text-xs text-gray-400 text-center pt-2">
            클릭해서 제외/포함 전환
          </p>
        </div>
      )}
    </div>
  )
}
