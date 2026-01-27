# 🔄 GitHub Actions 자동 트렌드 업데이트 설정 가이드

## 📋 개요

매주 월요일 새벽 4시(한국시간)에 자동으로 네이버 블로그에서 음식 트렌드를 수집하고 `menus.json`을 업데이트합니다.

---

## 🚀 설정 방법

### 1단계: GitHub 저장소 생성 & 푸시

```bash
# 프로젝트 폴더에서
git init
git add .
git commit -m "Initial commit"

# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/foodfit.git
git branch -M main
git push -u origin main
```

---

### 2단계: GitHub Secrets 설정

1. GitHub 저장소 페이지 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭
5. 아래 두 개의 시크릿 추가:

| Name | Value |
|------|-------|
| `NAVER_CLIENT_ID` | `F97rK_kgbbcMf_27hmbY` |
| `NAVER_CLIENT_SECRET` | `e6GODe_fpn` |

> ⚠️ 본인의 네이버 API 키로 변경하는 것을 권장합니다.

---

### 3단계: 워크플로우 확인

푸시 후 GitHub 저장소에서:

1. **Actions** 탭 클릭
2. **🔄 주간 트렌드 업데이트** 워크플로우 확인
3. 자동 실행 스케줄: 매주 월요일 새벽 4시 (KST)

---

## 🧪 수동 실행 방법

### GitHub에서 수동 실행

1. **Actions** 탭 → **🔄 주간 트렌드 업데이트** 선택
2. **Run workflow** 버튼 클릭
3. **Run workflow** 확인

### 로컬에서 수동 실행

```bash
npm run update-trends
```

---

## 📁 관련 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/update-trends.yml` | GitHub Actions 워크플로우 설정 |
| `scripts/updateTrends.js` | 트렌드 수집 & 업데이트 스크립트 |
| `src/data/menus.json` | 메뉴 데이터 (자동 업데이트됨) |

---

## 🔄 자동 업데이트 흐름

```
📅 매주 월요일 새벽 4시 (KST)
       ↓
🤖 GitHub Actions 자동 실행
       ↓
🔍 네이버 블로그 검색 API 호출
   - "비오는날 먹고싶은 음식"
   - "스트레스 받을때 먹는 음식"
   - "추운날 음식 추천" 등
       ↓
📊 음식별 언급 횟수 분석 & 순위 계산
       ↓
📝 menus.json 자동 업데이트
   - trendNote: "📊 이번주 트렌드: 비오는날 TOP1"
   - popularityScore: 95
       ↓
📤 GitHub에 자동 커밋
       ↓
🚀 Vercel 자동 재배포 (Vercel 연동 시)
```

---

## ❓ 문제 해결

### Actions가 실행되지 않아요

- Secrets가 정확히 설정되었는지 확인
- 워크플로우 파일이 `.github/workflows/` 폴더에 있는지 확인

### API 오류가 발생해요

- 네이버 API 키가 유효한지 확인
- 일일 API 호출 제한(25,000회)을 초과하지 않았는지 확인

### 커밋이 안 돼요

- 저장소에 쓰기 권한이 있는지 확인
- `GITHUB_TOKEN` 권한 확인

---

## 📞 참고 링크

- [네이버 개발자센터](https://developers.naver.com/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel 배포 가이드](https://vercel.com/docs)
