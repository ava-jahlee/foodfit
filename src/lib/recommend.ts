import { TimeSlot, MoodType, DietMode, FoodCategory } from '@/store/userInputStore'
import menusData from '@/data/menus.json'

// 카테고리 그룹 매핑
const CATEGORY_GROUPS: Record<FoodCategory, string[]> = {
  all: [], // 전체는 필터링 안함
  korean: ['한식', '분식'],
  western: ['양식', '건강식', '브런치'],
  asian: ['일식', '중식', '아시안'],
  light: ['카페', '간식', '샐러드', '건강식'],
}

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

// 데이터 신뢰도 타입
export type DataConfidence = 'high' | 'medium' | 'low'

// 메뉴별 데이터 신뢰도 판단
export function getMenuDataConfidence(menuName: string): DataConfidence {
  // WEATHER_CORRELATION에 있으면 트렌드 분석 데이터 있음 = high
  if (WEATHER_CORRELATION[menuName]) {
    return 'high'
  }
  // WEEKEND_PREFERENCE에 있으면 주말/평일 데이터 있음 = medium
  if (WEEKEND_PREFERENCE[menuName]) {
    return 'medium'
  }
  // 둘 다 없으면 기본 로직만 = low
  return 'low'
}

export interface RecommendationResult {
  menu: Menu
  score: number
  reasons: string[]
  dataConfidence: DataConfidence  // 추천 신뢰도
}

interface RecommendParams {
  weatherCondition: string
  temperature: number       // 기온 (°C)
  humidity: number          // 습도 (%)
  precipitation: number     // 강수량 (mm)
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
  foodCategory: FoodCategory
  adventureMode: boolean
  isWeekend?: boolean       // 주말 여부
  isHoliday?: boolean       // 공휴일 여부
}

// ========================================
// 주말/평일 가중치 (예상 선호도 기반)
// 양수: 주말 선호 / 음수: 평일 선호
// ========================================
const WEEKEND_PREFERENCE: Record<string, number> = {
  // 주말에 더 인기 (외식, 여유, 특별한 날)
  '삼겹살': 0.4,
  '스테이크': 0.5,
  '회': 0.5,
  '초밥': 0.4,
  '파스타': 0.3,
  '피자': 0.3,
  '치킨': 0.25,
  '족발': 0.35,
  '보쌈': 0.35,
  '곱창': 0.4,
  '막창': 0.4,
  '양꼬치': 0.35,
  '샤브샤브': 0.3,
  '뷔페': 0.5,
  '브런치': 0.4,
  '파전': 0.3,      // 주말에 막걸리와 함께
  '막걸리': 0.35,
  
  // 평일에 더 인기 (빠른 식사, 간편)
  '김밥': -0.3,
  '라면': -0.2,
  '국밥': -0.25,
  '김치찌개': -0.15,
  '된장찌개': -0.15,
  '백반': -0.3,
  '비빔밥': -0.2,
  '제육볶음': -0.15,
  '돈까스': -0.1,
  '우동': -0.2,
  '샌드위치': -0.25,
  '샐러드': -0.2,
  
  // 중립 (계절/날씨 영향이 더 큼)
  '냉면': 0,
  '빙수': 0.1,
  '설렁탕': -0.1,
  '칼국수': 0,
}

// 공휴일 가중치 (공휴일에 더 인기인 음식)
const HOLIDAY_PREFERENCE: Record<string, number> = {
  '치킨': 0.4,
  '피자': 0.35,
  '삼겹살': 0.3,
  '족발': 0.35,
  '보쌈': 0.35,
  '파전': 0.3,
  '막걸리': 0.3,
  '라면': 0.2,    // 집콕할 때
}

// 다변량 분석 기반 날씨 가중치 (구글 트렌드 분석 결과)
const WEATHER_CORRELATION: Record<string, { tempCoef: number; humidityCoef: number; rainCoef: number }> = {
  // 시원한 음식 (더울수록, 습할수록 인기)
  '냉면': { tempCoef: 0.86, humidityCoef: 0.83, rainCoef: 0.87 },
  '빙수': { tempCoef: 0.84, humidityCoef: 0.93, rainCoef: 0.92 },
  '콩국수': { tempCoef: 0.82, humidityCoef: 0.87, rainCoef: 0.88 },
  '아이스아메리카노': { tempCoef: 0.85, humidityCoef: 0.81, rainCoef: 0.89 },
  '막국수': { tempCoef: 0.90, humidityCoef: 0.88, rainCoef: 0.88 },
  '밀면': { tempCoef: 0.85, humidityCoef: 0.80, rainCoef: 0.87 },
  '삼계탕': { tempCoef: 0.70, humidityCoef: 0.86, rainCoef: 0.85 },
  // 국물 음식 (추울수록 인기)
  '김치찌개': { tempCoef: -0.62, humidityCoef: -0.50, rainCoef: -0.51 },
  '설렁탕': { tempCoef: -0.43, humidityCoef: -0.18, rainCoef: -0.21 },
  '칼국수': { tempCoef: -0.55, humidityCoef: -0.38, rainCoef: -0.39 },
  '국밥': { tempCoef: -0.38, humidityCoef: 0.18, rainCoef: 0.18 },
  '라면': { tempCoef: -0.28, humidityCoef: -0.07, rainCoef: -0.12 },
  // 기타
  '파전': { tempCoef: 0.42, humidityCoef: 0.17, rainCoef: 0.06 },
  '막걸리': { tempCoef: 0.26, humidityCoef: -0.01, rainCoef: 0.01 },
  '치킨': { tempCoef: 0.20, humidityCoef: 0.28, rainCoef: 0.31 },
  '아메리카노': { tempCoef: 0.75, humidityCoef: 0.59, rainCoef: 0.50 },
  '라떼': { tempCoef: -0.41, humidityCoef: -0.42, rainCoef: -0.41 },
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
    temperature,
    humidity,
    precipitation,
    mood,
    moodCustom,
    timeSlot,
    dietMode,
    dietOptions,
    excludeMenuIds,
    foodCategory,
    adventureMode,
  } = params
  
  const menus: Menu[] = menusData.menus as Menu[]
  const results: RecommendationResult[] = []
  
  // 기분 분석
  const effectiveMoods = mood ? [mood] : analyzeMoodKeywords(moodCustom)
  
  // 카테고리 필터 목록
  const categoryFilter = CATEGORY_GROUPS[foodCategory]
  
  // 🔥 다변량 점수 계산 함수
  const calculateMultivariateScore = (menuName: string): { score: number; reason: string | null } => {
    const correlation = WEATHER_CORRELATION[menuName]
    if (!correlation) return { score: 0, reason: null }
    
    // 온도 정규화: -10°C ~ 35°C → -1 ~ 1
    const normalizedTemp = (temperature - 12.5) / 22.5
    // 습도 정규화: 30% ~ 90% → -1 ~ 1
    const normalizedHumidity = (humidity - 60) / 30
    // 강수량: 0mm = 0, 10mm+ = 1
    const normalizedRain = Math.min(precipitation / 10, 1)
    
    // 다변량 점수 계산 (최대 15점)
    const tempScore = correlation.tempCoef * normalizedTemp * 5
    const humidityScore = correlation.humidityCoef * normalizedHumidity * 5
    const rainScore = correlation.rainCoef * normalizedRain * 5
    
    const totalScore = tempScore + humidityScore + rainScore
    
    // 이유 생성
    let reason: string | null = null
    if (Math.abs(totalScore) > 5) {
      if (totalScore > 0) {
        if (humidity > 70 && correlation.humidityCoef > 0.5) {
          reason = '🌡️ 습한 날씨에 딱 맞는 메뉴!'
        } else if (temperature > 25 && correlation.tempCoef > 0.5) {
          reason = '☀️ 더운 날씨에 최고의 선택!'
        } else if (precipitation > 0 && correlation.rainCoef > 0.5) {
          reason = '🌧️ 비 오는 날 생각나는 메뉴'
        }
      } else {
        if (temperature < 10 && correlation.tempCoef < -0.3) {
          reason = '❄️ 추운 날씨에 딱인 따끈한 메뉴!'
        }
      }
    }
    
    return { score: totalScore, reason }
  }
  
  for (const menu of menus) {
    // 0. 카테고리 필터링 (all이 아닌 경우)
    if (foodCategory !== 'all' && categoryFilter.length > 0) {
      if (!categoryFilter.includes(menu.category)) continue
    }
    
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
    
    // 🔥 인기도 점수 (0-30점)
    // 모험 모드: 인기도 낮은 메뉴에 보너스!
    if (adventureMode) {
      // 인기도가 낮을수록 점수 높음 (희귀템 발굴)
      const rarityBonus = menu.popularityScore 
        ? Math.floor((100 - menu.popularityScore) / 100 * 30) + 15 // 낮은 인기도 = 높은 점수
        : 25 // 인기도 없는 메뉴는 새로운 메뉴일 가능성
      score += rarityBonus
      
      // 이국적 카테고리 추가 보너스
      if (['아시안', '양식'].includes(menu.category)) {
        score += 10
      }
    } else {
      // 일반 모드: 블로그/커뮤니티 분석 결과 반영
    const popularityBonus = menu.popularityScore 
      ? Math.floor((menu.popularityScore / 100) * 30) 
      : 15 // 기본값
    score += popularityBonus
    }
    
    // 🔥 다변량 날씨 점수 (구글 트렌드 분석 기반)
    const multivariateResult = calculateMultivariateScore(menu.name)
    score += multivariateResult.score
    if (multivariateResult.reason) {
      reasons.push(multivariateResult.reason)
    }
    
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
    
    // 📅 주말/평일 점수 (최대 ±10점)
    if (params.isWeekend !== undefined || params.isHoliday !== undefined) {
      const weekendPref = WEEKEND_PREFERENCE[menu.name] || 0
      const holidayPref = HOLIDAY_PREFERENCE[menu.name] || 0
      
      if (params.isHoliday) {
        // 공휴일: 공휴일 선호도 적용 + 주말 선호도 절반
        const holidayScore = holidayPref * 15 + weekendPref * 5
        score += holidayScore
        if (holidayScore > 5) {
          reasons.push('🎉 공휴일에 인기 메뉴!')
        }
      } else if (params.isWeekend) {
        // 주말: 주말 선호도 적용
        const weekendScore = weekendPref * 10
        score += weekendScore
        if (weekendScore > 3) {
          reasons.push('📅 주말에 딱 맞는 메뉴')
        } else if (weekendScore < -2) {
          // 평일 음식은 주말에 살짝 페널티 (하지만 제외는 안함)
        }
      } else {
        // 평일: 반대로 적용
        const weekdayScore = -weekendPref * 8
        score += weekdayScore
        if (weekdayScore > 2) {
          reasons.push('⚡ 평일 점심으로 딱!')
        }
      }
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
    
    const confidence = getMenuDataConfidence(menu.name)
    results.push({ menu, score, reasons, dataConfidence: confidence })
  }
  
  // 점수순 정렬
  results.sort((a, b) => b.score - a.score)
  
  // 상위 결과 선택 (10개)
  let topResults = results.slice(0, 7)
  
  // 호불호 음식이 포함되어 있으면 대안 추가
  const hasControversial = topResults.some(r => r.menu.controversial)
  if (hasControversial) {
    // 호불호 아닌 메뉴 3개 추가
    const alternatives = results
      .filter(r => !r.menu.controversial && !topResults.includes(r))
      .slice(0, 3)
    topResults = [...topResults, ...alternatives]
  }
  
  return topResults.slice(0, 10) // 최대 10개
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
