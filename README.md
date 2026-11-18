# NextRouter — frontend

Interface Vue do NextRouter. No workspace completo, este repositório fica em
`frontend/`, ao lado de `backend/` e `doc/`. O planejamento e o contexto foram
centralizados na raiz comum, um nível acima:

- [Plano de implementação](../PLANO_IMPLEMENTACAO.md)
- [Contexto do frontend e referências do Figma](../CONTEXTO_FRONTEND.md)
- [Contrato da API](../CONTRATO_API.md)
- [Build integrado ao Django](../BUILD_VUE.md)

Se você clonou apenas este repositório, solicite acesso à raiz compartilhada
para consultar esses documentos. Os comandos a seguir são executados aqui,
no repositório frontend.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm ci
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

`npm run build` gera o artefato do Vue; isso não valida a aplicação servida pelo
Django. Consulte o guia de build para o empacotamento e as verificações integradas.

## Consolidação — primeiro recorte

O cliente usa `/api/` na mesma origem, cookies HttpOnly e bootstrap CSRF; não
espera JWT no JSON nem persiste usuário/tokens no storage. O papel vem das
leituras próprias de perfil (`companies/me/`, `drivers/me/`, `passengers/me/`),
não de um campo inventado em `users/me/`. Permissão continua no backend.

GET pode repetir uma leitura uma vez após refresh coordenado por Web Locks.
403 e mutações nunca disparam refresh/replay automático. Sem Web Locks, a sessão
expirada exige novo login; falha de logout não é apresentada como saída confirmada.
Troca de conta/logout em outra aba recarrega o documento para descartar estados
privados também das telas que ainda não foram migradas.

PWA/offline foi adiada. O build não copia `public/` nem gera manifestos/workers;
ícones importados vão para `/assets/`. Na inicialização, removem-se somente as
chaves legadas `access`, `user`, `manualLogout`, os workers antigos reconhecidos
na raiz e seus caches conhecidos. Não se usa `storage.clear()` ou limpeza global
de caches. **Limite:** uma instalação antiga presa inteiramente ao bundle offline
pode nunca executar o código de transição; nesse caso, fechar abas e limpar os
dados do site manualmente. A migração de instalações antigas ainda precisa de
aceite em dispositivos reais.

O proxy Vite aponta `/api` e `/ws` para `http://127.0.0.1:8000`, sem reescrever
Origin. Não iniciar o backend no banco habitual por seguir este exemplo.
Vite dev/preview não é entrega de produção.

### Testes sem dependências novas

```sh
npm test
```

Testes nativos Node de HTTP/CSRF, sessão, concorrência simulada entre abas e
transição dos caches. Não substituem navegador nem os testes PostgreSQL/Redis.

Smoke opcional do **Vue real compilado e servido pelo Django**, no workspace
completo, com frontend/backend limpos e commitados:

```sh
node scripts/test_django_browser.mjs --confirm-fictitious
```

Requer Node >=22, Firefox e a `.venv` existente em `../backend/`; não instala
pacotes. Cria build, manifesto, SQLite/arquivos e perfil Firefox próprios sob
`/tmp/opencode`, aplica só as migrations existentes nesse banco e encerra/remove
apenas os próprios recursos. O overlay temporário de teste não edita os settings
do backend. Bloqueia Internet, usa apenas identidades fictícias, e valida sessão,
CSRF, refresh entre abas, logout e limites do artefato. Não valida cadastro/vínculo,
TLS/WSS, mapas/viagens, produção ou o Marco A completo.

O mapeamento Figma → Vue → API e as evidências por revisão estão no
[plano central](../PLANO_IMPLEMENTACAO.md). Cadastro, recuperação de senha,
pesquisa/vínculo e telas operacionais ainda exigem seus próprios recortes.

### Lint e correção automática

O script pode alterar arquivos (`--fix`).

```sh
npm run lint
```
