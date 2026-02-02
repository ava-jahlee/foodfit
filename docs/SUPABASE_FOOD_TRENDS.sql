-- ========================================
-- 🍜 food_trends 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS food_trends (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 수집 정보
  collected_date DATE NOT NULL,           -- 수집 날짜 (2026-02-02)
  source VARCHAR(20) NOT NULL,            -- 'naver' or 'google'
  
  -- 검색 데이터
  keyword VARCHAR(50) NOT NULL,           -- '냉면', '김치찌개' 등
  region VARCHAR(20) NOT NULL,            -- '서울', '부산' 등 (전국은 'all')
  
  -- 검색량 데이터
  search_value INT NOT NULL,              -- 검색량 (상대값 0-100)
  period_start DATE,                      -- 기간 시작
  period_end DATE,                        -- 기간 끝
  
  -- 중복 방지 (같은 날짜, 소스, 키워드, 지역 조합은 하나만)
  UNIQUE(collected_date, source, keyword, region)
);

-- 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_food_trends_date ON food_trends(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_food_trends_keyword ON food_trends(keyword);
CREATE INDEX IF NOT EXISTS idx_food_trends_region ON food_trends(region);
CREATE INDEX IF NOT EXISTS idx_food_trends_source ON food_trends(source);

-- RLS (Row Level Security) 설정
ALTER TABLE food_trends ENABLE ROW LEVEL SECURITY;

-- 읽기는 누구나 가능
CREATE POLICY "Allow public read" ON food_trends
  FOR SELECT USING (true);

-- 쓰기는 서비스 롤만 (서버사이드에서만)
CREATE POLICY "Allow service write" ON food_trends
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update" ON food_trends
  FOR UPDATE USING (true);

-- ========================================
-- 📊 유용한 뷰 (선택사항)
-- ========================================

-- 최신 데이터만 보는 뷰
CREATE OR REPLACE VIEW latest_food_trends AS
SELECT DISTINCT ON (keyword, region, source)
  *
FROM food_trends
ORDER BY keyword, region, source, collected_date DESC;

-- 지역별 평균 검색량 뷰
CREATE OR REPLACE VIEW regional_avg_trends AS
SELECT 
  keyword,
  region,
  source,
  AVG(search_value) as avg_value,
  COUNT(*) as data_points,
  MAX(collected_date) as last_updated
FROM food_trends
WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY keyword, region, source;

-- ========================================
-- 🧪 테스트 데이터 (선택사항)
-- ========================================

-- INSERT INTO food_trends (collected_date, source, keyword, region, search_value, period_start, period_end)
-- VALUES 
--   ('2026-02-02', 'naver', '냉면', '서울', 75, '2026-01-26', '2026-02-02'),
--   ('2026-02-02', 'naver', '김치찌개', '서울', 85, '2026-01-26', '2026-02-02');
