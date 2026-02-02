/**
 * 🔄 최근 7일 지역별 트렌드 데이터 수집 스크립트
 * 
 * 히트맵 실시간화를 위한 최근 데이터 수집
 * 
 * 사용법: npx ts-node scripts/collectRecentTrends.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// ========================================
// 🗺️ 지역 설정 (9개 주요 도시)
// ========================================
const REGIONS = [
  { code: 'KR-11', name: '서울', lat: 37.5665, lng: 126.9780 },
  { code: 'KR-26', name: '부산', lat: 35.1796, lng: 129.0756 },
  { code: 'KR-27', name: '대구', lat: 35.8714, lng: 128.6014 },
  { code: 'KR-28', name: '인천', lat: 37.4563, lng: 126.7052 },
  { code: 'KR-29', name: '광주', lat: 35.1595, lng: 126.8526 },
  { code: 'KR-30', name: '대전', lat: 36.3504, lng: 127.3845 },
  { code: 'KR-31', name: '울산', lat: 35.5384, lng: 129.3114 },
  { code: 'KR-41', name: '경기', lat: 37.4138, lng: 127.5183 },
  { code: 'KR-49', name: '제주', lat: 33.4996, lng: 126.5312 },
];

// ========================================
// 🍜 분석할 음식 키워드 (히트맵용 핵심 메뉴)
// ========================================
const FOOD_KEYWORDS = [
  // 시원한 음식
  '냉면', '빙수', '콩국수', '아이스아메리카노',
  // 따뜻한 음식
  '김치찌개', '설렁탕', '칼국수', '라면',
  // 비 오는 날
  '파전', '막걸리',
  // 지역 특색
  '밀면', '국밥', '막창', '치킨',
];

// ========================================
// 📅 날짜 유틸리티
// ========================================
function getDateRange(daysAgo: number = 7): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  return { startDate, endDate };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ========================================
// 📊 Google Trends 데이터 가져오기 (최근 7일) + 재시도 로직
// ========================================
const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 기본 대기 시간 2초
const RATE_LIMIT_DELAY = 10000; // Rate Limit 시 10초 대기

async function getRecentTrendData(
  keyword: string, 
  regionCode: string,
  retryCount: number = 0
): Promise<{ daily: { date: string; value: number }[]; average: number }> {
  const { startDate, endDate } = getDateRange(7);
  
  try {
    const result = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: startDate,
      endTime: endDate,
      geo: regionCode,
    });

    const data = JSON.parse(result);
    const timelineData = data.default?.timelineData || [];

    if (timelineData.length === 0) {
      // 데이터가 없으면 재시도
      if (retryCount < MAX_RETRIES) {
        console.log(`  ⚠️ 데이터 없음 - 재시도 ${retryCount + 1}/${MAX_RETRIES}...`);
        await sleep(BASE_DELAY * (retryCount + 1));
        return getRecentTrendData(keyword, regionCode, retryCount + 1);
      }
      return { daily: [], average: 0 };
    }

    // 일별 데이터 추출
    const daily = timelineData.map((item: any) => ({
      date: formatDate(new Date(item.time * 1000)),
      value: item.value[0] || 0,
    }));

    // 평균 계산
    const average = daily.length > 0 
      ? Math.round(daily.reduce((sum: number, d: any) => sum + d.value, 0) / daily.length)
      : 0;

    // 평균이 0이면 재시도 (실제 데이터가 아닐 수 있음)
    if (average === 0 && retryCount < MAX_RETRIES) {
      console.log(`  ⚠️ 평균 0 - 재시도 ${retryCount + 1}/${MAX_RETRIES}...`);
      await sleep(BASE_DELAY * (retryCount + 1));
      return getRecentTrendData(keyword, regionCode, retryCount + 1);
    }

    return { daily, average };
  } catch (error: any) {
    const isRateLimit = error.message?.includes('302') || 
                        error.message?.includes('ETIMEDOUT') ||
                        error.message?.includes('Too Many Requests') ||
                        error.message?.includes('quota');
    
    if (isRateLimit) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = RATE_LIMIT_DELAY * (retryCount + 1);
        console.log(`  🚫 Rate Limit! ${waitTime/1000}초 대기 후 재시도 ${retryCount + 1}/${MAX_RETRIES}...`);
        await sleep(waitTime);
        return getRecentTrendData(keyword, regionCode, retryCount + 1);
      }
      console.log(`  ❌ Rate Limit - 최대 재시도 초과`);
    } else {
      console.log(`  ❌ Error: ${error.message?.slice(0, 50)}`);
    }
    
    return { daily: [], average: 0 };
  }
}

// ========================================
// 🛠️ 유틸리티
// ========================================
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 🚀 메인 수집 함수
// ========================================
async function collectRecentTrends() {
  console.log('\n🔄 최근 7일 지역별 트렌드 데이터 수집 시작!\n');
  console.log(`📅 수집 기간: ${formatDate(getDateRange(7).startDate)} ~ ${formatDate(getDateRange(7).endDate)}`);
  console.log(`📍 대상 지역: ${REGIONS.length}개`);
  console.log(`🍜 대상 메뉴: ${FOOD_KEYWORDS.length}개\n`);

  const results: {
    generatedAt: string;
    period: { start: string; end: string };
    regions: Record<string, {
      code: string;
      trends: { keyword: string; average: number; daily: { date: string; value: number }[] }[];
    }>;
  } = {
    generatedAt: new Date().toISOString(),
    period: {
      start: formatDate(getDateRange(7).startDate),
      end: formatDate(getDateRange(7).endDate),
    },
    regions: {},
  };

  let totalRequests = 0;
  const totalExpected = REGIONS.length * FOOD_KEYWORDS.length;

  for (const region of REGIONS) {
    console.log(`\n━━━ ${region.name} 수집 중... ━━━`);
    
    const regionTrends: { keyword: string; average: number; daily: { date: string; value: number }[] }[] = [];

    for (const keyword of FOOD_KEYWORDS) {
      totalRequests++;
      process.stdout.write(`  [${totalRequests}/${totalExpected}] ${keyword.padEnd(12)}`);
      
      const { daily, average } = await getRecentTrendData(keyword, region.code);
      
      regionTrends.push({
        keyword,
        average,
        daily,
      });

      const bar = '█'.repeat(Math.ceil(average / 10)) + '░'.repeat(10 - Math.ceil(average / 10));
      console.log(` ${bar} ${average}`);
      
      // Rate limit 방지 (2.5초 대기)
      await sleep(2500);
    }

    results.regions[region.name] = {
      code: region.code,
      trends: regionTrends,
    };
  }

  // 저장
  const outputPath = path.join(__dirname, '../src/data/recent-regional-trends.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ 저장 완료: src/data/recent-regional-trends.json`);
  console.log(`📊 총 ${totalRequests}개 요청 처리`);
  
  // 간단한 요약 출력
  printSummary(results);
}

// ========================================
// 📊 요약 출력
// ========================================
function printSummary(results: any) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 지역별 인기 메뉴 TOP 3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [regionName, regionData] of Object.entries(results.regions) as [string, any][]) {
    const sorted = [...regionData.trends].sort((a: any, b: any) => b.average - a.average);
    const top3 = sorted.slice(0, 3).map((t: any) => `${t.keyword}(${t.average})`).join(', ');
    console.log(`  ${regionName}: ${top3}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔥 전국 TOP 5 메뉴 (평균 기준)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 전국 평균 계산
  const nationalAvg: Record<string, number[]> = {};
  for (const regionData of Object.values(results.regions) as any[]) {
    for (const trend of regionData.trends) {
      if (!nationalAvg[trend.keyword]) nationalAvg[trend.keyword] = [];
      nationalAvg[trend.keyword].push(trend.average);
    }
  }

  const nationalRanking = Object.entries(nationalAvg)
    .map(([keyword, values]) => ({
      keyword,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  nationalRanking.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.keyword}: ${item.avg}`);
  });
}

// 실행
collectRecentTrends().catch(console.error);
