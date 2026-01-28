import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="pt-8 pb-4 text-center">
      <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
        <Link 
          href="/insights" 
          className="hover:text-orange-500 transition-colors flex items-center gap-1"
        >
          <span>📊</span> 날씨-음식 인사이트
        </Link>
        <span className="text-gray-300">·</span>
        <Link 
          href="/privacy" 
          className="hover:text-gray-600 transition-colors"
        >
          개인정보처리방침
        </Link>
        <span className="text-gray-300">·</span>
        <a 
          href="https://github.com/ava-jahlee/foodfit" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors"
        >
          GitHub
        </a>
      </div>
      <p className="mt-2 text-xs text-gray-300">
        © 2026 FoodFit
      </p>
    </footer>
  )
}
