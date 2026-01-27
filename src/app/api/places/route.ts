import { NextRequest, NextResponse } from 'next/server'

// 카텍(KATEC) 좌표 → WGS84 변환 (근사 변환)
function katecToWgs84(mapx: number, mapy: number): { lat: number; lng: number } {
  // 네이버 mapx, mapy는 카텍 좌표계 (단위: 1/10,000,000)
  // 정확한 변환은 복잡하지만, 한국 내에서는 이 근사식이 충분히 정확함
  const x = mapx / 10000000
  const y = mapy / 10000000
  
  // 카텍 → WGS84 근사 변환 (한반도 기준)
  const lng = x
  const lat = y
  
  return { lat, lng }
}

// 두 좌표 간 거리 계산 (Haversine 공식, km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반경 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 거리 포맷팅
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const userLat = parseFloat(searchParams.get('lat') || '0')
  const userLng = parseFloat(searchParams.get('lng') || '0')

  console.log('=== Places API Called (Naver) ===')
  console.log('Query:', query)
  console.log('User Location:', userLat, userLng)

  if (!query) {
    console.error('Missing query parameter')
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

  console.log('NAVER_CLIENT_ID exists:', !!NAVER_CLIENT_ID)

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error('❌ Naver API keys not set in .env.local!')
    return NextResponse.json({ error: 'API keys not configured' }, { status: 500 })
  }

  try {
    // 더 많이 가져와서 거리순 정렬 후 상위 5개만 반환
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=20&sort=comment`
    console.log('Naver API URL:', url)

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    })

    console.log('Naver API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Naver API Error Response:', errorText)
      throw new Error(`Naver API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Naver API Result Count:', data.items?.length || 0)

    let places = data.items.map((item: any) => {
      const placeName = item.title.replace(/<[^>]*>/g, '') // HTML 태그 제거
      const address = item.roadAddress || item.address
      
      // 좌표 변환 (네이버는 KATECH 좌표계, 큰 숫자로 옴)
      const mapx = parseInt(item.mapx) || 0
      const mapy = parseInt(item.mapy) || 0
      
      console.log(`Place: ${placeName}, mapx: ${mapx}, mapy: ${mapy}`)
      
      const { lat, lng } = katecToWgs84(mapx, mapy)
      console.log(`Converted: lat=${lat}, lng=${lng}`)
      
      // 거리 계산 (사용자 위치가 있을 때만)
      let distance = Infinity
      let distanceText = ''
      if (userLat && userLng && lat && lng) {
        distance = calculateDistance(userLat, userLng, lat, lng)
        distanceText = formatDistance(distance)
      }
      
      // 네이버 지도 검색 링크 생성 (가게 이름만으로 검색)
      const naverMapLink = `https://map.naver.com/p/search/${encodeURIComponent(placeName)}`
      
      return {
        place_name: placeName,
        address_name: address,
        phone: item.telephone,
        category: item.category,
        link: naverMapLink,
        distance,
        distanceText,
        lat,
        lng,
      }
    })

    // 거리순 정렬 (가까운 순)
    if (userLat && userLng) {
      places = places
        .filter((p: any) => p.distance < 50) // 50km 이내만
        .sort((a: any, b: any) => a.distance - b.distance)
    }

    // 상위 5개만 반환
    places = places.slice(0, 5)

    console.log('Sorted places:', places.map((p: any) => `${p.place_name} (${p.distanceText})`))

    return NextResponse.json({ places })
  } catch (error) {
    console.error('❌ Naver API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
