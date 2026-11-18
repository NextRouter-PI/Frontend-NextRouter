# NextRouter — entrada para agentes no frontend

Comece pelo [índice do workspace](../AGENTS.md), pelo
[plano de implementação](../PLANO_IMPLEMENTACAO.md) e pelo
[contexto do frontend](../CONTEXTO_FRONTEND.md). O [contrato HTTP/WS](../CONTRATO_API.md)
orienta a integração; consulte código e OpenAPI do backend para a revisão em uso.
Se estiver em um checkout isolado, solicite acesso aos documentos centrais antes
de tomar decisões de produto ou integração.

Trabalhe por jornada. Aproveite o Vue existente e use o Figma como referência
visual, sem restabelecer fluxos legados. Preserve cookies HttpOnly, CSRF e WS na
mesma origem; não use JWT no storage ou em URLs. Valide o build real pelo Django
conforme [BUILD_VUE.md](../BUILD_VUE.md), sem usar dados ou serviços reais.
