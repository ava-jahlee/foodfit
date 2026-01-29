/**
 * Lag 효과 + 평일/주말 효과 분석 (제대로 된 버전)
 * 
 * 핵심 개선:
 * 1. 3개월씩 나눠서 요청 → 일별 데이터 확보
 * 2. 실제 비 온 날짜와 매칭
 * 3. 전날/당일/다음날 lag 효과 분석
 * 4. 평일/주말 효과 분석
 * 
 * 사용법: npx ts-node scripts/analyzeLagAndWeekday.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// ========================================
// 🍜 분석할 음식 키워드
// ========================================
const FOOD_KEYWORDS = [
  '파전', '막걸리', '칼국수', '라면',
  '냉면', '빙수', '삼계탕', '설렁탕',
  '치킨', '피자', '삼겹살', '김치찌개',
  '떡볶이', '국밥', '짬뽕', '삼겹살'
];

// ========================================
// 📅 날짜 유틸리티
// ========================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 📊 Google Trends 일별 데이터 가져오기 (3개월 단위)
// ========================================
async function getDailyTrendsForYear(keyword: string, year: number): Promise<Map<string, number>> {
  console.log(`  🔍 "${keyword}" 데이터 수집 중...`);
  
  const dailyData = new Map<string, number>();
  
  // 3개월씩 4번 요청 (1-3월, 4-6월, 7-9월, 10-12월)
  const quarters = [
    { start: `${year}-01-01`, end: `${year}-03-31` },
    { start: `${year}-04-01`, end: `${year}-06-30` },
    { start: `${year}-07-01`, end: `${year}-09-30` },
    { start: `${year}-10-01`, end: `${year}-12-31` },
  ];
  
  for (const quarter of quarters) {
    try {
      const result = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(quarter.start),
        endTime: new Date(quarter.end),
        geo: 'KR',
      });
      
      const data = JSON.parse(result);
      if (data.default?.timelineData) {
        data.default.timelineData.forEach((item: any) => {
          const date = formatDate(new Date(item.time * 1000));
          const value = item.value[0] || 0;
          dailyData.set(date, value);
        });
      }
      
      // API 제한 방지
      await delay(2000);
    } catch (error) {
      console.error(`  ❌ ${quarter.start}~${quarter.end} 오류:`, error);
    }
  }
  
  console.log(`  ✅ ${dailyData.size}일 데이터 수집 완료`);
  return dailyData;
}

// ========================================
// 🌧️ 날씨 데이터 가져오기 (Open-Meteo)
// ========================================
async function getHistoricalWeather(year: number): Promise<Map<string, { rain: number; temp: number }>> {
  console.log(`\n🌤️ ${year}년 날씨 데이터 가져오는 중...`);
  
  const weatherMap = new Map<string, { rain: number; temp: number }>();
  
  try {
    // 서울 좌표
    const lat = 37.5665;
    const lng = 126.978;
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&longitude=${lng}&` +
      `start_date=${year}-01-01&end_date=${year}-12-31&` +
      `daily=precipitation_sum,temperature_2m_mean&` +
      `timezone=Asia/Seoul`
    );
    
    const data = await response.json();
    
    if (data.daily) {
      data.daily.time.forEach((date: string, i: number) => {
        weatherMap.set(date, {
          rain: data.daily.precipitation_sum[i] || 0,
          temp: data.daily.temperature_2m_mean[i] || 15,
        });
      });
    }
  } catch (error) {
    console.error('❌ 날씨 데이터 오류:', error);
  }
  
  console.log(`✅ ${weatherMap.size}일 날씨 데이터 수집 완료`);
  return weatherMap;
}

// ========================================
// 🧮 통계 함수
// ========================================
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

// ========================================
// 🔬 메인 분석 함수
// ========================================
interface AnalysisResult {
  keyword: string;
  totalDays: number;
  
  // 비 오는 날 효과
  rainEffect: {
    sampleSize: number;
    rainDayAvg: number;
    beforeRainAvg: number;
    afterRainAvg: number;
    noRainAvg: number;
    
    rainDayLift: number;      // 비 온 날 vs 안 온 날
    beforeToRainLift: number; // 전날 → 당일
    rainToAfterLift: number;  // 당일 → 다음날
  };
  
  // 평일/주말 효과
  weekdayEffect: {
    weekdayAvg: number;
    weekdayMedian: number;
    weekendAvg: number;
    weekendMedian: number;
    weekendLift: number;      // 주말 vs 평일
    
    mondayAvg: number;
    fridayAvg: number;
    saturdayAvg: number;
    sundayAvg: number;
  };
}

async function analyzeFood(
  keyword: string,
  searchData: Map<string, number>,
  weatherData: Map<string, { rain: number; temp: number }>
): Promise<AnalysisResult> {
  
  // 비 오는 날 분석
  const rainDayValues: number[] = [];
  const beforeRainValues: number[] = [];
  const afterRainValues: number[] = [];
  const noRainValues: number[] = [];
  
  // 평일/주말 분석
  const weekdayValues: number[] = [];
  const weekendValues: number[] = [];
  const mondayValues: number[] = [];
  const fridayValues: number[] = [];
  const saturdayValues: number[] = [];
  const sundayValues: number[] = [];
  
  // 모든 날짜 순회
  const searchEntries = Array.from(searchData.entries());
  for (const [date, searchValue] of searchEntries) {
    const weather = weatherData.get(date);
    if (!weather) continue;
    
    // 비 오는 날 분석
    if (weather.rain > 1) {
      rainDayValues.push(searchValue);
      
      // 전날 데이터
      const yesterday = addDays(date, -1);
      const yesterdayValue = searchData.get(yesterday);
      if (yesterdayValue !== undefined) {
        beforeRainValues.push(yesterdayValue);
      }
      
      // 다음날 데이터
      const tomorrow = addDays(date, 1);
      const tomorrowValue = searchData.get(tomorrow);
      if (tomorrowValue !== undefined) {
        afterRainValues.push(tomorrowValue);
      }
    } else {
      noRainValues.push(searchValue);
    }
    
    // 평일/주말 분석
    const dayOfWeek = new Date(date).getDay();
    if (isWeekend(date)) {
      weekendValues.push(searchValue);
      if (dayOfWeek === 6) saturdayValues.push(searchValue);
      if (dayOfWeek === 0) sundayValues.push(searchValue);
    } else {
      weekdayValues.push(searchValue);
      if (dayOfWeek === 1) mondayValues.push(searchValue);
      if (dayOfWeek === 5) fridayValues.push(searchValue);
    }
  }
  
  // 결과 계산
  const rainDayAvg = mean(rainDayValues);
  const beforeRainAvg = mean(beforeRainValues);
  const afterRainAvg = mean(afterRainValues);
  const noRainAvg = mean(noRainValues);
  
  const weekdayAvg = mean(weekdayValues);
  const weekendAvg = mean(weekendValues);
  
  return {
    keyword,
    totalDays: searchData.size,
    
    rainEffect: {
      sampleSize: rainDayValues.length,
      rainDayAvg,
      beforeRainAvg,
      afterRainAvg,
      noRainAvg,
      
      rainDayLift: noRainAvg > 0 ? ((rainDayAvg - noRainAvg) / noRainAvg) * 100 : 0,
      beforeToRainLift: beforeRainAvg > 0 ? ((rainDayAvg - beforeRainAvg) / beforeRainAvg) * 100 : 0,
      rainToAfterLift: rainDayAvg > 0 ? ((afterRainAvg - rainDayAvg) / rainDayAvg) * 100 : 0,
    },
    
    weekdayEffect: {
      weekdayAvg,
      weekdayMedian: median(weekdayValues),
      weekendAvg,
      weekendMedian: median(weekendValues),
      weekendLift: weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0,
      
      mondayAvg: mean(mondayValues),
      fridayAvg: mean(fridayValues),
      saturdayAvg: mean(saturdayValues),
      sundayAvg: mean(sundayValues),
    },
  };
}

// ========================================
// 🚀 메인 실행
// ========================================
async function main() {
  console.log('\n🔬 Lag 효과 + 평일/주말 분석 시작!\n');
  console.log('='.repeat(60));
  
  const year = 2024;
  
  // 1. 날씨 데이터 수집
  const weatherData = await getHistoricalWeather(year);
  const rainyDays = Array.from(weatherData.entries())
    .filter(([_, w]) => w.rain > 1)
    .map(([date]) => date);
  
  console.log(`\n🌧️ 비 온 날: ${rainyDays.length}일 / ${weatherData.size}일\n`);
  console.log('='.repeat(60));
  
  // 2. 각 음식별 분석
  const results: AnalysisResult[] = [];
  
  for (const keyword of FOOD_KEYWORDS) {
    console.log(`\n━━━ ${keyword} 분석 중... ━━━`);
    
    // Google Trends 데이터 수집 (일별)
    const searchData = await getDailyTrendsForYear(keyword, year);
    
    if (searchData.size < 100) {
      console.log(`  ⚠️ 데이터 부족 (${searchData.size}일), 건너뜀\n`);
      continue;
    }
    
    // 분석 실행
    const result = await analyzeFood(keyword, searchData, weatherData);
    results.push(result);
    
    // 결과 출력
    console.log(`\n  📊 결과:`);
    console.log(`  ├─ 총 ${result.totalDays}일 데이터`);
    console.log(`  ├─ 비 온 날: ${result.rainEffect.sampleSize}일`);
    console.log(`  │`);
    console.log(`  🌧️ 비 효과:`);
    console.log(`  ├─ 비 안 온 날: ${result.rainEffect.noRainAvg.toFixed(1)}`);
    console.log(`  ├─ 비 온 날: ${result.rainEffect.rainDayAvg.toFixed(1)} (${result.rainEffect.rainDayLift > 0 ? '+' : ''}${result.rainEffect.rainDayLift.toFixed(1)}%)`);
    console.log(`  │`);
    console.log(`  🔄 Lag 효과:`);
    console.log(`  ├─ 전날 → 당일: ${result.rainEffect.beforeToRainLift > 0 ? '+' : ''}${result.rainEffect.beforeToRainLift.toFixed(1)}%`);
    console.log(`  ├─ 당일 → 다음날: ${result.rainEffect.rainToAfterLift > 0 ? '+' : ''}${result.rainEffect.rainToAfterLift.toFixed(1)}%`);
    console.log(`  │`);
    console.log(`  📅 평일/주말:`);
    console.log(`  ├─ 평일: ${result.weekdayEffect.weekdayAvg.toFixed(1)}`);
    console.log(`  ├─ 주말: ${result.weekdayEffect.weekendAvg.toFixed(1)} (${result.weekdayEffect.weekendLift > 0 ? '+' : ''}${result.weekdayEffect.weekendLift.toFixed(1)}%)`);
    console.log(`  └─ 금요일: ${result.weekdayEffect.fridayAvg.toFixed(1)} / 토요일: ${result.weekdayEffect.saturdayAvg.toFixed(1)}`);
    
    // API 제한 방지
    await delay(1000);
  }
  
  // ========================================
  // 📊 요약 통계
  // ========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 분석 결과 요약');
  console.log('='.repeat(60));
  
  // 비 오는 날 효과 TOP 5
  console.log('\n🌧️ 비 오는 날 검색 증가 TOP 5:');
  const rainSorted = [...results].sort((a, b) => b.rainEffect.rainDayLift - a.rainEffect.rainDayLift);
  rainSorted.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword.padEnd(10)} ${r.rainEffect.rainDayLift > 0 ? '+' : ''}${r.rainEffect.rainDayLift.toFixed(1)}%`);
  });
  
  // 주말 효과 TOP 5
  console.log('\n📅 주말 검색 증가 TOP 5:');
  const weekendSorted = [...results].sort((a, b) => b.weekdayEffect.weekendLift - a.weekdayEffect.weekendLift);
  weekendSorted.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword.padEnd(10)} ${r.weekdayEffect.weekendLift > 0 ? '+' : ''}${r.weekdayEffect.weekendLift.toFixed(1)}%`);
  });
  
  // Lag 효과 분석
  console.log('\n🔄 Lag 효과 (비 기준 - 전날→당일→다음날):');
  results.forEach(r => {
    if (r.rainEffect.sampleSize > 10) {
      console.log(
        `   ${r.keyword.padEnd(10)} ` +
        `전→당 ${r.rainEffect.beforeToRainLift > 0 ? '+' : ''}${r.rainEffect.beforeToRainLift.toFixed(1)}% | ` +
        `당→다 ${r.rainEffect.rainToAfterLift > 0 ? '+' : ''}${r.rainEffect.rainToAfterLift.toFixed(1)}%`
      );
    }
  });
  
  // ========================================
  // 💾 결과 저장
  // ========================================
  const output = {
    generatedAt: new Date().toISOString(),
    year,
    totalDays: weatherData.size,
    rainyDays: rainyDays.length,
    
    results: results.map(r => ({
      keyword: r.keyword,
      totalDays: r.totalDays,
      rainEffect: {
        ...r.rainEffect,
        // 소수점 정리
        rainDayLift: Math.round(r.rainEffect.rainDayLift * 10) / 10,
        beforeToRainLift: Math.round(r.rainEffect.beforeToRainLift * 10) / 10,
        rainToAfterLift: Math.round(r.rainEffect.rainToAfterLift * 10) / 10,
      },
      weekdayEffect: {
        ...r.weekdayEffect,
        weekendLift: Math.round(r.weekdayEffect.weekendLift * 10) / 10,
      },
    })),
    
    insights: {
      topRainEffect: rainSorted.slice(0, 5).map(r => ({
        keyword: r.keyword,
        lift: Math.round(r.rainEffect.rainDayLift * 10) / 10,
      })),
      topWeekendEffect: weekendSorted.slice(0, 5).map(r => ({
        keyword: r.keyword,
        lift: Math.round(r.weekdayEffect.weekendLift * 10) / 10,
      })),
    },
  };
  
  const outputPath = path.join(__dirname, '../src/data/lag-weekday-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ 분석 결과 저장: ${outputPath}\n`);
}

// 실행
main().catch(console.error);
