import { PhotoSession } from "@/types";

const MOCK_SESSION_BASE: PhotoSession[] = [
  {
    id: "seochon-autumn-walk-2025",
    slug: "seochon-autumn-walk-2025",
    title: "서촌, 늦가을 빛의 잔상과 정갈한 한옥 골목길의 서정",
    date: "2025.11.04",
    location: "서울 종로구 서촌 & 옥인동",
    weather: "맑음, 14°C, 옅은 가을 햇살",
    camera: "Leica M11 + Summilux-M 35mm f/1.4 ASPH.",
    description: "오래된 골목길 사이로 낮게 들어오는 늦가을 볕. 담장 넘어 늘어진 은행나무 잎과 차분한 기와지붕의 대비를 담아낸 시간.",
    isPublished: true,
    gdriveFolderRef: "https://drive.google.com/drive/folders/demo-seochon-2025",
    createdAt: "2025-11-04T15:00:00Z",
    updatedAt: "2025-11-04T15:00:00Z",
    coverImageId: "photo-sc-1",
    coverImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-sc-1",
        order: 0,
        caption: "옥인동 골목 입구, 낮은 햇빛이 만드는 기와의 음영",
        location: "종로구 옥인동 골목길",
        exif: { camera: "Leica M11", lens: "Summilux-M 35mm f/1.4", iso: "ISO 64", aperture: "f/2.8", shutter: "1/1000s", focalLength: "35mm" },
        urls: {
          thumb: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "jeju-misty-forest-2026",
    slug: "jeju-misty-forest-2026",
    title: "제주, 안개 낀 삼나무 숲의 차분한 수묵화",
    date: "2026.02.18",
    location: "제주 구좌읍 비자림",
    weather: "흐림 및 짙은 안개, 8°C",
    camera: "Fujifilm GFX 100 II",
    description: "비가 내린 뒤 숲속 가득 들어찬 촉촉한 안개. 초록의 이끼와 검은 수피가 빚어내는 무채색에 가까운 미니멀 정경.",
    isPublished: true,
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
    coverImageId: "photo-jj-1",
    coverImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-jj-1",
        order: 0,
        caption: "수평선처럼 아득하게 펼쳐진 삼나무 산책로의 안개",
        urls: {
          thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "kamakura-coastal-line-2026",
    slug: "kamakura-coastal-line-2026",
    title: "가마쿠라, 해안 전철과 바다 윤슬",
    date: "2026.05.12",
    location: "일본 가마쿠라 시치리가하마",
    weather: "화창함, 22°C",
    camera: "Sony A7R V",
    description: "에노덴 전철이 지나갈 때마다 사각거리며 흩어지는 바다 윤슬. 빛이 부서지는 태평양 수평선을 시선에 담다.",
    isPublished: true,
    createdAt: "2026-05-12T18:00:00Z",
    updatedAt: "2026-05-12T18:00:00Z",
    coverImageId: "photo-km-1",
    coverImageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-km-1",
        order: 0,
        caption: "시치리가하마 해변을 따라 흐르는 오후의 짙은 푸른빛",
        urls: {
          thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "seongsu-brick-alley-2026",
    slug: "seongsu-brick-alley-2026",
    title: "성수동, 붉은 벽돌과 강렬한 햇볕",
    date: "2026.03.22",
    location: "서울 성동구 성수동 연무장길",
    weather: "포근함, 17°C",
    camera: "Ricoh GR III",
    description: "오래된 공장 지대의 붉은 타일 위로 떨어지는 강렬한 3월의 오후 햇살. 산업 유산과 현대 감성의 교차점.",
    isPublished: true,
    createdAt: "2026-03-22T14:00:00Z",
    updatedAt: "2026-03-22T14:00:00Z",
    coverImageId: "photo-ss-1",
    coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ss-1",
        order: 0,
        caption: "붉은 벽돌 벽면에 길게 늘어진 프레임의 그림자",
        urls: {
          thumb: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "kyoto-silent-bamboo-2025",
    slug: "kyoto-silent-bamboo-2025",
    title: "교토, 새벽 대나무 숲의 침묵과 정적",
    date: "2025.10.15",
    location: "일본 교토 아라시야마",
    weather: "맑고 쌀쌀함, 11°C",
    camera: "Hasselblad X2D 100C",
    description: "관광객이 찾아오기 전 새벽 6시의 침묵. 하늘을 향해 높게 솟은 대나무 잎 사이로 바람이 스치는 소리만 가득한 미학.",
    isPublished: true,
    createdAt: "2025-10-15T06:00:00Z",
    updatedAt: "2025-10-15T06:00:00Z",
    coverImageId: "photo-ky-1",
    coverImageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ky-1",
        order: 0,
        caption: "수평의 곡선과 수직의 곧은 울림이 만나다",
        urls: {
          thumb: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "gangneung-winter-sea-2025",
    slug: "gangneung-winter-sea-2025",
    title: "강릉, 겨울 바다의 파란 묵직함",
    date: "2025.12.28",
    location: "강원도 강릉 경포대",
    weather: "매서운 강풍, 2°C",
    camera: "Nikon Z8",
    description: "차가운 하얀 거품을 일으키며 밀려드는 동해의 겨울 파도. 거친 자연의 밀도와 묵직한 파랑의 그러데이션.",
    isPublished: true,
    createdAt: "2025-12-28T16:00:00Z",
    updatedAt: "2025-12-28T16:00:00Z",
    coverImageId: "photo-gn-1",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-gn-1",
        order: 0,
        caption: "수평선 끝에 걸린 차가운 12월의 파란 수평선",
        urls: {
          thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "bukchon-snow-roof-2026",
    slug: "bukchon-snow-roof-2026",
    title: "북촌, 함박눈이 내린 정갈한 한옥 지붕",
    date: "2026.01.12",
    location: "서울 종로구 북촌한옥마을",
    weather: "함박눈, -3°C",
    camera: "Canon EOS R5",
    description: "기와 마루 마다 정성스럽게 얹힌 하얀 눈 쌓임. 소음조차 삼켜버린 겨울 도심 한옥의 정취.",
    isPublished: true,
    createdAt: "2026-01-12T11:00:00Z",
    updatedAt: "2026-01-12T11:00:00Z",
    coverImageId: "photo-bc-1",
    coverImageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-bc-1",
        order: 0,
        caption: "골목길 따라 겹겹이 이어진 하얀 지붕의 선",
        urls: {
          thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "han-river-sunset-glow-2026",
    slug: "han-river-sunset-glow-2026",
    title: "한강, 보랏빛 노을과 여의도의 잔상",
    date: "2026.04.08",
    location: "서울 영등포구 여의도 한강공원",
    weather: "쾌청함, 19°C",
    camera: "Sony A7 IV",
    description: "퇴근길 강물 위로 차오르는 주황빛과 보랏빛 그라데이션. 도시의 빌딩 숲 뒤로 기우는 하루의 마침표.",
    isPublished: true,
    createdAt: "2026-04-08T19:00:00Z",
    updatedAt: "2026-04-08T19:00:00Z",
    coverImageId: "photo-hr-1",
    coverImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-hr-1",
        order: 0,
        caption: "다리 밑 강물이 머금은 노을빛 잔물결",
        urls: {
          thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "tokyo-night-neon-2025",
    slug: "tokyo-night-neon-2025",
    title: "도쿄, 신주쿠의 필름 빛깔 밤거리",
    date: "2025.09.20",
    location: "일본 도쿄 신주쿠 가부키초",
    weather: "비 온 뒤 야경, 20°C",
    camera: "Fujifilm X100VI",
    description: "아스팔트 웅덩이에 넘쳐나는 네온사인의 잔영. 빗물에 비친 도시의 밤이 선사하는 로맨틱한 시네마틱 프레임.",
    isPublished: true,
    createdAt: "2025-09-20T22:00:00Z",
    updatedAt: "2025-09-20T22:00:00Z",
    coverImageId: "photo-tk-1",
    coverImageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-tk-1",
        order: 0,
        caption: "빗물 머금은 도로 위 번지는 붉고 푸른 네온 잔상",
        urls: {
          thumb: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "samcheong-spring-cherry-2026",
    slug: "samcheong-spring-cherry-2026",
    title: "삼청동, 벚꽃 잎이 기와에 내릴 때",
    date: "2026.04.02",
    location: "서울 종로구 삼청동 길",
    weather: "온화함, 18°C",
    camera: "Leica Q3",
    description: "봄바람에 흩날리는 분홍빛 벚꽃 잎. 담장 아래 작은 카페의 유리창과 어우러져 피어나는 봄날의 찬란함.",
    isPublished: true,
    createdAt: "2026-04-02T13:00:00Z",
    updatedAt: "2026-04-02T13:00:00Z",
    coverImageId: "photo-sq-1",
    coverImageUrl: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-sq-1",
        order: 0,
        caption: "기와지붕 틈새로 살며시 내려앉은 벚꽃 한 잎",
        urls: {
          thumb: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "namhae-terraced-field-2025",
    slug: "namhae-terraced-field-2025",
    title: "남해, 다랭이마을의 노란 유채 물결",
    date: "2025.04.20",
    location: "경남 남해군 가천 다랭이마을",
    weather: "따스함, 21°C",
    camera: "Sony A7R IV",
    description: "계단식 논을 따라 시원하게 펼쳐진 유채꽃 필드. 파란 남해 바다와 조화를 이루는 선명한 노란빛의 향연.",
    isPublished: true,
    createdAt: "2025-04-20T10:00:00Z",
    updatedAt: "2025-04-20T10:00:00Z",
    coverImageId: "photo-nh-1",
    coverImageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-nh-1",
        order: 0,
        caption: "유채밭 사이로 멀리 바라뵈는 청량한 남해 바다 수평선",
        urls: {
          thumb: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "nagano-winter-snow-2026",
    slug: "nagano-winter-snow-2026",
    title: "나가노, 설국으로 떠난 정물 산책",
    date: "2026.01.29",
    location: "일본 나가노현 가루이자와",
    weather: "눈 내림, -6°C",
    camera: "Fujifilm GFX 50S II",
    description: "발자국 하나 없는 하얀 정원. 소나무 잎 위로 조용히 얹히는 눈 송이의 정갈한 파티클.",
    isPublished: true,
    createdAt: "2026-01-29T15:00:00Z",
    updatedAt: "2026-01-29T15:00:00Z",
    coverImageId: "photo-ng-1",
    coverImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ng-1",
        order: 0,
        caption: "눈 속에 묻힌 고요한 오두막의 밤",
        urls: {
          thumb: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  // BATCH 2 & 3: Additional photo sessions to test infinite scroll
  {
    id: "busan-haeundae-wave-2025",
    slug: "busan-haeundae-wave-2025",
    title: "부산, 해운대의 수평선과 윤슬",
    date: "2025.08.14",
    location: "부산 해운대구 달맞이길 & 마린시티",
    weather: "화창함, 28°C",
    camera: "Leica M11",
    description: "여름 오후 4시의 부서지는 바다 윤슬. 센텀시티의 빌딩 기둥 사이로 쏟아지는 파란 바닷바람.",
    isPublished: true,
    createdAt: "2025-08-14T16:00:00Z",
    updatedAt: "2025-08-14T16:00:00Z",
    coverImageId: "photo-bs-1",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-bs-1",
        order: 0,
        caption: "달맞이길 언덕에서 내려다본 부산 해운대의 탁 트인 수평선",
        urls: {
          thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "danyang-green-river-2025",
    slug: "danyang-green-river-2025",
    title: "단양, 도담삼봉의 남한강 푸른 정취",
    date: "2025.07.03",
    location: "충북 단양군 도담삼봉",
    weather: "맑고 온화함, 24°C",
    camera: "Fujifilm X-T5",
    description: "잔잔한 남한강 위로 우뚝 솟은 도담삼봉. 녹음이 짙어진 강변 따라 흐르는 평화로운 여름 산책.",
    isPublished: true,
    createdAt: "2025-07-03T11:00:00Z",
    updatedAt: "2025-07-03T11:00:00Z",
    coverImageId: "photo-dy-1",
    coverImageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-dy-1",
        order: 0,
        caption: "도담삼봉 정자 뒤로 물드는 신선한 아침 기운",
        urls: {
          thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "osaka-dontonbori-light-2025",
    slug: "osaka-dontonbori-light-2025",
    title: "오사카, 도톤보리 운하의 조명빛",
    date: "2025.06.19",
    location: "일본 오사카 난바 도톤보리",
    weather: "선선함, 21°C",
    camera: "Sony A7S III",
    description: "운하 물결 위로 오색 빛깔 반사되는 도시의 불빛. 사람들의 활기와 시끌벅적함이 깃든 활기찬 밤 정경.",
    isPublished: true,
    createdAt: "2025-06-19T21:00:00Z",
    updatedAt: "2025-06-19T21:00:00Z",
    coverImageId: "photo-os-1",
    coverImageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-os-1",
        order: 0,
        caption: "도톤보리 다리 아래 반짝이는 화려한 간판의 물반사",
        urls: {
          thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "pohang-space-walk-2026",
    slug: "pohang-space-walk-2026",
    title: "포항, 스페이스워크의 철제 선 곡선",
    date: "2026.03.05",
    location: "경북 포항 환호공원",
    weather: "구름 조금, 13°C",
    camera: "Leica Q2",
    description: "하늘을 향해 꼬여 올라가는 거대한 아연도금 트랙의 구조미. 바다와 조화를 이루는 아방가르드한 철제 조형물.",
    isPublished: true,
    createdAt: "2026-03-05T14:00:00Z",
    updatedAt: "2026-03-05T14:00:00Z",
    coverImageId: "photo-ph-1",
    coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ph-1",
        order: 0,
        caption: "루프 트랙 사이로 들어오는 맑은 동해 하늘",
        urls: {
          thumb: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "gyeongju-daereungwon-green-2025",
    slug: "gyeongju-daereungwon-green-2025",
    title: "경주, 대릉원의 푸른 고분 언덕",
    date: "2025.05.28",
    location: "경북 경주시 황남동 대릉원",
    weather: "따스한 햇살, 23°C",
    camera: "Hasselblad 907X",
    description: "천년의 세월을 품은 곡선의 잔디 언덕. 목련나무와 어우러진 차분하고 평온한 경주의 신라 정취.",
    isPublished: true,
    createdAt: "2025-05-28T15:00:00Z",
    updatedAt: "2025-05-28T15:00:00Z",
    coverImageId: "photo-gj-1",
    coverImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-gj-1",
        order: 0,
        caption: "부드러운 곡선 고분 사이로 비쳐드는 신록의 녹색 빛",
        urls: {
          thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "incheon-chinatown-red-2025",
    slug: "incheon-chinatown-red-2025",
    title: "인천, 개항장 거리와 홍등 골목",
    date: "2025.09.08",
    location: "인천 중구 신포동 & 차이나타운",
    weather: "구름 맑음, 22°C",
    camera: "Fujifilm X100V",
    description: "근대 건축물이 보존된 개항장 근대문화거리. 붉은 홍등과 함께 이국적인 분위기를 자아내는 오래된 석조 건물.",
    isPublished: true,
    createdAt: "2025-09-08T17:00:00Z",
    updatedAt: "2025-09-08T17:00:00Z",
    coverImageId: "photo-ic-1",
    coverImageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ic-1",
        order: 0,
        caption: "오래된 붉은 벽돌 창가 위로 매달린 연등의 조화",
        urls: {
          thumb: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "yeosu-night-sea-2025",
    slug: "yeosu-night-sea-2025",
    title: "여수, 돌산대교의 밤바다 불빛",
    date: "2025.10.30",
    location: "전남 여수시 돌산공원",
    weather: "시원함, 15°C",
    camera: "Sony A7R IV",
    description: "돌산대교 아래로 일렁이는 낭만 밤바다의 조명. 여수항을 오가는 선박의 유선형 궤적과 아늑한 바닷가 감성.",
    isPublished: true,
    createdAt: "2025-10-30T20:00:00Z",
    updatedAt: "2025-10-30T20:00:00Z",
    coverImageId: "photo-ys-1",
    coverImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-ys-1",
        order: 0,
        caption: "돌산대교 주탑을 물들이는 무지개 조명과 조용한 밤바다",
        urls: {
          thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "hokkaido-biei-tree-2026",
    slug: "hokkaido-biei-tree-2026",
    title: "홋카이도, 비에이의 외딴 나무와 눈 언덕",
    date: "2026.02.04",
    location: "일본 홋카이도 비에이 패치워크 길",
    weather: "눈 내림, -10°C",
    camera: "Leica SL2",
    description: "하얀 설원 가운데 외롭게 서 있는 켄과 메리의 나무. 하얀 여백과 미니멀리즘 구도가 만들어내는 한 편의 극치.",
    isPublished: true,
    createdAt: "2026-02-04T12:00:00Z",
    updatedAt: "2026-02-04T12:00:00Z",
    coverImageId: "photo-hk-1",
    coverImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-hk-1",
        order: 0,
        caption: "하늘과 땅의 경계가 사라진 설원 속의 단 하나의 나무",
        urls: {
          thumb: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "yangyang-surf-beach-2025",
    slug: "yangyang-surf-beach-2025",
    title: "양양, 서피비치의 야자수와 석양",
    date: "2025.07.25",
    location: "강원도 양양군 서피비치",
    weather: "더움, 29°C",
    camera: "Ricoh GR IIIx",
    description: "노을빛으로 붉게 물드는 바다와 짚 파라솔의 실루엣. 이국적인 여름 해변의 자유로운 스피릿.",
    isPublished: true,
    createdAt: "2025-07-25T18:30:00Z",
    updatedAt: "2025-07-25T18:30:00Z",
    coverImageId: "photo-yy-1",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-yy-1",
        order: 0,
        caption: "모래사장 위에 세워진 SURF 서핑보드와 분홍빛 노을",
        urls: {
          thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  },
  {
    id: "sapporo-tv-tower-2026",
    slug: "sapporo-tv-tower-2026",
    title: "삿포로, 오도리 공원의 눈축제 밤",
    date: "2026.02.08",
    location: "일본 홋카이도 삿포로 오도리 공원",
    weather: "눈축제, -8°C",
    camera: "Fujifilm X-T5",
    description: "거대한 설상 위로 조명이 켜지는 삿포로 눈축제의 현장. TV타워의 붉은 디지털 시계와 하얀 눈 조각의 대조.",
    isPublished: true,
    createdAt: "2026-02-08T19:00:00Z",
    updatedAt: "2026-02-08T19:00:00Z",
    coverImageId: "photo-sp-1",
    coverImageUrl: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=1600&auto=format&fit=crop",
    photos: [
      {
        id: "photo-sp-1",
        order: 0,
        caption: "오도리 공원 정중앙에 자리한 하얀 얼음 조각상",
        urls: {
          thumb: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=500&auto=format&fit=crop",
          medium: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=1600&auto=format&fit=crop",
          large: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?q=80&w=3000&auto=format&fit=crop"
        },
        aspectRatio: 1.5
      }
    ]
  }
];

// Reuse existing sample assets to give every demo gallery three distinct photos.
// These are UI fixtures, not additional photographs from the named locations.
export const INITIAL_MOCK_SESSIONS: PhotoSession[] = MOCK_SESSION_BASE.map((session, index) => ({
  ...session,
  photos: [
    ...session.photos,
    ...[1, 2].map((offset) => {
      const sample = MOCK_SESSION_BASE[(index + offset) % MOCK_SESSION_BASE.length].photos[0];
      return {
        id: `${session.id}-sample-${offset + 1}`,
        order: session.photos.length + offset - 1,
        caption: `전환 확인용 샘플 사진 ${offset + 1}`,
        urls: { ...sample.urls },
        aspectRatio: sample.aspectRatio,
      };
    }),
  ],
}));
