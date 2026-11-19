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
