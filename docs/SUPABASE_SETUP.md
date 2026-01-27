# 🗄️ Supabase 데이터 수집 설정 가이드

FoodFit 앱에서 사용자 선택 로그를 수집하여 **날씨-음식 상관관계 분석**을 하기 위한 Supabase 설정 가이드입니다.

---

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 테이블 생성](#2-데이터베이스-테이블-생성)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [데이터 확인](#4-데이터-확인)

---

## 1️⃣ Supabase 프로젝트 생성

### Step 1: Supabase 가입
1. [https://supabase.com](https://supabase.com) 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인

### Step 2: 새 프로젝트 생성
1. **New Project** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `foodfit`
   - **Database Password**: 원하는 비밀번호 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
3. **Create new project** 클릭
4. 2-3분 기다리기 (프로젝트 생성 중)

---

## 2️⃣ 데이터베이스 테이블 생성

### Step 1: SQL Editor 열기
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭

### Step 2: 테이블 생성 SQL 실행

아래 SQL을 복사해서 붙여넣고 **Run** 클릭:

```sql
-- 사용자 선택 로그 테이블
CREATE TABLE selection_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 환경 정보
  weather_condition TEXT NOT NULL,      -- 날씨 (cold, hot, rainy 등)
  temperature DECIMAL(5,2),             -- 온도
  
  -- 사용자 입력
  mood TEXT NOT NULL,                   -- 기분 (happy, sad, stressed 등)
  mood_custom TEXT,                     -- 자유 입력 기분
  time_slot TEXT NOT NULL,              -- 시간대 (lunch, dinner, latenight)
  diet_mode TEXT DEFAULT 'none',        -- 식단 모드
  
  -- 선택 정보
  selected_menu TEXT NOT NULL,          -- 선택한 메뉴 이름
  selected_menu_category TEXT,          -- 메뉴 카테고리
  location TEXT,                        -- 위치
  was_recommended BOOLEAN DEFAULT TRUE  -- 추천 목록에 있었는지
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX idx_weather ON selection_logs(weather_condition);
CREATE INDEX idx_mood ON selection_logs(mood);
CREATE INDEX idx_menu ON selection_logs(selected_menu);
CREATE INDEX idx_created ON selection_logs(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE selection_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 INSERT 가능하도록 정책 추가
CREATE POLICY "Allow anonymous insert" ON selection_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 모든 사용자가 SELECT 가능하도록 정책 추가 (통계 조회용)
CREATE POLICY "Allow anonymous select" ON selection_logs
  FOR SELECT
  TO anon
  USING (true);
```

✅ 성공하면 "Success. No rows returned" 메시지가 나타납니다.

---

## 3️⃣ 환경 변수 설정

### Step 1: API 키 확인
1. 왼쪽 메뉴에서 **Project Settings** (⚙️ 아이콘) 클릭
2. **API** 섹션 클릭
3. 아래 두 값을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: .env.local 파일 수정

프로젝트 루트의 `.env.local` 파일에 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Vercel 환경변수 설정 (배포 시)

Vercel 대시보드에서:
1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 위 두 변수 추가

---

## 4️⃣ 데이터 확인

### 테이블 확인
1. Supabase 대시보드에서 **Table Editor** 클릭
2. `selection_logs` 테이블 선택
3. 앱에서 "이거 먹을래요!" 버튼 클릭 후 새로고침하면 데이터가 쌓입니다!

### 통계 쿼리 예시

```sql
-- 날씨별 인기 메뉴 TOP 5
SELECT 
  weather_condition,
  selected_menu,
  COUNT(*) as count
FROM selection_logs
GROUP BY weather_condition, selected_menu
ORDER BY weather_condition, count DESC;

-- 기분별 메뉴 선택 패턴
SELECT 
  mood,
  selected_menu,
  COUNT(*) as count
FROM selection_logs
GROUP BY mood, selected_menu
ORDER BY mood, count DESC;

-- 시간대별 인기 메뉴
SELECT 
  time_slot,
  selected_menu,
  COUNT(*) as count
FROM selection_logs
GROUP BY time_slot, selected_menu
ORDER BY time_slot, count DESC;
```

---

## 📊 데이터 활용 계획

| 수집량 | 가능한 분석 |
|--------|------------|
| 100건 이상 | 기본 통계 (인기 메뉴) |
| 500건 이상 | 날씨-메뉴 상관관계 |
| 1,000건 이상 | 기분-메뉴 상관관계 |
| 5,000건 이상 | 머신러닝 추천 모델 |

---

## 💡 비용

- **Supabase Free Tier**:
  - 무료 500MB 데이터베이스
  - 월 2GB 전송량
  - **FoodFit 규모에서 충분히 무료로 운영 가능!**

---

## 🔗 관련 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase + Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
