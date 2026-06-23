# Agenda Mensal

Agenda com compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

## Subir no Render Free

O projeto esta pronto para subir no Render usando Blueprint. O Render cria o site e o banco Postgres automaticamente a partir do arquivo `render.yaml`.

Aviso importante: no plano gratis, o Postgres do Render expira depois de 30 dias. Para algo permanente sem prazo, precisa trocar para um banco pago depois. Enquanto estiver ativo, computador e celular acessando o mesmo link veem os mesmos dados.

## Passo a passo

1. Entre em <https://dashboard.render.com>.
2. Clique em `New +`.
3. Escolha `Blueprint`.
4. Conecte o GitHub, se pedir.
5. Selecione o repositorio `GabyQueiroz/AgendaMensal`.
6. Branch: `main`.
7. Confirme o Blueprint.
8. Clique em `Apply` ou `Deploy Blueprint`.

O Render vai criar:

- `agenda-mensal`: o site/API.
- `agenda-mensal-db`: o banco Postgres gratis.

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
