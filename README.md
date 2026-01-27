# 🍽️ FoodFit - 맞춤형 식사 메뉴 추천 앱

> **"오늘 뭐 먹지?"** 고민을 해결해주는 스마트 메뉴 추천 서비스

## 🚀 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 입력하세요:

```env
# 카카오 API
KAKAO_REST_API_KEY=your_kakao_rest_api_key
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:4000 에서 확인하세요!

## ✨ 주요 기능

- 🌤️ **날씨 기반 추천** - Open-Meteo API 연동
- 💭 **기분 기반 추천** - 6가지 기분 프리셋 + 자유 입력
- 🥗 **식단 관리 모드** - 다이어트, 벌크업, 키토 등
- 🍜 **최근 메뉴 제외** - 제외/포함 토글 가능
- 📍 **주변 맛집 연동** - 카카오맵 API

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **APIs**: Open-Meteo, 카카오맵

## 📁 프로젝트 구조

```
src/
├── app/              # Next.js App Router
│   ├── page.tsx      # 메인 페이지
│   ├── result/       # 추천 결과 페이지
│   └── api/          # API Routes
├── components/       # React 컴포넌트
├── data/             # 메뉴 데이터 (JSON)
├── lib/              # 유틸리티 함수
├── store/            # Zustand 스토어
└── utils/            # 헬퍼 함수
```

## 📝 라이선스

MIT
