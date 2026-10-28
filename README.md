# LeadControl — Dashboard de Leads

Projeto demonstrativo acadêmico desenvolvido com HTML5, CSS3 e JavaScript.

## Arquivos
- `index.html`: estrutura das páginas e formulários.
- `style.css`: identidade visual e layout responsivo.
- `script.js`: navegação, cadastro, edição, exclusão, filtros, relatórios, gráficos e armazenamento local.
- `assets/`: pasta reservada para recursos visuais adicionais.

## Como executar
1. Extraia o arquivo ZIP para uma pasta.
2. Abra `index.html` em um navegador moderno.
3. Clique em **Acessar Dashboard**.
4. Cadastre, edite, pesquise e exclua leads para testar as funcionalidades.

O projeto também pode ser executado com a extensão Live Server do Visual Studio Code. Isso é recomendado para simular melhor a publicação em um servidor.

## Funcionalidades
- Tela inicial e dashboard.
- Indicadores calculados a partir dos leads cadastrados.
- Cadastro, edição, detalhes e exclusão com confirmação.
- Pesquisa por nome ou telefone e filtros por status, origem e data.
- Abertura de conversa no WhatsApp usando o telefone cadastrado.
- Gráficos com Chart.js.
- Relatórios, taxa de conversão e exportação CSV.
- Persistência local via `localStorage`.
- Dados fictícios de demonstração e opção de restauração.
- Layout adaptado para computador, tablet e celular.

## Observações importantes
- Os dados são salvos apenas no navegador e dispositivo utilizados. Não existe banco de dados, login real, sincronização entre dispositivos nem integração com um CRM externo.
- Os gráficos usam Chart.js carregado por CDN e, por isso, precisam de conexão com a internet para renderizar.
- Para publicar, envie os arquivos mantendo `index.html`, `style.css`, `script.js` e a pasta `assets` na mesma estrutura para um serviço de hospedagem estática HTTPS, como GitHub Pages ou Netlify.
- Para usar dentro da Fabapp, publique primeiro o projeto e configure a URL pública conforme as opções de incorporação/link disponibilizadas pela plataforma. A compatibilidade final depende dos recursos e regras atuais da Fabapp.
- O botão do WhatsApp não consegue confirmar se o número existe ou se tem conta ativa. Para telefones com 10 ou 11 dígitos, o código do Brasil (55) é acrescentado; para números com outros comprimentos, o sistema usa os dígitos informados sem inventar um código de país.
