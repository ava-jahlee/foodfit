'use client'

import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // localStorage에서 다크모드 설정 확인
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // SSR 중에는 빈 버튼 렌더링
  if (!mounted) {
    return (
      <button className="dark-toggle w-10 h-10 flex items-center justify-center">
        <span className="text-lg">🌙</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="dark-toggle w-10 h-10 flex items-center justify-center"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      <span className="text-lg transition-transform duration-300 hover:scale-110">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
