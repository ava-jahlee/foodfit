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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>🍜</span>
        <span>최근에 뭐 드셨어요?</span>
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        최근 먹은 메뉴를 입력하면 추천에서 제외해드려요!
      </p>

      {/* 입력 필드 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="예: 김치찌개, 돈까스..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                meal.exclude
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMealExclude(meal.id)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    meal.exclude
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {meal.exclude ? '✕' : '✓'}
                </button>
                <span className={`font-medium ${
                  meal.exclude ? 'text-red-700 line-through' : 'text-green-700'
                }`}>
                  {meal.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  meal.exclude
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {meal.exclude ? '제외' : '포함OK'}
                </span>
                <button
                  onClick={() => removeRecentMeal(meal.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      {recentMeals.length > 0 && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          💡 버튼을 눌러 제외/포함을 전환할 수 있어요
        </p>
      )}
    </div>
  )
}
