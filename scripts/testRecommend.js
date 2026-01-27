/**
 * 추천 알고리즘 테스트 스크립트
 * 실행: node scripts/testRecommend.js
 */

const menusData = require('../src/data/menus.json')

const menus = menusData.menus

// 추천 함수 (간단 버전)
function getRecommendations({ weatherCondition, mood, timeSlot, dietMode, dietOptions, excludeMenuIds }) {
  const results = []
  
  for (const menu of menus) {
    // 1. 제외 필터링
    const shouldExclude = excludeMenuIds.some(excludeText => {
      const lowerExclude = excludeText.toLowerCase()
      return menu.name.toLowerCase().includes(lowerExclude) ||
             menu.subCategory.toLowerCase().includes(lowerExclude)
    })
    if (shouldExclude) continue
    
    // 2. 시간대 필터링
    if (!menu.timeSlot.includes(timeSlot)) continue
    
    // 3. 식단 모드 필터링
    if (dietMode !== 'none') {
      if (dietMode === 'vegan' && !menu.isVegan) continue
      if (dietMode === 'keto' && menu.carbs === 'high') continue
      if (dietMode === 'diet') {
        const isDietFriendly = menu.dietCompatible.includes('diet') || menu.estimatedCalories <= 500
        if (!isDietFriendly) continue
      }
      if (dietMode === 'bulk') {
        const isBulkFriendly = menu.dietCompatible.includes('bulk') || menu.protein === 'high'
        if (!isBulkFriendly) continue
      }
    }
    
    // 4. 식단 옵션 필터링
    if (dietOptions.lowSodium && menu.isHighSodium) continue
    if (dietOptions.noAlcohol && menu.isAlcoholRelated) continue
    
    // 점수 계산
    let score = 0
    const reasons = []
    
    // 날씨 매칭
    if (menu.weather.includes(weatherCondition)) {
      score += 25
      reasons.push(`${weatherCondition} 날씨 매칭`)
    }
    
    // 기분 매칭
    if (menu.mood.includes(mood)) {
      score += 20
      reasons.push(`${mood} 기분 매칭`)
    }
    
    // 식단 매칭
    if (dietMode !== 'none' && menu.dietCompatible.includes(dietMode)) {
      score += 20
      reasons.push(`${dietMode} 식단 호환`)
    }
    
    // 인기도
    score += (menu.popularityScore || 50) * 0.3
    
    // 약간의 랜덤
    score += Math.floor(Math.random() * 5)
    
    results.push({ menu, score, reasons })
  }
  
  // 정렬
  results.sort((a, b) => b.score - a.score)
  
  return results.slice(0, 5)
}

console.log('\n🧪 FoodFit 추천 알고리즘 테스트\n')
console.log('='.repeat(50))

// 테스트 1: 우울함 + 키토식단
console.log('\n📋 테스트 1: 우울함(sad) + 키토식단(keto)')
console.log('-'.repeat(50))

const test1 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'sad',
  timeSlot: 'dinner',
  dietMode: 'keto',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
})

console.log('추천 메뉴:')
test1.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} (${r.menu.category})`)
  console.log(`     - 탄수화물: ${r.menu.carbs}, 단백질: ${r.menu.protein}`)
  console.log(`     - 키토 호환: ${r.menu.dietCompatible.includes('keto') ? '✅' : '❌'}`)
  console.log(`     - 우울 기분: ${r.menu.mood.includes('sad') ? '✅' : '❌'}`)
})

// 테스트 2: 스트레스 + 다이어트
console.log('\n\n📋 테스트 2: 스트레스(stressed) + 다이어트(diet)')
console.log('-'.repeat(50))

const test2 = getRecommendations({
  weatherCondition: 'sunny',
  mood: 'stressed',
  timeSlot: 'lunch',
  dietMode: 'diet',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
})

console.log('추천 메뉴:')
test2.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} - ${r.menu.estimatedCalories}kcal`)
  console.log(`     - 다이어트 호환: ${r.menu.dietCompatible.includes('diet') ? '✅' : '❌'}`)
  console.log(`     - 스트레스 기분: ${r.menu.mood.includes('stressed') ? '✅' : '❌'}`)
})

// 테스트 3: 제외 기능
console.log('\n\n📋 테스트 3: "찌개" 제외 테스트')
console.log('-'.repeat(50))

const test3 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'normal',
  timeSlot: 'dinner',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: ['찌개'],
})

console.log('추천 메뉴 (찌개 제외):')
test3.forEach((r, i) => {
  const hasJjigae = r.menu.name.includes('찌개')
  console.log(`  ${i + 1}. ${r.menu.name} ${hasJjigae ? '❌ 오류!' : '✅'}`)
})

const jjigaeFound = test3.some(r => r.menu.name.includes('찌개'))
console.log(`\n검증: ${jjigaeFound ? '❌ 실패 - 찌개 포함됨' : '✅ 성공 - 찌개 제외됨'}`)

// 테스트 4: 술 안 먹음
console.log('\n\n📋 테스트 4: 야식 + 술 안 먹음')
console.log('-'.repeat(50))

const test4 = getRecommendations({
  weatherCondition: 'cold',
  mood: 'happy',
  timeSlot: 'latenight',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: true },
  excludeMenuIds: [],
})

console.log('추천 메뉴 (술안주 제외):')
test4.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} - 술안주: ${r.menu.isAlcoholRelated ? '❌ 오류!' : '✅ OK'}`)
})

const alcoholFound = test4.some(r => r.menu.isAlcoholRelated)
console.log(`\n검증: ${alcoholFound ? '❌ 실패 - 술안주 포함됨' : '✅ 성공 - 술안주 제외됨'}`)

// 테스트 5: 비오는 날
console.log('\n\n📋 테스트 5: 비오는 날 추천')
console.log('-'.repeat(50))

const test5 = getRecommendations({
  weatherCondition: 'rainy',
  mood: 'normal',
  timeSlot: 'dinner',
  dietMode: 'none',
  dietOptions: { lowSodium: false, noLateNight: false, noAlcohol: false },
  excludeMenuIds: [],
})

console.log('추천 메뉴:')
test5.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.menu.name} - 비오는날: ${r.menu.weather.includes('rainy') ? '✅' : '❌'}`)
})

console.log('\n' + '='.repeat(50))
console.log('🏁 테스트 완료!\n')
