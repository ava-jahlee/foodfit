'use client'

import { useState } from 'react'
import { useUserInputStore, MoodType } from '@/store/userInputStore'

const moods: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: '기분 좋음' },
  { type: 'sad', emoji: '😢', label: '우울함' },
  { type: 'stressed', emoji: '😤', label: '스트레스' },
  { type: 'tired', emoji: '🤒', label: '피곤함' },
  { type: 'special', emoji: '🎉', label: '특별한 날' },
  { type: 'normal', emoji: '🤔', label: '그냥 평범' },
]

export default function MoodSelector() {
  const { mood, setMoodPreset, setMoodCustom } = useUserInputStore()
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleMoodSelect = (type: MoodType) => {
    setMoodPreset(type)
    setShowCustomInput(false)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        오늘 기분이 어때요?
      </h3>

      {/* 기분 선택 버튼들 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {moods.map((item) => (
          <button
            key={item.type}
            onClick={() => handleMoodSelect(item.type)}
            className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
              mood.preset === item.type
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                : 'bg-white/50 hover:bg-white text-gray-600 hover:shadow-md'
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-xs font-medium">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* 직접 입력 토글 */}
      <button
        onClick={() => {
          setShowCustomInput(!showCustomInput)
          if (!showCustomInput) setMoodPreset(null)
        }}
        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
          showCustomInput
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200/80'
        }`}
      >
        {showCustomInput ? '직접 입력 중' : '✏️ 직접 입력하기'}
      </button>

      {/* 자유 입력 필드 */}
      {showCustomInput && (
        <div className="mt-3 animate-fade-in">
          <input
            type="text"
            value={mood.custom}
            onChange={(e) => setMoodCustom(e.target.value)}
            placeholder="오늘 기분을 자유롭게 적어주세요..."
            className="input-glass"
          />
          <p className="mt-2 text-xs text-gray-400">
            예: &quot;회식 후 해장이 필요해요&quot;, &quot;비 오니까 칼칼한 거 먹고싶어&quot;
          </p>
          <p className="mt-1 text-xs text-gray-300">
            ⚠️ 개인정보는 입력하지 마세요
          </p>
        </div>
      )}
    </div>
  )
}
