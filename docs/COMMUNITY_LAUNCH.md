# 사진 공유 서비스 전환 — 구현 및 공개 절차

## 현재 상태

기존 관리자와 기존 사진집을 유지하는 회원 서비스 프로토타입입니다. 운영 Firebase에 규칙·인증·데이터 변경을 배포하지 않았습니다. 일반 회원 로그인은 기본 비활성화입니다. Firebase CLI 로그인 정보가 없어 기존 데이터베이스의 edition/region과 Google provider 활성화 여부는 조회하지 못했습니다. 기존 프로젝트의 modular Firestore API를 유지했고 로컬 Standard edition 에뮬레이터에서 검증했습니다. 실제 프로젝트 설정을 확인하고 배포하세요.

회원 공개 전에 서비스명, 운영자 이름, 문의 이메일, 개인정보처리방침의 처리위탁·국외 이전·로그/백업 보관 항목을 확정해야 합니다. `/privacy`와 `/terms`는 실제 구현에 맞춘 검토용 초안이며 법률 검토가 끝난 문서가 아닙니다.

## 구현된 동작

- `/login`: Google 로그인, 만 14세 이상 및 이용약관 동의/개인정보처리방침 확인. 기존 이메일 관리자 로그인은 `/admin/login`.
- `/my`, `/my/new`, `/my/[id]/edit`: 내 사진집만 조회·수정·삭제. 새 글은 비공개이고 위치 공유가 기본 해제. 글당 12장(현재 UI/부모 문서 제한).
- 위치 공유 해제: 저장 전에 대표 좌표, 사진 GPS, 구조화된 장소명 제거. 저장 후 복구하려면 사용자가 위치를 다시 입력해야 함. 본문/캡션·이미지 안의 위치 문구는 자동 제거하지 않음. 원본 파일은 전송하지 않고 EXIF 보존을 끈 WebP 파일 3종만 저장.
- `/my` 탈퇴: Google 재인증 → deleting 상태 → 모든 소유 글의 사진 파일/사진 메타데이터/본문 삭제 → 미완성 업로드까지 회원 폴더 정리 → 본인의 신고/회원 확인 기록 삭제 → Firebase Auth 계정 삭제. 실패 시 계정은 마지막까지 유지하므로 재실행 가능. 관리자 계정은 이 경로로 삭제하지 않음.
- 글보기 신고 → `/admin/reports`에서 신고 검토 및 처리 완료. 게시물 비공개/삭제는 기존 관리 화면 사용. 신고자는 신고를 제출할 때만 본인 UID가 저장되며 일반 회원에게 신고 내역은 공개되지 않음.

## 데이터와 접근 권한

- 기존 `sessions/{id}`의 `photos` 배열과 `sessions/{id}/{photoId}/*.webp`는 그대로 사용. 기존 글에 ownerId를 자동 부여하지 않음.
- 새 회원 글: `sessions/{id}`에는 ownerId, shareLocation, photoCount, 빈 photos 배열 및 기본 정보 저장.
- 회원 사진 메타데이터: `sessions/{id}/photos/{photoId}`. 읽을 때 기존 PhotoSession 형식으로 복원. 사진별 문서 분리는 12장의 상세 검증을 한 요청의 1000-expression 한도 안에서 처리하기 위한 변경.
- 회원 사진 파일: `members/{uid}/sessions/{id}/{photoId}/*.webp`. 자기 경로만 업로드 가능. 본인·관리자만 폴더 열거/삭제 가능.
- `members/{uid}`: policyVersion, acceptedAt, deleting. 본인만 읽기 가능. 이메일·Google 프로필을 이 공개 Firestore 데이터에 복제하지 않음. 관리자 판별은 기존 고정 UID 사용, 회원 문서의 역할 필드는 허용하지 않음.
- `reports/{uid}_{sessionId}`: 신고자/관리자만 접근, 관리자만 상태 변경. 글당 회원 1회 신고.
- `config/community`: `enabled`를 Console에서 관리. 클라이언트에서 변경 불가. 문서가 없거나 false면 일반 회원 생성·게시·업로드 차단, 기존 데이터 조회/삭제는 계속 가능.
- 일반 공개 목록은 isPublished 필터, 내 사진 목록은 ownerId 필터. 위치 비공개 공개 사진 하위 문서는 gps == null 필터로 조회.

회원이 악의적으로 SDK를 직접 호출하면 UI의 12장 제한만으로 전체 업로드 수를 제한할 수는 없습니다. 사진 수·총 저장 용량·요청 빈도의 강제 제한은 서버 처리와 App Check 등 추가 운영 보호가 필요합니다. 현재 Firestore 규칙은 각 문서의 스키마와 사진 경로/소유권을 검증합니다.

Firebase 다운로드 토큰 URL은 주소를 아는 사람에게 접근 권한을 줄 수 있습니다. 공개 후 비공개 전환은 기존 복사본·URL·이미지 캐시 회수를 보장하지 않습니다. 엄격한 비공개 파일 요구사항이 있다면 토큰 회수/인증 다운로드와 캐시 정책을 별도로 구축한 뒤 개방하세요. 저장하지 않은 업로드·글에서 제거한 사진 파일은 회원 폴더에 남을 수 있고 글 삭제·회원 탈퇴 시 정리합니다. 장기 운영 시 미사용 파일 정리 작업을 추가해야 합니다.

회원 탈퇴는 클라이언트에서 순차적으로 실행됩니다. 브라우저를 닫으면 중단되므로 오류 안내 후 재실행 경로를 제공합니다. 대규모 공개 운영 전에 서버 측 삭제 작업/재시도 큐로 이전하는 것을 권장합니다.

## 공개 설정 순서

1. 운영자 정보와 개인정보처리방침 초안 확정. 특히 외부 지도/주소 검색(Nominatim), 날씨(Open-Meteo), 지도 타일(OpenStreetMap), 외부 폰트 및 Firebase 제품별 처리 주체·국가·기간을 실제 계약/배포 설정으로 확인. 위치정보법 적용 여부도 실제 기능 기준으로 검토.
2. 기존 Firebase 프로젝트와 Storage 위치 확인. 새 프로젝트를 임의 생성하지 않음.
3. Firebase Authentication에서 Google provider를 켜고 프로젝트 지원 이메일을 설정. Authentication > Settings > Authorized domains에 실제 도메인 추가. OAuth 브랜드/지원 연락처/홈페이지/개인정보처리방침 URL 설정. 소셜 로그인은 현재 Google만 구현; 카카오·네이버 등은 아직 미구현.
4. 로컬 검증: Java 21 이상, `npm ci`, `npm test`, `npm run test:rules`, `npx tsc --noEmit`.
5. 검토된 Firestore/Storage 규칙을 먼저 배포. `config/community`는 아직 false. `firebase deploy --only firestore:rules,firestore:indexes,storage` (이 작업에서는 미실행).
6. 배포 환경에 아래 변수를 설정하고 재빌드. 약관 문서의 미확정 문구를 실제 내용으로 교체하기 전에는 LEGAL_APPROVED를 true로 설정하지 말 것.

```dotenv
NEXT_PUBLIC_SERVICE_NAME=확정된 서비스명
NEXT_PUBLIC_SERVICE_OPERATOR=확정된 운영자명
NEXT_PUBLIC_SERVICE_CONTACT=실제 문의 이메일
NEXT_PUBLIC_LEGAL_APPROVED=true
NEXT_PUBLIC_MEMBERSHIP_ENABLED=true
```

7. Console에서 `config/community` 문서를 생성하고 `enabled: true`로 변경. 기존 `NEXT_PUBLIC_ADMIN_UID`와 두 rules 파일의 관리자 UID가 일치하는지 확인.
8. 운영자가 별도 테스트 계정으로 로그인 → 가입 → 비공개 글 저장 → 다른 계정 접근 거절 → 위치 공개/비공개 → 게시 → 신고 → 삭제·탈퇴를 직접 확인. 실제 계정 생성·탈퇴·실서비스 게시 작업은 자동 테스트에서 수행하지 않았음.

## 검증 결과

- 일반 테스트 28개 통과 (기존 기능 및 좌표 제거 회귀 포함).
- 로컬 Firestore/Storage 에뮬레이터 보안 테스트 10개 통과.
  - 비로그인 전체 조회 및 비공개 글 읽기 거절, 공개 필터 조회 허용.
  - 소유자 필터 조회 허용, 타인 수정·삭제/소유권 위조/기존 관리자 글 탈취 거절.
  - 사진 12개 개별 문서 일괄 저장 허용; 사진 캡션 길이·타입·URL/경로 위조 거절.
  - 비공개 위치의 중첩 GPS 저장 거절.
  - 회원 정보 타인/관리자 읽기·임의 역할 추가 거절.
  - 문서 생성/수정 양쪽의 필수 필드·타입·길이·불변 값 검증.
  - 오픈 게이트 종료 및 탈퇴 진행 시 새 쓰기 거절, 소유자 삭제 허용.
  - 신고 중복/타인 조회/회원의 신고 완료 처리 거절.
  - Storage 타인 경로 업로드·조회·열거·삭제, 비이미지 업로드 거절.
- 서버가 강제 생성하는 회원 동의/신고 시각은 request.time 검증. 기존 호환성을 위해 출사 createdAt/updatedAt는 ISO 문자열이며 논리적인 날짜 유효성·서버 시각 일치까지 보장하지 않음. 공개 정렬의 시간 조작을 강하게 막으려면 서버 타임스탬프 기반 마이그레이션 필요.
- 관리자 기존 대량 배열 사진은 기존 스키마를 유지; 새 회원 사진에는 개별 문서 검증 적용.
