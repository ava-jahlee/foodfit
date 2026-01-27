/**
 * 추천 알고리즘 테스트 스크립트
 * 실행: npx ts-node scripts/testRecommend.ts
 */

import { getRecommendations, weatherCodeToCondition } from '../src/lib/recommend'

console.log('\n🧪 FoodFit 추천 알고리즘 테스트\n')
console.log('='.repeat(50))

// 테스트 1: 우울함 + 키토식단
console.log('\n📋 테스트 1: 우울함(sad) + 키토식단(keto)')
console.log('-'.repeat(50))

const test1 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'sad',
  moodCustom: '',
  timeSlot: 'dinner',
  dietMode: 'keto',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
  foodCategory: 'all',
  adventureMode: false,
})

console.log('추천 메뉴:')
test1.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} (${r.menu.category})`)
  console.log(`     - 탄수화물: ${r.menu.carbs}, 단백질: ${r.menu.protein}`)
  console.log(`     - 키토 호환: ${r.menu.dietCompatible.includes('keto') ? '✅' : '❌'}`)
  console.log(`     - 우울 기분 매칭: ${r.menu.mood.includes('sad') ? '✅' : '❌'}`)
  console.log(`     - 점수: ${r.score}`)
})

// 테스트 2: 스트레스 + 다이어트
console.log('\n\n📋 테스트 2: 스트레스(stressed) + 다이어트(diet)')
console.log('-'.repeat(50))

const test2 = getRecommendations({
  weatherCondition: 'sunny',
  mood: 'stressed',
  moodCustom: '',
  timeSlot: 'lunch',
  dietMode: 'diet',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
  foodCategory: 'all',
  adventureMode: false,
})

console.log('추천 메뉴:')
test2.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} (${r.menu.category}) - ${r.menu.estimatedCalories}kcal`)
  console.log(`     - 다이어트 호환: ${r.menu.dietCompatible.includes('diet') ? '✅' : '❌'}`)
  console.log(`     - 스트레스 기분 매칭: ${r.menu.mood.includes('stressed') ? '✅' : '❌'}`)
})

// 테스트 3: 제외 기능 테스트
console.log('\n\n📋 테스트 3: "찌개" 제외 시 찌개류가 안 나오는지')
console.log('-'.repeat(50))

const test3 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'normal',
  moodCustom: '',
  timeSlot: 'dinner',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: ['찌개'],  // "찌개" 키워드로 제외
  foodCategory: 'all',
  adventureMode: false,
})

console.log('추천 메뉴 (찌개 제외):')
test3.forEach((r, i) => {
  const hasJjigae = r.menu.name.includes('찌개')
  console.log(`  ${i + 1}. ${r.menu.name} ${hasJjigae ? '❌ 찌개가 포함됨!' : '✅'}`)
})

// 찌개 포함 여부 검증
const jjigaeIncluded = test3.some(r => r.menu.name.includes('찌개'))
console.log(`\n검증: ${jjigaeIncluded ? '❌ 실패 - 찌개가 포함됨' : '✅ 성공 - 찌개 제외됨'}`)

// 테스트 4: 야식 시간 + 술 안 먹음
console.log('\n\n📋 테스트 4: 야식 시간(latenight) + 술 안 먹음 옵션')
console.log('-'.repeat(50))

const test4 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'happy',
  moodCustom: '',
  timeSlot: 'latenight',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: true },  // 술 안 먹음
  excludeMenuIds: [],
  foodCategory: 'all',
  adventureMode: false,
})

console.log('추천 메뉴 (술안주 제외):')
test4.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} - 술안주: ${r.menu.isAlcoholRelated ? '❌ 제외되어야 함' : '✅ OK'}`)
})

// 술안주 포함 여부 검증
const alcoholIncluded = test4.some(r => r.menu.isAlcoholRelated)
console.log(`\n검증: ${alcoholIncluded ? '❌ 실패 - 술안주가 포함됨' : '✅ 성공 - 술안주 제외됨'}`)

// 테스트 5: 비오는 날
console.log('\n\n📋 테스트 5: 비오는 날(rainy) 추천')
console.log('-'.repeat(50))

const test5 = getRecommendations({
  weatherCondition: 'rainy',
  mood: 'normal',
  moodCustom: '',
  timeSlot: 'dinner',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
  foodCategory: 'all',
  adventureMode: false,
})

console.log('추천 메뉴 (비오는 날):')
test5.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name}`)
  console.log(`     - 비오는날 매칭: ${r.menu.weather.includes('rainy') ? '✅' : '❌'}`)
  console.log(`     - 이유: ${r.reasons.join(', ')}`)
})

// 테스트 6: 카테고리 필터 (한식만)
console.log('\n\n📋 테스트 6: 한식만 추천')
console.log('-'.repeat(50))

const test6 = getRecommendations({
  weatherCondition: 'normal',
  mood: 'normal',
  moodCustom: '',
  timeSlot: 'lunch',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
  foodCategory: 'korean',
  adventureMode: false,
})

console.log('추천 메뉴 (한식):')
test6.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} (${r.menu.category})`)
})

// 테스트 7: 모험 모드
console.log('\n\n📋 테스트 7: 모험 모드 (색다른 거 도전)')
console.log('-'.repeat(50))

const test7 = getRecommendations({
  weatherCondition: 'normal',
  mood: 'normal',
  moodCustom: '',
  timeSlot: 'lunch',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
  foodCategory: 'all',
  adventureMode: true,
})

console.log('추천 메뉴 (모험 모드):')
test7.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} (${r.menu.category})`)
  console.log(`     - 이유: ${r.reasons.join(', ')}`)
})

console.log('\n' + '='.repeat(50))
console.log('🏁 테스트 완료!\n')
