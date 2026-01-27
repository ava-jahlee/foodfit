import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto py-6 text-center text-sm text-gray-400">
      <div className="space-x-4">
        <Link 
          href="/privacy" 
          className="hover:text-orange-500 transition-colors"
        >
          개인정보처리방침
        </Link>
        <span>•</span>
        <a 
          href="https://github.com/ava-jahlee/foodfit" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-orange-500 transition-colors"
        >
          GitHub
        </a>
      </div>
      <p className="mt-2">
        © 2026 FoodFit. Made with 🍊
      </p>
    </footer>
  )
}
