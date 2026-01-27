'use client'

import { useState } from 'react'
import { useUserInputStore, MoodType } from '@/store/userInputStore'

const moods: { type: MoodType; emoji: string; label: string; hint: string }[] = [
  { type: 'happy', emoji: '😊', label: '기분 좋음', hint: '뭐든 맛있겠다!' },
  { type: 'sad', emoji: '😢', label: '우울함', hint: '달달한 거 어때요?' },
  { type: 'stressed', emoji: '😤', label: '스트레스', hint: '매운 거로 스트레스 해소!' },
  { type: 'tired', emoji: '🤒', label: '피곤함', hint: '든든한 보양식이 필요해요' },
  { type: 'special', emoji: '🎉', label: '특별한 날', hint: '오늘은 좀 특별하게!' },
  { type: 'normal', emoji: '🤔', label: '그냥 평범', hint: '적당히 맛있는 거로!' },
]

export default function MoodSelector() {
  const { mood, setMoodPreset, setMoodCustom } = useUserInputStore()
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleMoodSelect = (type: MoodType) => {
    setMoodPreset(type)
    setShowCustomInput(false)
  }

  const selectedMood = moods.find((m) => m.type === mood.preset)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>💭</span>
        <span>오늘 기분이 어때요?</span>
      </h3>

      {/* 기분 선택 버튼들 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {moods.map((item) => (
          <button
            key={item.type}
            onClick={() => handleMoodSelect(item.type)}
            className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
              mood.preset === item.type
                ? 'bg-orange-100 border-2 border-orange-400 shadow-md scale-105'
                : 'bg-gray-50 border-2 border-transparent hover:bg-orange-50 hover:border-orange-200'
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className={`text-xs font-medium ${
              mood.preset === item.type ? 'text-orange-600' : 'text-gray-600'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* 선택된 기분 힌트 */}
      {selectedMood && (
        <div className="bg-orange-50 rounded-xl p-3 mb-4 animate-pulse-soft">
          <p className="text-sm text-orange-700">
            <span className="font-medium">{selectedMood.emoji} {selectedMood.label}</span>
            {' - '}
            {selectedMood.hint}
          </p>
        </div>
      )}

      {/* 직접 입력 버튼 */}
      <button
        onClick={() => {
          setShowCustomInput(!showCustomInput)
          if (!showCustomInput) setMoodPreset(null)
        }}
        className={`w-full py-2 px-4 rounded-xl text-sm transition-colors ${
          showCustomInput
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {showCustomInput ? '✏️ 직접 입력 중...' : '✏️ 직접 입력하기'}
      </button>

      {/* 자유 입력 필드 */}
      {showCustomInput && (
        <div className="mt-3">
          <input
            type="text"
            value={mood.custom}
            onChange={(e) => setMoodCustom(e.target.value)}
            placeholder="오늘 기분을 자유롭게 적어주세요..."
            className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors"
          />
          <p className="mt-2 text-xs text-gray-500">
            예: &quot;회식 후 해장이 필요해요&quot;, &quot;비 오니까 칼칼한 거 먹고싶어&quot;
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ⚠️ 개인정보(이름, 연락처 등)는 입력하지 마세요
          </p>
        </div>
      )}
    </div>
  )
}
