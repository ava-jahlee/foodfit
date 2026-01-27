# 🍽️ FoodFit - 맞춤형 식사 메뉴 추천 앱

> **"오늘 뭐 먹지?"** 고민을 해결해주는 스마트 메뉴 추천 서비스

---

## 📋 프로젝트 개요

### 목표
날씨, 기분, 최근 식사 이력, 시간대 등 다양한 요소를 고려하여 **개인 맞춤형 식사 메뉴**를 추천하고, 해당 메뉴를 파는 **주변 맛집**까지 함께 안내하는 웹 애플리케이션

### 핵심 가치
- 🎯 **복합적 추천**: 단순 랜덤이 아닌, 여러 조건을 종합한 스마트 추천
- 🗺️ **실용성**: 추천만 하는 게 아니라 실제 먹을 수 있는 가게까지 연결
- 😊 **사용자 경험**: 귀찮은 입력 최소화, 직관적인 UI

---

## 🎯 주요 기능

### 1. 식사 시간대 설정
| 구분 | 설명 |
|------|------|
| 점심 | 11:00 ~ 14:00 |
| 저녁 | 17:00 ~ 21:00 |
| 야식 | 21:00 ~ 02:00 |

- 현재 시간 기준 자동 감지
- 영업시간 고려하여 추천 (예: 아침엔 24시간 식당 위주)

### 2. 날씨 기반 추천
| 날씨 | 추천 메뉴 경향 |
|------|---------------|
| ☀️ 맑음/더움 | 냉면, 냉모밀, 샐러드, 회, 초밥 |
| 🌧️ 비/흐림 | 파전, 칼국수, 수제비, 라면, 국밥 |
| ❄️ 추움 | 찌개, 탕, 국밥, 샤브샤브, 곱창 |
| 🌡️ 쌀쌀함 | 칼국수, 우동, 된장찌개 |

- **기본 위치**: 선릉역 근처
- **위치 변경 가능**: 드롭다운 또는 검색으로 지역 선택

### 3. 최근 먹은 메뉴 제외
- 사용자가 최근 먹은 메뉴 입력 (최대 5개)
- 해당 메뉴 및 유사 카테고리 제외
- **체크박스 옵션**: "그래도 포함하고 싶어요" 선택 가능

```
예시:
- 어제: 김치찌개 ✓ 제외
- 그저께: 돈까스 ☐ 포함하고 싶음
```

### 4. 기분 기반 추천
| 기분 | 추천 메뉴 경향 |
|------|---------------|
| 😊 기분 좋음 | 맛있는 거 아무거나, 새로운 메뉴 도전 |
| 😢 우울함 | 단 음식, 매콤한 음식, 고기류 |
| 😤 스트레스 | 매운 음식, 고기, 술안주 |
| 🤒 피곤함 | 든든한 국물, 영양식 |
| 🎉 특별한 날 | 고급 레스토랑, 특별 메뉴 |
| 🤔 평범함 | 일반적인 추천 |

- **프리셋 선택** 또는 **자유 입력** 가능
- 자유 입력 시 키워드 분석하여 적용

### 5. 식단 관리 모드 🥗
| 모드 | 추천 메뉴 경향 | 제외 메뉴 |
|------|---------------|----------|
| 🏃 다이어트 중 | 샐러드, 포케, 닭가슴살, 곤약, 저칼로리 메뉴 | 튀김, 면류, 패스트푸드, 야식 |
| 💪 벌크업/근성장 | 고단백 (닭가슴살, 스테이크, 연어), 단백질 쉐이크 | 탄수화물 과다 메뉴 |
| 🥬 저탄고지 (키토) | 고기, 생선, 계란, 치즈, 아보카도 | 밥, 면, 빵, 감자 |
| 🍚 저지방 | 한식 위주, 찜/구이, 해산물 | 튀김, 중식, 크림소스 |
| 🌱 채식 중 | 비건/채식 메뉴, 두부요리 | 육류, 해산물 |
| 🩺 건강식 (일반) | 균형 잡힌 한식, 집밥 스타일 | 자극적인 음식, 인스턴트 |
| ❌ 해당 없음 | 제한 없이 추천 | - |

#### 추가 옵션 (체크박스)
- [ ] 나트륨 줄이기 (짜지 않은 음식)
- [ ] 야식 자제 (21시 이후 가벼운 메뉴만)
- [ ] 술 안 먹음 (술안주류 제외)

#### 칼로리 표시 (선택)
식단 관리 모드 선택 시, 추천 메뉴에 **예상 칼로리** 함께 표시
```
🍗 닭가슴살 샐러드 - 약 350kcal
🥗 포케 - 약 450kcal
```

### 6. 호불호 음식 처리 (스마트 방식)
사용자가 일일이 입력하는 게 아니라, **보편적으로 호불호가 갈리는 음식**이 추천될 때 자동으로 대안을 추가 제공

#### 호불호 갈리는 음식 목록
| 카테고리 | 음식 | 이유 |
|----------|------|------|
| 🐟 생선회 | 회, 초밥, 사시미 | 날생선 거부감 |
| 🦪 해산물 | 굴, 멍게, 해삼, 번데기 | 식감/비린내 |
| 🥬 향신채 | 고수(코리안더), 민트 | 향 거부감 |
| 🍈 특정 과일 | 두리안, 파파야 | 냄새/맛 |
| 🥩 내장류 | 곱창, 막창, 순대 | 내장 거부감 |
| 🦑 연체류 | 산낙지, 번데기 | 식감 |
| 🧀 발효식품 | 청국장, 홍어 | 냄새 |

#### 처리 방식
```
일반 추천: 3개 메뉴 제시
호불호 음식 포함 시: 5개 메뉴 제시 (대안 +2개)
```

### 7. 주변 맛집 연동
- 추천된 메뉴를 파는 **실제 가게** 표시
- **카카오맵 API** 연동
- 표시 정보:
  - 가게명
  - 주소
  - 거리
  - 영업시간
  - 평점 (있으면)
  - 지도에서 보기 링크

---

## 🛠️ 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14+ | React 프레임워크 (App Router) |
| TypeScript | 5+ | 타입 안정성 |
| Tailwind CSS | 3+ | 스타일링 |
| Zustand | 4+ | 상태 관리 |
| React Query | 5+ | 서버 상태 관리 |

### Backend (Next.js API Routes)
| 기술 | 용도 |
|------|------|
| Next.js API Routes | 백엔드 API |
| Prisma (선택) | ORM (DB 사용 시) |

### External APIs
| API | 용도 | 비용 |
|-----|------|------|
| Open-Meteo API | 날씨 정보 | **완전 무료** (API 키 불필요) |
| 카카오맵 API | 장소 검색 + 지도 | 무료 (일 300,000회) |

### Deployment
| 서비스 | 용도 |
|--------|------|
| Vercel | 호스팅 + CI/CD |
| (선택) Supabase/PlanetScale | 데이터베이스 |

---

## 📡 API 연동 계획

### 1. Open-Meteo API (날씨)

**엔드포인트**: `https://api.open-meteo.com/v1/forecast`

#### 특징
- ✅ **API 키 불필요** - 바로 사용 가능
- ✅ **완전 무료** - 상업용도 포함
- ✅ **호출 제한 없음** - 비상업 10,000회/일, 상업 무제한
- ✅ **한국 지역 지원**

#### 요청 예시
```typescript
const response = await fetch(
  `https://api.open-meteo.com/v1/forecast?` +
  `latitude=37.5045&longitude=127.0494&` +  // 선릉역 좌표
  `current=temperature_2m,weather_code,rain,relative_humidity_2m&` +
  `timezone=Asia/Seoul`
);
```

#### 응답 데이터 활용
| 필드 | 설명 | 활용 |
|------|------|------|
| temperature_2m | 기온 (℃) | 더움/추움 판단 |
| weather_code | WMO 날씨 코드 | 맑음/흐림/비/눈 |
| rain | 강수량 (mm) | 비 오는지 |
| relative_humidity_2m | 습도 (%) | 습한지 |

#### WMO 날씨 코드 매핑
```typescript
const weatherCodeMap = {
  0: "맑음",           // Clear sky
  1: "대체로 맑음",    // Mainly clear
  2: "구름 조금",      // Partly cloudy
  3: "흐림",           // Overcast
  45: "안개",          // Fog
  51: "이슬비",        // Light drizzle
  61: "약한 비",       // Slight rain
  63: "비",            // Moderate rain
  65: "강한 비",       // Heavy rain
  71: "약한 눈",       // Slight snow
  73: "눈",            // Moderate snow
  95: "뇌우",          // Thunderstorm
};
```

### 2. 카카오 로컬 API

**엔드포인트**: `https://dapi.kakao.com/v2/local`

#### 사용할 API
- `/search/keyword.json` - 키워드로 장소 검색

#### 요청 파라미터
```typescript
{
  query: "선릉역 짬뽕",      // 검색어
  category_group_code: "FD6", // 음식점
  x: "127.0494",             // 경도 (선릉역)
  y: "37.5045",              // 위도
  radius: 1000,              // 반경 1km
  sort: "distance"           // 거리순 정렬
}
```

#### 응답 데이터 활용
```typescript
{
  place_name: "맛집 이름",
  address_name: "주소",
  phone: "전화번호",
  distance: "거리(m)",
  place_url: "카카오맵 링크",
  x: "경도",
  y: "위도"
}
```

---

## 📊 데이터 구조

### 메뉴 데이터베이스 (정적 JSON)

```typescript
// types/menu.ts
interface Menu {
  id: string;
  name: string;                    // "김치찌개"
  category: MenuCategory;          // "한식"
  subCategory: string;             // "찌개/탕"
  keywords: string[];              // ["매운", "돼지고기", "국물"]
  
  // 추천 조건
  weather: WeatherCondition[];     // ["cold", "rainy"]
  mood: MoodType[];                // ["stressed", "tired"]
  timeSlot: TimeSlot[];            // ["lunch", "dinner"]
  
  // 🥗 식단 관리 정보
  dietCompatible: DietMode[];      // ["diet", "healthy"] - 호환되는 식단 모드
  estimatedCalories: number;       // 예상 칼로리 (1인분 기준)
  isHighSodium: boolean;           // 나트륨 높음 여부
  isAlcoholRelated: boolean;       // 술안주 여부
  isVegan: boolean;                // 비건 여부
  protein: "high" | "medium" | "low";  // 단백질 함량
  carbs: "high" | "medium" | "low";    // 탄수화물 함량
  
  // 호불호 표시
  controversial: boolean;          // true면 호불호 갈림
  controversialReason?: string;    // "향신료" | "날것" | "내장" 등
  
  // 메타데이터
  searchKeywords: string[];        // 카카오맵 검색용 키워드
}

type MenuCategory = "한식" | "중식" | "일식" | "양식" | "분식" | "패스트푸드" | "아시안" | "기타";
type WeatherCondition = "hot" | "cold" | "rainy" | "sunny" | "cloudy";
type MoodType = "happy" | "sad" | "stressed" | "tired" | "special" | "normal";
type TimeSlot = "breakfast" | "lunch" | "dinner" | "latenight";
type DietMode = "diet" | "bulk" | "keto" | "lowfat" | "vegan" | "healthy" | "none";
```

### 사용자 입력 상태

```typescript
// types/userInput.ts
interface UserInput {
  // 위치
  location: {
    name: string;        // "선릉역"
    lat: number;         // 37.5045
    lng: number;         // 127.0494
  };
  
  // 시간대
  timeSlot: TimeSlot;    // 자동 감지 또는 수동 선택
  
  // 최근 먹은 메뉴
  recentMeals: {
    menuId: string;
    exclude: boolean;    // true면 제외, false면 포함
  }[];
  
  // 기분
  mood: {
    preset?: MoodType;   // 프리셋 선택
    custom?: string;     // 자유 입력
  };
  
  // 식단 관리 모드 🥗
  diet: {
    mode: DietMode;              // "diet" | "bulk" | "keto" | "lowfat" | "vegan" | "healthy" | "none"
    options: {
      lowSodium: boolean;        // 나트륨 줄이기
      noLateNight: boolean;      // 야식 자제
      noAlcohol: boolean;        // 술 안 먹음
    };
    showCalories: boolean;       // 칼로리 표시 여부
  };
}
```

### 날씨 데이터

```typescript
// types/weather.ts
interface WeatherData {
  temperature: number;      // 기온 (℃)
  condition: WeatherCondition;
  humidity: number;         // 습도 (%)
  precipitation: number;    // 강수량 (mm)
  description: string;      // "맑음", "비", "눈" 등
  icon: string;             // 아이콘 코드
  fetchedAt: Date;          // 조회 시간 (캐싱용)
}
```

---

## 🎨 UI/UX 설계

### 페이지 구조

```
📱 FoodFit
├── 🏠 메인 (/) 
│   ├── 현재 날씨 표시
│   ├── 위치 선택
│   ├── 시간대 자동 감지
│   ├── 기분 선택
│   ├── 최근 먹은 메뉴 입력
│   └── [추천받기] 버튼
│
├── 🍽️ 추천 결과 (/result)
│   ├── 추천 메뉴 카드 (3~5개)
│   ├── 각 메뉴별 주변 맛집 리스트
│   └── 지도 보기
│
└── ⚙️ 설정 (/settings) - 선택
    ├── 기본 위치 설정
    └── 제외할 음식 설정
```

### 메인 화면 와이어프레임

```
┌─────────────────────────────────────┐
│  🍽️ FoodFit                    ⚙️  │
├─────────────────────────────────────┤
│                                     │
│  📍 선릉역 근처          [변경]     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ☀️ 맑음  12°C               │   │
│  │ 점심 시간이에요!             │   │
│  └─────────────────────────────┘   │
│                                     │
│  💭 오늘 기분이 어때요?             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│  │😊│ │😢│ │😤│ │🤒│ │🎉│   │
│  └───┘ └───┘ └───┘ └───┘ └───┘   │
│  [직접 입력하기]                    │
│                                     │
│  🥗 식단 관리 중이신가요?           │
│  ┌─────────────────────────────┐   │
│  │ ▼ 해당 없음                  │   │
│  └─────────────────────────────┘   │
│  ☐ 나트륨 줄이기  ☐ 야식 자제      │
│                                     │
│  🍜 최근에 뭐 드셨어요?            │
│  ┌─────────────────────────────┐   │
│  │ + 메뉴 추가                  │   │
│  └─────────────────────────────┘   │
│  ┌─────────┐ ┌─────────┐          │
│  │김치찌개 ☑│ │돈까스  ☐│          │
│  │ 제외    │ │ 포함OK │          │
│  └─────────┘ └─────────┘          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     🎯 메뉴 추천받기!        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 추천 결과 화면 와이어프레임

```
┌─────────────────────────────────────┐
│  ← 뒤로        추천 결과            │
├─────────────────────────────────────┤
│                                     │
│  🎯 오늘의 추천 메뉴                │
│  (맑은 날씨 + 기분 좋음 + 점심)     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  1️⃣ 비빔밥                    │   │
│  │  한식 · 건강한 · 가벼운       │   │
│  │  ────────────────────────    │   │
│  │  📍 주변 맛집 3곳             │   │
│  │  • 본죽&비빔밥 (150m) →      │   │
│  │  • 한솥도시락 (200m) →       │   │
│  │  • 명동비빔밥 (350m) →       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  2️⃣ 냉면                      │   │
│  │  한식 · 시원한 · 면류         │   │
│  │  ────────────────────────    │   │
│  │  📍 주변 맛집 3곳             │   │
│  │  • 을밀대 (100m) →           │   │
│  │  • 평양냉면집 (250m) →       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  3️⃣ 초밥 ⚠️ 날생선            │   │
│  │  일식 · 신선한               │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔄 다시 추천받기]                 │
│                                     │
└─────────────────────────────────────┘
```

### 디자인 컨셉

#### 컬러 팔레트
```css
:root {
  /* Primary - 따뜻한 오렌지 계열 (식욕 자극) */
  --primary-50: #FFF7ED;
  --primary-100: #FFEDD5;
  --primary-500: #F97316;
  --primary-600: #EA580C;
  
  /* Secondary - 민트/그린 계열 (신선함) */
  --secondary-500: #10B981;
  
  /* Neutral */
  --gray-50: #F9FAFB;
  --gray-900: #111827;
  
  /* Accent - 날씨별 */
  --sunny: #FCD34D;
  --rainy: #60A5FA;
  --cold: #A5B4FC;
}
```

#### 폰트
- 제목: **Pretendard** (한글 최적화)
- 본문: **Pretendard**
- 이모지: 시스템 기본

---

## 🧠 추천 알고리즘

### 가중치 시스템

```typescript
interface RecommendationScore {
  menuId: string;
  scores: {
    weather: number;      // 날씨 매칭 (0~25점)
    mood: number;         // 기분 매칭 (0~20점)
    diet: number;         // 식단 모드 매칭 (0~20점) 🥗
    timeSlot: number;     // 시간대 매칭 (0~15점)
    variety: number;      // 다양성 (최근 메뉴 아님) (0~10점)
    random: number;       // 랜덤 요소 (0~10점)
  };
  totalScore: number;     // 합계 (0~100점)
  isControversial: boolean;
  estimatedCalories?: number; // 예상 칼로리 (식단 모드 시)
}
```

### 추천 프로세스

```
1. 전체 메뉴 풀에서 시작 (약 100개)
      ↓
2. 최근 먹은 메뉴 필터링 (제외 체크된 것만)
      ↓
3. 시간대 필터링 (점심/저녁/야식)
      ↓
4. 🥗 식단 모드 필터링 (다이어트면 고칼로리 제외 등)
      ↓
5. 날씨 기반 점수 부여
      ↓
6. 기분 기반 점수 부여
      ↓
7. 🥗 식단 적합도 점수 부여
      ↓
8. 다양성 점수 부여
      ↓
9. 랜덤 점수 추가 (매번 다른 결과)
      ↓
10. 상위 3~5개 선정
      ↓
11. 호불호 음식 포함 시 → 추가 대안 제시
      ↓
12. 🥗 식단 모드면 칼로리 정보 첨부
```

### 날씨-메뉴 매칭 매트릭스

```typescript
const weatherMenuMatrix = {
  hot: {
    preferred: ["냉면", "냉모밀", "회", "초밥", "샐러드", "빙수"],
    avoided: ["삼계탕", "부대찌개", "샤브샤브"]
  },
  cold: {
    preferred: ["김치찌개", "된장찌개", "국밥", "칼국수", "우동", "샤브샤브"],
    avoided: ["냉면", "빙수", "샐러드"]
  },
  rainy: {
    preferred: ["파전", "칼국수", "수제비", "라면", "부대찌개"],
    avoided: ["바베큐", "피크닉류"]
  },
  // ...
};
```

---

## 📁 프로젝트 구조

```
foodfit/
├── 📄 PROJECT_PLAN.md          # 이 문서
├── 📄 README.md                # 프로젝트 소개
├── 📄 .env.local               # 환경 변수 (API 키)
├── 📄 .gitignore
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.ts
├── 📄 next.config.js
│
├── 📁 public/
│   ├── 📁 icons/               # 날씨/기분 아이콘
│   └── 📄 favicon.ico
│
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── 📄 layout.tsx       # 루트 레이아웃
│   │   ├── 📄 page.tsx         # 메인 페이지
│   │   ├── 📁 result/
│   │   │   └── 📄 page.tsx     # 추천 결과 페이지
│   │   └── 📁 api/
│   │       ├── 📁 weather/
│   │       │   └── 📄 route.ts # 날씨 API
│   │       └── 📁 places/
│   │           └── 📄 route.ts # 장소 검색 API
│   │
│   ├── 📁 components/
│   │   ├── 📁 common/          # 공통 컴포넌트
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Card.tsx
│   │   │   └── 📄 Input.tsx
│   │   ├── 📁 weather/
│   │   │   └── 📄 WeatherCard.tsx
│   │   ├── 📁 mood/
│   │   │   └── 📄 MoodSelector.tsx
│   │   ├── 📁 menu/
│   │   │   ├── 📄 RecentMealInput.tsx
│   │   │   └── 📄 MenuCard.tsx
│   │   └── 📁 place/
│   │       └── 📄 PlaceList.tsx
│   │
│   ├── 📁 data/
│   │   ├── 📄 menus.json       # 메뉴 데이터베이스
│   │   └── 📄 locations.json   # 지역 좌표 데이터
│   │
│   ├── 📁 hooks/
│   │   ├── 📄 useWeather.ts    # 날씨 데이터 훅
│   │   └── 📄 usePlaces.ts     # 장소 검색 훅
│   │
│   ├── 📁 lib/
│   │   ├── 📄 weatherApi.ts    # 기상청 API 클라이언트
│   │   ├── 📄 kakaoApi.ts      # 카카오 API 클라이언트
│   │   └── 📄 recommend.ts     # 추천 알고리즘
│   │
│   ├── 📁 store/
│   │   └── 📄 userInputStore.ts # Zustand 스토어
│   │
│   ├── 📁 types/
│   │   ├── 📄 menu.ts
│   │   ├── 📄 weather.ts
│   │   ├── 📄 place.ts
│   │   └── 📄 userInput.ts
│   │
│   └── 📁 utils/
│       ├── 📄 coordinates.ts   # 좌표 변환 유틸
│       └── 📄 time.ts          # 시간대 판단 유틸
│
└── 📁 tests/                   # 테스트 (선택)
```

---

## 📅 개발 일정 (예상)

### Phase 1: 기본 구조 (Day 1-2)
- [x] 프로젝트 계획서 작성
- [ ] Next.js 프로젝트 초기 설정
- [ ] 기본 레이아웃 및 라우팅
- [ ] Tailwind CSS 설정

### Phase 2: 메인 UI (Day 2-3)
- [ ] 메인 페이지 UI 구현
- [ ] 위치 선택 컴포넌트
- [ ] 기분 선택 컴포넌트
- [ ] 최근 메뉴 입력 컴포넌트

### Phase 3: 데이터 & 로직 (Day 3-4)
- [ ] 메뉴 데이터베이스 구축 (JSON)
- [ ] 추천 알고리즘 구현
- [ ] 상태 관리 설정 (Zustand)

### Phase 4: API 연동 (Day 4-5)
- [ ] 기상청 API 연동
- [ ] 카카오맵 API 연동
- [ ] API 캐싱 구현

### Phase 5: 결과 페이지 (Day 5-6)
- [ ] 추천 결과 UI 구현
- [ ] 주변 맛집 리스트 표시
- [ ] 지도 연동 (선택)

### Phase 6: 마무리 (Day 6-7)
- [ ] 반응형 디자인 최적화
- [ ] 에러 처리
- [ ] 배포 (Vercel)

---

## 🔑 환경 변수

```env
# .env.local

# Open-Meteo API - API 키 불필요! 🎉

# 카카오 API
KAKAO_REST_API_KEY=your_kakao_rest_api_key
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
```

---

## 📝 메모 & 추가 아이디어

### 향후 확장 가능 기능
1. **로그인/회원가입**: 개인화된 추천 기록 저장
2. **즐겨찾기**: 자주 가는 맛집 저장
3. **리뷰 연동**: 네이버/카카오 리뷰 점수 표시
4. **그룹 추천**: 여러 사람 취향 종합
5. **칼로리 정보**: 다이어트 모드
6. **예산 설정**: 가격대별 추천

### 참고 자료
- [기상청 API 문서](https://www.data.go.kr/data/15084084/openapi.do)
- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [Next.js 공식 문서](https://nextjs.org/docs)

---

## ✅ 체크리스트

- [x] ~~기상청 API 키 발급~~ → **Open-Meteo 사용 (API 키 불필요!)** ✅
- [ ] 카카오 개발자 앱 등록 완료
- [ ] 카카오 REST API 키 확보
- [ ] 카카오 JavaScript 키 확보
- [ ] Vercel 계정 준비

---

*Last Updated: 2026-01-27*
