# image-compress

지정한 디렉토리에서 **300kb를 초과하는 JPG/PNG 이미지를 자동으로 압축**하는 Claude Code 스킬.

## 동작 방식

- **JPEG**: mozjpeg 인코더, quality 80→30 단계적 감소
- **PNG**: palette 양자화, 256→128→64 colours 단계적 감소
- 결과 파일: `photo.jpg` → `photo_mini.jpg` (원본 삭제)
- 300kb 이하 파일, `_mini` 파일은 건너뜀
- 하위 폴더 재귀 탐색

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
