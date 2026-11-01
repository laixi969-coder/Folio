#!/bin/zsh
cd "${0:A:h}"
if ! command -v node >/dev/null; then
  echo '需要先安装 Node.js 22.12 或更新版本。'
  read -k 1
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm install || exit 1
fi
if [[ ! -d dist ]]; then
  npm run build || exit 1
fi
npm run start:lan
