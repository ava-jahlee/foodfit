'use client'

import { useUserInputStore, DietMode } from '@/store/userInputStore'

const dietModes: { mode: DietMode; emoji: string; label: string; description: string }[] = [
  { mode: 'none', emoji: '❌', label: '해당 없음', description: '제한 없이 추천받기' },
  { mode: 'diet', emoji: '🏃', label: '다이어트 중', description: '저칼로리, 건강식 위주' },
  { mode: 'bulk', emoji: '💪', label: '벌크업/근성장', description: '고단백 위주' },
  { mode: 'keto', emoji: '🥬', label: '저탄고지 (키토)', description: '탄수화물 제한' },
  { mode: 'lowfat', emoji: '🍚', label: '저지방', description: '기름기 적은 음식' },
  { mode: 'vegan', emoji: '🌱', label: '채식 중', description: '육류/해산물 제외' },
  { mode: 'healthy', emoji: '🩺', label: '건강식', description: '균형 잡힌 식단' },
]

export default function DietSelector() {
  const { diet, setDietMode, setDietOption, setShowCalories } = useUserInputStore()

  const selectedDiet = dietModes.find((d) => d.mode === diet.mode)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>🥗</span>
        <span>식단 관리 중이신가요?</span>
      </h3>

      {/* 드롭다운 선택 */}
      <div className="relative mb-4">
        <select
          value={diet.mode}
          onChange={(e) => setDietMode(e.target.value as DietMode)}
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none cursor-pointer focus:border-orange-400 focus:outline-none transition-colors text-gray-700"
        >
          {dietModes.map((item) => (
            <option key={item.mode} value={item.mode}>
              {item.emoji} {item.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 선택된 모드 설명 */}
      {selectedDiet && diet.mode !== 'none' && (
        <div className="bg-green-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-green-700">
            <span className="font-medium">{selectedDiet.emoji} {selectedDiet.label}</span>
            {' - '}
            {selectedDiet.description}
          </p>
        </div>
      )}

      {/* 추가 옵션 체크박스 */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={diet.options.lowSodium}
            onChange={(e) => setDietOption('lowSodium', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">🧂 나트륨 줄이기 (짜지 않은 음식)</span>
        </label>

        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={diet.options.noLateNight}
            onChange={(e) => setDietOption('noLateNight', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">🌙 야식 자제 (21시 이후 가벼운 메뉴)</span>
        </label>

        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={diet.options.noAlcohol}
            onChange={(e) => setDietOption('noAlcohol', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">🍺 술 안 먹음 (술안주류 제외)</span>
        </label>
      </div>

      {/* 칼로리 표시 옵션 */}
      {diet.mode !== 'none' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <span className="text-sm text-gray-700">🔥 추천 메뉴에 칼로리 표시</span>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              diet.showCalories ? 'bg-orange-500' : 'bg-gray-300'
            }`}>
              <div
                onClick={() => setShowCalories(!diet.showCalories)}
                className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform cursor-pointer ${
                  diet.showCalories ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
      )}
    </div>
  )
}
