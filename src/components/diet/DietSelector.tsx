'use client'

import { useUserInputStore, DietMode } from '@/store/userInputStore'

const dietModes: { mode: DietMode; emoji: string; label: string }[] = [
  { mode: 'none', emoji: '✕', label: '해당 없음' },
  { mode: 'diet', emoji: '🏃', label: '다이어트 중' },
  { mode: 'bulk', emoji: '💪', label: '벌크업' },
  { mode: 'keto', emoji: '🥬', label: '키토' },
  { mode: 'lowfat', emoji: '🍚', label: '저지방' },
  { mode: 'vegan', emoji: '🌱', label: '채식' },
  { mode: 'healthy', emoji: '🩺', label: '건강식' },
]

const dietOptions = [
  { key: 'lowSodium' as const, label: '나트륨 줄이기', emoji: '🧂' },
  { key: 'noLateNight' as const, label: '야식 자제', emoji: '🌙' },
  { key: 'noAlcohol' as const, label: '술 안 먹음', emoji: '🍺' },
]

export default function DietSelector() {
  const { diet, setDietMode, setDietOption, setShowCalories } = useUserInputStore()

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        식단 관리 중이신가요?
      </h3>

      {/* 식단 모드 선택 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dietModes.map((item) => (
          <button
            key={item.mode}
            onClick={() => setDietMode(item.mode)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              diet.mode === item.mode
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <span className="mr-1">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* 추가 옵션 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dietOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setDietOption(option.key, !diet.options[option.key])}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              diet.options[option.key]
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200/80'
            }`}
          >
            <span className="mr-1">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* 칼로리 표시 토글 */}
      {diet.mode !== 'none' && (
        <div className="pt-3 border-t border-gray-100/50">
          <button
            onClick={() => setShowCalories(!diet.showCalories)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <span className="text-sm text-gray-600">🔥 칼로리 표시</span>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${
              diet.showCalories ? 'bg-orange-500' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                diet.showCalories ? 'left-5' : 'left-1'
              }`} />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
