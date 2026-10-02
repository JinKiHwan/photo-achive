This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 지구본과 촬영 위치

- 메인에서 **지구본으로 보기**를 선택하고 상단 사진글을 클릭하면 해당 좌표로 회전·확대합니다. 지도 위 마커도 글 선택과 연결됩니다.
- 지구본은 Three.js 기반 MIT 라이선스 `react-globe.gl`을 사용합니다. WebGL이 필요하며 지구 표면 이미지는 three-globe 예제의 Blue Marble 이미지를 프로젝트에서 제공합니다.
- 업로드 시 `exifr`로 압축 전 원본의 EXIF GPS를 읽습니다. GPS가 없거나 변경하려면 글의 대표 위치 또는 사진별 촬영 위치에서 장소 검색, 지도 클릭, 위도·경도 입력을 사용하세요.
- 글 좌표 우선순위는 대표 위치 → 표지 사진 GPS → GPS가 있는 첫 사진입니다. 기존 글은 편집 화면에서 좌표를 추가해야 지구본 위치 이동이 가능합니다. 공개 글의 위치도 공개되므로 게시 전 확인하세요.
- 무료 기본 구성은 Leaflet + OpenStreetMap 지도 + Nominatim 장소 검색입니다. API 키나 결제 계정이 필요 없습니다. 검색은 버튼을 누를 때만 실행하며 브라우저 내 간격 제한과 캐시를 사용합니다. 자동완성은 사용하지 않습니다.
- 공개 Nominatim과 OSM 타일은 소규모 사용 기준입니다. 여러 관리자가 사용하는 서비스로 확장할 경우 검색 제공자를 교체하거나 자체 운영하고, 전체 서비스 요청 제한을 적용하세요. 사용 정책: https://operations.osmfoundation.org/policies/nominatim/ 및 https://operations.osmfoundation.org/policies/tiles/
- Google 지도는 좌표 확인 링크로 연결됩니다. 유료 Google Maps API는 사용하지 않습니다.
- 기존 예시 글 22개에 장소 기준 임시 좌표를 제공합니다. 실제 EXIF 또는 직접 입력한 좌표는 덮어쓰지 않으며, 기존 브라우저 저장 글에도 임시 좌표를 보완합니다. `demo` 좌표는 실제 촬영 지점이 아니므로 편집 화면에서 교체하세요.
- 처음에는 지구 이미지가 표시됩니다. 글 선택 시 멀리 보기 → 지역으로 회전 → 장소 확대 순서로 이동하고, 지도 타일이 로딩되면 지구 이미지에서 상세 지도로 부드럽게 전환합니다. **지구 전체 보기**를 누르면 지구 이미지로 돌아갑니다. 상단 글 목록은 마우스 드래그, 휠 및 터치 스와이프로 좌우 이동할 수 있습니다.

## Getting Started

### 사진 업로드

사진에서 GPS와 촬영 정보를 추출한 뒤, 브라우저에서 500/1600/3000px WebP로 최적화해 Firebase Storage에 업로드합니다. Google Drive 연결은 필요하지 않으며 원본 파일은 서버에 보관하지 않습니다.

### 날씨 자동 입력

등록 화면에서 대표 위치(없으면 표지/첫 사진 GPS)와 촬영 날짜를 설정하면 Open-Meteo로 하루 대표 날씨와 일평균 기온을 조회합니다. 촬영 순간의 기온이 아니며 최근 날짜는 예보 API 데이터를 사용합니다. 직접 수정하면 자동 입력이 꺼지고 기존 글의 날씨는 자동으로 덮어쓰지 않습니다. 자동 입력 체크를 켜면 다시 조회합니다. Open-Meteo 무료 API는 비상업용이며 상업 서비스에는 별도 라이선스가 필요합니다: https://open-meteo.com/en/pricing



### 국내 도로명 주소 검색

현재 카카오 자동 검색 연결은 보류되어 기본 검색은 Nominatim을 사용합니다. 도로명 공백을 보정하며, Google 지도에서 주소를 찾은 뒤 우클릭으로 복사한 `위도, 경도`를 검색창에 붙여넣어 적용할 수도 있습니다. 위치 지도는 휠 확대·축소, 클릭, 핀 드래그, 지도 중심에 핀 놓기와 현재 위치 이동을 지원합니다. 신규 글 URL은 글 ID로 자동 지정하고 기존 글 URL은 유지합니다.

카카오 개발자 앱의 REST API 키를 `.env.local`에 `KAKAO_REST_API_KEY=발급받은키`로 설정한 뒤 서버를 재시작하세요. 배포 시에도 서버 환경 변수로 설정합니다. 키는 서버에서만 사용하며 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 활성화·쿼터 조건은 https://developers.kakao.com/docs/ko/local/dev-guide 및 https://developers.kakao.com/docs/ko/getting-started/quota 를 확인하세요. 키 설정 전에는 국내 주소 검색 개선 효과가 제한됩니다.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
