/**
 * 지역별 날씨-음식 상관관계 분석 스크립트
 * 
 * 각 지역의 날씨와 음식 검색량 상관관계 분석
 * 
 * 사용법: npx ts-node scripts/analyzeByRegion.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');

// ========================================
// 🗺️ 지역 설정
// ========================================
const REGIONS = [
  { code: 'KR-11', name: '서울', lat: 37.5665, lng: 126.9780 },
  { code: 'KR-26', name: '부산', lat: 35.1796, lng: 129.0756 },
  { code: 'KR-27', name: '대구', lat: 35.8714, lng: 128.6014 },
  { code: 'KR-28', name: '인천', lat: 37.4563, lng: 126.7052 },
  { code: 'KR-29', name: '광주', lat: 35.1595, lng: 126.8526 },
  { code: 'KR-30', name: '대전', lat: 36.3504, lng: 127.3845 },
  { code: 'KR-31', name: '울산', lat: 35.5384, lng: 129.3114 },
  { code: 'KR-41', name: '경기', lat: 37.4138, lng: 127.5183 },  // 수원 기준
  { code: 'KR-49', name: '제주', lat: 33.4996, lng: 126.5312 },
];

// ========================================
// 🍜 분석할 음식 키워드 (간소화)
// ========================================
const FOOD_KEYWORDS = [
  // 시원한 음식
  '냉면', '빙수', '콩국수', '아이스아메리카노',
  // 따뜻한 음식
  '김치찌개', '설렁탕', '칼국수', '라면',
  // 비 오는 날
  '파전', '막걸리',
  // 지역 특색 (비교용)
  '밀면', '국밥', '막창', '치킨',
];

// ========================================
// 📅 월별 기상 데이터 (지역별)
// ========================================
const REGIONAL_WEATHER: Record<string, Record<number, { temp: number; rain: number }>> = {
  '서울': {
    1: { temp: -2, rain: 20 }, 2: { temp: 1, rain: 25 }, 3: { temp: 7, rain: 45 },
    4: { temp: 13, rain: 65 }, 5: { temp: 18, rain: 90 }, 6: { temp: 23, rain: 130 },
    7: { temp: 27, rain: 350 }, 8: { temp: 28, rain: 290 }, 9: { temp: 23, rain: 140 },
    10: { temp: 16, rain: 50 }, 11: { temp: 8, rain: 50 }, 12: { temp: 1, rain: 25 },
  },
  '부산': {
    1: { temp: 3, rain: 35 }, 2: { temp: 5, rain: 45 }, 3: { temp: 9, rain: 80 },
    4: { temp: 14, rain: 130 }, 5: { temp: 18, rain: 150 }, 6: { temp: 21, rain: 200 },
    7: { temp: 25, rain: 280 }, 8: { temp: 27, rain: 200 }, 9: { temp: 23, rain: 150 },
    10: { temp: 18, rain: 60 }, 11: { temp: 12, rain: 55 }, 12: { temp: 6, rain: 30 },
  },
  '대구': {
    1: { temp: 0, rain: 20 }, 2: { temp: 3, rain: 30 }, 3: { temp: 9, rain: 50 },
    4: { temp: 15, rain: 70 }, 5: { temp: 20, rain: 85 }, 6: { temp: 24, rain: 150 },
    7: { temp: 27, rain: 250 }, 8: { temp: 28, rain: 220 }, 9: { temp: 23, rain: 120 },
    10: { temp: 16, rain: 40 }, 11: { temp: 9, rain: 35 }, 12: { temp: 2, rain: 20 },
  },
  '인천': {
    1: { temp: -2, rain: 20 }, 2: { temp: 0, rain: 25 }, 3: { temp: 6, rain: 40 },
    4: { temp: 12, rain: 60 }, 5: { temp: 17, rain: 85 }, 6: { temp: 22, rain: 120 },
    7: { temp: 26, rain: 320 }, 8: { temp: 27, rain: 280 }, 9: { temp: 22, rain: 130 },
    10: { temp: 15, rain: 50 }, 11: { temp: 7, rain: 50 }, 12: { temp: 0, rain: 25 },
  },
  '광주': {
    1: { temp: 1, rain: 35 }, 2: { temp: 4, rain: 50 }, 3: { temp: 9, rain: 70 },
    4: { temp: 14, rain: 95 }, 5: { temp: 19, rain: 110 }, 6: { temp: 23, rain: 200 },
    7: { temp: 26, rain: 300 }, 8: { temp: 27, rain: 260 }, 9: { temp: 23, rain: 130 },
    10: { temp: 16, rain: 50 }, 11: { temp: 9, rain: 55 }, 12: { temp: 3, rain: 35 },
  },
  '대전': {
    1: { temp: -1, rain: 25 }, 2: { temp: 2, rain: 30 }, 3: { temp: 8, rain: 55 },
    4: { temp: 14, rain: 80 }, 5: { temp: 19, rain: 100 }, 6: { temp: 23, rain: 180 },
    7: { temp: 26, rain: 320 }, 8: { temp: 27, rain: 280 }, 9: { temp: 22, rain: 140 },
    10: { temp: 15, rain: 50 }, 11: { temp: 8, rain: 45 }, 12: { temp: 1, rain: 30 },
  },
  '울산': {
    1: { temp: 2, rain: 30 }, 2: { temp: 4, rain: 40 }, 3: { temp: 9, rain: 70 },
    4: { temp: 14, rain: 100 }, 5: { temp: 18, rain: 120 }, 6: { temp: 21, rain: 180 },
    7: { temp: 25, rain: 250 }, 8: { temp: 27, rain: 200 }, 9: { temp: 23, rain: 140 },
    10: { temp: 17, rain: 50 }, 11: { temp: 11, rain: 45 }, 12: { temp: 5, rain: 25 },
  },
  '경기': {
    1: { temp: -3, rain: 20 }, 2: { temp: 0, rain: 25 }, 3: { temp: 6, rain: 45 },
    4: { temp: 13, rain: 65 }, 5: { temp: 18, rain: 90 }, 6: { temp: 23, rain: 135 },
    7: { temp: 26, rain: 340 }, 8: { temp: 27, rain: 300 }, 9: { temp: 22, rain: 145 },
    10: { temp: 15, rain: 50 }, 11: { temp: 7, rain: 50 }, 12: { temp: 0, rain: 25 },
  },
  '제주': {
    1: { temp: 6, rain: 70 }, 2: { temp: 7, rain: 65 }, 3: { temp: 10, rain: 95 },
    4: { temp: 14, rain: 90 }, 5: { temp: 18, rain: 95 }, 6: { temp: 22, rain: 180 },
    7: { temp: 27, rain: 210 }, 8: { temp: 28, rain: 260 }, 9: { temp: 24, rain: 180 },
    10: { temp: 19, rain: 85 }, 11: { temp: 13, rain: 80 }, 12: { temp: 8, rain: 55 },
  },
};

// ========================================
// 🧮 피어슨 상관계수
// ========================================
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// ========================================
// 📊 구글 트렌드 데이터 가져오기
// ========================================
async function getTrendData(keyword: string, regionCode: string): Promise<number[]> {
  try {
    const result = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-12-31'),
      geo: regionCode,
    });

    const data = JSON.parse(result);
    const timelineData = data.default?.timelineData || [];

    // 월별로 집계
    const monthlyData: Record<number, number[]> = {};
    
    timelineData.forEach((item: any) => {
      const date = new Date(item.time * 1000);
      const month = date.getMonth() + 1;
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(item.value[0]);
    });

    // 월별 평균
    const monthlyAvg: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const values = monthlyData[m] || [0];
      monthlyAvg.push(Math.round(values.reduce((a, b) => a + b, 0) / values.length));
    }

    return monthlyAvg;
  } catch (error: any) {
    if (error.message?.includes('302') || error.requestBody?.includes('sorry')) {
      console.log(`  ⚠️ Rate limit - 잠시 대기...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return Array(12).fill(50);
    }
    console.error(`  ❌ Error:`, error.message?.slice(0, 50));
    return Array(12).fill(50);
  }
}

// ========================================
// 🚀 메인 분석 함수
// ========================================
async function analyzeByRegion() {
  console.log('\n🗺️ 지역별 날씨-음식 상관관계 분석 시작!\n');
  
  const results: Record<string, any> = {
    generatedAt: new Date().toISOString(),
    regions: {},
  };

  for (const region of REGIONS) {
    console.log(`\n━━━ ${region.name} 분석 중... ━━━`);
    
    const weather = REGIONAL_WEATHER[region.name];
    const temps = Object.values(weather).map(w => w.temp);
    const rains = Object.values(weather).map(w => w.rain);
    
    const regionResults: any[] = [];

    for (const keyword of FOOD_KEYWORDS) {
      process.stdout.write(`  ${keyword.padEnd(15)}`);
      
      const monthlyValues = await getTrendData(keyword, region.code);
      
      const tempCorr = pearsonCorrelation(monthlyValues, temps);
      const rainCorr = pearsonCorrelation(monthlyValues, rains);
      
      regionResults.push({
        keyword,
        monthlyValues: monthlyValues.map((v, i) => ({ month: i + 1, value: v })),
        correlationWithTemp: Math.round(tempCorr * 100) / 100,
        correlationWithRain: Math.round(rainCorr * 100) / 100,
      });

      const tempIcon = tempCorr > 0.3 ? '🔥' : tempCorr < -0.3 ? '❄️' : '🌤️';
      console.log(`${tempIcon} 기온:${tempCorr.toFixed(2).padStart(6)}`);
      
      // API 속도 제한
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results.regions[region.name] = {
      code: region.code,
      lat: region.lat,
      lng: region.lng,
      weather: weather,
      trends: regionResults,
      summary: {
        hotWeatherFoods: regionResults.filter(r => r.correlationWithTemp > 0.5).map(r => r.keyword),
        coldWeatherFoods: regionResults.filter(r => r.correlationWithTemp < -0.3).map(r => r.keyword),
        rainyDayFoods: regionResults.filter(r => r.correlationWithRain > 0.3).map(r => r.keyword),
      },
    };
  }

  // 지역 간 비교 분석
  console.log('\n\n📊 지역 간 비교 분석...');
  
  const comparison: Record<string, any> = {};
  
  for (const keyword of FOOD_KEYWORDS) {
    comparison[keyword] = {};
    
    for (const region of REGIONS) {
      const regionData = results.regions[region.name];
      const foodData = regionData.trends.find((t: any) => t.keyword === keyword);
      
      if (foodData) {
        const avgSearchVolume = foodData.monthlyValues.reduce((sum: number, v: any) => sum + v.value, 0) / 12;
        comparison[keyword][region.name] = {
          avgSearchVolume: Math.round(avgSearchVolume),
          tempCorrelation: foodData.correlationWithTemp,
        };
      }
    }
  }
  
  results.comparison = comparison;

  // 저장
  fs.writeFileSync('src/data/regional-analysis.json', JSON.stringify(results, null, 2));
  
  // 리포트 출력
  printReport(results);
  
  console.log('\n✅ src/data/regional-analysis.json 저장 완료!');
}

function printReport(results: any) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🗺️ 지역별 분석 결과 리포트                             ║
╚════════════════════════════════════════════════════════════════╝
`);

  // 지역별 요약
  for (const [regionName, data] of Object.entries(results.regions) as [string, any][]) {
    console.log(`\n━━━ ${regionName} ━━━`);
    console.log(`  🔥 더운 날 인기: ${data.summary.hotWeatherFoods.join(', ') || '없음'}`);
    console.log(`  ❄️ 추운 날 인기: ${data.summary.coldWeatherFoods.join(', ') || '없음'}`);
  }

  // 지역 간 비교 (냉면 예시)
  console.log(`\n\n🆚 지역 간 비교 - "냉면" 인기도`);
  const naengmyeon = results.comparison['냉면'];
  if (naengmyeon) {
    const sorted = Object.entries(naengmyeon)
      .sort((a: any, b: any) => b[1].avgSearchVolume - a[1].avgSearchVolume);
    
    sorted.forEach(([region, data]: any, i) => {
      console.log(`  ${i + 1}. ${region}: 평균 ${data.avgSearchVolume} (기온상관: ${data.tempCorrelation})`);
    });
  }
}

// 실행
analyzeByRegion().catch(console.error);
