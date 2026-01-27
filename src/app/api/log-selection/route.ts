import { NextRequest, NextResponse } from 'next/server'
import { saveSelectionLog, SelectionLog } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body: Omit<SelectionLog, 'id' | 'created_at'> = await request.json()

    console.log('=== Selection Log Received ===')
    console.log('Menu:', body.selected_menu)
    console.log('Weather:', body.weather_condition, body.temperature + '°C')
    console.log('Mood:', body.mood)
    console.log('Location:', body.location)

    // Supabase가 설정되어 있으면 저장
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const result = await saveSelectionLog(body)
      
      if (result) {
        console.log('✅ Log saved to Supabase')
        return NextResponse.json({ success: true, data: result })
      } else {
        console.log('⚠️ Failed to save to Supabase, but request received')
        return NextResponse.json({ success: true, message: 'Log received (DB not saved)' })
      }
    } else {
      // Supabase 미설정 시에도 로그만 출력
      console.log('⚠️ Supabase not configured, log only printed')
      return NextResponse.json({ success: true, message: 'Log received (no DB)' })
    }
  } catch (error) {
    console.error('Error processing selection log:', error)
    return NextResponse.json({ error: 'Failed to process log' }, { status: 500 })
  }
}
