# Agenda Mensal

Site para acompanhar compromissos, tarefas, aulas, horarios livres e bloqueios manuais.

## Persistencia

O app tem dois modos:

- `Local`: salva no navegador atual.
- `Online`: salva em um banco Supabase e aparece em qualquer navegador, celular ou computador usando o mesmo site.

Para usar em qualquer dispositivo, configure o Supabase.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o arquivo `supabase-schema.sql`.
3. Copie a `Project URL` e a `anon public key`.
4. No site, clique em `Nuvem`, preencha a URL e a anon public key, e clique em `Salvar e enviar`.
5. No celular, abra o mesmo site, clique em `Nuvem`, preencha os mesmos dados e clique em `Baixar da nuvem`.

Opcionalmente, para deixar isso automatico em todos os dispositivos, edite `config.js`:

```js
window.AGENDA_CLOUD = {
  provider: "supabase",
  supabaseUrl: "SUA_PROJECT_URL",
  supabaseAnonKey: "SUA_ANON_PUBLIC_KEY",
  table: "agenda_data",
  documentId: "default",
};
```

Depois suba o `config.js` atualizado no GitHub.

Quando estiver funcionando, o topo do site mostra `Online`. Se aparecer `Local`, ele esta salvando apenas no navegador atual. Se aparecer `Offline`, ele esta usando o local e tentando reconectar.

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

## Backup

Use o botao de exportar no topo para baixar um arquivo JSON com seus dados. Para restaurar, use o botao de importar e selecione esse arquivo.
