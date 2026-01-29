# 🍽️ FoodFit - 데이터 기반 맞춤형 음식 추천

> **"오늘 뭐 먹지?"** 고민을 데이터로 해결하는 스마트 메뉴 추천 서비스

🔗 **Live Demo**: [https://foodfit.forx.kr](https://foodfit.forx.kr)

![FoodFit Screenshot](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

---

## ✨ 주요 기능

### 🎯 맞춤형 추천
| 기능 | 설명 |
|------|------|
| 🌤️ **날씨 기반** | 기온, 습도, 강수량에 따른 추천 |
| 📍 **GPS 위치** | 현재 위치 자동 감지 + 주변 맛집 연동 |
| 💭 **기분 기반** | 6가지 기분 프리셋 + 자유 입력 |
| 🍜 **카테고리** | 한식/양식/일식/중식/아시안/카페 |
| 🥗 **식단 관리** | 다이어트, 벌크업, 키토제닉 등 |
| ⏰ **시간대** | 아침/점심/저녁/야식 자동 감지 |

### 📊 데이터 분석 & 인사이트
| 분석 | 내용 |
|------|------|
| 🔬 **날씨-음식 상관관계** | Google Trends + Open-Meteo 데이터 분석 |
| 🗺️ **지역별 분석** | 9개 지역 (서울, 부산, 대구, 인천, 광주, 대전, 울산, 경기, 제주) |
| 👥 **인구통계 분석** | 연령대, 1인가구 비율과 음식 선호도 상관관계 |
| 🧠 **다변량 분석** | 기온+습도+강수량+일조량 복합 분석 |

### 💡 재밌는 발견들

**📊 Google Trends 일별 분석 (2024년 366일 데이터)**
- 🔥 **"비 오면 파전" 드디어 증명!** - 비 오는 날 검색 **+345%**
- 📅 **주말 파전 문화** - 주말 검색 +138%, 특히 일요일 최고 (월요일 대비 -91%)
- 🔄 **Lag 효과 발견** - 비 오기 전날 +20% → 당일 급증 → 다음날 -42%
- 🍗 **금요일부터 시작되는 외식** - 치킨/피자 금요일부터 +30% 이상 증가
- ☕ **라떼 vs 아메리카노** - 정반대 계절 선호 (추운 날 vs 더운 날)
- 🏙️ **서울의 특이점** - 선택지 다양성으로 날씨 영향 적음
- 🧓 **연령대별 선호** - 고령층은 전통 음식 선호

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism UI)
- **State**: Zustand
- **Charts**: Recharts

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **APIs**: Open-Meteo (날씨), Naver Local API (맛집)
- **Analysis**: Google Trends API

### DevOps
- **Hosting**: Vercel
- **Domain**: Custom (forx.kr)
- **CI/CD**: GitHub Actions (자동 트렌드 분석)

---

## 🚀 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Naver API (맛집 검색)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Supabase (데이터 수집)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:4000 에서 확인!

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 메인 페이지
│   ├── result/           # 추천 결과
│   ├── insights/         # 데이터 인사이트
│   ├── privacy/          # 개인정보처리방침
│   └── api/              # API Routes
├── components/
│   ├── weather/          # 날씨 카드
│   ├── mood/             # 기분 선택
│   ├── diet/             # 식단 관리
│   ├── category/         # 카테고리 선택
│   └── location/         # 위치 선택
├── data/
│   ├── menus.json        # 메뉴 데이터 (200+)
│   ├── trend-analysis.json
│   ├── regional-analysis.json
│   └── demographic-analysis.json
├── lib/
│   ├── recommend.ts      # 추천 알고리즘
│   └── supabase.ts       # DB 연동
└── scripts/
    ├── analyzeTrends.ts      # 트렌드 분석
    ├── analyzeByRegion.ts    # 지역별 분석
    └── analyzeDemographics.ts # 인구통계 분석
```

---

## 📊 데이터 분석 스크립트

```bash
# 날씨-음식 트렌드 분석
npx ts-node scripts/analyzeTrends.ts

# 지역별 분석 (9개 지역)
npx ts-node scripts/analyzeByRegion.ts

# 인구통계 분석
npx ts-node scripts/analyzeDemographics.ts

# 다변량 분석
npx ts-node scripts/analyzeMultivariate.ts
```

---

## 🔄 자동 업데이트

GitHub Actions로 3일마다 자동 트렌드 분석:
- `.github/workflows/update-trends.yml`
- 최신 Google Trends 데이터 반영
- 추천 알고리즘 자동 개선

---

## 📝 문서

- [Supabase 설정 가이드](docs/SUPABASE_SETUP.md)
- [GitHub Actions 설정](docs/GITHUB_ACTIONS_SETUP.md)
- [데이터 인사이트 리포트](docs/INSIGHTS.md)
- [배포 계획](docs/DEPLOYMENT_PLAN.md)

---

## 📜 라이선스

MIT License

---

## 👨‍💻 개발자

취미로 만든 사이드 프로젝트입니다! 🍜

**GitHub**: [@ava-jahlee](https://github.com/ava-jahlee)
