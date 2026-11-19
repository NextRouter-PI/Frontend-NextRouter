# NextRouter — instruções e contexto para agentes no frontend

Este documento orienta agentes de IA que trabalham neste repositório.
Todos os caminhos de código e comandos abaixo são relativos à raiz do frontend.

## 1. Fontes de verdade e escopo

- **Referências internas do repositório:**
  - [README.md](README.md): comandos de inicialização local (`npm run dev`), build (`npm run build`), rede local (`npm run dev:lan`) e qualidade.
  - [tests/README.md](tests/README.md): execução opt-in dos testes automatizados (`npm test`).
  - [package.json](package.json), [vite.config.js](vite.config.js), [eslint.config.js](eslint.config.js), [.oxlintrc.json](.oxlintrc.json) e [.prettierrc.json](.prettierrc.json): dependências, scripts, build e regras de lint/formatação.
- **Abordagem de desenvolvimento:** trabalhe por jornada demonstrável, aproveitando
  a estrutura Vue existente sem reescrever a base nem migrar para TypeScript ou trocar
  a stack. Não altere dependências nem o `package-lock.json` sem autorização explícita.
- **Comportamento e estado de transição:** o núcleo de comunicação HTTP, sessão por
  cookies `HttpOnly`, proteção CSRF e aposentadoria seletiva do PWA legado já está
  consolidado (`src/api/http.js`, `src/stores/session.js`, `src/legacyPwa.js`). Parte
  dos formulários, stores e telas operacionais ainda contém chamadas a endpoints
  legados e deve ser adaptada incrementalmente por jornada. Não trate a simples
  renomeação de URLs como migração concluída: conta, moderação cadastral, vínculo
  empresarial, grupo de atendimento, serviço habitual, dia de atendimento, resposta
  diária, pedido de alteração, alocação e viagem publicada são conceitos e estados
  distintos.

## 2. Stack e mapa do repositório

- **Stack:** Vue 3 (JavaScript, ES Modules), Vite 7, Vue Router 5, Pinia 3, Axios,
  Leaflet (mapas), Chart.js / `vue-chartjs` (gráficos) e `@mdi/font` (ícones).
  Qualidade com ESLint, Oxlint e Prettier; testes nativos com `node --test`.
- **Entradas e configuração na raiz:**
  - `index.html` e `src/main.js`: bootstrap da aplicação, limpeza seletiva de
    credenciais/service workers legados antes do mount, Pinia, Vue Router e
    listeners globais de mudança/expiração de sessão entre abas.
  - `vite.config.js`: base `/`, `publicDir: false` (apenas assets importados são
    emitidos com hash sob `/assets/`), servidor em `127.0.0.1:5173` (`strictPort: true`)
    e proxy de `/api`, `/ws` e `/media` preservando `Host` e `Origin` (`changeOrigin: false`).
- **Camada HTTP e autenticação (`src/api/` e `src/legacyPwa.js`):**
  - `src/api/http.js`: `createHttpClient` com restrição estrita à mesma origem (`/api/`),
    cookies (`withCredentials: true`), bootstrap e rotação de CSRF (`GET /api/csrf/` e
    cabeçalho `X-CSRFToken`), coordenação de `login`/`refresh`/`logout` via Web Locks
    (`nextrouter-cookie-session`) e sincronização entre abas via `BroadcastChannel`
    (`nextrouter-vue-session`). Inclui agregação automática de páginas para `GET` sem
    `params.page` explícito (`page_size: 100`).
  - `src/api/client.js`: instância padrão do cliente HTTP com limpeza em HMR.
  - `src/api/upload.js`: envio `multipart/form-data` para `/uploads/images/` e
    `/uploads/documents/`.
  - `src/api/registration.js`: normaliza e restringe os campos enviados no cadastro,
    verifica o código sem consumi-lo e cria perfil em JSON com `user_data` aninhado.
    O servidor revalida/consome o código na criação; não há login, aprovação ou vínculo
    automático. Não enviar objetos de formulário como multipart com chaves pontuadas.
  - `src/api/companies.js`: descoberta com whitelist pública (`id`, `trade_name`,
    `city`, `state`). Filtros de cidade/UF consultam destino atendido; os campos da
    resposta são cadastrais, não uma lista de cidades atendidas ou pontos operacionais.
  - `src/api/memberships.js`: listas com página explícita, pedido do próprio perfil e
    transições `approve/reject/withdraw`. Consulta pessoal confere pending/active fora
    da página do histórico e resolve somente o nome público do ciclo aberto (sem N+1).
  - `src/legacyPwa.js`: remoção seletiva das chaves antigas (`access`, `user`,
    `manualLogout`) do storage, desregistro de `/sw.js` e `/dev-sw.js` da mesma
    origem e limpeza apenas dos caches conhecidos (`api-cache`, `google-fonts-cache`,
    `gstatic-fonts-cache` e `workbox-precache-v2-*`).
- **Estado e sessão (`src/stores/`):**
  - `src/stores/state.js`, `src/stores/session.js` e `src/stores/useLoginState.js`:
    estado reativo de autenticação exclusivamente em memória (`logged`, `initialized`,
    `user`, `role`, `profiles`, `loading`, `error`, `checkingAuth`). A identidade é
    obtida em `users/me/` e o papel ativo é resolvido consultando `companies/me/`,
    `drivers/me/` e `passengers/me/` (sem depender de campo `type` em `users/me/`).
  - Demais stores (`useRegisterState.js`, `useRotasStore.js`, `useTransporteStore.js`,
    `useTransportState.js`, `useQuestionnaireState.js`, `useUploadImage.js`): estado
    de fluxos específicos de cadastro e operação (verificar alinhamento com o contrato
    atual antes de reutilizar chamadas legadas).
  - `useRegisterState.js` e `useUploadImage.js` mantêm os nomes/caminhos históricos,
    mas são composables locais, não stores Pinia. Chamá-los durante `setup` ou em
    um escopo Vue ativo: estado e requisições pertencem à instância e são descartados
    com ela. O envio de código em `useEmailVerification.js` segue o mesmo ciclo de
    vida. Abortar a espera local não desfaz escrita já aceita pelo servidor nem
    autoriza repetição automática.
- **Navegação (`src/router/index.js`):**
  - Rotas públicas (`meta: { requiresAuth: false }`): `/login`, `/signup`,
    `/signup/usuario`, `/signup/motorista`, `/signup/empresa`, `/signup/confirmacao`,
    `/forgot-password`, `/logout` e `/empresas`. A descoberta usa
    `allowAuthenticated: true` para também aceitar contas autenticadas.
  - Rotas autenticadas (`meta: { requiresAuth: true }`): `/`, `/usuario`, `/lista`,
    `/transporte`, `/cadastro-veiculo`, `/veiculos/editar/:id`, `/cadastro-rota`,
    `/rotas/editar/:id`, `/usuarios`, `/usuarios/motorista/:id`, `/usuarios/passageiro/:id`
    e `/vinculos`.
  - O guard `beforeEach` executa `checkAuth()` na primeira navegação autenticada,
    aplica o tema (`localStorage.getItem('theme')`) em rotas privadas e na descoberta e
    redireciona conforme `state.logged`.
- **Componentes, views, composables e utilitários (`src/`):**
  - `src/views/`: views de página mapeadas pelo router (`HomeView`, `LoginView`,
    `SignUpView`, `ConfirmationView`, `ForgotPasswordView`, `LogoutView`, `UserView`,
    `ListView`, `TransportView`, `CompanyDirectoryView`, `MembershipsView`).
  - `src/components/layout/`: `RoleBasedView.vue` (seleciona a tela por papel ativo),
    `AppHeader.vue`, `AppSideBar.vue`, `AppBottomNavigationBar.vue`, `AvatarUpload.vue`.
  - `src/components/auth/` e `src/components/forms/`: login, confirmação de código
    e formulários de cadastro por perfil
    (`SignUpPassenger.vue`, `SignUpDriver.vue`, `SignUpCompany.vue`, `AddressSection.vue`,
    `CnhSection.vue`).
  - `src/components/pages/`: telas segmentadas em `company/`, `driver/` e `passenger/`.
  - `src/components/ui/`: componentes visuais reutilizáveis (`BaseButton`, `FloatingInput`,
    `FormField`, `FormattedField`, `PasswordField`, `SelectField`, `CodeInput`, `DateInput`,
    `FileUploadField`, `ErrorMessage`, `SuccessDisplay`, `LoadingSpinner`, `LiveLocationMap`,
    `MapBackground`).
  - `DateInput.vue` usa `v-model:day`, `v-model:month` e `v-model:year`, com erros
    separados e IDs por instância; não recebe nem altera o formulário inteiro.
  - `src/composables/`: lógica reutilizável (`useDeviceLayout`, `useEmailVerification`,
    `useInputFormat`, `useSignUpForm`, `useSignUpCompanyForm`, `useTransportQuestionnaire`,
    `useTravelTracking`, `useValidation`, `useToast`). `useToast` mantém mensagem e
    timer por escopo, substitui o timer anterior e ignora chamadas após descarte.
  - `useEmailVerification` vincula o código ao e-mail solicitado; voltar à revisão
    não reenvia código durante o cooldown. `usePasswordReset` mantém um fluxo próprio
    de solicitação/verificação/confirmação, com mensagens antienumeração. Validade e
    limites são do servidor; cooldown no cliente não é proteção autoritativa.
  - `useCompanyDirectory` mantém filtros aplicados, paginação e cancelamento de busca.
    `useMemberships` mantém consulta/escrita por escopo e identidade, bloqueia ações
    com leitura inválida ou escrita em andamento e exige releitura após falha. Uma
    confirmação de POST não implica sucesso da consulta posterior. Não há replay.
  - `src/components/memberships/`: apresentação mínima e confirmação com motivo
    opcional. `CompanyUsuarios.vue` usa vínculos, não listas de identidade ou grupo.
    Detalhes legados em `UsuarioDetalhe.vue` continuam fora dessa jornada, para revisão
    em recorte de perfil. As quatro buscas antigas sem consumidores foram retiradas.
  - `src/utils/apiErrors.js`: `formatApiError` para traduzir respostas de erro aninhadas
    da API, erros de rede, `429` e `5xx` em mensagens legíveis em português.
  - `src/assets/css/`: variáveis de tema (`theme.css`) e estilos globais (`global.css`).
- **Scripts e testes (`scripts/`, `tests/`):**
  - `tests/http.test.js`, `tests/session.test.js`, `tests/legacyPwa.test.js` e
    `tests/smokeHarness.test.js`: suíte unitária executada via `npm test`.
  - `scripts/build_backend.mjs` e `scripts/test_django_browser.mjs`: scripts auxiliares
    de build e smoke integrado.

## 3. Regras obrigatórias de arquitetura e segurança

- **Mesma origem e zero JWT no cliente:** todas as chamadas HTTP devem passar pelo
  cliente de `src/api/client.js` (`baseURL: '/api/'`, mesma origem). Nunca armazene
  tokens JWT, dados de sessão ou perfis privados em `localStorage`, `sessionStorage`,
  IndexedDB ou cookies acessíveis por JavaScript, e nunca envie `Authorization: Bearer`
  nem inclua tokens em URLs de HTTP ou WebSocket. O único item permitido em
  `localStorage` é a preferência visual `'theme'`.
- **Semântica de CSRF, 401, 403 e mutações:**
  - Métodos de escrita (`POST`, `PATCH`, `PUT`, `DELETE`) exigem sempre `X-CSRFToken`
    obtido via `/api/csrf/` (gerenciado automaticamente por `src/api/http.js`).
  - `401 Unauthorized` em leitura (`GET`) dispara no máximo **uma** tentativa de
    renovação coordenada (`POST /api/refresh/`) seguida de uma única repetição da leitura.
  - `403 Forbidden` **nunca** dispara refresh automático (indica falha de permissão
    ou CSRF inválido).
  - Mutações de negócio **nunca** sofrem replay automático após falha ou `401`; o
    usuário deve ser informado claramente se a sessão expirou.
  - Em contextos sem suporte a `navigator.locks` (como HTTP em IP de rede local), a
    renovação automática não é disputada sem mutex; exija novo login.
- **Isolamento entre contas e abas:**
  - No login, limpe a identidade anterior imediatamente após a troca dos cookies para
    que uma falha subsequente nas leituras de perfil nunca exiba dados da conta antiga.
  - O logout só é confirmado após resposta bem-sucedida de `POST /api/me/logout/`;
    eventos de troca/saída em outra aba (`external-changed`) forçam `window.location.reload()`
    para descartar todo o estado em memória das stores.
  - Mensagens em `BroadcastChannel` notificam apenas o tipo do evento (`changed` ou
    `refreshed`), nunca transportando tokens, CSRF ou dados do usuário.
- **Artefato de build e PWA:**
  - O PWA e o registro de service worker estão desativados. O pacote `vite-plugin-pwa`
    permanece no `package.json` apenas para preservar o lockfile; não o ative no
    `vite.config.js` nem copie `public/` no build (`publicDir: false`).
  - Todo asset visual novo (imagens, ícones, fontes) deve ser importado pelo código
    para que o Vite o emita com hash dentro de `/assets/`. Não referencie arquivos
    soltos na raiz pública além de `/favicon.ico` e `/index.html`.
- **WebSockets e localização (`src/composables/useTravelTracking.js`):**
  - A URL WebSocket deriva de `window.location.protocol` (`ws:`/`wss:`) e
    `window.location.host` (`/ws/travels/${travelId}/location/`), autenticada pelos
    cookies da mesma origem, sem query string de token.
  - Trate indisponibilidade de geolocalização, posição ausente/desatualizada, perda de
    conexão e encerramento de acesso sem prometer rastreamento contínuo em segundo plano.

## 4. Diretrizes de domínio e adaptação de interface

- **Eixos independentes no domínio:**
  - **Conta e autenticação:** login usa **e-mail** e senha (nunca nome de usuário).
    Recuperação de senha não deve exibir mensagens que permitam enumerar quais e-mails
    estão cadastrados.
  - **Identidade vs. moderação vs. vínculo vs. grupo:** criar e confirmar uma conta de
    passageiro ou motorista não cria nem aprova vínculo com empresa. O cadastro de
    empresa passa por moderação cadastral separada. O pedido de vínculo usa
    `memberships/` (`approve/`, `reject/`, `withdraw/`, `end/`); a alocação em grupo
    e ponto operacional (`assign-group/`) e a autorização de serviços habituais
    (`authorize-services/`) são etapas posteriores ao vínculo ativo.
    CNH no cadastro de motorista é um documento opcional identificado por
    `attachment_key`, não um número de CNH obrigatório. Gênero não é campo da API
    atual e não é coletado como se fosse persistido.
    A R3 só apresenta retirada de pedido pendente, não encerramento de vínculo ativo.
    Não fabricar grupo/serviço ao aprovar. Cadastro empresarial pendente/recusado não
    autoriza consultar ou decidir vínculos; o titular pessoal ainda pode retirar seu
    pedido se a empresa deixar de ser pública/aprovada.
  - **Configuração habitual vs. operação datada:** grupos (`company-route-groups/`),
    políticas de resposta (`response-policies/`), pontos operacionais
    (`operational-points/`), frota (`vehicles/`) e serviços habituais
    (`recurring-services/`) compõem a configuração habitual. Atendimentos por data
    (`service-days/`), elegibilidades e respostas diárias (`eligibilities/`,
    `daily-responses/`), pedidos na prorrogação (`change-requests/`), viagens
    (`travels/`), participações/presença (`travel-participations/`) e snapshots de
    paradas (`route-snapshots/`, `route-stops/`) pertencem à operação datada.
  - **Intenção vs. alocação vs. publicação:** no questionário/resposta do passageiro,
    ida e retorno são independentes e as opções de horário devem vir dos serviços
    autorizados para aquele aluno (não de horários fixos como 12h/17h). Enviar
    resposta ou ter pedido aprovado na prorrogação não equivale a viagem publicada.
- **Uso dos protótipos no Figma:**
  - Páginas principais do arquivo Figma:
    - [Mobile](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=0-1) e [Desktop](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=649-160)
    - [Login](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=495-889) (ex.: [Login/Cadastro](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=70-67))
    - [Empresa](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=495-886) (ex.: [Gerenciamento de rotas](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=213-50))
    - [Motorista](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=495-888) (ex.: [Meu transporte](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=325-88))
    - [Passageiro](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=495-887) (ex.: [Questionário](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=306-98))
    - [Outros](https://www.figma.com/design/vUK2DY8Mx0OxD1RqgremkS/NEXTROUTER?node-id=495-890)
  - O Figma orienta a identidade visual e o layout, mas **não autoriza alterar regras
    de negócio** nem reativar fluxos legados. Não copie código gerado do Figma;
    reutilize os componentes de `src/components/ui/` e `src/assets/css/`, adaptando
    campos, rótulos e estados ausentes no protótipo (carregamento, erro de rede,
    sessão expirada, empresa em moderação, ausência de vínculo, pedido pendente/recusado,
    conflito de revisão e lista vazia).

## 5. Ambiente, qualidade e validação

- **Autorização prévia obrigatória:** não crie nem execute testes, builds ou
  servidores automaticamente por padrão. Peça autorização quando a validação envolver
  iniciar servidores, executar builds de integração ou rodar suítes com navegador.
  Não crie modos de login simulado ou mocks de dados privados para funcionar sem API.
- **Comandos disponíveis (executar em `frontend/` quando autorizados):**
  - `npm run dev`: inicia o servidor Vite com HMR em `http://127.0.0.1:5173`.
  - `npm run dev:lan`: expõe o servidor Vite na rede local (`--host 0.0.0.0`).
  - `npm run build`: compila o bundle de produção em `dist/`.
  - `npm test`: executa os testes unitários em Node (`node --test tests/*.test.js`),
    cobrindo cliente HTTP/CSRF/refresh, sessão, retirada seletiva de PWA legado e
    guardas do harness de smoke.
  - `npm run lint` (`lint:oxlint` e `lint:eslint`) e `npm run format` (Prettier em `src/`):
    atenção pois os scripts `lint:*` e `format` do `package.json` usam `--fix` / `--write`
    e modificam arquivos. Os diretórios gerados (`dist/`, `dev-dist/`) são ignorados
    pela configuração de lint/Prettier e não devem ser editados como código-fonte.
- **Convenções de código e estilo ([.prettierrc.json](.prettierrc.json), [eslint.config.js](eslint.config.js)):**
  - Sem ponto e vírgula (`semi: false`), aspas simples (`singleQuote: true`),
    indentação de 2 espaços, largura máxima de 100 colunas e fim de linha `lf`.
  - `src/**` usa globals de navegador; `*.js`, `scripts/**` e `tests/**` usam globals de Node.
- **Mudanças exclusivamente documentais:** verifique links internos, consistência com
  o código e `git diff --check`; não execute testes funcionais ou builds sem necessidade
  ou autorização, e nunca apresente validações anteriores como executadas na revisão atual.

## 6. Commits e documentação

- **Commits atômicos por mudança lógica:** siga o padrão do histórico (`git log`),
  usando prefixos `feat:`, `fix:`, `chore:`, `docs:` ou `test:` com descrição curta em
  português.
- **Escopo limpo:** inclua implementação, testes e documentação do repositório que
  pertençam à mesma mudança lógica no mesmo commit. Confirme `git status` e
  `git diff --check` antes de versionar. Não misture assuntos independentes, trabalho
  preexistente ou artefatos de build (`dist/`), e nunca faça `git push` ou `git merge`
  sem pedido explícito.
- **Manutenção documental:** ao alterar scripts, fluxos ou testes, mantenha
  atualizados [README.md](README.md), [tests/README.md](tests/README.md) e este
  [AGENTS.md](AGENTS.md), registrando com precisão o que foi ou não validado.
