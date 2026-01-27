import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 선택 로그 데이터 타입
export interface SelectionLog {
  id?: string
  created_at?: string
  weather_condition: string      // 날씨 (cold, hot, rainy 등)
  temperature: number            // 온도
  mood: string                   // 기분 (happy, sad, stressed 등)
  mood_custom?: string           // 자유 입력 기분
  time_slot: string              // 시간대 (lunch, dinner, latenight)
  diet_mode: string              // 식단 모드
  selected_menu: string          // 선택한 메뉴 이름
  selected_menu_category: string // 메뉴 카테고리
  location: string               // 위치
  was_recommended: boolean       // 추천 목록에 있었는지
}

// 선택 로그 저장
export async function saveSelectionLog(log: Omit<SelectionLog, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('selection_logs')
    .insert([log])
    .select()

  if (error) {
    console.error('Error saving selection log:', error)
    return null
  }
  
  return data
}

// 통계 데이터 조회 (날씨별 메뉴 선택 빈도)
export async function getWeatherMenuStats() {
  const { data, error } = await supabase
    .from('selection_logs')
    .select('weather_condition, selected_menu, selected_menu_category')
  
  if (error) {
    console.error('Error fetching stats:', error)
    return null
  }

  // 날씨별 메뉴 선택 빈도 계산
  const stats: Record<string, Record<string, number>> = {}
  
  data?.forEach(log => {
    if (!stats[log.weather_condition]) {
      stats[log.weather_condition] = {}
    }
    if (!stats[log.weather_condition][log.selected_menu]) {
      stats[log.weather_condition][log.selected_menu] = 0
    }
    stats[log.weather_condition][log.selected_menu]++
  })

  return stats
}

// 기분별 메뉴 선택 빈도
export async function getMoodMenuStats() {
  const { data, error } = await supabase
    .from('selection_logs')
    .select('mood, selected_menu, selected_menu_category')
  
  if (error) {
    console.error('Error fetching mood stats:', error)
    return null
  }

  const stats: Record<string, Record<string, number>> = {}
  
  data?.forEach(log => {
    if (!stats[log.mood]) {
      stats[log.mood] = {}
    }
    if (!stats[log.mood][log.selected_menu]) {
      stats[log.mood][log.selected_menu] = 0
    }
    stats[log.mood][log.selected_menu]++
  })

  return stats
}
