# Credenciamento Convocação

Crie um formulário de credenciamento com o seguinte cabeçalho:

Título: Festa da Família Subtítulo: Festa e Música que transformam Descrição abaixo do subtítulo: Preencha os dados com atenção. As informações serão utilizadas pela organização do evento. Deixe um campo para inserção de Logo ao lado do nome do Evento

Campos globais — exibidos para todos:

Tipo de credenciamento (seleção obrigatória, define o fluxo):

Equipe Palco/Camarim

Banda / Artista

Dias de presença (múltipla escolha, obrigatório):

Dia 30

Dia 31

Ambos os dias

Responsável pelo cadastro (obrigatório):

Nome completo

WhatsApp (com máscara de telefone)

Se selecionado "Equipe Palco/Camarim" — exibir:

Membros da equipe (campos repetíveis, botão "Adicionar membro"):

Nome completo

Função: dropdown com opções Comissão / Apresentador(a)

Quantidade estimada de pessoas (número, obrigatório)

Observações: campo de texto livre com placeholder "Possui alguma restrição alimentar ou informação que seja útil à organização ser informada previamente?"

Se selecionado "Banda / Artista" — exibir:

Nome da banda ou artista (texto, obrigatório)

Horário previsto de chegada (hora, obrigatório)

Veículos (campos repetíveis, botão "Adicionar veículo"):

Marca / Modelo

Cor

Placa (caixa alta automática)

Membros da banda/equipe (campos repetíveis, botão "Adicionar membro"):

Nome completo

Função: dropdown com opções Cantor(a) / Músico(a) / Produção / Técnica / Fotógrafo/Videomaker / Acompanhante

Quantidade estimada de pessoas (número, obrigatório)

Observações: campo de texto livre com placeholder "Possui alguma restrição alimentar ou informação que seja útil à organização ser informada previamente?"

Comportamento esperado:

Formulário responsivo, otimizado para celular

Lógica condicional: exibir seções conforme o tipo de credenciamento selecionado

Salvar todas as respostas em banco de dados

Tela de confirmação após envio com mensagem: "Credenciamento enviado com sucesso. A organização entrará em contato se necessário."

Visual limpo e sóbrio, sem cores excessivas

Exportação de dados:

Todas as respostas devem poder ser exportadas em formato Excel (.xlsx)

Cada envio deve gerar uma linha na planilha com colunas separadas para cada campo (tipo de credenciamento, dias de presença, responsável, nome da banda, membros, veículos, etc.)

Os campos repetíveis (membros e veículos) devem ser exportados em colunas separadas ou em abas distintas na planilha, de forma que os dados fiquem organizados e legíveis

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://comvocacao.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/66f41768-12a6-43b9-900f-6a55e9bd0edb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
