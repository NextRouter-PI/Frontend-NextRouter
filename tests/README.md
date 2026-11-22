# Testes do frontend

Execute em `frontend/`, apenas quando a validação estiver autorizada:

```sh
npm test
```

Os testes Node verificam HTTP/CSRF/refresh com adapter em memória, identidade e
papéis de sessão e retirada seletiva de credenciais/caches legados. Não precisam
de Django nem simulam uma jornada integrada ou um navegador real.

`smokeHarness.test.js` verifica somente a recusa do smoke sem confirmação,
antes de importar o backend ou preparar recursos; não inicia o smoke completo.
Os testes de PWA continuam necessários enquanto existir a retirada do legado.

## Vue real servido pelo Django

`node scripts/test_django_browser.mjs --confirm-fictitious` continua opt-in:
requer o backend irmão, checkouts limpos, Node >=22 e Firefox já instalado.
Compila Vue, prepara banco fictício com migrations existentes e inicia Django/
navegador em recursos temporários. Essa execução exige autorização separada.

O runner duplicado `test_static_serving.mjs` e os aliases `test:static`/`test:serve`
foram retirados. Para desenvolver ou inspecionar o build manualmente, use os
comandos do [README principal](../README.md), sem testes implícitos.

Esta revisão foi estática: nenhum teste, build, servidor ou migration foi executado.

## Validação focal pendente — R1 de cadastro

Não foram criados nem executados testes para a R1. Antes de declarar o recorte
confiável, autorizar a verificação de:

- Erro, loading e sucesso isolados entre formulários/instâncias e após remontar.
- Entrada de data por digitação e sugestão, erros por campo e IDs distintos.
- Cliques repetidos sem duplicar cadastro, envio de código ou lote de documentos.
- Saída da tela durante resposta pendente, cooldown ou redirecionamento, sem
  callback tardio na tela nova; cancelamento local não comprova rollback no servidor.
- Falha parcial de upload: aguardar o lote terminar e preservar os anexos já enviados
  antes de nova tentativa explícita, sem replay automático de escrita.

ESLint focal sem `--fix`/cache e `git diff --check` passaram na revisão estática.
Isso não comprova renderização, interação, contrato de cadastro ou integração real.
CEP não faz parte desta evidência: seu tratamento foi adiado pelo responsável.

Nos perfis, também ficam pendentes a verificação de loading/erro de upload isolados
entre instâncias, de troca de foto ocupada até o PATCH terminar e sem continuação
local após sair da tela, e de toasts sucessivos cujo timer anterior não apague a
mensagem atual. Nenhum teste de perfil ou navegador foi executado nesta R1.

## Validação focal pendente — R2

Somente leitura do backend e análise estática do frontend, sem novos testes ou
execução funcional. Antes do aceite, autorizar a demonstração com dados fictícios de:

- Cadastro dos três perfis: `request` → `verify` → criação com JSON aninhado,
  sem criar conta quando a verificação falhar; CNH ausente/presente e três PDFs
  obrigatórios da empresa, com chaves de vínculo e falhas parciais.
- E-mail alterado entre revisão/código, reentrada durante cooldown, reenvio e código
  antigo, incorreto, expirado, bloqueado ou consumido. Colagem/autofill de seis
  dígitos, foco, IDs e campos desabilitados nos controles compartilhados.
- Recuperação de e-mail cadastrado/desconhecido com a mesma mensagem; verificação
  real antes da nova senha, `new_password`, erros de força e expiração entre etapas.
  Só resposta de confirmação bem-sucedida mostra sucesso e informa revogação.
- Saída durante requisições, 401/403/429/5xx, falha de rede/resultado incerto e
  cliques repetidos sem replay automático. Não declarar revogação de sessões ou
  proteção contra enumeração comprovadas apenas por lint ou leitura do código.

A confirmação pública antiga agora é informativa, sem afirmar análise/vínculo ou
usar e-mail da URL; o `ForgotPasswordForm.vue` órfão foi retirado. Conferência visual
das telas/estados alterados e integração no Vue servido pelo Django seguem pendentes.

## Validação focal pendente — R3 / Marco A

Implementação com revisão estática somente. Nenhum teste foi criado/executado; não
há evidência de navegação, proteção de acesso ou fidelidade visual nesta revisão.
Antes do aceite, autorizar ambiente fictício com integrações externas desabilitadas e:

- Em `/empresas`, buscar por `trade_name`, `city`, `state` e `destination`: só
  empresas aprovadas/ativas, filtros no servidor, lista vazia distinta de erro,
  paginação e busca sucessiva/saída sem resposta antiga. Cidade cadastral exibida
  não deve ser interpretada como região atendida nem expor endereço operacional.
- Consultar como visitante, passageiro, motorista, empresa e conta sem perfil único.
  Selecionar empresa não deve escrever; login deve preservar descarte de memória,
  aceitar somente retorno interno fixo e exigir confirmação explícita em `/vinculos`.
- Demonstrar o Marco A completo: cadastrar/confirmar passageiro, pedir vínculo,
  aprovar pela empresa em `/usuarios`, recarregar `/vinculos` e observar estado ativo,
  sem atribuir grupo, ponto, serviços ou viagem. Repetir com motorista, recusa e retirada.
- Com histórico de várias páginas, confirmar que pendência/vínculo ativo fora da
  página bloqueia novo pedido. Conferir conflito de outro ciclo, decisão em outra aba,
  retirada concorrente e preservação de conta/histórico. Atualizar retorna à página 1,
  inclusive se a página anterior deixar de existir.
- Testar empresa pendente/recusada na moderação, perda de aprovação após a listagem e
  tentativa por outra empresa/staff/titular. Não basta esconder botões: conferir
  respostas do servidor, ausência de dados de terceiros e negativa real de CSRF.
- Cobrir 401/403/404/409/429/5xx, rede, resposta perdida, cliques repetidos, falha de
  releitura após POST confirmado, saída/troca de identidade durante GET/POST e retorno
  à tela. Não reapresentar dados da conta anterior nem repetir escrita; falha bloqueia
  ações até nova consulta bem-sucedida. Cancelar a espera não significa rollback.
- Conferir nomes mínimos dos solicitantes, motivo opcional com 500 caracteres,
  teclado/foco/labels do `FormField`, confirmação, navegação/paginação, larguras
  Mobile/Desktop e temas. Não reintroduzir CPF, endereço, documentos, fotos fictícias
  de pessoas ou campos do protótipo que a resposta pública não fornece.

ESLint focal e inspeção de imports/diffs não substituem essas demonstrações no Vue
servido pelo Django. R1/R2 continuam sem aceite; CEP segue adiado. O smoke existente
não foi ampliado e não comprova sozinho os cadastros ou vínculos da R2/R3.

## Validação focal pendente — R4 / Etapa 2 (Perfil, segurança e encerramento de vínculo)

Implementação com revisão estática somente. Nenhum teste foi criado/executado; não
há evidência de edição, download, revogação de sessão ou encerramento de vínculo em
navegador real nesta revisão. Antes do aceite, autorizar validação com dados fictícios de:

- Em `/usuario`, consultar o próprio perfil (`passengers/me/`, `drivers/me/`, `companies/me/`)
  e editar seções permitidas (`PATCH /users/me/` e `PATCH /companies/me/`), verificando que
  CPF, CNPJ e e-mail de acesso permanecem somente leitura, que alterar endereço cadastral
  não altera ponto operacional, e que falhas de escrita invalidam o snapshot (`profileStale`),
  exigem releitura explícita antes de salvar novamente e preservam o rascunho aberto.
- Trocar foto de perfil (JPG/PNG até 5 MB) sem exibir preview local não confirmado pelo
  servidor e mantendo o arquivo pendente para nova tentativa explícita se a associação falhar.
- Em motorista (`cnh`) e empresa (três documentos cadastrais), enviar PDF até 10 MB,
  associar a chave ao perfil e baixar via `uploads/documents/{key}/download/`, além de
  confirmar recusa (404) ao tentar baixar documento de terceiro.
- Em `/seguranca`, validar redefinição de senha autenticada, troca de e-mail
  (`email-change/request/` → `verify/` → `confirm/` com senha atual) e listagem/revogação
  de sessões (`sessions/`, `DELETE sessions/{id}/` para outro dispositivo e
  `POST me/revoke-sessions/`). Confirmar que redefinir senha, confirmar novo e-mail ou
  revogar todas as sessões aciona `confirmSessionRevocation()`, descarta estado em memória,
  propaga para outras abas e exige novo login, sem replay automático em resultado incerto.
- Em `/vinculos` e `/usuarios`, encerrar vínculo ativo (`POST memberships/{id}/end/` com
  motivo opcional de até 500 caracteres) tanto pelo titular quanto pela empresa, verificando
  a preservação da conta/histórico e a exibição de bloqueios de domínio (viagens em
  andamento ou alocações futuras).
- Em `/usuarios/motorista/:id` e `/usuarios/passageiro/:id`, confirmar que a empresa
  consulta apenas a identidade mínima (`id`, `name` e estatísticas de avaliação do motorista),
  sem expor CPF, endereço, telefone, e-mail ou CNH, e que vínculos inativos/de outra empresa
  são recusados.
- Verificar que leituras operacionais do próprio motorista/passageiro (`DriverList.vue`,
  `useTransportState.js`) usam `/drivers/me/` e `/passengers/me/` em vez de listagem com `.find()`.

## Validação focal pendente — R5 / Etapas 3–5 e 6.1–6.4 (Configuração habitual e operação datada)

Implementação com revisão estática somente. Nenhum teste foi criado/executado; não
há evidência de cálculo OSRM/worker, publicação, WebSocket ao vivo ou registro de
presença em navegador real nesta revisão. Antes do aceite do Marco B, autorizar
validação com dados fictícios de:

- **Configuração habitual (Etapa 3 + 6.4):** cadastrar e editar pontos operacionais
  (`operational-points/` com coordenadas explícitas) e frota (`vehicles/` com
  `garage_point_id`, sem vínculo direto legado a grupo/motorista e sem `DELETE`);
  criar grupo (`company-route-groups/` com `destination_id`), política de respostas
  (`policy/` com abertura, janela normal e prorrogação opcional), serviços habituais
  (`recurring-services/` com sentido imutável, máscara de dias da semana, vigência,
  duração, margem, motorista/veículo habituais e `stops/`), atribuição de passageiro
  a grupo e ponto (`assign-group/`), autorização de serviços e ida habitual
  (`authorize-services/`) e agenda automática opt-in (`automation/` e `automation-status/`).
- **Atendimento por data, respostas e publicação (Etapa 4 + 6.1–6.2):** gerar horizonte
  (`generate/` até 31 dias/lote) e cancelar datas (`cancel-date/` e `service-days/{id}/cancel/`);
  responder pelo passageiro na janela normal (`eligibilities/{id}/answer/` com ida e
  retorno independentes dentre os serviços autorizados e `expected_revision`); separar
  negativa explícita de ausência de resposta; fechar janela normal e preparar alocações
  (`service-days/{id}/close/`); solicitar cálculo (`travels/{id}/calculate/` → 202),
  acompanhar `route-snapshots/` e `optimization-jobs/` e publicar viagem pronta
  (`travels/{id}/publish/`), comprovando que resposta/cálculo não publicam automaticamente.
  Na prorrogação, solicitar alteração (`request-change/`), aprovar/recusar pela empresa
  (`change-requests/{id}/approve|reject/`), verificar que a escolha/alocação anteriores
  permanecem vigentes durante `preparing` e aplicar após cálculo pronto (`apply/`).
  Testar também desistência por trecho antes do embarque (`withdraw-leg/`).
- **Execução, substituições e acompanhamento (Etapa 5 + 6.3):** substituir veículo
  (`assign-vehicle/`), informar indisponibilidade do motorista (`unavailability/`),
  convidar substituto (`invite-driver/`) e responder convite pelo motorista convidado
  (`driver-invitations/{id}/respond/`), verificando que convite pendente não expõe o
  percurso. Como motorista designado, iniciar viagem na revisão publicada vigente
  (`travels/{id}/start/` com `expected_revision`), consultar paradas (`route-stops/`) e
  participações (`travel-participations/` sem dados cadastrais/endereço pessoal),
  registrar embarque, ausência e desembarque (`record/` com `operation_id`), tratar
  paradas (`handle/`) e finalizar viagem (`finish/`), conferindo bloqueios quando
  houver passageiros a bordo ou pendentes.
- **Mapa e WebSocket na mesma origem (5.4–5.5):** enviar posição pelo motorista com
  `{latitude, longitude, recorded_at}` e receber `{type: 'location', position, stale}`
  pelo passageiro alocado/embarcado e pela empresa; tratar posição ausente/desatualizada
  (`stale`), códigos de fechamento (`4001/4003/4009/1009/1000`), reconexão após `refresh`
  e encerramento em `travel.closed`.

## Validação focal pendente — R6 / Etapa 6 (6.5–6.6 e consolidação visual/técnica)

Implementação com revisão estática somente. Nenhum teste foi criado/executado. Antes do
aceite, autorizar validação com dados fictícios de:

- **Avisos persistentes (`notifications/`, 6.6):** consultar avisos do próprio usuário
  autenticado (sem expor avisos de terceiros, inclusive para staff) e marcar como lidos
  (`POST /notifications/{id}/read/` idempotente).
- **Avaliações e objetos perdidos (`driver-ratings/` e `lost-items/`, 6.5):** avaliar
  motorista (`1..5` estrelas e comentário opcional) somente por passageiro com desembarque
  registrado (`dropped_off`) em viagem finalizada e vínculo ativo; relatar objeto perdido
  pelo passageiro desembarcado ou motorista da viagem finalizada com `operation_id` UUID
  (verificando que outros alunos não veem relatos de terceiros e que ex-vinculados não
  acessam histórico operacional); avançar custódia exclusivamente pela empresa dona na
  sequência `reported → found → returned` (`POST /lost-items/{id}/transition/`), sem
  reabertura ou exclusão.
- **Consolidação visual e controles (`App.vue`, `global.css`, `theme.css`, `FormattedField`,
  `SelectField`, `PasswordFieldSignUp`):** verificar espaçamento do `.main-content` com
  `AppHeader`, `AppSideBar` (desktop > 900px) e `AppBottomNavigationBar` (mobile <= 900px);
  contraste no tema escuro (`.dark`); colagem e saneamento numérico em `FormattedField`
  sem bloqueio por `@keypress`; e associação `label`/`id`/`aria-invalid` nos inputs.
