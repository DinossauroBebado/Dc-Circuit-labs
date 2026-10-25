#!/usr/bin/env bash
# Converte fotos e vídeos brutos (do celular, da pasta do Drive) em arquivos leves para o site.
#
#   npm run midia -- <arquivo-bruto> <nome-de-saida> [início] [duração]
#
# Exemplos:
#   npm run midia -- midia-bruta/20260906_172743.mp4 apoio-maker-faire 00:00:04 8
#   npm run midia -- midia-bruta/20261012_211832.jpg sobre-laboratorio
#
# Vídeo → public/media/<nome>.mp4 (H.264, 1280px, sem áudio, loop de até 10 s, ~2–4 MB)
#         public/media/<nome>.jpg (quadro de capa, mostrado enquanto o vídeo carrega)
# Foto  → public/media/<nome>.webp (1920px, qualidade 80)
#
# Depois, preencha `src` (e `poster`, no vídeo) do item correspondente em src/data/midia.ts.
# Coloque os brutos em midia-bruta/ (fica fora do git — são centenas de MB).
set -euo pipefail

ENTRADA="${1:?Informe o arquivo bruto}"
NOME="${2:?Informe o nome de saída (ex.: hero-laboratorio)}"
INICIO="${3:-00:00:00}"
DURACAO="${4:-8}"
SAIDA="$(cd "$(dirname "$0")/.." && pwd)/public/media"
mkdir -p "$SAIDA"

case "${ENTRADA,,}" in
  *.mp4|*.mov|*.m4v|*.webm)
    ffmpeg -hide_banner -loglevel error -y -ss "$INICIO" -t "$DURACAO" -i "$ENTRADA" \
      -an -vf "scale='min(1280,iw)':-2,fps=30" -c:v libx264 -preset slow -crf 27 \
      -pix_fmt yuv420p -movflags +faststart "$SAIDA/$NOME.mp4"
    ffmpeg -hide_banner -loglevel error -y -ss "$INICIO" -i "$ENTRADA" -frames:v 1 \
      -vf "scale='min(1280,iw)':-2" -q:v 4 "$SAIDA/$NOME.jpg"
    echo "Pronto: public/media/$NOME.mp4 ($(du -h "$SAIDA/$NOME.mp4" | cut -f1)) + capa $NOME.jpg"
    echo "Em src/data/midia.ts:  src: '/media/$NOME.mp4', poster: '/media/$NOME.jpg',"
    ;;
  *.jpg|*.jpeg|*.png|*.heic|*.webp)
    ffmpeg -hide_banner -loglevel error -y -i "$ENTRADA" \
      -vf "scale='min(1920,iw)':-2" -c:v libwebp -quality 80 "$SAIDA/$NOME.webp"
    echo "Pronto: public/media/$NOME.webp ($(du -h "$SAIDA/$NOME.webp" | cut -f1))"
    echo "Em src/data/midia.ts:  src: '/media/$NOME.webp',"
    ;;
  *)
    echo "Formato não suportado: $ENTRADA" >&2
    exit 1
    ;;
esac
