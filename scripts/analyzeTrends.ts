/**
 * 구글 트렌드 + 날씨 상관관계 분석 스크립트
 * 
 * 사용법: npx ts-node scripts/analyzeTrends.ts
 */

const googleTrends = require('google-trends-api');

// 분석할 음식 키워드들
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
  { keyword: '삼계탕', expectedWeather: 'hot', category: '더운날' }, // 이열치열
  { keyword: '김치찌개', expectedWeather: 'cold', category: '추운날' },
  { keyword: '라면', expectedWeather: 'cold', category: '추운날' },
  { keyword: '삼겹살', expectedWeather: 'any', category: '상시인기' },
  { keyword: '치킨', expectedWeather: 'any', category: '상시인기' },
  { keyword: '피자', expectedWeather: 'any', category: '상시인기' },
];

// 월별 평균 기온 (서울 기준, 2024년 추정)
const MONTHLY_TEMP: Record<number, number> = {
  1: -2,
  2: 1,
  3: 7,
  4: 13,
  5: 18,
  6: 23,
  7: 27,
  8: 28,
  9: 23,
  10: 16,
  11: 8,
  12: 1,
};

// 월별 강수일 (서울 기준, 평균)
const MONTHLY_RAINY_DAYS: Record<number, number> = {
  1: 6,
  2: 5,
  3: 7,
  4: 9,
  5: 9,
  6: 11,
  7: 16, // 장마
  8: 14,
  9: 10,
  10: 6,
  11: 8,
  12: 7,
};

interface TrendData {
  keyword: string;
  monthlyValues: { month: number; value: number }[];
  correlation: {
    withTemp: number;
    withRain: number;
  };
}

// 상관계수 계산 (피어슨)
function calculateCorrelation(x: number[], y: number[]): number {
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

async function getTrendData(keyword: string): Promise<number[]> {
  try {
    const result = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-12-31'),
      geo: 'KR',
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
  } catch (error) {
    console.error(`Error fetching trend for ${keyword}:`, error);
    return Array(12).fill(50); // 기본값
  }
}

async function analyzeAllTrends(): Promise<TrendData[]> {
  const results: TrendData[] = [];
  const temps = Object.values(MONTHLY_TEMP);
  const rainDays = Object.values(MONTHLY_RAINY_DAYS);

  console.log('\n🔍 구글 트렌드 데이터 수집 중...\n');

  for (const food of FOOD_KEYWORDS) {
    console.log(`  📊 "${food.keyword}" 분석 중...`);
    
    const monthlyValues = await getTrendData(food.keyword);
    
    const trendData: TrendData = {
      keyword: food.keyword,
      monthlyValues: monthlyValues.map((value, i) => ({ month: i + 1, value })),
      correlation: {
        withTemp: calculateCorrelation(monthlyValues, temps),
        withRain: calculateCorrelation(monthlyValues, rainDays),
      },
    };

    results.push(trendData);

    // API 속도 제한 방지
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

function generateReport(data: TrendData[]): string {
  let report = `
╔════════════════════════════════════════════════════════════╗
║           🔬 날씨-음식 상관관계 분석 리포트                    ║
║                  (2024년 구글 트렌드 기반)                     ║
╚════════════════════════════════════════════════════════════╝

📊 상관계수 해석:
   +0.7 ~ +1.0  : 강한 양의 상관관계 (함께 증가)
   +0.3 ~ +0.7  : 중간 양의 상관관계
   -0.3 ~ +0.3  : 약한/없음
   -0.7 ~ -0.3  : 중간 음의 상관관계
   -1.0 ~ -0.7  : 강한 음의 상관관계 (반대로 움직임)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌡️ 기온과의 상관관계 (더우면 ↑ or 추우면 ↑)
`;

  const byTemp = [...data].sort((a, b) => b.correlation.withTemp - a.correlation.withTemp);
  
  report += '\n  [더울수록 검색 증가 🔥]\n';
  byTemp.filter(d => d.correlation.withTemp > 0.3).forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlation.withTemp) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlation.withTemp.toFixed(2)}\n`;
  });

  report += '\n  [추울수록 검색 증가 ❄️]\n';
  byTemp.filter(d => d.correlation.withTemp < -0.3).reverse().forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlation.withTemp) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlation.withTemp.toFixed(2)}\n`;
  });

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌧️ 강수량과의 상관관계 (비 오면 ↑)
`;

  const byRain = [...data].sort((a, b) => b.correlation.withRain - a.correlation.withRain);
  
  report += '\n  [비 올수록 검색 증가 🌧️]\n';
  byRain.filter(d => d.correlation.withRain > 0.3).forEach(d => {
    const bar = '█'.repeat(Math.round(Math.abs(d.correlation.withRain) * 10));
    report += `  ${d.keyword.padEnd(15)} ${bar} ${d.correlation.withRain.toFixed(2)}\n`;
  });

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 월별 검색량 TOP 5

`;

  // 각 월별 1위 음식
  for (let month = 1; month <= 12; month++) {
    const monthData = data.map(d => ({
      keyword: d.keyword,
      value: d.monthlyValues.find(m => m.month === month)?.value || 0,
    })).sort((a, b) => b.value - a.value);

    const top = monthData[0];
    const monthNames = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const temp = MONTHLY_TEMP[month];
    const tempEmoji = temp > 20 ? '🔥' : temp < 5 ? '❄️' : '🌤️';
    
    report += `  ${monthNames[month]} (${temp}°C ${tempEmoji}): ${top.keyword} (${top.value})\n`;
  }

  report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 추천 알고리즘 적용 제안

`;

  // 알고리즘 제안
  data.forEach(d => {
    if (d.correlation.withTemp > 0.5) {
      report += `  ✅ "${d.keyword}": 더운 날(25°C+) 가중치 +${Math.round(d.correlation.withTemp * 30)}%\n`;
    } else if (d.correlation.withTemp < -0.5) {
      report += `  ✅ "${d.keyword}": 추운 날(5°C-) 가중치 +${Math.round(Math.abs(d.correlation.withTemp) * 30)}%\n`;
    }
    if (d.correlation.withRain > 0.5) {
      report += `  ✅ "${d.keyword}": 비 오는 날 가중치 +${Math.round(d.correlation.withRain * 30)}%\n`;
    }
  });

  return report;
}

// JSON 형태로 저장 (웹페이지에서 사용)
function saveAsJson(data: TrendData[]): void {
  const fs = require('fs');
  const output = {
    generatedAt: new Date().toISOString(),
    monthlyTemp: MONTHLY_TEMP,
    monthlyRainyDays: MONTHLY_RAINY_DAYS,
    trends: data.map(d => ({
      keyword: d.keyword,
      monthlyValues: d.monthlyValues,
      correlationWithTemp: Math.round(d.correlation.withTemp * 100) / 100,
      correlationWithRain: Math.round(d.correlation.withRain * 100) / 100,
    })),
  };

  fs.writeFileSync('src/data/trend-analysis.json', JSON.stringify(output, null, 2));
  console.log('\n✅ src/data/trend-analysis.json 저장 완료!');
}

// 메인 실행
async function main() {
  console.log('\n🚀 날씨-음식 상관관계 분석 시작!\n');
  
  try {
    const data = await analyzeAllTrends();
    const report = generateReport(data);
    
    console.log(report);
    
    saveAsJson(data);
    
    console.log('\n✨ 분석 완료! src/data/trend-analysis.json 파일을 확인하세요.\n');
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
  }
}

main();
