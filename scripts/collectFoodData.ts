/**
 * 네이버 블로그 검색 API를 활용해서
 * 날씨/기분별로 사람들이 실제로 먹는 음식 데이터를 수집하는 스크립트
 * 
 * 사용법: npx ts-node scripts/collectFoodData.ts
 */

const NAVER_CLIENT_ID = 'F97rK_kgbbcMf_27hmbY'
const NAVER_CLIENT_SECRET = 'e6GODe_fpn'

// 검색할 키워드들
const searchQueries = {
  weather: {
    rainy: ['비오는날 먹고싶은 음식', '비올때 먹는 음식', '장마철 음식 추천'],
    cold: ['추운날 먹고싶은 음식', '겨울 음식 추천', '추울때 먹는 음식'],
    hot: ['더운날 먹고싶은 음식', '여름 음식 추천', '더울때 먹는 음식', '시원한 음식'],
  },
  mood: {
    stressed: ['스트레스 받을때 먹는 음식', '스트레스 해소 음식', '화날때 먹는 음식'],
    sad: ['우울할때 먹는 음식', '기분 안좋을때 음식', '위로되는 음식'],
    tired: ['피곤할때 먹는 음식', '지칠때 먹는 음식', '보양식 추천'],
    happy: ['기분좋을때 먹는 음식', '특별한날 음식', '맛있는거 추천'],
  },
  diet: {
    diet: ['다이어트 음식 추천', '저칼로리 점심', '살안찌는 음식'],
    healthy: ['건강한 점심 추천', '영양가 있는 음식', '건강식 추천'],
  }
}

// 음식 키워드 추출을 위한 정규식
const foodKeywords = [
  '파전', '칼국수', '라면', '수제비', '부대찌개', '김치찌개', '된장찌개',
  '삼계탕', '냉면', '냉모밀', '콩국수', '비빔밥', '샐러드', '초밥', '회',
  '떡볶이', '치킨', '피자', '햄버거', '삼겹살', '곱창', '족발', '보쌈',
  '짜장면', '짬뽕', '탕수육', '마라탕', '훠궈', '스테이크', '파스타',
  '우동', '라멘', '돈까스', '카레', '국밥', '순대', '김밥', '분식',
  '샤브샤브', '전골', '찜닭', '닭볶음탕', '감자탕', '해장국', '설렁탕',
  '갈비탕', '육개장', '순두부', '청국장', '제육볶음', '불고기', '갈비',
  '쌀국수', '포케', '닭가슴살', '두부', '곤약'
]

async function searchBlog(query: string): Promise<string[]> {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=100`
  
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  })
  
  if (!response.ok) {
    console.error(`Failed to search: ${query}`)
    return []
  }
  
  const data = await response.json()
  
  // 제목과 설명에서 음식 키워드 추출
  const foundFoods: string[] = []
  
  for (const item of data.items) {
    const text = (item.title + ' ' + item.description).replace(/<[^>]*>/g, '')
    
    for (const food of foodKeywords) {
      if (text.includes(food) && !foundFoods.includes(food)) {
        foundFoods.push(food)
      }
    }
  }
  
  return foundFoods
}

async function collectData() {
  console.log('🔍 네이버 블로그에서 음식 데이터 수집 중...\n')
  
  const results: Record<string, Record<string, string[]>> = {
    weather: {},
    mood: {},
    diet: {},
  }
  
  // 날씨별 수집
  console.log('=== 날씨별 음식 ===')
  for (const [condition, queries] of Object.entries(searchQueries.weather)) {
    const allFoods: string[] = []
    for (const query of queries) {
      console.log(`  검색: "${query}"`)
      const foods = await searchBlog(query)
      allFoods.push(...foods)
      await sleep(100) // API 호출 간격
    }
    // 중복 제거 및 빈도순 정렬
    const foodCount = countOccurrences(allFoods)
    const topFoods = Object.entries(foodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([food]) => food)
    
    results.weather[condition] = topFoods
    console.log(`  → ${condition}: ${topFoods.join(', ')}\n`)
  }
  
  // 기분별 수집
  console.log('=== 기분별 음식 ===')
  for (const [mood, queries] of Object.entries(searchQueries.mood)) {
    const allFoods: string[] = []
    for (const query of queries) {
      console.log(`  검색: "${query}"`)
      const foods = await searchBlog(query)
      allFoods.push(...foods)
      await sleep(100)
    }
    const foodCount = countOccurrences(allFoods)
    const topFoods = Object.entries(foodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([food]) => food)
    
    results.mood[mood] = topFoods
    console.log(`  → ${mood}: ${topFoods.join(', ')}\n`)
  }
  
  // 식단별 수집
  console.log('=== 식단별 음식 ===')
  for (const [diet, queries] of Object.entries(searchQueries.diet)) {
    const allFoods: string[] = []
    for (const query of queries) {
      console.log(`  검색: "${query}"`)
      const foods = await searchBlog(query)
      allFoods.push(...foods)
      await sleep(100)
    }
    const foodCount = countOccurrences(allFoods)
    const topFoods = Object.entries(foodCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([food]) => food)
    
    results.diet[diet] = topFoods
    console.log(`  → ${diet}: ${topFoods.join(', ')}\n`)
  }
  
  // 결과 출력
  console.log('\n📊 === 최종 결과 ===\n')
  console.log(JSON.stringify(results, null, 2))
  
  return results
}

function countOccurrences(arr: string[]): Record<string, number> {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 실행
collectData().then(() => {
  console.log('\n✅ 수집 완료!')
}).catch(console.error)
