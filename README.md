# Agenda Mensal

Agenda com compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

Agora o projeto roda com um servidor Node e salva os dados em um arquivo JSON. Assim, quando publicado no Render, computador e celular acessam o mesmo endereco e veem os mesmos dados.

## Rodar localmente

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

Localmente, os dados ficam em `data/agenda.json`.

## Publicar no Render

1. Crie um novo `Web Service` no Render usando este repositorio.
2. Build Command:

```bash
npm install
```

3. Start Command:

```bash
npm start
```

4. Adicione um `Persistent Disk`.
5. Configure o Mount Path do disco como:

```text
/data
```

6. Adicione a variavel de ambiente:

```text
DATA_FILE=/data/agenda.json
```

Sem Persistent Disk, o Render pode apagar o JSON em restart ou redeploy.

## Levar os dados atuais do computador

Depois de publicar no Render:

1. Abra o site do Render no computador onde seus dados aparecem.
2. O app carrega os dados locais do navegador.
3. Se o JSON do servidor ainda estiver vazio, ele envia automaticamente esses dados locais para o servidor.
4. Abra o mesmo link no celular.

Depois disso, tudo que salvar em qualquer dispositivo vai para o mesmo `agenda.json` do servidor.

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
