#!/usr/bin/env bash
# Gera todas as fotos e vídeos do site (public/media/) a partir dos brutos da pasta "marketing" do Drive.
# Cada trecho/quadro abaixo foi escolhido à mão — anotado ao lado. Para trocar um, mude o tempo e rode de novo.
#
# Uso: npm run midia:site [pasta-marketing]
#   (padrão: a pasta baixada do Drive em assets/marketing-*/marketing)
#
# Regra das escolhas: nas fotos de uso geral (hero, serviços, sobre) só entram quadros SEM nome ou logo
# de cliente. Material que identifica cliente fica só nos cases/apoios, que só vão ao ar com autorização
# por escrito (src/data/autorizacoes.ts).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
BRUTO="${1:-$(ls -d "$RAIZ"/assets/marketing-*/marketing 2>/dev/null | head -n 1)}"
[[ -d "$BRUTO" ]] || { echo "Pasta de mídia bruta não encontrada. Informe o caminho da pasta 'marketing'." >&2; exit 1; }
M="$BRUTO/Mídia "
SAIDA="$RAIZ/public/media"
mkdir -p "$SAIDA"

ffm() { ffmpeg -nostdin -hide_banner -loglevel error -y "$@"; }

# Recorte: vídeo em pé (celular) → faixa horizontal na altura relativa Y (0 = topo, 1 = base).
faixa() { # faixa PROPORCAO Y   → filtro de recorte para fontes em pé
  echo "crop=iw:iw/($1):0:(ih-iw/($1))*$2"
}

# foto NOME ARQUIVO TEMPO [FILTRO] → public/media/NOME.webp (até 1600px de largura)
foto() {
  local nome=$1 arquivo=$2 tempo=$3 filtro=${4:-null}
  ffm -ss "$tempo" -i "$arquivo" -frames:v 1 -vf "$filtro,scale='min(1600,iw)':-2" -c:v libwebp -quality 82 "$SAIDA/$nome.webp"
  echo "  foto   $nome.webp  $(du -h "$SAIDA/$nome.webp" | cut -f1)"
}

# video NOME ARQUIVO INICIO DURACAO [FILTRO] → NOME.mp4 (1280px, sem áudio) + NOME.jpg (capa)
video() {
  local nome=$1 arquivo=$2 inicio=$3 duracao=$4 filtro=${5:-null}
  ffm -ss "$inicio" -t "$duracao" -i "$arquivo" -an \
    -vf "$filtro,scale=1280:-2,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 27 -movflags +faststart "$SAIDA/$nome.mp4"
  ffm -ss "$inicio" -i "$arquivo" -frames:v 1 -vf "$filtro,scale=1280:-2" -q:v 4 "$SAIDA/$nome.jpg"
  echo "  vídeo  $nome.mp4  $(du -h "$SAIDA/$nome.mp4" | cut -f1)"
}

MB="$M/Metabee "
COPA="$M/Copa pinhão "
IND="$M/Rogge"

echo "Hero: montagem de bancada (cinco cortes sem logo de cliente, 16:9)"
H169=$(faixa 16/9 0.5)
ffm \
  -ss 9.4 -t 2.4 -i "$MB/20260919_155859.mp4" \
  -ss 0.4 -t 2.8 -i "$MB/20260919_160502.mp4" \
  -ss 5.6 -t 2.8 -i "$MB/20260919_155915.mp4" \
  -ss 6.0 -t 2.8 -i "$MB/20260919_164131.mp4" \
  -ss 10.4 -t 2.4 -i "$MB/20260919_180608.mp4" \
  -filter_complex "\
    [0:v]scale=1280:720,setsar=1,fps=30[a];\
    [1:v]$(faixa 16/9 0.35),scale=1280:720,setsar=1,fps=30[b];\
    [2:v]$(faixa 16/9 0.55),scale=1280:720,setsar=1,fps=30[c];\
    [3:v]$(faixa 16/9 0.45),scale=1280:720,setsar=1,fps=30[d];\
    [4:v]$(faixa 16/9 0.62),scale=1280:720,setsar=1,fps=30[e];\
    [a][b][c][d][e]concat=n=5:v=1:a=0,fade=t=in:st=0:d=0.5,fade=t=out:st=12.7:d=0.5,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 27 -movflags +faststart "$SAIDA/hero-laboratorio.mp4"
ffm -ss 1.2 -i "$SAIDA/hero-laboratorio.mp4" -frames:v 1 -q:v 4 "$SAIDA/hero-laboratorio.jpg"
echo "  vídeo  hero-laboratorio.mp4  $(du -h "$SAIDA/hero-laboratorio.mp4" | cut -f1)"

echo "Serviços (só quadros sem nome/logo de cliente)"
foto servico-eletronica-pcb "$MB/20260919_155859.mp4" 10.5                       # pads com pasta de solda + logo da DC na serigrafia
foto servico-firmware       "$MB/20260919_180608.mp4" 12.5 "$(faixa 4/3 0.42)"   # tela rodando o firmware com o logo da DC
foto servico-mecanica       "$COPA/20260907_142126.mp4" 0.3                      # obstáculo modular em MDF
foto servico-integracao     "$MB/VID-20260919-WA0016.mp4" 6 "crop=iw*0.8:iw*0.8/(16/9):iw*0.1:(ih-iw*0.8/(16/9))*0.74"  # tela de configuração Wi-Fi (sem o cabeçalho com o nome do cliente)
foto servico-manufatura     "$MB/20260919_155915.mp4" 7 "$(faixa 4/3 0.55)"      # pinça posicionando componentes SMD
foto servico-edge-ai        "$MB/20260919_160502.mp4" 8.5 "$(faixa 4/3 0.4),crop=iw*0.72:ih*0.72:0:ih*0.14"  # módulo processador (corta o logo do cliente à direita)
foto servico-robotica       "$COPA/20260907_142046.mp4" 2                        # pórtico com obstáculo motorizado

echo "Sobre"
foto sobre-laboratorio      "$MB/20260919_164131.mp4" 15 "$(faixa 16/9 0.45),crop=iw*0.8:ih*0.8:0:ih*0.2"  # mãos soldando na bancada

echo "Apoios"
video apoio-maker-faire     "$M/Maker Faire /20260906_172743.mp4" 0 6            # painel de patrocinadores com o logo da DC
video apoio-copa-pinhao     "$COPA/20260907_142046.mp4" 0 6                      # obstáculo móvel em funcionamento

echo "Cases (só vão ao ar com autorização por escrito)"
video case-metabee          "$MB/20260919_180608.mp4" 0 10 "$(faixa 16/9 0.45)"  # placa ligando + tela com o logo
foto case-industrial        "$IND/20261012_215026.mp4" 20 "$(faixa 16/9 0.5)"    # montagem SMD, sem logo do cliente

echo "Pronto: $SAIDA"
