import { TimeSlot, MoodType, DietMode } from '@/store/userInputStore'
import menusData from '@/data/menus.json'

export interface Menu {
  id: string
  name: string
  category: string
  subCategory: string
  keywords: string[]
  weather: string[]
  mood: string[]
  timeSlot: string[]
  dietCompatible: string[]
  estimatedCalories: number
  isHighSodium: boolean
  isAlcoholRelated: boolean
  isVegan: boolean
  protein: string
  carbs: string
  controversial: boolean
  controversialReason?: string
  popularityScore?: number  // 실제 트렌드 기반 인기도 (0-100)
  trendNote?: string        // 트렌드 설명 (블로그/커뮤니티 분석 결과)
  searchKeywords: string[]
}

export interface RecommendationResult {
  menu: Menu
  score: number
  reasons: string[]
}

interface RecommendParams {
  weatherCondition: string
  mood: MoodType | null
  moodCustom: string
  timeSlot: TimeSlot
  dietMode: DietMode
  dietOptions: {
    lowSodium: boolean
    noLateNight: boolean
    noAlcohol: boolean
  }
  excludeMenuIds: string[]
}

// 날씨 코드를 추천 조건으로 변환
export function weatherCodeToCondition(code: number, temperature: number): string {
  // 비/눈
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy'
  if ([71, 73, 75, 77].includes(code)) return 'cold'
  if ([95, 96, 99].includes(code)) return 'rainy'
  
  // 온도 기반
  if (temperature >= 28) return 'hot'
  if (temperature >= 20) return 'sunny'
  if (temperature >= 10) return 'cloudy'
  return 'cold'
}

// 기분 키워드 분석
function analyzeMoodKeywords(customMood: string): MoodType[] {
  const moodKeywords: Record<MoodType, string[]> = {
    happy: ['기쁜', '좋은', '행복', '신나', '즐거운'],
    sad: ['우울', '슬픈', '기분 안', '꿀꿀', '울적'],
    stressed: ['스트레스', '짜증', '화나', '빡치', '열받', '회식', '해장'],
    tired: ['피곤', '지친', '힘든', '졸린', '기력', '보양'],
    special: ['특별', '기념일', '생일', '축하', '데이트'],
    normal: ['평범', '그냥', '아무거나'],
  }
  
  const result: MoodType[] = []
  const lowerMood = customMood.toLowerCase()
  
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerMood.includes(keyword))) {
      result.push(mood as MoodType)
    }
  }
  
  return result.length > 0 ? result : ['normal']
}

export function getRecommendations(params: RecommendParams): RecommendationResult[] {
  const {
    weatherCondition,
    mood,
    moodCustom,
    timeSlot,
    dietMode,
    dietOptions,
    excludeMenuIds,
  } = params
  
  const menus: Menu[] = menusData.menus as Menu[]
  const results: RecommendationResult[] = []
  
  // 기분 분석
  const effectiveMoods = mood ? [mood] : analyzeMoodKeywords(moodCustom)
  
  for (const menu of menus) {
    // 1. 제외 필터링 (부분 문자열 매칭 지원)
    // "찌개" 입력 시 김치찌개, 된장찌개 등 모두 제외
    const shouldExclude = excludeMenuIds.some(excludeText => {
      const lowerExclude = excludeText.toLowerCase()
      const lowerName = menu.name.toLowerCase()
      const lowerSubCategory = menu.subCategory.toLowerCase()
      const lowerKeywords = menu.keywords.map(k => k.toLowerCase())
      
      // ID 정확 매칭 OR 이름 포함 OR 카테고리 포함 OR 키워드 포함
      return menu.id === excludeText ||
             lowerName.includes(lowerExclude) ||
             lowerSubCategory.includes(lowerExclude) ||
             lowerKeywords.some(k => k.includes(lowerExclude))
    })
    if (shouldExclude) continue
    
    // 2. 시간대 필터링
    if (!menu.timeSlot.includes(timeSlot)) continue
    
    // 3. 식단 모드 필터링 (강화)
    if (dietMode !== 'none') {
      // 채식: 비건 음식만
      if (dietMode === 'vegan' && !menu.isVegan) continue
      // 키토: 고탄수화물 제외
      if (dietMode === 'keto' && menu.carbs === 'high') continue
      // 다이어트: dietCompatible에 'diet' 포함 또는 저칼로리(500 이하)만
      if (dietMode === 'diet') {
        const isDietFriendly = menu.dietCompatible.includes('diet') || menu.estimatedCalories <= 500
        if (!isDietFriendly) continue
      }
      // 벌크업: 고단백 메뉴만
      if (dietMode === 'bulk') {
        const isBulkFriendly = menu.dietCompatible.includes('bulk') || menu.protein === 'high'
        if (!isBulkFriendly) continue
      }
      // 저지방: dietCompatible에 'lowfat' 포함 또는 저칼로리
      if (dietMode === 'lowfat') {
        const isLowFatFriendly = menu.dietCompatible.includes('lowfat') || menu.estimatedCalories <= 450
        if (!isLowFatFriendly) continue
      }
      // 건강식: dietCompatible에 'healthy' 포함
      if (dietMode === 'healthy') {
        const isHealthyFriendly = menu.dietCompatible.includes('healthy')
        if (!isHealthyFriendly) continue
      }
    }
    
    // 4. 식단 옵션 필터링
    if (dietOptions.lowSodium && menu.isHighSodium) continue
    if (dietOptions.noAlcohol && menu.isAlcoholRelated) continue
    if (dietOptions.noLateNight && timeSlot === 'latenight' && menu.estimatedCalories > 500) continue
    
    // 점수 계산
    let score = 0
    const reasons: string[] = []
    
    // 🔥 실제 트렌드 기반 인기도 점수 (0-30점)
    // 블로그/커뮤니티 분석 결과 반영
    const popularityBonus = menu.popularityScore 
      ? Math.floor((menu.popularityScore / 100) * 30) 
      : 15 // 기본값
    score += popularityBonus
    
    // 날씨 점수 (0-25점) - 계절 반대 음식은 강하게 페널티!
    const isWeatherMatch = menu.weather.includes(weatherCondition)
    const isOppositeWeather = (
      (weatherCondition === 'cold' && menu.weather.includes('hot') && !menu.weather.includes('cold')) ||
      (weatherCondition === 'hot' && menu.weather.includes('cold') && !menu.weather.includes('hot'))
    )
    
    if (isWeatherMatch) {
      score += 25
      // 트렌드 노트가 있고 현재 날씨에 맞는 내용이면 표시
      const weatherKeywords = {
        cold: ['추운', '겨울', '뜨끈', '따뜻'],
        hot: ['더운', '여름', '시원', '냉'],
        rainy: ['비오는', '비 오는', '막걸리'],
      }
      const currentKeywords = weatherKeywords[weatherCondition as keyof typeof weatherKeywords] || []
      const matchesTrendWeather = menu.trendNote && currentKeywords.some(kw => menu.trendNote!.includes(kw))
      
      if (matchesTrendWeather) {
        reasons.push(`🔥 ${menu.trendNote}`)
      } else {
        reasons.push(`${getWeatherEmoji(weatherCondition)} 날씨에 딱 맞아요`)
      }
    } else if (isOppositeWeather) {
      // 계절 반대 음식은 큰 페널티 (한겨울 냉면, 한여름 찌개 등)
      score -= 20
    } else {
      score += 5 // 기본 점수 (낮춤)
    }
    
    // 기분 점수 (0-20점)
    const moodMatch = effectiveMoods.some(m => menu.mood.includes(m))
    if (moodMatch) {
      score += 20
      // 스트레스/우울 등 특정 기분에 맞는 트렌드 노트
      if (menu.trendNote && (menu.trendNote.includes('스트레스') || menu.trendNote.includes('우울') || menu.trendNote.includes('위로'))) {
        reasons.push(`💭 ${menu.trendNote}`)
      } else {
        reasons.push(`💭 지금 기분에 어울려요`)
      }
    } else {
      score += 5
    }
    
    // 식단 적합도 점수 (0-20점)
    if (dietMode !== 'none') {
      if (menu.dietCompatible.includes(dietMode)) {
        score += 20
        reasons.push(`🥗 ${getDietLabel(dietMode)}에 적합해요`)
      } else {
        score += 5
      }
    } else {
      score += 10
    }
    
    // 시간대 점수 (0-15점)
    score += 15 // 이미 필터링됨
    
    // 인기 메뉴 추가 이유 (트렌드 노트 활용)
    if (menu.popularityScore && menu.popularityScore >= 90 && !reasons.some(r => r.includes(menu.trendNote || ''))) {
      reasons.push(`📊 실제 인기 메뉴! (인기도 ${menu.popularityScore}점)`)
    }
    
    // 약간의 랜덤 요소 (0-5점) - 다양성 위해
    score += Math.floor(Math.random() * 5)
    
    results.push({ menu, score, reasons })
  }
  
  // 점수순 정렬
  results.sort((a, b) => b.score - a.score)
  
  // 상위 결과 선택
  let topResults = results.slice(0, 3)
  
  // 호불호 음식이 포함되어 있으면 대안 추가
  const hasControversial = topResults.some(r => r.menu.controversial)
  if (hasControversial) {
    // 호불호 아닌 메뉴 2개 추가
    const alternatives = results
      .filter(r => !r.menu.controversial && !topResults.includes(r))
      .slice(0, 2)
    topResults = [...topResults, ...alternatives]
  }
  
  return topResults
}

function getWeatherEmoji(condition: string): string {
  const emojis: Record<string, string> = {
    hot: '☀️ 더운',
    sunny: '🌤️ 맑은',
    cloudy: '⛅ 흐린',
    rainy: '🌧️ 비오는',
    cold: '❄️ 추운',
  }
  return emojis[condition] || '🌤️'
}

function getDietLabel(mode: DietMode): string {
  const labels: Record<DietMode, string> = {
    diet: '다이어트',
    bulk: '벌크업',
    keto: '저탄고지',
    lowfat: '저지방',
    vegan: '채식',
    healthy: '건강식',
    none: '',
  }
  return labels[mode]
}
