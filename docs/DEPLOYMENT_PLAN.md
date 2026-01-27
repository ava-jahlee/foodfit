# 🚀 FoodFit 배포 계획

> 작성일: 2026-01-28  
> 목표: FoodFit을 Vercel에 배포하고 `foodfit.forx.kr` 서브도메인 연결

---

## 📌 현재 상황

| 항목 | 상태 |
|------|------|
| GitHub 레포 | ✅ `ava-jahlee/foodfit` |
| 개발 완료 | ✅ 로컬에서 정상 동작 |
| 도메인 보유 | ✅ `forx.kr`, `forx.co.kr` (가비아) |
| 호스팅 | 🔄 가비아 WordPress → Vercel 이전 예정 |

---

## 🎯 최종 목표 구조

```
forx.kr (메인 포트폴리오) ─────────────────┐
├── / (홈) - 인트로, 자기소개              │
├── /about - 커리어 타임라인               │  ← Phase 4-5에서 구현
├── /projects - 프로젝트 모음              │
├── /activities - 활동, 수상               │
└── /contact - 연락처                      │
                                           │
foodfit.forx.kr (서브도메인) ──────────────┤
└── FoodFit 앱 ← Phase 1-3에서 구현        │
                                           │
(향후) other-project.forx.kr ──────────────┘
```

---

## 📋 Phase 1: Vercel 배포 (~15분)

### 1-1. Vercel 가입/로그인
- [ ] https://vercel.com 접속
- [ ] "Continue with GitHub" 클릭
- [ ] GitHub 계정 연동 승인

### 1-2. 프로젝트 Import
- [ ] "Add New Project" 클릭
- [ ] `ava-jahlee/foodfit` 레포 선택
- [ ] Framework: Next.js (자동 감지됨)

### 1-3. 환경변수 설정
아래 환경변수를 Vercel 프로젝트 설정에 추가:

```env
NAVER_CLIENT_ID=네이버_클라이언트_ID
NAVER_CLIENT_SECRET=네이버_클라이언트_시크릿
NEXT_PUBLIC_SUPABASE_URL=https://dhexmjdalgwisdqwinvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ 실제 값은 `.env.local` 파일 또는 별도 보관 장소에서 확인

### 1-4. 배포 실행
- [ ] "Deploy" 버튼 클릭
- [ ] 빌드 완료 대기 (~2분)
- [ ] `foodfit-xxx.vercel.app` 주소 확인
- [ ] 사이트 접속하여 정상 동작 테스트

### ✅ Phase 1 완료 체크
- [ ] Vercel 배포 URL 접속 가능
- [ ] 메인 페이지 로드 정상
- [ ] 날씨 API 동작 확인
- [ ] 추천 결과 페이지 동작 확인

---

## 📋 Phase 2: 서브도메인 연결 (~10분)

### 2-1. Vercel 커스텀 도메인 설정
- [ ] Vercel 프로젝트 → Settings → Domains
- [ ] `foodfit.forx.kr` 입력 후 Add

### 2-2. 가비아 DNS 설정
1. 가비아 로그인 → DNS 관리툴
2. `forx.kr` 도메인 선택
3. 레코드 추가:

| 타입 | 호스트 | 값 | TTL |
|------|--------|-----|-----|
| CNAME | foodfit | cname.vercel-dns.com | 3600 |

### 2-3. SSL 인증서 확인
- [ ] Vercel에서 자동 SSL 발급 대기 (최대 24시간, 보통 수분 내)
- [ ] https://foodfit.forx.kr 접속 확인
- [ ] 자물쇠 아이콘 확인 (HTTPS)

### ✅ Phase 2 완료 체크
- [ ] `foodfit.forx.kr` 접속 가능
- [ ] HTTPS 정상 동작
- [ ] 모든 기능 정상

---

## 📋 Phase 3: 마무리 (~5분)

### 3-1. 크로스 브라우저/디바이스 테스트
- [ ] PC Chrome
- [ ] PC Safari
- [ ] 모바일 Safari (iOS)
- [ ] 모바일 Chrome (Android)

### 3-2. 기능 테스트
- [ ] 위치 선택 → 날씨 표시
- [ ] 기분/식단 선택 → 추천 결과
- [ ] 맛집 검색 → 네이버 지도 연결
- [ ] Supabase 로그 저장 확인

### 3-3. 문서 업데이트
- [ ] README.md에 라이브 URL 추가
- [ ] 이 문서 완료 체크

---

## 📋 Phase 4: 메인 포트폴리오 개발 (향후)

### 예상 기간: 1-2주

### 포함 내용
- **About**: 대학 → 대학원 → EAN 커리어 타임라인
- **Projects**: GitHub 프로젝트 카드 (FoodFit 포함)
- **Activities**: 각종 활동, 수상 기록
- **Contact**: 연락처, LinkedIn, GitHub 링크

### 기술 스택 (예정)
- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion (애니메이션)
- MDX (블로그/콘텐츠)

---

## 📋 Phase 5: 메인 도메인 연결 (향후)

### 가비아 DNS 설정 변경
기존 WordPress 호스팅 해제 후:

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

---

## 🔧 환경변수 참조

### 로컬 개발 (.env.local)
```
/Users/lja/Projects/foodfit/.env.local
```

### 필요한 키 목록
| 변수명 | 용도 | 발급처 |
|--------|------|--------|
| NAVER_CLIENT_ID | 네이버 지역검색 API | 네이버 개발자센터 |
| NAVER_CLIENT_SECRET | 네이버 지역검색 API | 네이버 개발자센터 |
| NEXT_PUBLIC_SUPABASE_URL | Supabase 연결 | Supabase 대시보드 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 인증 | Supabase 대시보드 |

---

## 📝 참고 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel 커스텀 도메인 가이드](https://vercel.com/docs/concepts/projects/domains)
- [가비아 DNS 관리 가이드](https://customer.gabia.com/manual/domain/284/1166)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)

---

## ✅ 최종 체크리스트

- [ ] **Phase 1**: Vercel 배포 완료
- [ ] **Phase 2**: 서브도메인 연결 완료
- [ ] **Phase 3**: 테스트 및 마무리 완료
- [ ] **Phase 4**: 메인 포트폴리오 개발 (향후)
- [ ] **Phase 5**: 메인 도메인 연결 (향후)

---

*Last Updated: 2026-01-28*
