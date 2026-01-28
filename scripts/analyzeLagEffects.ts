/**
 * Lag 효과 + 시계열 분석 스크립트
 * 
 * 분석 내용:
 * 1. 비 온 날 vs 전날 vs 다음날 음식 검색량 변화
 * 2. 주말/평일 효과
 * 3. 공휴일 효과
 * 4. 자기상관(Autocorrelation) 분석
 * 
 * 사용법: npx ts-node scripts/analyzeLagEffects.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// ========================================
// 📅 2024-2025 공휴일 데이터
// ========================================
const HOLIDAYS_2024 = [
  '2024-01-01', // 신정
  '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', // 설날
  '2024-03-01', // 삼일절
  '2024-04-10', // 국회의원선거
  '2024-05-05', // 어린이날
  '2024-05-15', // 부처님오신날
  '2024-06-06', // 현충일
  '2024-08-15', // 광복절
  '2024-09-16', '2024-09-17', '2024-09-18', // 추석
  '2024-10-03', // 개천절
  '2024-10-09', // 한글날
  '2024-11-14', // 수능
  '2024-12-25', // 크리스마스
];

const SPECIAL_DAYS = [
  { date: '2024-11-14', name: '수능', type: 'exam' },
  { date: '2024-02-14', name: '발렌타인', type: 'event' },
  { date: '2024-03-14', name: '화이트데이', type: 'event' },
  { date: '2024-11-11', name: '빼빼로데이', type: 'event' },
];

// ========================================
// 🍜 분석할 음식
// ========================================
const FOOD_KEYWORDS = [
  // 비/날씨 관련
  '파전', '막걸리', '칼국수', '라면',
  // 계절 음식
  '냉면', '빙수', '삼계탕', '설렁탕',
  // 일반
  '치킨', '피자', '삼겹살', '김치찌개',
];

// ========================================
// 🛠️ 유틸리티 함수
// ========================================

// 날짜가 주말인지 확인
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

// 날짜가 공휴일인지 확인
function isHoliday(dateStr: string): boolean {
  return HOLIDAYS_2024.includes(dateStr);
}

// 날짜가 특별한 날인지 확인
function getSpecialDay(dateStr: string): string | null {
  const special = SPECIAL_DAYS.find(d => d.date === dateStr);
  return special ? special.name : null;
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// n일 전/후 날짜 구하기
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// 피어슨 상관계수
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// 자기상관(Autocorrelation) 계산 - lag k
function autocorrelation(data: number[], lag: number): number {
  const n = data.length;
  if (lag >= n) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n - lag; i++) {
    numerator += (data[i] - mean) * (data[i + lag] - mean);
  }
  
  for (let i = 0; i < n; i++) {
    denominator += (data[i] - mean) ** 2;
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// 평균 계산
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// 표준편차
function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((acc, val) => acc + (val - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// 딜레이 함수
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 📊 Google Trends 일별 데이터 가져오기
// ========================================
async function getDailyTrends(keyword: string, startDate: string, endDate: string): Promise<{ date: string; value: number }[]> {
  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(startDate),
      endTime: new Date(endDate),
      geo: 'KR',
    });
    
    const data = JSON.parse(result);
    if (!data.default?.timelineData) return [];
    
    return data.default.timelineData.map((item: any) => ({
      date: formatDate(new Date(item.time * 1000)),
      value: item.value[0] || 0,
    }));
  } catch (error) {
    console.error(`  ❌ Error fetching trends for ${keyword}:`, error);
    return [];
  }
}

// ========================================
// 🌧️ 날씨 데이터 가져오기 (Open-Meteo 과거 데이터)
// ========================================
async function getHistoricalWeather(startDate: string, endDate: string): Promise<{ date: string; rain: number; temp: number }[]> {
  try {
    // 서울 좌표
    const lat = 37.5665;
    const lng = 126.978;
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum,temperature_2m_mean&timezone=Asia/Seoul`
    );
    
    const data = await response.json();
    
    if (!data.daily) return [];
    
    return data.daily.time.map((date: string, i: number) => ({
      date,
      rain: data.daily.precipitation_sum[i] || 0,
      temp: data.daily.temperature_2m_mean[i] || 15,
    }));
  } catch (error) {
    console.error('❌ Error fetching weather:', error);
    return [];
  }
}

// ========================================
// 🔬 Lag 효과 분석
// ========================================
interface LagAnalysisResult {
  keyword: string;
  sampleSize: number;
  
  // 비 오는 날 효과
  rainEffect: {
    rainDayAvg: number;      // 비 온 날 평균 검색량
    beforeRainAvg: number;   // 비 오기 전날 평균
    afterRainAvg: number;    // 비 온 다음날 평균
    noRainAvg: number;       // 비 안 온 날 평균
    rainDayLift: number;     // 비 온 날 상승률 (%)
  };
  
  // 주말/평일 효과
  dayEffect: {
    weekdayAvg: number;
    weekendAvg: number;
    weekendLift: number;
    fridayAvg: number;
    mondayAvg: number;
  };
  
  // 공휴일 효과
  holidayEffect: {
    holidayAvg: number;
    normalAvg: number;
    holidayLift: number;
  };
  
  // 자기상관 (시계열 특성)
  autocorrelations: {
    lag1: number;  // 1일 전과의 상관
    lag7: number;  // 7일 전과의 상관 (주간 패턴)
    lag30: number; // 30일 전과의 상관 (월간 패턴)
  };
}

async function analyzeLagEffects(): Promise<void> {
  console.log('\n🔬 Lag 효과 + 시계열 분석 시작!\n');
  console.log('='.repeat(60));
  
  // 분석 기간 설정 (최근 3개월 - 일별 데이터 가능)
  const endDate = '2024-12-31';
  const startDate = '2024-01-01';
  
  console.log(`📅 분석 기간: ${startDate} ~ ${endDate}\n`);
  
  // 날씨 데이터 가져오기
  console.log('🌤️ 날씨 데이터 가져오는 중...');
  const weatherData = await getHistoricalWeather(startDate, endDate);
  console.log(`   ✅ ${weatherData.length}일 데이터 수집\n`);
  
  // 날씨 데이터를 Map으로 변환
  const weatherMap = new Map<string, { rain: number; temp: number }>();
  weatherData.forEach(w => weatherMap.set(w.date, { rain: w.rain, temp: w.temp }));
  
  // 비 온 날 목록
  const rainyDays = weatherData.filter(w => w.rain > 1).map(w => w.date);
  console.log(`🌧️ 비 온 날: ${rainyDays.length}일\n`);
  
  const results: LagAnalysisResult[] = [];
  
  // 각 음식별 분석
  for (const keyword of FOOD_KEYWORDS) {
    console.log(`━━━ ${keyword} 분석 중... ━━━`);
    
    // Google Trends 데이터 가져오기
    const trendsData = await getDailyTrends(keyword, startDate, endDate);
    await delay(2000); // Rate limit 방지
    
    if (trendsData.length < 30) {
      console.log(`   ⚠️ 데이터 부족 (${trendsData.length}일), 건너뜀\n`);
      continue;
    }
    
    // 검색량 Map으로 변환
    const searchMap = new Map<string, number>();
    trendsData.forEach(t => searchMap.set(t.date, t.value));
    
    // ========== 비 오는 날 효과 분석 ==========
    const rainDayValues: number[] = [];
    const beforeRainValues: number[] = [];
    const afterRainValues: number[] = [];
    const noRainValues: number[] = [];
    
    trendsData.forEach(t => {
      const weather = weatherMap.get(t.date);
      if (!weather) return;
      
      if (weather.rain > 1) {
        // 비 온 날
        rainDayValues.push(t.value);
        
        // 전날 데이터
        const yesterday = addDays(t.date, -1);
        const yesterdayValue = searchMap.get(yesterday);
        if (yesterdayValue !== undefined) {
          beforeRainValues.push(yesterdayValue);
        }
        
        // 다음날 데이터
        const tomorrow = addDays(t.date, 1);
        const tomorrowValue = searchMap.get(tomorrow);
        if (tomorrowValue !== undefined) {
          afterRainValues.push(tomorrowValue);
        }
      } else {
        noRainValues.push(t.value);
      }
    });
    
    const rainDayAvg = mean(rainDayValues);
    const noRainAvg = mean(noRainValues);
    const rainDayLift = noRainAvg > 0 ? ((rainDayAvg - noRainAvg) / noRainAvg) * 100 : 0;
    
    // ========== 주말/평일 효과 ==========
    const weekdayValues: number[] = [];
    const weekendValues: number[] = [];
    const fridayValues: number[] = [];
    const mondayValues: number[] = [];
    
    trendsData.forEach(t => {
      const date = new Date(t.date);
      const day = date.getDay();
      
      if (day === 0 || day === 6) {
        weekendValues.push(t.value);
      } else {
        weekdayValues.push(t.value);
        if (day === 5) fridayValues.push(t.value);
        if (day === 1) mondayValues.push(t.value);
      }
    });
    
    const weekdayAvg = mean(weekdayValues);
    const weekendAvg = mean(weekendValues);
    const weekendLift = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;
    
    // ========== 공휴일 효과 ==========
    const holidayValues: number[] = [];
    const normalValues: number[] = [];
    
    trendsData.forEach(t => {
      if (isHoliday(t.date)) {
        holidayValues.push(t.value);
      } else {
        normalValues.push(t.value);
      }
    });
    
    const holidayAvg = mean(holidayValues);
    const normalAvg = mean(normalValues);
    const holidayLift = normalAvg > 0 ? ((holidayAvg - normalAvg) / normalAvg) * 100 : 0;
    
    // ========== 자기상관 분석 ==========
    const searchValues = trendsData.map(t => t.value);
    const lag1 = autocorrelation(searchValues, 1);
    const lag7 = autocorrelation(searchValues, 7);
    const lag30 = autocorrelation(searchValues, 30);
    
    // 결과 저장
    const result: LagAnalysisResult = {
      keyword,
      sampleSize: trendsData.length,
      rainEffect: {
        rainDayAvg,
        beforeRainAvg: mean(beforeRainValues),
        afterRainAvg: mean(afterRainValues),
        noRainAvg,
        rainDayLift,
      },
      dayEffect: {
        weekdayAvg,
        weekendAvg,
        weekendLift,
        fridayAvg: mean(fridayValues),
        mondayAvg: mean(mondayValues),
      },
      holidayEffect: {
        holidayAvg,
        normalAvg,
        holidayLift,
      },
      autocorrelations: {
        lag1,
        lag7,
        lag30,
      },
    };
    
    results.push(result);
    
    // 결과 출력
    console.log(`   📊 샘플: ${trendsData.length}일`);
    console.log(`   🌧️ 비온날 효과: ${rainDayLift > 0 ? '+' : ''}${rainDayLift.toFixed(1)}%`);
    console.log(`   📅 주말 효과: ${weekendLift > 0 ? '+' : ''}${weekendLift.toFixed(1)}%`);
    console.log(`   🎉 공휴일 효과: ${holidayLift > 0 ? '+' : ''}${holidayLift.toFixed(1)}%`);
    console.log(`   📈 자기상관: 1일=${lag1.toFixed(2)}, 7일=${lag7.toFixed(2)}, 30일=${lag30.toFixed(2)}`);
    console.log('');
  }
  
  // ========== 결과 요약 ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 분석 결과 요약');
  console.log('='.repeat(60));
  
  // 비 오는 날 효과 TOP
  console.log('\n🌧️ 비 오는 날 검색 증가 TOP 5:');
  const rainSorted = [...results].sort((a, b) => b.rainEffect.rainDayLift - a.rainEffect.rainDayLift);
  rainSorted.slice(0, 5).forEach((r, i) => {
    const sign = r.rainEffect.rainDayLift > 0 ? '+' : '';
    console.log(`   ${i + 1}. ${r.keyword}: ${sign}${r.rainEffect.rainDayLift.toFixed(1)}%`);
  });
  
  // 주말 효과 TOP
  console.log('\n📅 주말 검색 증가 TOP 5:');
  const weekendSorted = [...results].sort((a, b) => b.dayEffect.weekendLift - a.dayEffect.weekendLift);
  weekendSorted.slice(0, 5).forEach((r, i) => {
    const sign = r.dayEffect.weekendLift > 0 ? '+' : '';
    console.log(`   ${i + 1}. ${r.keyword}: ${sign}${r.dayEffect.weekendLift.toFixed(1)}%`);
  });
  
  // 공휴일 효과 TOP
  console.log('\n🎉 공휴일 검색 증가 TOP 5:');
  const holidaySorted = [...results].sort((a, b) => b.holidayEffect.holidayLift - a.holidayEffect.holidayLift);
  holidaySorted.slice(0, 5).forEach((r, i) => {
    const sign = r.holidayEffect.holidayLift > 0 ? '+' : '';
    console.log(`   ${i + 1}. ${r.keyword}: ${sign}${r.holidayEffect.holidayLift.toFixed(1)}%`);
  });
  
  // 주간 패턴이 강한 음식 (lag7 자기상관 높음)
  console.log('\n📆 주간 패턴이 강한 음식 (lag7 자기상관):');
  const weeklySorted = [...results].sort((a, b) => b.autocorrelations.lag7 - a.autocorrelations.lag7);
  weeklySorted.slice(0, 5).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword}: ${r.autocorrelations.lag7.toFixed(2)}`);
  });
  
  // Lag 효과 분석 (비 오기 전날 vs 당일 vs 다음날)
  console.log('\n🔄 Lag 효과 (비 기준):');
  results.forEach(r => {
    if (r.rainEffect.beforeRainAvg > 0) {
      const beforeVsDay = ((r.rainEffect.rainDayAvg - r.rainEffect.beforeRainAvg) / r.rainEffect.beforeRainAvg * 100).toFixed(1);
      const dayVsAfter = ((r.rainEffect.afterRainAvg - r.rainEffect.rainDayAvg) / r.rainEffect.rainDayAvg * 100).toFixed(1);
      console.log(`   ${r.keyword}: 전날→당일 ${beforeVsDay}% | 당일→다음날 ${dayVsAfter}%`);
    }
  });
  
  // 결과 저장
  const output = {
    generatedAt: new Date().toISOString(),
    period: { startDate, endDate },
    rainyDaysCount: rainyDays.length,
    totalDays: weatherData.length,
    results,
    insights: {
      topRainEffect: rainSorted.slice(0, 5).map(r => ({ keyword: r.keyword, lift: r.rainEffect.rainDayLift })),
      topWeekendEffect: weekendSorted.slice(0, 5).map(r => ({ keyword: r.keyword, lift: r.dayEffect.weekendLift })),
      topHolidayEffect: holidaySorted.slice(0, 5).map(r => ({ keyword: r.keyword, lift: r.holidayEffect.holidayLift })),
      strongWeeklyPattern: weeklySorted.slice(0, 5).map(r => ({ keyword: r.keyword, lag7: r.autocorrelations.lag7 })),
    },
  };
  
  const outputPath = path.join(__dirname, '../src/data/lag-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ 분석 결과 저장: ${outputPath}`);
}

// 실행
analyzeLagEffects().catch(console.error);
