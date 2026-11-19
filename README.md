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
| `npm run dev:lan` | Disponibilizar o servidor Vite na rede local. |
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

## Descoberta, vínculo, perfil e segurança — R3 e R4

`/empresas` permite busca pública por nome, cidade/UF atendidas e grupo/destino.
O titular revisa e envia o pedido em `/vinculos`, acompanha o estado e pode retirar
pedidos pendentes ou encerrar vínculos ativos. A empresa consulta e decide vínculos em
`/usuarios`, além de consultar a identidade mínima de titulares vinculados. Em `/usuario`
e `/seguranca`, o titular consulta e edita dados permitidos, substitui/baixa documentos,
altera senha ou e-mail e gerencia sessões. Grupo e serviços ficam em recortes próprios.

CEP permanece inalterado e adiado. R1–R4 têm somente conferência estática;
validação funcional, de segurança e visual continuam pendentes de autorização.

## Documentação

- [Testes automatizados](tests/README.md)
- [Instruções para agentes](AGENTS.md)
