/**
 * 다변량 날씨-음식 상관관계 분석 스크립트
 * 
 * 여러 변수를 동시에 고려한 분석:
 * - 기온, 강수량, 습도, 요일 등
 * 
 * 사용법: npx ts-node scripts/analyzeMultivariate.ts
 */

const googleTrends = require('google-trends-api');

// ========================================
// 📊 표본 컷 설정
// ========================================
const MIN_SAMPLE_SIZE = 50;  // 최소 표본 수 (이하면 결과에서 제외)
const MIN_SEARCH_VOLUME = 10; // 최소 평균 검색량 (이하면 신뢰도 낮음)

// ========================================
// 🗺️ 지역별 분석 설정
// ========================================
const REGIONS = [
  { code: 'KR', name: '전국', city: '서울' },
  // 추가 가능: 부산, 대구, 광주, 대전 등
];

// ========================================
// 📊 확장된 음식 키워드 (100개+)
// ========================================
const FOOD_KEYWORDS = [
  // 🍜 국물/따뜻한 음식 (추운 날)
  { keyword: '김치찌개', category: '국물', season: 'winter' },
  { keyword: '된장찌개', category: '국물', season: 'winter' },
  { keyword: '부대찌개', category: '국물', season: 'winter' },
  { keyword: '순두부찌개', category: '국물', season: 'winter' },
  { keyword: '설렁탕', category: '국물', season: 'winter' },
  { keyword: '갈비탕', category: '국물', season: 'winter' },
  { keyword: '육개장', category: '국물', season: 'winter' },
  { keyword: '감자탕', category: '국물', season: 'winter' },
  { keyword: '칼국수', category: '국물', season: 'winter' },
  { keyword: '수제비', category: '국물', season: 'winter' },
  { keyword: '라면', category: '국물', season: 'winter' },
  { keyword: '우동', category: '국물', season: 'winter' },
  { keyword: '국밥', category: '국물', season: 'winter' },
  { keyword: '해장국', category: '국물', season: 'winter' },
  { keyword: '곰탕', category: '국물', season: 'winter' },
  
  // 🍧 시원한 음식 (더운 날)
  { keyword: '냉면', category: '시원한음식', season: 'summer' },
  { keyword: '막국수', category: '시원한음식', season: 'summer' },
  { keyword: '콩국수', category: '시원한음식', season: 'summer' },
  { keyword: '밀면', category: '시원한음식', season: 'summer' },
  { keyword: '냉모밀', category: '시원한음식', season: 'summer' },
  { keyword: '빙수', category: '시원한음식', season: 'summer' },
  { keyword: '아이스아메리카노', category: '시원한음식', season: 'summer' },
  { keyword: '아이스크림', category: '시원한음식', season: 'summer' },
  { keyword: '수박', category: '시원한음식', season: 'summer' },
  { keyword: '팥빙수', category: '시원한음식', season: 'summer' },
  
  // 🌧️ 비 오는 날
  { keyword: '파전', category: '비오는날', season: 'rainy' },
  { keyword: '막걸리', category: '비오는날', season: 'rainy' },
  { keyword: '부침개', category: '비오는날', season: 'rainy' },
  { keyword: '전', category: '비오는날', season: 'rainy' },
  
  // 🔥 이열치열
  { keyword: '삼계탕', category: '이열치열', season: 'summer' },
  { keyword: '보양식', category: '이열치열', season: 'summer' },
  { keyword: '추어탕', category: '이열치열', season: 'fall' },
  
  // 🍖 고기류 (상시)
  { keyword: '삼겹살', category: '고기', season: 'all' },
  { keyword: '갈비', category: '고기', season: 'all' },
  { keyword: '소고기', category: '고기', season: 'all' },
  { keyword: '치킨', category: '고기', season: 'all' },
  { keyword: '족발', category: '고기', season: 'all' },
  { keyword: '보쌈', category: '고기', season: 'all' },
  { keyword: '곱창', category: '고기', season: 'all' },
  { keyword: '닭발', category: '고기', season: 'all' },
  
  // 🍕 양식/분식
  { keyword: '피자', category: '양식', season: 'all' },
  { keyword: '파스타', category: '양식', season: 'all' },
  { keyword: '햄버거', category: '양식', season: 'all' },
  { keyword: '떡볶이', category: '분식', season: 'all' },
  { keyword: '순대', category: '분식', season: 'winter' },
  { keyword: '김밥', category: '분식', season: 'all' },
  
  // 🍣 일식/중식
  { keyword: '초밥', category: '일식', season: 'all' },
  { keyword: '돈카츠', category: '일식', season: 'all' },
  { keyword: '짜장면', category: '중식', season: 'all' },
  { keyword: '짬뽕', category: '중식', season: 'winter' },
  { keyword: '탕수육', category: '중식', season: 'all' },
  
  // ☕ 카페
  { keyword: '아메리카노', category: '카페', season: 'all' },
  { keyword: '라떼', category: '카페', season: 'all' },
  { keyword: '케이크', category: '카페', season: 'all' },
  { keyword: '마카롱', category: '카페', season: 'all' },
  { keyword: '크로플', category: '카페', season: 'all' },
  { keyword: '스무디', category: '카페', season: 'summer' },
  { keyword: '프라푸치노', category: '카페', season: 'summer' },
  
  // 🍜 추가 국물/면류
  { keyword: '뼈해장국', category: '국물', season: 'winter' },
  { keyword: '선지해장국', category: '국물', season: 'winter' },
  { keyword: '순대국', category: '국물', season: 'winter' },
  { keyword: '돼지국밥', category: '국물', season: 'winter' },
  { keyword: '소머리국밥', category: '국물', season: 'winter' },
  { keyword: '뚝배기불고기', category: '국물', season: 'winter' },
  { keyword: '샤브샤브', category: '국물', season: 'winter' },
  { keyword: '전골', category: '국물', season: 'winter' },
  { keyword: '매운탕', category: '국물', season: 'winter' },
  { keyword: '알탕', category: '국물', season: 'winter' },
  
  // 🍧 추가 시원한 음식
  { keyword: '화채', category: '시원한음식', season: 'summer' },
  { keyword: '과일빙수', category: '시원한음식', season: 'summer' },
  { keyword: '망고빙수', category: '시원한음식', season: 'summer' },
  { keyword: '냉우동', category: '시원한음식', season: 'summer' },
  { keyword: '냉소바', category: '시원한음식', season: 'summer' },
  { keyword: '비빔냉면', category: '시원한음식', season: 'summer' },
  { keyword: '물냉면', category: '시원한음식', season: 'summer' },
  
  // 🍖 추가 고기류
  { keyword: '양고기', category: '고기', season: 'all' },
  { keyword: '양갈비', category: '고기', season: 'all' },
  { keyword: '오리고기', category: '고기', season: 'all' },
  { keyword: '닭갈비', category: '고기', season: 'all' },
  { keyword: '불닭', category: '고기', season: 'all' },
  { keyword: '훈제오리', category: '고기', season: 'all' },
  { keyword: '생갈비', category: '고기', season: 'all' },
  { keyword: '등심', category: '고기', season: 'all' },
  { keyword: '차돌박이', category: '고기', season: 'all' },
  { keyword: '양념갈비', category: '고기', season: 'all' },
  
  // 🍕 추가 양식
  { keyword: '스테이크', category: '양식', season: 'all' },
  { keyword: '리조또', category: '양식', season: 'all' },
  { keyword: '오믈렛', category: '양식', season: 'all' },
  { keyword: '브런치', category: '양식', season: 'all' },
  { keyword: '샐러드', category: '양식', season: 'summer' },
  { keyword: '수프', category: '양식', season: 'winter' },
  { keyword: '그라탕', category: '양식', season: 'winter' },
  
  // 🍣 추가 일식
  { keyword: '라멘', category: '일식', season: 'winter' },
  { keyword: '규동', category: '일식', season: 'all' },
  { keyword: '우동', category: '일식', season: 'winter' },
  { keyword: '텐동', category: '일식', season: 'all' },
  { keyword: '가츠동', category: '일식', season: 'all' },
  { keyword: '오코노미야끼', category: '일식', season: 'all' },
  { keyword: '타코야끼', category: '일식', season: 'all' },
  { keyword: '사시미', category: '일식', season: 'summer' },
  
  // 🥡 추가 중식
  { keyword: '마라탕', category: '중식', season: 'all' },
  { keyword: '마라샹궈', category: '중식', season: 'all' },
  { keyword: '양꼬치', category: '중식', season: 'all' },
  { keyword: '깐풍기', category: '중식', season: 'all' },
  { keyword: '유린기', category: '중식', season: 'all' },
  { keyword: '꿔바로우', category: '중식', season: 'all' },
  { keyword: '볶음밥', category: '중식', season: 'all' },
  
  // 🌏 아시안
  { keyword: '쌀국수', category: '아시안', season: 'all' },
  { keyword: '팟타이', category: '아시안', season: 'all' },
  { keyword: '분짜', category: '아시안', season: 'all' },
  { keyword: '반미', category: '아시안', season: 'all' },
  { keyword: '똠양꿍', category: '아시안', season: 'all' },
  { keyword: '카레', category: '아시안', season: 'all' },
  { keyword: '나시고렝', category: '아시안', season: 'all' },
  
  // 🍚 밥류
  { keyword: '비빔밥', category: '한식', season: 'all' },
  { keyword: '돌솥비빔밥', category: '한식', season: 'winter' },
  { keyword: '제육볶음', category: '한식', season: 'all' },
  { keyword: '불고기', category: '한식', season: 'all' },
  { keyword: '갈비찜', category: '한식', season: 'winter' },
  { keyword: '찜닭', category: '한식', season: 'all' },
  { keyword: '닭도리탕', category: '한식', season: 'all' },
  { keyword: '백반', category: '한식', season: 'all' },
  
  // 🍜 분식 추가
  { keyword: '라볶이', category: '분식', season: 'all' },
  { keyword: '쫄면', category: '분식', season: 'summer' },
  { keyword: '비빔국수', category: '분식', season: 'summer' },
  { keyword: '잔치국수', category: '분식', season: 'all' },
  { keyword: '튀김', category: '분식', season: 'all' },
  { keyword: '오뎅', category: '분식', season: 'winter' },
  { keyword: '호떡', category: '분식', season: 'winter' },
  { keyword: '붕어빵', category: '분식', season: 'winter' },
  
  // 🦐 해산물
  { keyword: '회', category: '해산물', season: 'summer' },
  { keyword: '새우', category: '해산물', season: 'all' },
  { keyword: '랍스터', category: '해산물', season: 'all' },
  { keyword: '조개구이', category: '해산물', season: 'all' },
  { keyword: '전복', category: '해산물', season: 'all' },
  { keyword: '굴', category: '해산물', season: 'winter' },
  { keyword: '대게', category: '해산물', season: 'winter' },
  { keyword: '킹크랩', category: '해산물', season: 'winter' },
  
  // 🍺 안주류
  { keyword: '감자튀김', category: '안주', season: 'all' },
  { keyword: '소세지', category: '안주', season: 'all' },
  { keyword: '나초', category: '안주', season: 'all' },
  { keyword: '육회', category: '안주', season: 'all' },
  { keyword: '골뱅이', category: '안주', season: 'all' },
  { keyword: '오징어', category: '안주', season: 'all' },
];

// ========================================
// 📅 월별 기상 데이터 (서울 2024년 기준)
// ========================================
interface MonthlyWeather {
  temp: number;      // 평균 기온
  rain: number;      // 강수일수
  humidity: number;  // 평균 습도
  sunshine: number;  // 일조시간
}

const MONTHLY_WEATHER: Record<number, MonthlyWeather> = {
  1:  { temp: -2,  rain: 6,  humidity: 55, sunshine: 180 },
  2:  { temp: 1,   rain: 5,  humidity: 52, sunshine: 190 },
  3:  { temp: 7,   rain: 7,  humidity: 55, sunshine: 210 },
  4:  { temp: 13,  rain: 9,  humidity: 58, sunshine: 220 },
  5:  { temp: 18,  rain: 9,  humidity: 60, sunshine: 240 },
  6:  { temp: 23,  rain: 11, humidity: 70, sunshine: 180 },
  7:  { temp: 27,  rain: 16, humidity: 80, sunshine: 150 }, // 장마
  8:  { temp: 28,  rain: 14, humidity: 78, sunshine: 170 },
  9:  { temp: 23,  rain: 10, humidity: 68, sunshine: 190 },
  10: { temp: 16,  rain: 6,  humidity: 60, sunshine: 210 },
  11: { temp: 8,   rain: 8,  humidity: 58, sunshine: 180 },
  12: { temp: 1,   rain: 7,  humidity: 55, sunshine: 170 },
};

// 요일별 가중치 (월=0, 일=6)
const DAY_OF_WEEK_WEIGHTS: Record<string, Record<number, number>> = {
  '치킨': { 0: 0.8, 1: 0.9, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5, 6: 1.3 }, // 금토 인기
  '삼겹살': { 0: 0.9, 1: 0.9, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.4, 6: 1.2 },
  '피자': { 0: 0.8, 1: 0.9, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.4, 6: 1.3 },
  '파전': { 0: 0.9, 1: 0.9, 2: 0.9, 3: 1.0, 4: 1.0, 5: 1.2, 6: 1.1 },
  '막걸리': { 0: 0.8, 1: 0.8, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.3, 6: 1.2 },
};

// ========================================
// 🧮 다변량 분석 함수들
// ========================================

// 피어슨 상관계수
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

// 다중 선형 회귀 (단순 구현)
interface RegressionResult {
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
}

function multipleLinearRegression(
  y: number[],
  X: Record<string, number[]>
): RegressionResult {
  // 단순화된 다중 회귀: 각 변수의 개별 기여도 추정
  const variables = Object.keys(X);
  const coefficients: Record<string, number> = {};
  
  let totalVariance = 0;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  y.forEach(yi => totalVariance += Math.pow(yi - yMean, 2));
  
  let explainedVariance = 0;
  
  variables.forEach(variable => {
    const correlation = pearsonCorrelation(y, X[variable]);
    const xValues = X[variable];
    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const xStd = Math.sqrt(xValues.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) / xValues.length);
    const yStd = Math.sqrt(totalVariance / y.length);
    
    coefficients[variable] = correlation * (yStd / xStd);
    explainedVariance += Math.pow(correlation, 2);
  });
  
  // R² (다중 결정계수) - 단순화
  const rSquared = Math.min(explainedVariance / variables.length, 1);
  
  // 절편 계산
  const intercept = yMean - variables.reduce((sum, v) => {
    const xMean = X[v].reduce((a, b) => a + b, 0) / X[v].length;
    return sum + coefficients[v] * xMean;
  }, 0);

  return { coefficients, intercept, rSquared };
}

// 구글 트렌드 데이터 가져오기
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
    return Array(12).fill(50);
  }
}

// ========================================
// 🚀 메인 분석 함수
// ========================================

interface MultivariateResult {
  keyword: string;
  category: string;
  monthlyValues: { month: number; value: number }[];
  correlations: {
    temp: number;
    rain: number;
    humidity: number;
    sunshine: number;
  };
  regression: RegressionResult;
  optimalConditions: {
    tempRange: string;
    rainLevel: string;
    humidityRange: string;
    bestMonths: number[];
  };
}

async function analyzeMultivariate(): Promise<MultivariateResult[]> {
  const results: MultivariateResult[] = [];
  
  // 기상 데이터 배열로 변환
  const temps = Object.values(MONTHLY_WEATHER).map(w => w.temp);
  const rains = Object.values(MONTHLY_WEATHER).map(w => w.rain);
  const humidities = Object.values(MONTHLY_WEATHER).map(w => w.humidity);
  const sunshines = Object.values(MONTHLY_WEATHER).map(w => w.sunshine);

  console.log('\n🔬 다변량 분석 시작...\n');
  console.log(`📊 총 ${FOOD_KEYWORDS.length}개 메뉴 분석\n`);

  for (const food of FOOD_KEYWORDS) {
    process.stdout.write(`  분석 중: ${food.keyword.padEnd(15)}`);
    
    const monthlyValues = await getTrendData(food.keyword);
    
    // 상관관계 계산
    const correlations = {
      temp: pearsonCorrelation(monthlyValues, temps),
      rain: pearsonCorrelation(monthlyValues, rains),
      humidity: pearsonCorrelation(monthlyValues, humidities),
      sunshine: pearsonCorrelation(monthlyValues, sunshines),
    };

    // 다중 회귀 분석
    const regression = multipleLinearRegression(monthlyValues, {
      temp: temps,
      rain: rains,
      humidity: humidities,
    });

    // 최적 조건 도출
    const maxValue = Math.max(...monthlyValues);
    const bestMonths = monthlyValues
      .map((v, i) => ({ month: i + 1, value: v }))
      .filter(m => m.value >= maxValue * 0.8)
      .map(m => m.month);

    const avgTempForBest = bestMonths.reduce((sum, m) => sum + MONTHLY_WEATHER[m].temp, 0) / bestMonths.length;
    const avgRainForBest = bestMonths.reduce((sum, m) => sum + MONTHLY_WEATHER[m].rain, 0) / bestMonths.length;
    const avgHumidityForBest = bestMonths.reduce((sum, m) => sum + MONTHLY_WEATHER[m].humidity, 0) / bestMonths.length;

    const optimalConditions = {
      tempRange: avgTempForBest > 20 ? '더운 날 (20°C+)' : avgTempForBest < 10 ? '추운 날 (10°C-)' : '온화한 날씨',
      rainLevel: avgRainForBest > 12 ? '장마/비 많은 시기' : avgRainForBest < 7 ? '맑은 날' : '보통',
      humidityRange: avgHumidityForBest > 70 ? '습한 날' : avgHumidityForBest < 60 ? '건조한 날' : '보통',
      bestMonths,
    };

    results.push({
      keyword: food.keyword,
      category: food.category,
      monthlyValues: monthlyValues.map((v, i) => ({ month: i + 1, value: v })),
      correlations,
      regression,
      optimalConditions,
    });

    console.log(`✓ (R²=${regression.rSquared.toFixed(2)})`);
    
    // API 속도 제한
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  return results;
}

// ========================================
// 📝 결과 저장
// ========================================

function saveResults(results: MultivariateResult[]): void {
  const fs = require('fs');
  
  const output = {
    generatedAt: new Date().toISOString(),
    analysisType: 'multivariate',
    variables: ['temperature', 'rainfall', 'humidity', 'sunshine'],
    monthlyWeather: MONTHLY_WEATHER,
    totalMenus: results.length,
    categories: Array.from(new Set(results.map(r => r.category))),
    results: results.map(r => ({
      keyword: r.keyword,
      category: r.category,
      monthlyValues: r.monthlyValues,
      correlations: {
        temp: Math.round(r.correlations.temp * 100) / 100,
        rain: Math.round(r.correlations.rain * 100) / 100,
        humidity: Math.round(r.correlations.humidity * 100) / 100,
        sunshine: Math.round(r.correlations.sunshine * 100) / 100,
      },
      regression: {
        coefficients: Object.fromEntries(
          Object.entries(r.regression.coefficients).map(([k, v]) => [k, Math.round(v * 100) / 100])
        ),
        rSquared: Math.round(r.regression.rSquared * 100) / 100,
      },
      optimalConditions: r.optimalConditions,
    })),
    // 요약 통계
    summary: {
      hotWeatherFoods: results
        .filter(r => r.correlations.temp > 0.5)
        .map(r => r.keyword),
      coldWeatherFoods: results
        .filter(r => r.correlations.temp < -0.3)
        .map(r => r.keyword),
      rainyDayFoods: results
        .filter(r => r.correlations.rain > 0.3)
        .map(r => r.keyword),
      humidDayFoods: results
        .filter(r => r.correlations.humidity > 0.5)
        .map(r => r.keyword),
    },
  };

  fs.writeFileSync('src/data/multivariate-analysis.json', JSON.stringify(output, null, 2));
  console.log('\n✅ src/data/multivariate-analysis.json 저장 완료!');
}

// 리포트 출력
function printReport(results: MultivariateResult[]): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        🔬 다변량 날씨-음식 상관관계 분석 리포트                    ║
║            (기온 + 강수량 + 습도 + 일조시간)                       ║
╚════════════════════════════════════════════════════════════════╝
`);

  // 카테고리별 요약
  const categories = Array.from(new Set(results.map(r => r.category)));
  
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    console.log(`\n━━━ ${cat} (${catResults.length}개) ━━━`);
    
    catResults.forEach(r => {
      const tempIcon = r.correlations.temp > 0.3 ? '🔥' : r.correlations.temp < -0.3 ? '❄️' : '🌤️';
      const rainIcon = r.correlations.rain > 0.3 ? '🌧️' : '☀️';
      
      console.log(`  ${r.keyword.padEnd(12)} ${tempIcon}기온:${r.correlations.temp.toFixed(2).padStart(6)} ${rainIcon}비:${r.correlations.rain.toFixed(2).padStart(6)} 💧습도:${r.correlations.humidity.toFixed(2).padStart(6)}`);
    });
  });

  // 최적 조건 TOP 10
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 회귀 분석 설명력 TOP 10 (R² 높은 순)
`);
  
  const topR2 = [...results].sort((a, b) => b.regression.rSquared - a.regression.rSquared).slice(0, 10);
  topR2.forEach((r, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${r.keyword.padEnd(12)} R²=${r.regression.rSquared.toFixed(2)} → ${r.optimalConditions.tempRange}`);
  });
}

// ========================================
// 🚀 실행
// ========================================

async function main() {
  console.log('\n🚀 다변량 날씨-음식 분석 시작!\n');
  
  try {
    const results = await analyzeMultivariate();
    printReport(results);
    saveResults(results);
    
    console.log('\n✨ 분석 완료! 결과는 src/data/multivariate-analysis.json 참고\n');
  } catch (error) {
    console.error('❌ 분석 중 오류:', error);
  }
}

main();
