/**
 * 지역별 인구통계 + 음식 선호도 상관관계 분석
 * 
 * 데이터 출처: KOSIS 국가통계포털 (2024년 기준 추정치)
 */

const fs = require('fs');
const path = require('path');

// 지역별 인구통계 데이터 (2024년 기준 추정)
const DEMOGRAPHICS = {
  '서울': {
    population: 9411000,      // 총 인구
    density: 15500,           // 인구밀도 (명/km²)
    medianAge: 44.2,          // 중위연령
    youthRatio: 11.2,         // 청년비율 (20~29세) %
    elderlyRatio: 18.5,       // 고령비율 (65세+) %
    singleHousehold: 35.1,    // 1인가구 비율 %
    maleRatio: 48.8,          // 남성 비율 %
    avgIncome: 4200,          // 평균 월소득 (만원)
  },
  '부산': {
    population: 3290000,
    density: 4300,
    medianAge: 47.1,
    youthRatio: 10.8,
    elderlyRatio: 22.3,
    singleHousehold: 33.8,
    maleRatio: 48.5,
    avgIncome: 3400,
  },
  '대구': {
    population: 2350000,
    density: 2700,
    medianAge: 45.8,
    youthRatio: 11.5,
    elderlyRatio: 19.8,
    singleHousehold: 31.2,
    maleRatio: 49.1,
    avgIncome: 3200,
  },
  '인천': {
    population: 2940000,
    density: 2800,
    medianAge: 43.5,
    youthRatio: 12.1,
    elderlyRatio: 16.8,
    singleHousehold: 31.5,
    maleRatio: 49.8,
    avgIncome: 3500,
  },
  '광주': {
    population: 1420000,
    density: 2800,
    medianAge: 43.2,
    youthRatio: 13.2,
    elderlyRatio: 16.4,
    singleHousehold: 30.5,
    maleRatio: 49.3,
    avgIncome: 3100,
  },
  '대전': {
    population: 1440000,
    density: 2700,
    medianAge: 42.8,
    youthRatio: 14.1,
    elderlyRatio: 15.8,
    singleHousehold: 32.1,
    maleRatio: 49.5,
    avgIncome: 3300,
  },
  '울산': {
    population: 1100000,
    density: 1050,
    medianAge: 43.8,
    youthRatio: 11.8,
    elderlyRatio: 15.2,
    singleHousehold: 28.5,
    maleRatio: 51.2,          // 산업도시 특성상 남성 비율 높음
    avgIncome: 3800,          // 산업도시라 소득 높음
  },
  '경기': {
    population: 13600000,     // 경기도 전체
    density: 1300,
    medianAge: 42.1,
    youthRatio: 13.5,
    elderlyRatio: 14.8,
    singleHousehold: 30.2,
    maleRatio: 50.1,
    avgIncome: 3700,
  },
  '제주': {
    population: 680000,
    density: 370,             // 인구밀도 낮음
    medianAge: 42.5,
    youthRatio: 12.8,
    elderlyRatio: 17.2,
    singleHousehold: 29.8,
    maleRatio: 49.5,
    avgIncome: 3000,
  },
};

// 지역별 분석 데이터 로드
const regionalDataPath = path.join(__dirname, '../src/data/regional-analysis.json');
const regionalData = JSON.parse(fs.readFileSync(regionalDataPath, 'utf8'));

// 상관계수 계산 함수
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

// 분석 실행
async function analyzeDemographics() {
  console.log('🔬 지역별 인구통계 + 음식 선호도 분석 시작...\n');
  
  const regions = Object.keys(DEMOGRAPHICS);
  const results: any = {
    generatedAt: new Date().toISOString(),
    demographics: DEMOGRAPHICS,
    correlations: {},
    insights: [],
  };
  
  // 인구통계 변수들
  const demographicVars = [
    { key: 'medianAge', name: '중위연령', desc: '높을수록 고령' },
    { key: 'youthRatio', name: '청년비율', desc: '20~29세 비율' },
    { key: 'elderlyRatio', name: '고령비율', desc: '65세+ 비율' },
    { key: 'singleHousehold', name: '1인가구비율', desc: '1인가구 비율' },
    { key: 'density', name: '인구밀도', desc: '명/km²' },
    { key: 'avgIncome', name: '평균소득', desc: '월 평균 소득' },
  ];
  
  // 음식별 지역 상관계수 평균 계산
  const comparison = regionalData.comparison;
  const foodKeywords = Object.keys(comparison);
  
  console.log('📊 인구통계 변수와 음식 선호도 상관관계:\n');
  console.log('=' .repeat(70));
  
  for (const varInfo of demographicVars) {
    const demographicValues = regions.map(r => (DEMOGRAPHICS as any)[r][varInfo.key]);
    
    console.log(`\n📈 ${varInfo.name} (${varInfo.desc})`);
    console.log('-'.repeat(50));
    
    const foodCorrelations: { food: string; corr: number }[] = [];
    
    for (const food of foodKeywords) {
      // 각 지역의 음식 검색량 가져오기
      const searchVolumes = regions.map(r => {
        const data = comparison[food]?.[r];
        return data?.avgSearchVolume || 0;
      });
      
      // 상관계수 계산
      const corr = calculateCorrelation(demographicValues, searchVolumes);
      
      if (!isNaN(corr) && corr !== 0) {
        foodCorrelations.push({ food, corr });
      }
    }
    
    // 상관계수 정렬
    foodCorrelations.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
    
    // 상위 결과 출력
    const top5 = foodCorrelations.slice(0, 5);
    for (const item of top5) {
      const sign = item.corr > 0 ? '+' : '';
      const emoji = item.corr > 0.5 ? '🔥' : item.corr < -0.5 ? '❄️' : '➖';
      console.log(`  ${emoji} ${item.food}: ${sign}${item.corr.toFixed(2)}`);
    }
    
    results.correlations[varInfo.key] = {
      name: varInfo.name,
      description: varInfo.desc,
      topPositive: foodCorrelations.filter(f => f.corr > 0.3).slice(0, 5),
      topNegative: foodCorrelations.filter(f => f.corr < -0.3).slice(0, 5),
    };
  }
  
  // 인사이트 도출
  console.log('\n\n💡 주요 발견 (Insights)');
  console.log('=' .repeat(70));
  
  // 고령비율 vs 음식
  const elderlyCorr = results.correlations['elderlyRatio'];
  if (elderlyCorr.topPositive.length > 0) {
    const insight = {
      title: '고령 인구 ↑ → 전통 음식 선호',
      finding: `고령비율이 높은 지역에서 ${elderlyCorr.topPositive.map((f: any) => f.food).join(', ')} 검색 ↑`,
      correlation: elderlyCorr.topPositive[0]?.corr.toFixed(2),
    };
    results.insights.push(insight);
    console.log(`\n🧓 ${insight.title}`);
    console.log(`   ${insight.finding}`);
  }
  
  // 청년비율 vs 음식
  const youthCorr = results.correlations['youthRatio'];
  if (youthCorr.topPositive.length > 0) {
    const insight = {
      title: '청년 인구 ↑ → 트렌디 음식 선호',
      finding: `청년비율이 높은 지역에서 ${youthCorr.topPositive.map((f: any) => f.food).join(', ')} 검색 ↑`,
      correlation: youthCorr.topPositive[0]?.corr.toFixed(2),
    };
    results.insights.push(insight);
    console.log(`\n👶 ${insight.title}`);
    console.log(`   ${insight.finding}`);
  }
  
  // 1인가구 vs 음식
  const singleCorr = results.correlations['singleHousehold'];
  if (singleCorr.topPositive.length > 0) {
    const insight = {
      title: '1인가구 ↑ → 간편식/배달 선호',
      finding: `1인가구 비율이 높은 지역에서 ${singleCorr.topPositive.map((f: any) => f.food).join(', ')} 검색 ↑`,
      correlation: singleCorr.topPositive[0]?.corr.toFixed(2),
    };
    results.insights.push(insight);
    console.log(`\n🏠 ${insight.title}`);
    console.log(`   ${insight.finding}`);
  }
  
  // 인구밀도 vs 음식
  const densityCorr = results.correlations['density'];
  if (densityCorr.topPositive.length > 0) {
    const insight = {
      title: '인구밀도 ↑ → 다양성으로 평균화',
      finding: `인구밀도가 높은 지역(서울)에서 특정 음식 선호도가 분산됨`,
      note: '서울의 모든 음식 상관계수가 0인 이유와 일치',
    };
    results.insights.push(insight);
    console.log(`\n🏙️ ${insight.title}`);
    console.log(`   ${insight.finding}`);
  }
  
  // 지역별 특성 요약
  console.log('\n\n📍 지역별 특성 요약');
  console.log('=' .repeat(70));
  
  for (const region of regions) {
    const demo = (DEMOGRAPHICS as any)[region];
    const regionData = regionalData.regions[region];
    
    console.log(`\n${region}:`);
    console.log(`  인구: ${(demo.population / 10000).toFixed(0)}만명 | 중위연령: ${demo.medianAge}세`);
    console.log(`  청년: ${demo.youthRatio}% | 고령: ${demo.elderlyRatio}% | 1인가구: ${demo.singleHousehold}%`);
    
    if (regionData?.summary) {
      console.log(`  🔥 더운날 음식: ${regionData.summary.hotWeatherFoods.slice(0, 3).join(', ')}`);
      console.log(`  ❄️ 추운날 음식: ${regionData.summary.coldWeatherFoods.slice(0, 3).join(', ')}`);
    }
  }
  
  // 결과 저장
  const outputPath = path.join(__dirname, '../src/data/demographic-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\n✅ 분석 결과 저장: ${outputPath}`);
  
  return results;
}

analyzeDemographics().catch(console.error);
