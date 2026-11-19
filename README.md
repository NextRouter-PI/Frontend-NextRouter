# NextRouter — frontend

Interface Vue do NextRouter, desenvolvida com Vite, Vue Router e Pinia. No
workspace completo, `frontend/` fica ao lado de `backend/` e `doc/`.

## Começar

Requer Node conforme `engines` em `package.json` e npm. Em `frontend/`:

```sh
npm ci
npm run dev
```

Abra <http://127.0.0.1:5173>. O Vite inicia sem o backend; nesse caso, é possível
trabalhar nas telas públicas, mas não há login ou dados simulados para as privadas.
Para integração, inicie separadamente `pdm run dev` em `../backend/`. O Vite
encaminha API, WebSocket e mídia ao Django, mantendo o hot reload.

## Build e rede local

| Comando | Finalidade |
|---|---|
| `npm run build` | Gerar o frontend em `dist/`. |
| `npm run build:backend` | Atualizar o Vue servido em `../backend/frontend_dist/`. |
| `npm run dev:lan` | Disponibilizar o Vite na rede local. |
| `npm test` | Executar os testes JavaScript. |

Após `build:backend`, reinicie o Django e acesse <http://127.0.0.1:8000>.
Para integrar pela rede, inicie também `pdm run dev-lan <IPv4>` no backend e
abra `http://<IPv4>:5173` no dispositivo. Use rede confiável e dados fictícios;
HTTP na rede pode limitar GPS e renovação de sessão.

## Documentação

- [Desenvolvimento e ambientes](../OPERACAO.md) · [Build integrado](../BUILD_VUE.md)
- [Contrato da API](../CONTRATO_API.md) · [Plano e evidências](../PLANO_IMPLEMENTACAO.md)
- [Contexto do frontend](../CONTEXTO_FRONTEND.md) · [Backend](../backend/README.md)

Os guias ficam na raiz comum; solicite acesso se tiver apenas este repositório.
O fluxo simplificado recente ainda não foi validado por testes ou execução.
