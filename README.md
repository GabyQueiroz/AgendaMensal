# Agenda Mensal

Agenda com compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

## Render Free usando banco existente

O Render Free permite apenas um banco Postgres gratis ativo por workspace. Por isso este projeto nao cria um banco novo automaticamente. Ele cria apenas o Web Service e usa a variavel `DATABASE_URL` do banco Postgres que voce ja tem.

O app cria a tabela `agenda_state` automaticamente dentro desse banco.

## Passo a passo

1. No Render, abra o banco Postgres que voce ja tem.
2. Va em `Info` ou `Connect`.
3. Copie a `Internal Database URL`.
4. Abra o Blueprint `AgendaMensal`.
5. Clique em `Manual sync`.
6. Quando o Render pedir `DATABASE_URL`, cole a `Internal Database URL` do seu banco existente.
7. Confirme o deploy.

O Render vai criar apenas:

- `agenda-mensal`: o site/API.

Quando terminar, abra a URL do servico `agenda-mensal`.

## Levar os dados atuais do computador

1. Abra a URL do Render no computador onde seus dados aparecem.
2. Se o banco estiver vazio, o app envia automaticamente os dados locais do navegador para o servidor.
3. Depois abra a mesma URL no celular.

Depois disso, tudo que salvar em qualquer dispositivo vai para o mesmo banco.

## Rodar localmente

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Localmente, sem `DATABASE_URL`, o app salva em `data/agenda.json`.

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
