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
