# NextRouter — frontend

Interface Vue do NextRouter, desenvolvida com Vite, Vue Router e Pinia.

## Começar

Requer Node conforme `engines` em [package.json](package.json) e npm. Em `frontend/`:

```sh
npm ci
npm run dev
```

Abra <http://127.0.0.1:5173>. O Vite inicia de forma independente; sem a API
ativa na porta `8000`, é possível desenvolver as telas públicas, sem login ou
dados simulados para as rotas privadas. Quando a API está em execução em
`127.0.0.1:8000`, o Vite encaminha `/api`, `/ws` e `/media` preservando `Host`
e `Origin`.

## Build, testes e rede local

| Comando | Finalidade |
|---|---|
| `npm run build` | Compilar o frontend em `dist/`. |
| `npm run build:backend` | Compilar o frontend diretamente em `../backend/frontend_dist/` e sincronizar `frontend-release.json`. |
| `npm run dev:lan` | Disponibilizar o servidor Vite na rede local. |
| `npm run lint` | Verificar código com Oxlint e ESLint (sem alterar arquivos). |
| `npm run lint:fix` | Corrigir problemas automáticos com Oxlint e ESLint. |
| `npm test` | Executar os testes automatizados em Node. |

Use rede confiável e dados fictícios ao acessar via `dev:lan` (`http://<IPv4>:5173`);
o uso de HTTP em IP da rede local pode limitar geolocalização e renovação
automática de sessão.

## Estado local — refatoração R1

Validação, submissão e envio de código pertencem à instância montada do formulário.
Requisições e timers desse fluxo são descartados ao sair da tela; abortar a espera
no cliente não desfaz cadastro ou upload já aceito pelo servidor, nem provoca replay.
`DateInput` recebe modelos separados de dia/mês/ano e apresenta seus erros.

Nos três perfis, o estado de upload é local e a troca de foto permanece ocupada
até a associação do arquivo ao perfil terminar. Toasts substituem o timer anterior
e são descartados ao sair da tela, reutilizando a apresentação existente.

## Cadastro e recuperação — R2

O cadastro solicita e verifica código em `registration/request/` e `verify/`,
depois cria o perfil em JSON com `user_data` aninhado; uploads continuam multipart.
CNH é opcional. Criar conta não aprova empresa nem solicita vínculo.
Recuperação usa `password-reset/request/`, `verify/` e `confirm/` com `new_password`:
a tela de nova senha só abre após verificação no servidor, sem informar se há conta.

## Descoberta, vínculo, perfil, segurança e operação — R3 a R6

`/empresas` permite busca pública por nome, cidade/UF atendidas e grupo/destino.
O titular revisa e envia o pedido em `/vinculos`, acompanha o estado e pode retirar
pedidos pendentes ou encerrar vínculos ativos. A empresa consulta e decide vínculos em
`/usuarios` e vê a identidade mínima de vinculados. Em `/usuario` e `/seguranca`, o titular
edita dados permitidos, gerencia documentos, senha, e-mail, sessões e desativação da conta. Em `/transporte` e
`/lista`, a empresa configura pontos operacionais, frota, grupos, políticas, serviços,
autorizações e operação datada; o passageiro responde por data e acompanha viagens
publicadas; o motorista executa viagens designadas, paradas, presença e localização; e os
três papéis consultam avisos persistentes, avaliações e objetos perdidos.

A consulta de CEP com mapa interativo utiliza o proxy de mesma origem `/api/cep/<cep>/`.

## Documentação

- [Testes automatizados](tests/README.md)
- [Instruções para agentes](AGENTS.md)
