/**
 * 일별 날씨-음식 트렌드 분석 (개선 버전)
 * 
 * 핵심 개선:
 * - 3개월씩 나눠서 요청 → 일별 데이터 366일 확보
 * - 실제 날씨 데이터와 일별 매칭
 * - 정확한 상관관계 분석
 * 
 * 사용법: npx ts-node scripts/analyzeTrendsDaily.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// ========================================
// 🍜 분석할 음식 키워드 (확장)
// ========================================
const FOOD_KEYWORDS = [
  // 날씨 영향 받는 음식들
  { keyword: '파전', expectedWeather: 'rainy', category: '비오는날' },
  { keyword: '막걸리', expectedWeather: 'rainy', category: '비오는날' },
  { keyword: '칼국수', expectedWeather: 'rainy', category: '비오는날' },
  { keyword: '냉면', expectedWeather: 'hot', category: '더운날' },
  { keyword: '빙수', expectedWeather: 'hot', category: '더운날' },
  { keyword: '콩국수', expectedWeather: 'hot', category: '더운날' },
  { keyword: '아이스아메리카노', expectedWeather: 'hot', category: '더운날' },
  { keyword: '국밥', expectedWeather: 'cold', category: '추운날' },
  { keyword: '설렁탕', expectedWeather: 'cold', category: '추운날' },
  { keyword: '삼계탕', expectedWeather: 'hot', category: '더운날' },
  { keyword: '김치찌개', expectedWeather: 'cold', category: '추운날' },
  { keyword: '라면', expectedWeather: 'cold', category: '추운날' },
  { keyword: '삼겹살', expectedWeather: 'any', category: '상시인기' },
  { keyword: '치킨', expectedWeather: 'any', category: '상시인기' },
  { keyword: '피자', expectedWeather: 'any', category: '상시인기' },
  { keyword: '떡볶이', expectedWeather: 'any', category: '상시인기' },
  { keyword: '짬뽕', expectedWeather: 'any', category: '상시인기' },
];

// ========================================
// 📅 날짜 유틸리티
// ========================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 📊 Google Trends 일별 데이터 가져오기
// ========================================
async function getDailyTrendsForYear(keyword: string, year: number): Promise<Map<string, number>> {
  console.log(`  🔍 "${keyword}" 데이터 수집 중...`);
  
  const dailyData = new Map<string, number>();
  
  // 3개월씩 4번 요청
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
      
      await delay(2000);
    } catch (error) {
      console.error(`  ❌ ${quarter.start}~${quarter.end} 오류`);
    }
  }
  
  console.log(`  ✅ ${dailyData.size}일 데이터 수집 완료`);
  return dailyData;
}

// ========================================
// 🌧️ 날씨 데이터 가져오기
// ========================================
async function getHistoricalWeather(year: number): Promise<Map<string, { rain: number; temp: number; humidity: number }>> {
  console.log(`\n🌤️ ${year}년 날씨 데이터 가져오는 중...`);
  
  const weatherMap = new Map();
  
  try {
    const lat = 37.5665;
    const lng = 126.978;
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&longitude=${lng}&` +
      `start_date=${year}-01-01&end_date=${year}-12-31&` +
      `daily=precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean&` +
      `timezone=Asia/Seoul`
    );
    
    const data = await response.json();
    
    if (data.daily) {
      data.daily.time.forEach((date: string, i: number) => {
        weatherMap.set(date, {
          rain: data.daily.precipitation_sum[i] || 0,
          temp: data.daily.temperature_2m_mean[i] || 15,
          humidity: data.daily.relative_humidity_2m_mean?.[i] || 60,
        });
      });
    }
  } catch (error) {
    console.error('❌ 날씨 데이터 오류:', error);
  }
  
  console.log(`✅ ${weatherMap.size}일 날씨 데이터 수집 완료\n`);
  return weatherMap;
}

// ========================================
// 🧮 상관계수 계산
// ========================================
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

// ========================================
// 📊 메인 분석
// ========================================
interface DailyTrendData {
  keyword: string;
  category: string;
  expectedWeather: string;
  totalDays: number;
  correlations: {
    withTemp: number;
    withRain: number;
    withHumidity: number;
  };
  dailyValues: { date: string; value: number; temp: number; rain: number; humidity: number }[];
}

async function analyzeAllTrends(): Promise<DailyTrendData[]> {
  const year = 2024;
  const results: DailyTrendData[] = [];
  
  console.log('\n🔍 일별 날씨-음식 트렌드 분석 시작!\n');
  console.log('='.repeat(60));
  
  // 날씨 데이터 수집
  const weatherData = await getHistoricalWeather(year);
  
  // 각 음식별 분석
  for (const food of FOOD_KEYWORDS) {
    console.log(`\n━━━ ${food.keyword} (${food.category}) ━━━`);
    
    const searchData = await getDailyTrendsForYear(food.keyword, year);
    
    if (searchData.size < 100) {
      console.log(`  ⚠️ 데이터 부족 (${searchData.size}일), 건너뜀\n`);
      continue;
    }
    
    // 날씨와 검색량 매칭
    const temps: number[] = [];
    const rains: number[] = [];
    const humidities: number[] = [];
    const searchValues: number[] = [];
    const dailyValues: any[] = [];
    
    const searchEntries = Array.from(searchData.entries());
    for (const [date, value] of searchEntries) {
      const weather = weatherData.get(date);
      if (!weather) continue;
      
      temps.push(weather.temp);
      rains.push(weather.rain);
      humidities.push(weather.humidity);
      searchValues.push(value);
      
      dailyValues.push({
        date,
        value,
        temp: weather.temp,
        rain: weather.rain,
        humidity: weather.humidity,
      });
    }
    
    // 상관계수 계산
    const correlations = {
      withTemp: pearsonCorrelation(searchValues, temps),
      withRain: pearsonCorrelation(searchValues, rains),
      withHumidity: pearsonCorrelation(searchValues, humidities),
    };
    
    results.push({
      keyword: food.keyword,
      category: food.category,
      expectedWeather: food.expectedWeather,
      totalDays: searchData.size,
      correlations,
      dailyValues: dailyValues.slice(0, 30), // 처음 30일만 저장 (용량 절약)
    });
    
    // 결과 출력
    console.log(`  📊 ${searchData.size}일 데이터`);
    console.log(`  🌡️ 기온 상관: ${correlations.withTemp > 0 ? '+' : ''}${correlations.withTemp.toFixed(3)}`);
    console.log(`  🌧️ 강수 상관: ${correlations.withRain > 0 ? '+' : ''}${correlations.withRain.toFixed(3)}`);
    console.log(`  💧 습도 상관: ${correlations.withHumidity > 0 ? '+' : ''}${correlations.withHumidity.toFixed(3)}`);
    
    await delay(1000);
  }
  
  return results;
}

// ========================================
// 📝 리포트 생성
// ========================================
function generateReport(data: DailyTrendData[]): string {
  let report = `
╔════════════════════════════════════════════════════════════╗
║         🔬 일별 날씨-음식 상관관계 분석 리포트                ║
║                 (2024년 일별 데이터 기반)                    ║
╚════════════════════════════════════════════════════════════╝

📊 상관계수 해석:
   +0.7 ~ +1.0  : 강한 양의 상관관계
   +0.3 ~ +0.7  : 중간 양의 상관관계
   -0.3 ~ +0.3  : 약한/없음
   -0.7 ~ -0.3  : 중간 음의 상관관계
   -1.0 ~ -0.7  : 강한 음의 상관관계

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌡️ 기온과의 상관관계

`;

  const byTemp = [...data].sort((a, b) => b.correlations.withTemp - a.correlations.withTemp);
  
  report += '\n  [더울수록 검색 증가 🔥]\n';
  byTemp.filter(d => d.correlations.withTemp > 0.3).forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlations.withTemp) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlations.withTemp.toFixed(3)}\n`;
  });

  report += '\n  [추울수록 검색 증가 ❄️]\n';
  byTemp.filter(d => d.correlations.withTemp < -0.3).reverse().forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlations.withTemp) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlations.withTemp.toFixed(3)}\n`;
  });

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌧️ 강수량과의 상관관계

`;

  const byRain = [...data].sort((a, b) => b.correlations.withRain - a.correlations.withRain);
  
  report += '\n  [비 올수록 검색 증가 🌧️]\n';
  byRain.filter(d => d.correlations.withRain > 0.1).forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlations.withRain) * 20));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlations.withRain.toFixed(3)}\n`;
  });

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 습도와의 상관관계

`;

  const byHumidity = [...data].sort((a, b) => b.correlations.withHumidity - a.correlations.withHumidity);
  
  report += '\n  [습할수록 검색 증가 💧]\n';
  byHumidity.filter(d => d.correlations.withHumidity > 0.3).forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlations.withHumidity) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlations.withHumidity.toFixed(3)}\n`;
  });

  return report;
}

// ========================================
// 💾 결과 저장
// ========================================
function saveResults(data: DailyTrendData[]): void {
  const output = {
    generatedAt: new Date().toISOString(),
    analysisType: 'daily',
    year: 2024,
    totalDays: 366,
    trends: data.map(d => ({
      keyword: d.keyword,
      category: d.category,
      expectedWeather: d.expectedWeather,
      totalDays: d.totalDays,
      correlations: {
        temp: Math.round(d.correlations.withTemp * 1000) / 1000,
        rain: Math.round(d.correlations.withRain * 1000) / 1000,
        humidity: Math.round(d.correlations.withHumidity * 1000) / 1000,
      },
      sampleDailyValues: d.dailyValues,
    })),
    summary: {
      hotWeatherFoods: data.filter(d => d.correlations.withTemp > 0.5).map(d => d.keyword),
      coldWeatherFoods: data.filter(d => d.correlations.withTemp < -0.3).map(d => d.keyword),
      rainyDayFoods: data.filter(d => d.correlations.withRain > 0.1).map(d => d.keyword),
      humidDayFoods: data.filter(d => d.correlations.withHumidity > 0.5).map(d => d.keyword),
    },
  };

  const outputPath = path.join(__dirname, '../src/data/trend-analysis-daily.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ 결과 저장: ${outputPath}`);
}

// ========================================
// 🚀 실행
// ========================================
async function main() {
  try {
    const data = await analyzeAllTrends();
    const report = generateReport(data);
    
    console.log('\n' + '='.repeat(60));
    console.log(report);
    
    saveResults(data);
    
    console.log('\n✨ 분석 완료!\n');
  } catch (error) {
    console.error('❌ 분석 중 오류:', error);
  }
}

main();
