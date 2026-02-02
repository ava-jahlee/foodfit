/**
 * 🔍 네이버 데이터랩 API를 이용한 음식 트렌드 수집
 * 
 * 네이버는 한국 검색 점유율 60%+ 로 더 정확한 데이터!
 * Rate Limit도 Google보다 훨씬 여유로움
 * 
 * 사용법: npx ts-node scripts/collectNaverTrends.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

// 환경 변수
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ========================================
// 🍜 분석할 음식 키워드
// ========================================
const FOOD_KEYWORDS = [
  // 계절 음식
  '냉면', '빙수', '콩국수', '아이스아메리카노',
  '김치찌개', '설렁탕', '칼국수', '라면',
  // 비/날씨 관련
  '파전', '막걸리',
  // 트렌드/인기
  '치킨', '피자', '삼겹살', '국밥', '떡볶이',
  // 건강식
  '샐러드', '포케',
  // 카페
  '라떼', '카페',
]

// ========================================
// 📅 날짜 유틸
// ========================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(daysAgo: number = 7): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

// ========================================
// 🔍 네이버 데이터랩 API 호출
// ========================================
interface NaverTrendResponse {
  startDate: string
  endDate: string
  timeUnit: string
  results: {
    title: string
    keywords: string[]
    data: { period: string; ratio: number }[]
  }[]
}

async function fetchNaverTrends(keywords: string[]): Promise<NaverTrendResponse | null> {
  const { startDate, endDate } = getDateRange(7)
  
  // 네이버 API는 한 번에 5개 키워드까지만 비교 가능
  // 각 키워드를 개별 그룹으로 만들어서 상대적 비교
  const keywordGroups = keywords.slice(0, 5).map(keyword => ({
    groupName: keyword,
    keywords: [keyword],
  }))
  
  const body = {
    startDate: startDate.replace(/-/g, '-'),
    endDate: endDate.replace(/-/g, '-'),
    timeUnit: 'date',
    keywordGroups,
  }
  
  try {
    const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`  ❌ API 오류: ${response.status} - ${errorText}`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error: any) {
    console.error(`  ❌ 네트워크 오류: ${error.message}`)
    return null
  }
}

// ========================================
// 💾 Supabase에 저장
// ========================================
interface TrendData {
  collected_date: string
  source: string
  keyword: string
  region: string
  search_value: number
  period_start: string
  period_end: string
}

async function saveTrendsToDb(trends: TrendData[]) {
  const { data, error } = await supabase
    .from('food_trends')
    .upsert(trends, {
      onConflict: 'collected_date,source,keyword,region',
    })
  
  if (error) {
    console.error('  ❌ DB 저장 오류:', error.message)
    return false
  }
  
  console.log(`  ✅ ${trends.length}개 데이터 저장 완료`)
  return true
}

// ========================================
// 🚀 메인 실행
// ========================================
async function main() {
  console.log('\n🔍 네이버 데이터랩 음식 트렌드 수집 시작!\n')
  
  // API 키 확인
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error('❌ NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없습니다.')
    console.error('   .env.local 파일을 확인하세요.')
    process.exit(1)
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 설정이 없습니다.')
    process.exit(1)
  }
  
  const { startDate, endDate } = getDateRange(7)
  console.log(`📅 수집 기간: ${startDate} ~ ${endDate}`)
  console.log(`🍜 대상 키워드: ${FOOD_KEYWORDS.length}개\n`)
  
  const allTrends: TrendData[] = []
  const today = formatDate(new Date())
  
  // 5개씩 묶어서 요청 (네이버 API 제한)
  for (let i = 0; i < FOOD_KEYWORDS.length; i += 5) {
    const batch = FOOD_KEYWORDS.slice(i, i + 5)
    console.log(`━━━ 배치 ${Math.floor(i/5) + 1}: ${batch.join(', ')} ━━━`)
    
    const result = await fetchNaverTrends(batch)
    
    if (result && result.results) {
      for (const item of result.results) {
        // 일별 데이터의 평균 계산
        const avgRatio = item.data.length > 0
          ? Math.round(item.data.reduce((sum, d) => sum + d.ratio, 0) / item.data.length)
          : 0
        
        console.log(`  ${item.title.padEnd(12)} 평균: ${avgRatio}`)
        
        allTrends.push({
          collected_date: today,
          source: 'naver',
          keyword: item.title,
          region: 'all', // 네이버는 전국 데이터
          search_value: avgRatio,
          period_start: startDate,
          period_end: endDate,
        })
      }
    }
    
    // Rate limit 방지 (0.5초 대기)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // DB에 저장
  if (allTrends.length > 0) {
    console.log(`\n💾 Supabase에 저장 중...`)
    await saveTrendsToDb(allTrends)
  }
  
  // 결과 요약
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 수집 결과 요약')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const sorted = [...allTrends].sort((a, b) => b.search_value - a.search_value)
  console.log('🔥 TOP 5 인기 키워드:')
  sorted.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.keyword}: ${t.search_value}`)
  })
  
  console.log('\n✅ 완료!')
}

// 실행
main().catch(console.error)
