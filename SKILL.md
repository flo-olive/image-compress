---
name: image-compress
description: 지정한 디렉토리에서 300kb를 초과하는 JPG/PNG 이미지를 자동으로 압축합니다. "이미지 압축", "사진 용량 줄이기", "public 폴더 이미지 최적화", "파일 크기 줄여줘", "_mini로 저장", "300kb 넘는 이미지" 등의 요청이 오면 즉시 이 스킬을 사용하세요. 이미지 최적화, 웹 성능 개선, 용량 문제 등 이미지 파일 크기와 관련된 모든 요청에 적극 사용하세요.
---

## 개요

지정 디렉토리의 JPG/PNG 파일 중 300kb 초과 파일을 압축한다.

- **JPEG**: mozjpeg 인코더, quality 80부터 30까지 10씩 줄이며 300kb 이하가 되면 저장
- **PNG**: palette 양자화, 256 → 128 → 64 colours 단계적 감소
- 결과: `photo.jpg` → `photo_mini.jpg` (원본 삭제)
- 300kb 이하 파일은 건드리지 않는다
- 이미 `_mini`가 붙은 파일은 건너뜀
- 하위 폴더까지 재귀 탐색한다

## 실행 순서

### 1. sharp 설치 확인

```bash
node -e "require('sharp')" 2>/dev/null && echo "OK" || echo "MISSING"
```

없으면 설치:

```bash
npm install sharp
```

### 2. 스크립트 실행

```bash
node ~/.claude/skills/image-compress/scripts/compress.js <디렉토리 경로>
```

예시:

```bash
node ~/.claude/skills/image-compress/scripts/compress.js ./public/images
```

### 3. 결과 해석

```
🔍 5개 이미지 파일 발견

건너뜀 (320kb ≤ 300kb): icon.png
✓ hero.jpg → hero_mini.jpg (1200kb → 320kb, 73% 감소)
✓ banner.png → banner_mini.png (800kb → 410kb, 49% 감소)
⚠ huge.png → huge_mini.png (4000kb → 680kb, 300kb 미만 달성 불가)

✅ 완료
```

- `✓` — 300kb 이하로 압축 성공, 원본 삭제됨
- `건너뜀` — 이미 300kb 이하이거나 `_mini` 파일
- `⚠` — 최대한 압축했지만 300kb 미만 달성 불가 (해상도가 매우 큰 PNG에서 발생 가능)

## 주의사항

- **원본 파일은 삭제된다** — 실행 전 중요한 파일은 미리 백업
- `⚠` 케이스가 나오면 사용자에게 해상도 축소 여부를 물어볼 것
