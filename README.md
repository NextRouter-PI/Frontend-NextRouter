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

## Documentação

- [Testes automatizados](tests/README.md)
- [Instruções para agentes](AGENTS.md)
