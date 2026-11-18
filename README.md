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

### Lint e correção automática

O script pode alterar arquivos (`--fix`).

```sh
npm run lint
```
