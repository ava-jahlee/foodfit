/**
 * 시간대별 음식 선호도 분석
 * 
 * 분석 내용:
 * - 아침 (06:00-11:00): 아침 메뉴 vs 점심 메뉴
 * - 점심 (11:00-14:00): 빠른 식사 vs 여유로운 식사
 * - 저녁 (17:00-21:00): 외식/특별한 메뉴
 * - 야식 (21:00-02:00): 배달 음식, 간편식
 * 
 * 사용법: npx ts-node scripts/analyzeByTimeOfDay.ts
 */

const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// ========================================
// 🍜 분석할 음식 키워드
// ========================================
const FOOD_KEYWORDS = [
  // 아침 메뉴
  { keyword: '샌드위치', expectedTime: 'breakfast' },
  { keyword: '토스트', expectedTime: 'breakfast' },
  { keyword: '시리얼', expectedTime: 'breakfast' },
  { keyword: '죽', expectedTime: 'breakfast' },
  { keyword: '계란말이', expectedTime: 'breakfast' },
  
  // 점심 메뉴 (빠른 식사)
  { keyword: '김밥', expectedTime: 'lunch' },
  { keyword: '라면', expectedTime: 'lunch' },
  { keyword: '국밥', expectedTime: 'lunch' },
  { keyword: '김치찌개', expectedTime: 'lunch' },
  { keyword: '비빔밥', expectedTime: 'lunch' },
  { keyword: '백반', expectedTime: 'lunch' },
  { keyword: '돈까스', expectedTime: 'lunch' },
  { keyword: '샐러드', expectedTime: 'lunch' },
  
  // 저녁 메뉴 (외식, 특별)
  { keyword: '삼겹살', expectedTime: 'dinner' },
  { keyword: '회', expectedTime: 'dinner' },
  { keyword: '스테이크', expectedTime: 'dinner' },
  { keyword: '파스타', expectedTime: 'dinner' },
  { keyword: '초밥', expectedTime: 'dinner' },
  { keyword: '피자', expectedTime: 'dinner' },
  { keyword: '치킨', expectedTime: 'dinner' },
  { keyword: '짬뽕', expectedTime: 'dinner' },
  { keyword: '갈비', expectedTime: 'dinner' },
  { keyword: '족발', expectedTime: 'dinner' },
  
  // 야식 메뉴
  { keyword: '떡볶이', expectedTime: 'latenight' },
  { keyword: '라면', expectedTime: 'latenight' },
  { keyword: '치킨', expectedTime: 'latenight' },
  { keyword: '피자', expectedTime: 'latenight' },
  { keyword: '햄버거', expectedTime: 'latenight' },
  { keyword: '족발', expectedTime: 'latenight' },
  { keyword: '보쌈', expectedTime: 'latenight' },
];

// ========================================
// ⏰ 시간대 정의
// ========================================
const TIME_SLOTS = {
  breakfast: { start: 6, end: 11, name: '아침' },
  lunch: { start: 11, end: 14, name: '점심' },
  afternoon: { start: 14, end: 17, name: '오후' },
  dinner: { start: 17, end: 21, name: '저녁' },
  latenight: { start: 21, end: 26, name: '야식' }, // 26 = 다음날 02시
} as const;

// ========================================
// 📅 날짜 유틸리티
// ========================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getHour(date: Date): number {
  return date.getHours();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// 📊 Google Trends 시간별 데이터 가져오기
// ========================================
async function getHourlyTrends(keyword: string, startDate: Date, endDate: Date): Promise<Map<string, Map<number, number>>> {
  console.log(`  🔍 "${keyword}" 시간별 데이터 수집 중...`);
  
  // 날짜별 -> 시간별 맵
  const hourlyData = new Map<string, Map<number, number>>();
  
  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: startDate,
      endTime: endDate,
      geo: 'KR',
    });
    
    const data = JSON.parse(result);
    if (!data.default?.timelineData) {
      console.log(`  ⚠️ 데이터 없음`);
      return hourlyData;
    }
    
    data.default.timelineData.forEach((item: any) => {
      const date = new Date(item.time * 1000);
      const dateStr = formatDate(date);
      const hour = getHour(date);
      const value = item.value[0] || 0;
      
      if (!hourlyData.has(dateStr)) {
        hourlyData.set(dateStr, new Map());
      }
      hourlyData.get(dateStr)!.set(hour, value);
    });
    
    const totalHours = Array.from(hourlyData.values()).reduce((sum, day) => sum + day.size, 0);
    console.log(`  ✅ ${hourlyData.size}일, ${totalHours}시간 데이터 수집`);
    
  } catch (error: any) {
    console.error(`  ❌ 오류: ${error.message?.slice(0, 50)}`);
  }
  
  return hourlyData;
}

// ========================================
// 🔬 시간대별 패턴 분석
// ========================================
interface TimeOfDayAnalysis {
  keyword: string;
  expectedTime: string;
  totalHours: number;
  
  timeSlotAverages: {
    breakfast: number;
    lunch: number;
    afternoon: number;
    dinner: number;
    latenight: number;
  };
  
  peakTimeSlot: string;
  peakHour: number;
  
  // 점심 대비 비율
  ratios: {
    breakfastToLunch: number;    // 아침/점심 비율
    dinnerToLunch: number;        // 저녁/점심 비율
    latenightToLunch: number;     // 야식/점심 비율
  };
}

function analyzeTimePatterns(hourlyData: Map<string, Map<number, number>>): TimeOfDayAnalysis | null {
  if (hourlyData.size === 0) return null;
  
  // 시간대별 평균 계산
  const slotValues: Record<string, number[]> = {
    breakfast: [],
    lunch: [],
    afternoon: [],
    dinner: [],
    latenight: [],
  };
  
  const allHourValues = new Map<number, number[]>();
  for (let h = 0; h < 24; h++) {
    allHourValues.set(h, []);
  }
  
  // 모든 데이터 수집
  for (const [_, dayData] of Array.from(hourlyData.entries())) {
    for (const [hour, value] of Array.from(dayData.entries())) {
      allHourValues.get(hour)?.push(value);
      
      // 시간대 분류
      for (const [slotName, slot] of Object.entries(TIME_SLOTS)) {
        const adjustedHour = hour >= 0 && hour < 6 ? hour + 24 : hour; // 새벽 시간 조정
        if (adjustedHour >= slot.start && adjustedHour < slot.end) {
          slotValues[slotName].push(value);
        }
      }
    }
  }
  
  // 시간대별 평균
  const slotAverages = {
    breakfast: mean(slotValues.breakfast),
    lunch: mean(slotValues.lunch),
    afternoon: mean(slotValues.afternoon),
    dinner: mean(slotValues.dinner),
    latenight: mean(slotValues.latenight),
  };
  
  // 피크 시간대 찾기
  const peakSlot = Object.entries(slotAverages)
    .sort((a, b) => b[1] - a[1])[0];
  
  // 피크 시간 찾기
  const hourAverages = Array.from(allHourValues.entries())
    .map(([hour, values]) => ({ hour, avg: mean(values) }))
    .sort((a, b) => b.avg - a.avg);
  
  const peakHour = hourAverages[0]?.hour || 12;
  
  // 점심 대비 비율
  const lunchAvg = slotAverages.lunch || 1;
  
  return {
    keyword: '',
    expectedTime: '',
    totalHours: Array.from(hourlyData.values()).reduce((sum, day) => sum + day.size, 0),
    timeSlotAverages: slotAverages,
    peakTimeSlot: peakSlot[0],
    peakHour,
    ratios: {
      breakfastToLunch: slotAverages.breakfast / lunchAvg,
      dinnerToLunch: slotAverages.dinner / lunchAvg,
      latenightToLunch: slotAverages.latenight / lunchAvg,
    },
  };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ========================================
// 🚀 메인 분석
// ========================================
async function main() {
  console.log('\n⏰ 시간대별 음식 선호도 분석 시작!\n');
  console.log('='.repeat(60));
  
  // 최근 7일 데이터 (시간별 데이터를 얻기 위함)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  console.log(`📅 분석 기간: ${formatDate(startDate)} ~ ${formatDate(endDate)}`);
  console.log(`   (최근 7일 시간별 데이터)\n`);
  
  const results: any[] = [];
  
  for (const food of FOOD_KEYWORDS) {
    console.log(`\n━━━ ${food.keyword} (예상: ${food.expectedTime}) ━━━`);
    
    const hourlyData = await getHourlyTrends(food.keyword, startDate, endDate);
    const analysis = analyzeTimePatterns(hourlyData);
    
    if (!analysis) {
      console.log(`  ⚠️ 분석 불가\n`);
      await delay(2000);
      continue;
    }
    
    analysis.keyword = food.keyword;
    analysis.expectedTime = food.expectedTime;
    
    // 결과 출력
    console.log(`\n  📊 시간대별 평균 검색량:`);
    console.log(`  ├─ 아침 (06-11): ${analysis.timeSlotAverages.breakfast.toFixed(1)}`);
    console.log(`  ├─ 점심 (11-14): ${analysis.timeSlotAverages.lunch.toFixed(1)}`);
    console.log(`  ├─ 오후 (14-17): ${analysis.timeSlotAverages.afternoon.toFixed(1)}`);
    console.log(`  ├─ 저녁 (17-21): ${analysis.timeSlotAverages.dinner.toFixed(1)}`);
    console.log(`  └─ 야식 (21-02): ${analysis.timeSlotAverages.latenight.toFixed(1)}`);
    console.log(`\n  🔝 피크 시간대: ${TIME_SLOTS[analysis.peakTimeSlot as keyof typeof TIME_SLOTS].name} (${analysis.peakHour}시)`);
    console.log(`\n  📈 점심 대비 비율:`);
    console.log(`  ├─ 아침/점심: ${(analysis.ratios.breakfastToLunch * 100).toFixed(0)}%`);
    console.log(`  ├─ 저녁/점심: ${(analysis.ratios.dinnerToLunch * 100).toFixed(0)}%`);
    console.log(`  └─ 야식/점심: ${(analysis.ratios.latenightToLunch * 100).toFixed(0)}%`);
    
    results.push(analysis);
    
    await delay(3000); // Rate limit
  }
  
  // ========================================
  // 📊 요약
  // ========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 시간대별 분석 결과 요약');
  console.log('='.repeat(60));
  
  // 아침 메뉴 TOP
  console.log('\n🌅 아침에 인기 (아침/점심 비율 높음):');
  const breakfastFoods = [...results]
    .filter(r => r.ratios.breakfastToLunch > 0.5)
    .sort((a, b) => b.ratios.breakfastToLunch - a.ratios.breakfastToLunch)
    .slice(0, 5);
  breakfastFoods.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword.padEnd(12)} ${(r.ratios.breakfastToLunch * 100).toFixed(0)}%`);
  });
  
  // 저녁 메뉴 TOP
  console.log('\n🌆 저녁에 인기 (저녁/점심 비율 높음):');
  const dinnerFoods = [...results]
    .filter(r => r.ratios.dinnerToLunch > 1.0)
    .sort((a, b) => b.ratios.dinnerToLunch - a.ratios.dinnerToLunch)
    .slice(0, 5);
  dinnerFoods.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword.padEnd(12)} ${(r.ratios.dinnerToLunch * 100).toFixed(0)}%`);
  });
  
  // 야식 메뉴 TOP
  console.log('\n🌙 야식에 인기 (야식/점심 비율 높음):');
  const latenightFoods = [...results]
    .filter(r => r.ratios.latenightToLunch > 0.8)
    .sort((a, b) => b.ratios.latenightToLunch - a.ratios.latenightToLunch)
    .slice(0, 5);
  latenightFoods.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.keyword.padEnd(12)} ${(r.ratios.latenightToLunch * 100).toFixed(0)}%`);
  });
  
  // ========================================
  // 💾 결과 저장
  // ========================================
  const output = {
    generatedAt: new Date().toISOString(),
    period: {
      start: formatDate(startDate),
      end: formatDate(endDate),
    },
    results: results.map(r => ({
      keyword: r.keyword,
      expectedTime: r.expectedTime,
      totalHours: r.totalHours,
      timeSlotAverages: {
        breakfast: Math.round(r.timeSlotAverages.breakfast * 10) / 10,
        lunch: Math.round(r.timeSlotAverages.lunch * 10) / 10,
        afternoon: Math.round(r.timeSlotAverages.afternoon * 10) / 10,
        dinner: Math.round(r.timeSlotAverages.dinner * 10) / 10,
        latenight: Math.round(r.timeSlotAverages.latenight * 10) / 10,
      },
      peakTimeSlot: r.peakTimeSlot,
      peakHour: r.peakHour,
      ratios: {
        breakfastToLunch: Math.round(r.ratios.breakfastToLunch * 100) / 100,
        dinnerToLunch: Math.round(r.ratios.dinnerToLunch * 100) / 100,
        latenightToLunch: Math.round(r.ratios.latenightToLunch * 100) / 100,
      },
    })),
    insights: {
      topBreakfastFoods: breakfastFoods.map(r => r.keyword),
      topDinnerFoods: dinnerFoods.map(r => r.keyword),
      topLatenightFoods: latenightFoods.map(r => r.keyword),
    },
  };
  
  const outputPath = path.join(__dirname, '../src/data/time-of-day-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ 결과 저장: ${outputPath}\n`);
}

main().catch(console.error);
