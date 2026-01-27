/**
 * 🔄 주간 트렌드 자동 업데이트 스크립트
 * 
 * 네이버 블로그 검색 API를 활용해서 음식 트렌드를 수집하고
 * menus.json의 popularityScore와 trendNote를 업데이트합니다.
 * 
 * GitHub Actions에서 매주 자동 실행됩니다.
 */

const fs = require('fs')
const path = require('path')

// 환경변수 또는 하드코딩 (GitHub Secrets 사용 권장)
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'F97rK_kgbbcMf_27hmbY'
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'e6GODe_fpn'

// 검색 키워드 설정
const trendQueries = {
  weather: {
    rainy: ['비오는날 먹고싶은 음식', '비올때 먹는 음식 추천'],
    cold: ['추운날 먹고싶은 음식', '겨울 음식 추천'],
    hot: ['더운날 먹고싶은 음식', '여름 음식 추천', '시원한 음식'],
  },
  mood: {
    stressed: ['스트레스 받을때 먹는 음식', '스트레스 해소 음식'],
    sad: ['우울할때 먹는 음식', '위로되는 음식 추천'],
    tired: ['피곤할때 먹는 음식', '보양식 추천'],
    happy: ['기분좋을때 먹는 음식', '특별한날 음식'],
  }
}

// 메뉴 이름 → ID 매핑 (부분 매칭)
const menuNamePatterns = {
  '파전': 'pajeon',
  '부침개': 'buchimgae',
  '전': 'buchimgae',
  '칼국수': 'kalguksu',
  '수제비': 'sujebi',
  '라면': 'ramyun',
  '김치찌개': 'kimchi-jjigae',
  '된장찌개': 'doenjang-jjigae',
  '부대찌개': 'budae-jjigae',
  '순두부': 'sundubu',
  '국밥': 'gukbap',
  '설렁탕': 'seolleongtang',
  '감자탕': 'gamjatang',
  '육개장': 'yukgaejang',
  '삼계탕': 'samgyetang',
  '냉면': 'naengmyeon',
  '콩국수': 'kongguksu',
  '물회': 'mulhoe',
  '초밥': 'sushi',
  '회': 'sashimi',
  '떡볶이': 'tteokbokki',
  '치킨': 'chicken',
  '삼겹살': 'samgyeopsal',
  '곱창': 'gopchang',
  '마라탕': 'malatang',
  '짜장면': 'jjajangmyeon',
  '짬뽕': 'jjamppong',
  '비빔밥': 'bibimbap',
  '돈까스': 'donkatsu',
  '우동': 'udon',
  '라멘': 'ramen',
  '파스타': 'pasta',
  '피자': 'pizza',
  '햄버거': 'burger',
  '스테이크': 'steak',
  '샐러드': 'salad',
  '족발': 'jokbal',
  '보쌈': 'bossam',
  '장어': 'jangeo',
  '샤브샤브': 'shabu',
  '카레': 'curry',
}

async function searchBlog(query) {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=100&sort=sim`
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    })
    
    if (!response.ok) {
      console.error(`API 오류: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error(`검색 실패: ${query}`, error.message)
    return []
  }
}

function extractFoodMentions(items) {
  const mentions = {}
  
  for (const item of items) {
    const text = (item.title + ' ' + item.description)
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
    
    for (const [foodName, menuId] of Object.entries(menuNamePatterns)) {
      if (text.includes(foodName.toLowerCase())) {
        mentions[menuId] = (mentions[menuId] || 0) + 1
      }
    }
  }
  
  return mentions
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function collectTrends() {
  console.log('🔍 트렌드 데이터 수집 시작...\n')
  
  const trendData = {
    weather: { rainy: {}, cold: {}, hot: {} },
    mood: { stressed: {}, sad: {}, tired: {}, happy: {} },
  }
  
  // 날씨별 트렌드 수집
  for (const [condition, queries] of Object.entries(trendQueries.weather)) {
    console.log(`📌 날씨: ${condition}`)
    for (const query of queries) {
      console.log(`   검색: "${query}"`)
      const items = await searchBlog(query)
      const mentions = extractFoodMentions(items)
      
      for (const [menuId, count] of Object.entries(mentions)) {
        trendData.weather[condition][menuId] = (trendData.weather[condition][menuId] || 0) + count
      }
      
      await sleep(150) // API 속도 제한 준수
    }
  }
  
  // 기분별 트렌드 수집
  for (const [mood, queries] of Object.entries(trendQueries.mood)) {
    console.log(`📌 기분: ${mood}`)
    for (const query of queries) {
      console.log(`   검색: "${query}"`)
      const items = await searchBlog(query)
      const mentions = extractFoodMentions(items)
      
      for (const [menuId, count] of Object.entries(mentions)) {
        trendData.mood[mood][menuId] = (trendData.mood[mood][menuId] || 0) + count
      }
      
      await sleep(150)
    }
  }
  
  return trendData
}

function generateTrendNote(menuId, trendData) {
  const notes = []
  
  // 날씨별 인기도 확인
  for (const [condition, data] of Object.entries(trendData.weather)) {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])
    const rank = sorted.findIndex(([id]) => id === menuId) + 1
    
    if (rank > 0 && rank <= 5) {
      const conditionNames = { rainy: '비오는날', cold: '추운날', hot: '더운날' }
      notes.push(`${conditionNames[condition]} TOP${rank}`)
    }
  }
  
  // 기분별 인기도 확인
  for (const [mood, data] of Object.entries(trendData.mood)) {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])
    const rank = sorted.findIndex(([id]) => id === menuId) + 1
    
    if (rank > 0 && rank <= 5) {
      const moodNames = { stressed: '스트레스 해소', sad: '위로 음식', tired: '보양식', happy: '기분좋을때' }
      notes.push(`${moodNames[mood]} TOP${rank}`)
    }
  }
  
  return notes.length > 0 ? notes.join(', ') : null
}

function calculatePopularityScore(menuId, trendData) {
  let totalMentions = 0
  
  for (const data of Object.values(trendData.weather)) {
    totalMentions += data[menuId] || 0
  }
  for (const data of Object.values(trendData.mood)) {
    totalMentions += data[menuId] || 0
  }
  
  // 0-100 스케일로 정규화 (최대 500회 언급 기준)
  const score = Math.min(100, Math.round((totalMentions / 500) * 100))
  return Math.max(50, score) // 최소 50점
}

async function updateMenusJson(trendData) {
  const menusPath = path.join(__dirname, '../src/data/menus.json')
  const menusData = JSON.parse(fs.readFileSync(menusPath, 'utf-8'))
  
  // 업데이트 날짜 기록
  menusData.dataSource.lastUpdated = new Date().toISOString().split('T')[0]
  menusData.dataSource.description = '네이버 블로그/커뮤니티 자동 분석 (주간 업데이트)'
  
  let updatedCount = 0
  
  for (const menu of menusData.menus) {
    const newTrendNote = generateTrendNote(menu.id, trendData)
    const newPopularityScore = calculatePopularityScore(menu.id, trendData)
    
    if (newTrendNote) {
      menu.trendNote = `📊 이번주 트렌드: ${newTrendNote}`
      menu.popularityScore = newPopularityScore
      updatedCount++
      console.log(`✅ ${menu.name}: ${menu.trendNote} (${menu.popularityScore}점)`)
    }
  }
  
  fs.writeFileSync(menusPath, JSON.stringify(menusData, null, 2), 'utf-8')
  console.log(`\n📝 ${updatedCount}개 메뉴 트렌드 업데이트 완료!`)
}

// 메인 실행
async function main() {
  console.log('=' .repeat(50))
  console.log('🔄 FoodFit 주간 트렌드 자동 업데이트')
  console.log('=' .repeat(50))
  console.log(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}\n`)
  
  try {
    const trendData = await collectTrends()
    await updateMenusJson(trendData)
    console.log('\n✅ 트렌드 업데이트 완료!')
  } catch (error) {
    console.error('❌ 업데이트 실패:', error)
    process.exit(1)
  }
}

main()
