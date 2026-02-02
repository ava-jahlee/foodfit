import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="pt-8 pb-4 text-center">
      {/* 회사 로고 */}
      <a 
        href="https://www.ean.kr" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Image 
          src="/images/ean-logo.png" 
          alt="EAN Technology" 
          width={24} 
          height={24}
          className="opacity-70"
        />
        <span className="text-xs">(주)이에이엔테크놀로지</span>
      </a>
      
      {/* 링크들 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-400">
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
