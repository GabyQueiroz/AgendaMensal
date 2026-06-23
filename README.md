# Agenda Mensal

Agenda com compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

## Persistencia sem banco

Este projeto nao precisa de banco. O Render roda o site, e os dados ficam em um arquivo JSON no proprio GitHub:

```text
branch data / agenda-data.json
```

O servidor cria essa branch e esse arquivo automaticamente quando voce salvar dados pela primeira vez.

## Subir no Render

1. Crie um token do GitHub:
   - Acesse <https://github.com/settings/personal-access-tokens>
   - Crie um token fine-grained para o repositorio `GabyQueiroz/AgendaMensal`
   - Permissao: `Contents` com `Read and write`
   - Copie o token

2. No Render:
   - Clique em `New +`
   - Escolha `Blueprint`
   - Selecione o repositorio `GabyQueiroz/AgendaMensal`
   - Branch: `main`
   - Confirme

3. Quando o Render pedir `GITHUB_JSON_TOKEN`, cole o token do GitHub.

4. Confirme o deploy.

O Render vai criar apenas o site/API `agenda-mensal`.

## Levar os dados atuais do computador

1. Abra a URL do Render no computador onde seus dados aparecem.
2. Se o JSON no GitHub ainda estiver vazio, o app envia automaticamente os dados locais do navegador para o arquivo `agenda-data.json`.
3. Depois abra a mesma URL no celular.

Depois disso, tudo que salvar em qualquer dispositivo vai para o mesmo JSON no GitHub.

## Rodar localmente

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Localmente, sem `GITHUB_JSON_TOKEN`, o app salva em `data/agenda.json`.

## Recursos

- Cadastro, edicao e exclusao de compromissos.
- Visualizacao mensal em calendario.
- Painel do dia selecionado.
- Aulas como eventos informativos, sem entrar como tarefa ou compromisso efetivo.
- Compromissos fixos com repeticao diaria, semanal ou mensal.
- Lista automatica de horarios livres entre 07:00 e 22:00.
- Bloqueio manual de horarios livres.
- Imagem PNG dos horarios livres da semana selecionada.
- Lista de tarefas com prazo, prioridade, detalhes e controle de concluido.
- Exportacao e importacao de backup em JSON.
