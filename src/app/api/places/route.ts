import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  console.log('=== Places API Called (Naver) ===')
  console.log('Query:', query)

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
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=comment`
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

    const places = data.items.map((item: any) => {
      const placeName = item.title.replace(/<[^>]*>/g, '') // HTML 태그 제거
      const address = item.roadAddress || item.address
      
      // 네이버 지도 검색 링크 생성 (리뷰, 지도, 상세정보 바로 확인 가능)
      const naverMapLink = `https://map.naver.com/p/search/${encodeURIComponent(placeName + ' ' + address)}`
      
      return {
        place_name: placeName,
        address_name: address,
        phone: item.telephone,
        category: item.category,
        link: naverMapLink, // 네이버 지도 링크로 변경!
      }
    })

    return NextResponse.json({ places })
  } catch (error) {
    console.error('❌ Naver API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
