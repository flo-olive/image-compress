# image-compress

지정한 디렉토리에서 **300kb를 초과하는 JPG/PNG 이미지를 자동으로 압축**하는 Claude Code 스킬.

## 동작 방식

[TinyPNG](https://tinypng.com)의 압축 방식에 기반해 구현했습니다.

TinyPNG은 이미지에서 사람 눈에 잘 보이지 않는 색상 정보를 줄이는 방식으로 압축합니다. 수백만 가지 색상을 사용하는 원본 이미지에서 비슷한 색끼리 묶어 색 수를 줄이고, 시각적으로 거의 차이가 없는 수준에서 최소한의 품질만 낮추는 것이 핵심입니다.

- **JPEG**: quality 80부터 시작해 300kb 이하가 될 때까지 10씩 낮추며 압축 (최저 30)
- **PNG**: 색상 수를 256→128→64로 줄이며 300kb 이하가 될 때까지 단계적으로 압축
  - 한 번에 최저 품질로 압축하면 과도하게 손상될 수 있어, 목표 용량에 도달하는 최소한의 품질만 적용
- 결과 파일: `photo.jpg` → `photo_mini.jpg` (원본 삭제)
- 이미 300kb 이하인 파일은 건드리지 않음
- `_mini`가 붙은 파일은 이전에 이미 압축된 파일이므로 건너뜀
- 지정한 폴더 안의 폴더까지 모두 탐색해 이미지를 찾음

## 설치

**1. 스킬 폴더에 클론**

```bash
git clone https://github.com/flo-olive/image-compress ~/.claude/skills/image-compress
```

**2. 의존성 설치**

```bash
cd ~/.claude/skills/image-compress && npm install
```

## 사용법

```bash
node scripts/compress.js <디렉토리 경로>
```

예시:

```bash
node scripts/compress.js ./public/images
```

## 출력 예시

```
🔍 5개 이미지 파일 발견

건너뜀 (320kb ≤ 300kb): icon.png
✓ hero.jpg → hero_mini.jpg (1200kb → 320kb, 73% 감소)
✓ banner.png → banner_mini.png (800kb → 410kb, 49% 감소)
⚠ huge.png → huge_mini.png (4000kb → 680kb, 300kb 미만 달성 불가)

✅ 완료
```

| 아이콘 | 의미 |
|---|---|
| `✓` | 압축 성공, 원본 삭제됨 |
| `건너뜀` | 이미 300kb 이하이거나 `_mini` 파일 |
| `⚠` | 최대 압축해도 300kb 미만 달성 불가 |

## 주의사항

- **원본 파일은 삭제됩니다** — 실행 전 중요한 파일은 미리 백업
