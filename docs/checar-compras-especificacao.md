# Checar compras: Especificação do Projeto

## 1. Identificação

- **Nome do app:** Checar Compras
- **Repositório:** `checar-compras` (GitHub, conta `j-barboza`)
- **Pacote Android:** `com.jbarboz.checar_compras`
- **Idioma principal:** português (Brasil)
- **Idioma futuro:** inglês, como evolução posterior
- **Licença:** MIT, com repositório público ao final

## 2. Objetivo e problema

**Problema:** em compras grandes, é difícil lembrar o preço de todos os itens. Divergências entre a gôndola e o caixa só aparecem no fim, quando já é tarde para conferir com calma.

**Objetivo:** permitir que o consumidor registre os produtos e preços durante a compra, acompanhe o total em tempo real e compare com o subtotal do caixa antes de pagar, para decidir se vale contestar.

## 3. Público-alvo

Qualquer consumidor de supermercado, com foco em compras maiores. Inclui idosos e pessoas com pouca familiaridade com tecnologia. Também atende quem tem orçamento apertado e precisa saber quanto ainda pode gastar.

## 4. Funcionalidades

### 4.1 Captura de itens

- **Código de barras (principal):** a câmera só abre ao tocar em "Escanear". Fluxo de cada leitura: lê o código → (produto novo: apelido) → preço → volta para a lista. Para ler outro item, toca em "Escanear" de novo.
- **Produto já conhecido:** se o código já existe no cadastro local, o app mostra o apelido e o último preço registrado (sem abrir teclado para o apelido).
- **Produto novo:** o app pede um apelido curto. Sugestão de nome vinda do Open Food Facts quando há internet. O apelido é digitado e pode repetir entre produtos, pois a identidade é o código de barras.
- **Teclado:** nas telas de digitação, as informações da coleta ficam no alto e o campo fica embaixo, logo acima do teclado.
- **Leitura repetida:** ler um código que já está na compra soma 1 à quantidade da linha existente e volta para a lista, sem pedir preço nem criar outra linha.
- **Preço por foto da etiqueta:** a câmera fotografa a etiqueta de gôndola, o OCR (Google ML Kit, no aparelho) extrai o valor, e o app mostra o número reconhecido para confirmação ou correção com um toque. A foto não é guardada, só o valor confirmado. *(Ainda não implementado: no APK de teste 1 o preço é digitado.)*
- **Preço ilegível:** o item fica pendente, sem entrar no total, até ser preenchido manualmente. Item pendente não impede concluir a compra; ele aparece destacado na lista e na conferência.

### 4.2 Produtos sem código de barras (FLV e itens a granel)

- Bloco manual separado, acionado por "+ Adicionar FLV".
- O usuário digita o nome e escolhe o modo por um seletor: **kg** ou **unidade**.
- Modo kg: informa o preço por quilo e o peso. O app calcula o valor do item.
- Modo unidade: informa o preço unitário e a quantidade.
- O app sugere o último preço registrado daquele item, com data.
- Produto sem código que aparece depois com código pode ser vinculado a ele.

### 4.3 Lista de compra em andamento

- Tela principal com três áreas:
  1. **Topo:** nome do mercado, hora de início e botão "Conferir". A câmera **não** fica fixa na tela: abre só pelo botão grande "Escanear" no rodapé, ao lado de "+ FLV".
  2. **Meio:** lista dos itens em **ordem de coleta** (do primeiro ao último lido).
  3. **Rodapé fixo:** total registrado, quantidade de itens, orçamento (se definido) e saldo.
- Ao abrir uma nova compra, o usuário escolhe o supermercado.
- Qualquer item registrado pode ser editado (quantidade, preço e apelido) antes da conclusão. Exemplo: corrigir um preço lançado como R$ 10,00 quando a promoção mostra R$ 8,50.
- Remoção de item por gesto de deslizar, com alternativa visível por botão.

### 4.4 Orçamento (opcional)

- O usuário pode informar quanto tem para a compra.
- O rodapé mostra quanto já foi registrado e quanto sobra, ou quanto passou do limite.
- Serve para decidir, na gôndola, entre produtos com base no que ainda cabe no orçamento.
- Pensado também para quem vai ao mercado com dinheiro contado: quando o total registrado chega ao orçamento, o app mostra o aviso "Seu orçamento chegou", para a pessoa decidir se devolve, troca ou para de pegar itens. O aviso aparece uma vez e volta a valer se o total cair abaixo do orçamento.

### 4.5 Conferência

- Não há alerta de divergência durante a compra. O total visível no rodapé substitui esse alerta.
- Conferência final em **lista única** com todos os itens (código de barras e FLV).
- Duas ordens disponíveis, alternáveis: **ordem de coleta** e **ordem alfabética**.
- Cada item pode ser marcado como conferido com um toque.
- Um único campo **"Total do caixa"**, digitado (subtotal e total da nota foram unificados). É obrigatório para concluir, pois define o resultado da compra.
- Se a diferença entre o total registrado e o total do caixa for menor ou igual à tolerância, a compra é marcada como "ok". Acima dela, "divergente".

### 4.6 Consulta da NFC-e (QR code): removida

- Descartada em 26/10/2026: a consulta à SEFAZ varia por estado (captcha, HTML diferente) e não funcionaria de forma confiável. Melhor não ter do que ter algo que falha. Ver seção 11.

### 4.7 Tolerância

- Limite configurável para diferenças pequenas (padrão sugerido: R$ 1,00).
- Diferenças dentro do limite contam como "ok" no ranking.

### 4.8 Ranking por supermercado

- Conta apenas compras concluídas.
- Para cada mercado: número de compras, compras com divergência e taxa de divergência.
- Guarda somente esses totais. Não guarda preços nem itens.
- Objetivo: informar onde vale ter mais atenção. Não é punição.

### 4.9 Comprovante para contestação

- Ao concluir a conferência, o app guarda uma lista mínima: itens, quantidades, preços, supermercado, data e hora da leitura. Sem fotos.
- Pode ser consultado depois, com o cupom na mão.
- **Retenção:** exclusão manual pelo usuário, ou automática após 30 dias, o que vier primeiro.

### 4.10 Limpeza e compras abandonadas

- Ao concluir a conferência, os itens e preços da compra são apagados.
- Compra não concluída expira após 5 horas desde a última atividade, ou na virada do dia, o que vier primeiro.
- Ao reabrir o app após a expiração, o usuário é avisado de que havia uma compra em aberto e que ela foi apagada.
- Ao expirar, itens e preços são apagados, sem registro no ranking.
- Preços antigos não são mantidos além da compra, exceto o **último preço** de cada produto (por código de barras) e de cada FLV (por nome), usados como sugestão. Eles ficam no aparelho por até 30 dias, a mesma retenção do comprovante.

### 4.11 Tratamento de erros

- **Preço lido errado:** o valor reconhecido é mostrado antes de salvar, com possibilidade de correção.
- **Código não reconhecido:** o app pede nova tentativa ou digitação do código.
- **Item sem preço:** destacado na lista, para não ser esquecido.
- **Item sem código de barras:** registrado como item manual, com apelido e preço.

## 5. Tecnologias

- **Framework:** React Native com Expo
- **Linguagem:** TypeScript
- **Leitura de código de barras:** `expo-camera` (escolhido; usa Google ML Kit no Android)
- **OCR de etiqueta:** Google ML Kit, executado no aparelho
- **Armazenamento local:** SQLite (`expo-sqlite`)
- **Sugestão de nome:** API pública do Open Food Facts (envia só o código de barras)
- **Controle de versão:** Git, com repositório no GitHub

## 6. Plataforma

- **Fase 1:** Android, com desenvolvimento e testes no smartphone conectado ao laptop em modo debug.
- **Fase 2:** iOS, após a validação completa no Android.
- **Requisito para iOS:** um dos dois, conta paga de desenvolvedor Apple (cerca de US$ 99/ano) ou Mac com Xcode. Esse é o gargalo da etapa e deve ser resolvido antes da fase 2.
- **Distribuição:** APK ao final, apenas quando o app estiver completo e testado.

## 7. Requisitos não funcionais

### 7.1 Desempenho

- Leitura de código de barras em até 1 segundo, em iluminação normal.
- Item registrado na lista logo após a leitura, sem tela de carregamento.
- Funcionamento offline, exceto a sugestão de nome do produto (sem internet, a sugestão simplesmente não aparece).

### 7.2 Privacidade

- Todos os dados ficam no aparelho.
- Sem conta de usuário e sem envio de dados para servidores externos nesta fase.
- Única comunicação externa: consulta do código de barras no Open Food Facts, para sugerir o nome. Nenhum preço ou dado da compra é enviado.

### 7.3 Acessibilidade

- Área mínima de toque de cerca de 48 dp. Botões grandes o suficiente para uso fácil, sem exagero.
- Fonte base confortável, respeitando o tamanho de texto definido nas configurações do sistema.
- Contraste adequado, também no modo escuro.
- Ações principais (registrar, conferir, concluir) sempre visíveis, sem depender de gestos complexos.

## 8. Estratégia de testes

### 8.1 Testes automatizados (por módulo, a cada etapa)

- Soma e totais, incluindo FLV por quilo e por unidade.
- Tolerância de diferença, dentro e fora do limite.
- Expiração de compra abandonada (5 horas e virada do dia).
- Ranking por supermercado.
- Limpeza de preços ao concluir a conferência.
- Comprovante: criação, consulta e exclusão após 30 dias.
- Aviso de orçamento atingido.
- Leitura de código repetida: soma de quantidade, sem duplicar linha.
- Edição de item já registrado.

Cada módulo deve sair com seus testes antes de iniciar o próximo.

### 8.2 Roteiro de testes manuais (no celular)

- Fluxo completo: escanear, registrar, conferir, concluir.
- Preço lido errado: corrigir antes de salvar.
- Preço lançado errado: editar depois, com a promoção como caso de referência (R$ 10,00 para R$ 8,50).
- Produto sem código de barras e vinculação posterior.
- FLV por quilo e por unidade.
- Compra abandonada e aviso de expiração.
- Orçamento: saldo e excedente.
- Conferência nas duas ordens.
- Produto novo sem internet (sem sugestão de nome).
- Fechar o app no meio da compra e reabrir: a compra continua.
- Exclusão manual do comprovante.

O roteiro deve ser mantido atualizado no repositório, com casos, passos e resultado esperado.

## 9. Entregáveis e critérios de aceite

### 9.1 Entregáveis finais

- Aplicativo (APK), gerado somente ao final.
- Código-fonte no GitHub.
- README com descrição, funcionalidades e tecnologias.
- Instruções de instalação e execução.
- Roteiro de testes manuais atualizado.
- Documentação de decisões e arquitetura.

### 9.2 Critérios de aceite (Android, fase 1)

- Todas as funcionalidades da seção 4 implementadas.
- Testes automatizados passando.
- Roteiro de testes manuais executado sem falhas bloqueantes.
- Leitura de código de barras dentro do tempo de desempenho definido.
- Funcionamento offline, exceto a sugestão de nome.
- Nenhum dado enviado para fora do aparelho, exceto o código de barras consultado no Open Food Facts.

## 10. Método de desenvolvimento

- Celular conectado ao laptop durante o desenvolvimento, com teste contínuo em modo debug.
- Repositório GitHub, criado como privado e tornado público ao final.
- Commits por bloco lógico ou situação concluída, com mensagens claras, para facilitar reversões.
- Ordem de trabalho: módulo, testes automatizados, teste no aparelho, commit.

## 11. Fora do escopo desta versão

- Banco de dados central com preços de todos os usuários. Depende de questões de privacidade (LGPD), validação de dados enviados por terceiros e avaliação jurídica sobre divulgação de preços.
- Comparação de preços entre supermercados para outros usuários.
- Versão em inglês.
- Alerta de divergência durante a compra (descartado, pois não há como comparar preços em tempo real).
- OCR da embalagem para identificar o produto (substituído por apelido digitado).
- Integração com listas de compras de outros aplicativos.
- Consulta da NFC-e na SEFAZ por QR code (removida em 26/10/2026, ver 4.6).

## 12. Pendências

- Definir como obter a conta ou o Mac para o build de iOS, antes da fase 2.

Resolvidas em 26/10/2026: usuário GitHub confirmado como `j-barboza` (commits com `jose.f.barboza@outlook.com`); pacote Android `com.jbarboz.checar_compras`, com underline, porque hífen não é válido em nome de pacote; sugestão de nome pelo Open Food Facts; tolerância padrão de R$ 1,00 (configurável); leitura com `expo-camera`.

## 13. Layout

- Protótipo clicável aprovado (paleta azul): https://claude.ai/artifact/Rj3hHY1ZjAPvsY2akHcNPa
- Paleta: azul `#1D4ED8` nas ações, fundo claro `#F6F5F1`, laranja `#A14A00` para itens sem preço, vermelho `#B42318` para divergência e "passou do orçamento".
- Fonte: Atkinson Hyperlegible, criada para leitura por pessoas com baixa visão.
- Telas: Início, Nova compra (mercado + orçamento), Lista (rodapé fixo com total, itens, orçamento e saldo; botões "+ FLV" e "Escanear"), Escanear, FLV, Editar item (folha que sobe de baixo), Conferência, Resultado, Configurações (tolerância). Ainda faltam: Comprovantes e Ranking.
