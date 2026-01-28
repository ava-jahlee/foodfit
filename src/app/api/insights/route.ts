import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/trend-analysis.json')
    
    // 파일이 없으면 기본 데이터 반환
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(getDefaultData())
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to load trend analysis:', error)
    return NextResponse.json(getDefaultData())
  }
}

// 기본 데이터 (분석 파일이 없을 때)
function getDefaultData() {
  return {
    generatedAt: new Date().toISOString(),
    monthlyTemp: {
      "1": -2, "2": 1, "3": 7, "4": 13, "5": 18, "6": 23,
      "7": 27, "8": 28, "9": 23, "10": 16, "11": 8, "12": 1
    },
    monthlyRainyDays: {
      "1": 6, "2": 5, "3": 7, "4": 9, "5": 9, "6": 11,
      "7": 16, "8": 14, "9": 10, "10": 6, "11": 8, "12": 7
    },
    trends: [
      {
        keyword: "냉면",
        monthlyValues: [
          { month: 1, value: 20 }, { month: 2, value: 25 }, { month: 3, value: 35 },
          { month: 4, value: 45 }, { month: 5, value: 60 }, { month: 6, value: 85 },
          { month: 7, value: 100 }, { month: 8, value: 95 }, { month: 9, value: 65 },
          { month: 10, value: 40 }, { month: 11, value: 25 }, { month: 12, value: 20 }
        ],
        correlationWithTemp: 0.86,
        correlationWithRain: 0.87
      },
      {
        keyword: "빙수",
        monthlyValues: [
          { month: 1, value: 15 }, { month: 2, value: 18 }, { month: 3, value: 25 },
          { month: 4, value: 35 }, { month: 5, value: 55 }, { month: 6, value: 89 },
          { month: 7, value: 95 }, { month: 8, value: 90 }, { month: 9, value: 60 },
          { month: 10, value: 30 }, { month: 11, value: 20 }, { month: 12, value: 15 }
        ],
        correlationWithTemp: 0.84,
        correlationWithRain: 0.92
      },
      {
        keyword: "콩국수",
        monthlyValues: [
          { month: 1, value: 10 }, { month: 2, value: 12 }, { month: 3, value: 20 },
          { month: 4, value: 35 }, { month: 5, value: 55 }, { month: 6, value: 80 },
          { month: 7, value: 95 }, { month: 8, value: 85 }, { month: 9, value: 50 },
          { month: 10, value: 25 }, { month: 11, value: 15 }, { month: 12, value: 10 }
        ],
        correlationWithTemp: 0.82,
        correlationWithRain: 0.88
      },
      {
        keyword: "아이스아메리카노",
        monthlyValues: [
          { month: 1, value: 40 }, { month: 2, value: 45 }, { month: 3, value: 55 },
          { month: 4, value: 65 }, { month: 5, value: 80 }, { month: 6, value: 95 },
          { month: 7, value: 100 }, { month: 8, value: 98 }, { month: 9, value: 85 },
          { month: 10, value: 65 }, { month: 11, value: 50 }, { month: 12, value: 42 }
        ],
        correlationWithTemp: 0.85,
        correlationWithRain: 0.89
      },
      {
        keyword: "삼계탕",
        monthlyValues: [
          { month: 1, value: 30 }, { month: 2, value: 32 }, { month: 3, value: 38 },
          { month: 4, value: 45 }, { month: 5, value: 55 }, { month: 6, value: 75 },
          { month: 7, value: 100 }, { month: 8, value: 90 }, { month: 9, value: 55 },
          { month: 10, value: 40 }, { month: 11, value: 35 }, { month: 12, value: 30 }
        ],
        correlationWithTemp: 0.70,
        correlationWithRain: 0.85
      },
      {
        keyword: "김치찌개",
        monthlyValues: [
          { month: 1, value: 90 }, { month: 2, value: 85 }, { month: 3, value: 75 },
          { month: 4, value: 65 }, { month: 5, value: 55 }, { month: 6, value: 50 },
          { month: 7, value: 48 }, { month: 8, value: 50 }, { month: 9, value: 55 },
          { month: 10, value: 70 }, { month: 11, value: 81 }, { month: 12, value: 92 }
        ],
        correlationWithTemp: -0.62,
        correlationWithRain: 0.15
      },
      {
        keyword: "설렁탕",
        monthlyValues: [
          { month: 1, value: 80 }, { month: 2, value: 84 }, { month: 3, value: 70 },
          { month: 4, value: 60 }, { month: 5, value: 55 }, { month: 6, value: 50 },
          { month: 7, value: 52 }, { month: 8, value: 83 }, { month: 9, value: 84 },
          { month: 10, value: 75 }, { month: 11, value: 78 }, { month: 12, value: 82 }
        ],
        correlationWithTemp: -0.43,
        correlationWithRain: 0.20
      },
      {
        keyword: "칼국수",
        monthlyValues: [
          { month: 1, value: 85 }, { month: 2, value: 80 }, { month: 3, value: 70 },
          { month: 4, value: 60 }, { month: 5, value: 55 }, { month: 6, value: 52 },
          { month: 7, value: 55 }, { month: 8, value: 58 }, { month: 9, value: 62 },
          { month: 10, value: 70 }, { month: 11, value: 75 }, { month: 12, value: 80 }
        ],
        correlationWithTemp: -0.55,
        correlationWithRain: 0.10
      },
      {
        keyword: "파전",
        monthlyValues: [
          { month: 1, value: 55 }, { month: 2, value: 58 }, { month: 3, value: 62 },
          { month: 4, value: 68 }, { month: 5, value: 72 }, { month: 6, value: 78 },
          { month: 7, value: 85 }, { month: 8, value: 80 }, { month: 9, value: 72 },
          { month: 10, value: 65 }, { month: 11, value: 60 }, { month: 12, value: 55 }
        ],
        correlationWithTemp: 0.42,
        correlationWithRain: 0.28
      },
      {
        keyword: "막걸리",
        monthlyValues: [
          { month: 1, value: 60 }, { month: 2, value: 65 }, { month: 3, value: 78 },
          { month: 4, value: 82 }, { month: 5, value: 81 }, { month: 6, value: 75 },
          { month: 7, value: 72 }, { month: 8, value: 70 }, { month: 9, value: 75 },
          { month: 10, value: 84 }, { month: 11, value: 70 }, { month: 12, value: 62 }
        ],
        correlationWithTemp: 0.15,
        correlationWithRain: 0.22
      },
      {
        keyword: "라면",
        monthlyValues: [
          { month: 1, value: 75 }, { month: 2, value: 72 }, { month: 3, value: 68 },
          { month: 4, value: 65 }, { month: 5, value: 62 }, { month: 6, value: 58 },
          { month: 7, value: 55 }, { month: 8, value: 56 }, { month: 9, value: 60 },
          { month: 10, value: 65 }, { month: 11, value: 70 }, { month: 12, value: 78 }
        ],
        correlationWithTemp: -0.28,
        correlationWithRain: 0.05
      },
      {
        keyword: "치킨",
        monthlyValues: [
          { month: 1, value: 70 }, { month: 2, value: 72 }, { month: 3, value: 75 },
          { month: 4, value: 78 }, { month: 5, value: 80 }, { month: 6, value: 85 },
          { month: 7, value: 90 }, { month: 8, value: 88 }, { month: 9, value: 82 },
          { month: 10, value: 78 }, { month: 11, value: 75 }, { month: 12, value: 72 }
        ],
        correlationWithTemp: 0.25,
        correlationWithRain: 0.31
      },
      {
        keyword: "삼겹살",
        monthlyValues: [
          { month: 1, value: 70 }, { month: 2, value: 75 }, { month: 3, value: 100 },
          { month: 4, value: 85 }, { month: 5, value: 80 }, { month: 6, value: 75 },
          { month: 7, value: 72 }, { month: 8, value: 70 }, { month: 9, value: 75 },
          { month: 10, value: 78 }, { month: 11, value: 80 }, { month: 12, value: 75 }
        ],
        correlationWithTemp: -0.15,
        correlationWithRain: 0.08
      },
      {
        keyword: "피자",
        monthlyValues: [
          { month: 1, value: 68 }, { month: 2, value: 70 }, { month: 3, value: 72 },
          { month: 4, value: 75 }, { month: 5, value: 78 }, { month: 6, value: 80 },
          { month: 7, value: 82 }, { month: 8, value: 80 }, { month: 9, value: 78 },
          { month: 10, value: 75 }, { month: 11, value: 72 }, { month: 12, value: 70 }
        ],
        correlationWithTemp: 0.18,
        correlationWithRain: 0.12
      },
      {
        keyword: "국밥",
        monthlyValues: [
          { month: 1, value: 82 }, { month: 2, value: 78 }, { month: 3, value: 70 },
          { month: 4, value: 65 }, { month: 5, value: 60 }, { month: 6, value: 55 },
          { month: 7, value: 52 }, { month: 8, value: 54 }, { month: 9, value: 58 },
          { month: 10, value: 68 }, { month: 11, value: 75 }, { month: 12, value: 80 }
        ],
        correlationWithTemp: -0.38,
        correlationWithRain: 0.18
      }
    ]
  }
}
