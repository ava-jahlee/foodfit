'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUserInputStore } from '@/store/userInputStore'

// 주요 역/상권 데이터 (전국)
const allLocations = [
  // 서울
  { name: '강남역', lat: 37.4979, lng: 127.0276, region: '서울' },
  { name: '선릉역', lat: 37.5045, lng: 127.0494, region: '서울' },
  { name: '역삼역', lat: 37.5006, lng: 127.0366, region: '서울' },
  { name: '홍대입구역', lat: 37.5571, lng: 126.9236, region: '서울' },
  { name: '신촌역', lat: 37.5596, lng: 126.9422, region: '서울' },
  { name: '이태원역', lat: 37.5346, lng: 126.9947, region: '서울' },
  { name: '명동역', lat: 37.5609, lng: 126.9863, region: '서울' },
  { name: '건대입구역', lat: 37.5404, lng: 127.0692, region: '서울' },
  { name: '잠실역', lat: 37.5133, lng: 127.1001, region: '서울' },
  { name: '여의도역', lat: 37.5216, lng: 126.9243, region: '서울' },
  { name: '신림역', lat: 37.4842, lng: 126.9293, region: '서울' },
  { name: '노량진역', lat: 37.5133, lng: 126.9425, region: '서울' },
  // 경기
  { name: '판교역', lat: 37.3947, lng: 127.1114, region: '경기' },
  { name: '분당 서현역', lat: 37.3849, lng: 127.1233, region: '경기' },
  { name: '수원역', lat: 37.2661, lng: 127.0016, region: '경기' },
  { name: '인천 부평역', lat: 37.4892, lng: 126.7235, region: '인천' },
  // 부산
  { name: '서면역', lat: 35.1578, lng: 129.0599, region: '부산' },
  { name: '해운대역', lat: 35.1631, lng: 129.1636, region: '부산' },
  { name: '센텀시티역', lat: 35.1695, lng: 129.1316, region: '부산' },
  { name: '남포역', lat: 35.0982, lng: 129.0279, region: '부산' },
  // 대구
  { name: '동성로', lat: 35.8690, lng: 128.5964, region: '대구' },
  { name: '대구역', lat: 35.8791, lng: 128.6282, region: '대구' },
  // 대전
  { name: '대전역', lat: 36.3323, lng: 127.4346, region: '대전' },
  { name: '유성온천역', lat: 36.3551, lng: 127.3421, region: '대전' },
  // 광주
  { name: '광주 충장로', lat: 35.1494, lng: 126.9154, region: '광주' },
  // 제주
  { name: '제주시청', lat: 33.4996, lng: 126.5312, region: '제주' },
  { name: '서귀포시청', lat: 33.2531, lng: 126.5595, region: '제주' },
]

// localStorage 키
const RECENT_LOCATIONS_KEY = 'foodfit_recent_locations'

// 최근 위치 저장/불러오기
const getRecentLocations = (): typeof allLocations => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(RECENT_LOCATIONS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveRecentLocation = (location: typeof allLocations[0]) => {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentLocations()
    const filtered = recent.filter(l => l.name !== location.name)
    const updated = [location, ...filtered].slice(0, 3) // 최대 3개
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export default function LocationSelector() {
  const { location, setLocation } = useUserInputStore()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [recentLocations, setRecentLocations] = useState<typeof allLocations>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  // 클라이언트 사이드에서만 Portal 사용
  useEffect(() => {
    setMounted(true)
    setRecentLocations(getRecentLocations())
  }, [])

  // 드롭다운 위치 계산
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
      setSearchQuery('')
      setGpsError(null)
    }
    setIsOpen(!isOpen)
  }

  const handleSelect = (loc: typeof allLocations[0]) => {
    setLocation(loc)
    saveRecentLocation(loc)
    setRecentLocations(getRecentLocations())
    setIsOpen(false)
  }

  // 역지오코딩으로 주소 가져오기 (Nominatim - 무료)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`
      )
      const data = await res.json()
      
      // 동/구 단위로 표시
      const address = data.address
      if (address) {
        const dong = address.suburb || address.neighbourhood || address.quarter
        const gu = address.city_district || address.district
        if (dong && gu) return `${gu} ${dong}`
        if (dong) return dong
        if (gu) return gu
        if (address.city) return address.city
      }
      return '현재 위치'
    } catch {
      return '현재 위치'
    }
  }

  // GPS 현재 위치 가져오기
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('이 브라우저에서는 GPS를 지원하지 않아요')
      return
    }

    setIsGettingLocation(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // 가장 가까운 역/상권 찾기
        let closest = allLocations[0]
        let minDistance = Infinity
        
        for (const loc of allLocations) {
          const distance = Math.sqrt(
            Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
          )
          if (distance < minDistance) {
            minDistance = distance
            closest = loc
          }
        }

        // 거리가 너무 멀면 (약 10km 이상) 현재 위치로 표시
        if (minDistance > 0.1) {
          // 역지오코딩으로 실제 동네 이름 가져오기
          const addressName = await reverseGeocode(latitude, longitude)
          const currentLocation = {
            name: addressName,
            lat: latitude,
            lng: longitude,
            region: 'GPS',
          }
          setLocation(currentLocation)
          saveRecentLocation(currentLocation)
        } else {
          setLocation(closest)
          saveRecentLocation(closest)
        }
        
        setRecentLocations(getRecentLocations())
        setIsGettingLocation(false)
        setIsOpen(false)
      },
      (error) => {
        setIsGettingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('위치 권한이 차단되었어요. 브라우저 설정에서 허용해주세요')
            break
          case error.POSITION_UNAVAILABLE:
            setGpsError('위치 정보를 가져올 수 없어요')
            break
          case error.TIMEOUT:
            setGpsError('위치 요청 시간이 초과됐어요')
            break
          default:
            setGpsError('알 수 없는 오류가 발생했어요')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  // 검색 필터링
  const filteredLocations = searchQuery
    ? allLocations.filter(loc => 
        loc.name.includes(searchQuery) || loc.region.includes(searchQuery)
      )
    : []

  // 지역별 그룹핑 (검색 없을 때)
  const groupedLocations = !searchQuery ? {
    recent: recentLocations,
    popular: allLocations.filter(l => 
      ['강남역', '홍대입구역', '서면역', '판교역', '해운대역'].includes(l.name)
    ),
  } : null

  // 드롭다운 컴포넌트
  const dropdown = isOpen && mounted ? createPortal(
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />
      {/* 드롭다운 */}
      <div 
        className="fixed z-[9999] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: '70vh',
        }}
      >
        <div className="p-3 border-b border-gray-100">
          {/* GPS 버튼 */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {isGettingLocation ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>위치 찾는 중...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>현재 위치 사용하기</span>
              </>
            )}
          </button>
          
          {gpsError && (
            <p className="mt-2 text-xs text-red-500 text-center">{gpsError}</p>
          )}

          {/* 검색창 */}
          <div className="mt-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 역/상권 검색..."
              className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 위치 리스트 */}
        <div className="max-h-64 overflow-y-auto p-2">
          {searchQuery ? (
            // 검색 결과
            filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => (
                <LocationItem
                  key={loc.name}
                  loc={loc}
                  isSelected={location.name === loc.name}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 py-4 text-sm">
                검색 결과가 없어요 😢
              </p>
            )
          ) : (
            // 최근 + 인기
            <>
              {groupedLocations?.recent && groupedLocations.recent.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 font-medium px-3 py-1">⏱️ 최근 선택</p>
                  {groupedLocations.recent.map((loc) => (
                    <LocationItem
                      key={`recent-${loc.name}`}
                      loc={loc}
                      isSelected={location.name === loc.name}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-400 font-medium px-3 py-1">⭐ 인기 지역</p>
                {groupedLocations?.popular.map((loc) => (
                  <LocationItem
                    key={`popular-${loc.name}`}
                    loc={loc}
                    isSelected={location.name === loc.name}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium px-3 py-1">📍 전체 지역</p>
                {allLocations.slice(0, 10).map((loc) => (
                  <LocationItem
                    key={`all-${loc.name}`}
                    loc={loc}
                    isSelected={location.name === loc.name}
                    onSelect={handleSelect}
                  />
                ))}
                <p className="text-xs text-gray-400 text-center py-2">
                  검색으로 더 많은 지역을 찾아보세요!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null

  const isGPSLocation = location.region === 'GPS'

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="w-full glass-card p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isGPSLocation ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            <span className="text-lg">{isGPSLocation ? '📍' : '🚇'}</span>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400 font-medium">
              {isGPSLocation ? 'GPS 위치' : '선택한 위치'}
            </p>
            <p className="font-semibold text-gray-800">{location.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-orange-500 transition-colors">
          <span className="text-sm">변경</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {dropdown}
    </div>
  )
}

// 위치 아이템 컴포넌트
function LocationItem({ 
  loc, 
  isSelected, 
  onSelect 
}: { 
  loc: typeof allLocations[0]
  isSelected: boolean
  onSelect: (loc: typeof allLocations[0]) => void 
}) {
  const isGPS = loc.region === 'GPS'
  
  return (
    <button
      onClick={() => onSelect(loc)}
      className={`w-full px-4 py-2.5 text-left rounded-xl transition-all flex items-center gap-3 ${
        isSelected
          ? 'bg-orange-500 text-white'
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <span className="text-sm">
        {isSelected ? '✓' : isGPS ? '📍' : '○'}
      </span>
      <span className="font-medium flex-1">{loc.name}</span>
      <span className={`text-xs ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
        {isGPS ? '현재' : loc.region}
      </span>
    </button>
  )
}
