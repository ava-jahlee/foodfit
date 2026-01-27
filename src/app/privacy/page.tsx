'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 뒤로가기 */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          ← 메인으로 돌아가기
        </Link>

        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🛡️ 개인정보처리방침
          </h1>
          <p className="text-sm text-gray-500">
            최종 수정일: 2026년 1월 28일
          </p>
        </div>

        {/* 내용 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          
          {/* 1. 개요 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">1.</span> 개요
            </h2>
            <p className="text-gray-600 leading-relaxed">
              FoodFit(이하 &quot;서비스&quot;)는 사용자의 개인정보를 중요하게 생각하며, 
              최소한의 정보만을 수집하여 서비스 개선 목적으로만 활용합니다.
            </p>
          </section>

          {/* 2. 수집 정보 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">2.</span> 수집하는 정보
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-3">
                본 서비스는 <strong>익명 통계 데이터</strong>만을 수집합니다:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  선택한 지역 (예: 선릉역, 강남역)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  날씨 정보 (날씨 API 기반)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  선택한 기분 및 식단 모드
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  선택한 메뉴
                </li>
              </ul>
            </div>
          </section>

          {/* 3. 수집하지 않는 정보 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">3.</span> 수집하지 않는 정보
            </h2>
            <div className="bg-red-50 rounded-xl p-4">
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  이름, 이메일, 전화번호 등 개인 식별 정보
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  정밀 GPS 위치 정보
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  기기 정보, IP 주소
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  로그인/회원가입 정보 (서비스에 로그인 기능 없음)
                </li>
              </ul>
            </div>
          </section>

          {/* 4. 수집 목적 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">4.</span> 수집 목적
            </h2>
            <p className="text-gray-600 leading-relaxed">
              수집된 익명 데이터는 다음 목적으로만 활용됩니다:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                날씨-음식 선호도 상관관계 분석
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                추천 알고리즘 개선
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                서비스 품질 향상
              </li>
            </ul>
          </section>

          {/* 5. 제3자 제공 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">5.</span> 제3자 제공
            </h2>
            <p className="text-gray-600 leading-relaxed">
              수집된 데이터는 <strong>제3자에게 제공되지 않습니다.</strong>
            </p>
          </section>

          {/* 6. 데이터 보관 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">6.</span> 데이터 보관
            </h2>
            <p className="text-gray-600 leading-relaxed">
              익명 통계 데이터는 서비스 운영 기간 동안 보관되며, 
              서비스 종료 시 모든 데이터는 안전하게 삭제됩니다.
            </p>
          </section>

          {/* 7. 문의 */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-orange-500">7.</span> 문의
            </h2>
            <p className="text-gray-600 leading-relaxed">
              개인정보 관련 문의사항은 아래로 연락해 주세요:
            </p>
            <div className="mt-3 bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700">
                📧 이메일: <a href="mailto:lja.eantec@gmail.com" className="text-orange-500 hover:underline">lja.eantec@gmail.com</a>
              </p>
            </div>
          </section>

        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-gray-400">
          © 2026 FoodFit. Made with 🍊
        </div>
      </div>
    </main>
  )
}
