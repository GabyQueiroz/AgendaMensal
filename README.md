# Agenda Mensal

Agenda com compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

## Persistencia no Render Free

O Render Free nao preserva arquivos salvos no disco do servidor depois de restart ou redeploy. Por isso, este projeto usa um JSON salvo em um GitHub Gist quando estiver publicado no Render.

O fluxo fica assim:

- Render Free roda o site e a API.
- GitHub Gist guarda o arquivo `agenda.json`.
- Computador e celular acessam o mesmo link do Render e veem os mesmos dados.

## Criar o JSON no GitHub Gist

1. Acesse <https://gist.github.com>.
2. Crie um gist chamado `agenda.json`.
3. Coloque este conteudo inicial:

```json
{
  "events": [],
  "tasks": [],
  "blocks": []
}
```

4. Crie como `Secret gist` ou publico.
5. Copie o ID do gist. Ele fica na URL, por exemplo:

```text
https://gist.github.com/GabyQueiroz/ID_DO_GIST
```

## Criar o token do GitHub

1. Acesse <https://github.com/settings/personal-access-tokens>.
2. Crie um token fine-grained.
3. Permissao necessaria: `Gists` com leitura e escrita.
4. Copie o token. Ele sera usado apenas como variavel secreta no Render.

## Publicar no Render Free

1. No Render, clique em `New +`.
2. Escolha `Web Service`.
3. Conecte o repositorio `GabyQueiroz/AgendaMensal`.
4. Configure:

```text
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

5. Em `Environment Variables`, adicione:

```text
GIST_ID=ID_DO_SEU_GIST
GITHUB_TOKEN=SEU_TOKEN_DO_GITHUB
GIST_FILENAME=agenda.json
```

6. Clique em `Create Web Service`.

Quando o deploy terminar, abra o link do Render no computador e no celular.

## Levar os dados atuais do computador

Se seus compromissos aparecem no computador antes de publicar:

1. Publique no Render.
2. Abra o link do Render no computador onde seus dados aparecem.
3. Se o Gist ainda estiver vazio, o app envia automaticamente os dados locais do navegador para o Gist.
4. Abra o mesmo link no celular.

Depois disso, tudo que salvar em qualquer dispositivo vai para o mesmo `agenda.json` no Gist.

## Rodar localmente

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Sem `GIST_ID` e `GITHUB_TOKEN`, o modo local salva em `data/agenda.json`.

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
