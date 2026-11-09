# Uso de inteligência artificial no desenvolvimento

Utilizei o ChatGPT como apoio à organização e ao desenvolvimento da solução de controle de estoque. O trabalho com IA envolveu a análise dos requisitos, a discussão da arquitetura, a geração de código para o backend e o frontend, a elaboração de testes e a documentação das decisões técnicas.

A escolha de FastAPI, React e SQLite partiu das tecnologias que defini para o projeto. A partir dessas escolhas, a interação com a IA ajudou a transformar o enunciado em uma implementação organizada, com atenção especial à consistência das quantidades, ao tratamento de falhas e à simplicidade de execução.

## 1. Prompt principal

O prompt abaixo é uma versão consolidada e reescrita das orientações e decisões discutidas durante a conversa, apresentada para tornar claros o objetivo, as restrições e os critérios de qualidade.

> Estou desenvolvendo um case de controle de estoque com FastAPI no backend, React no frontend e SQLite para persistência. A aplicação será executada localmente, sem Docker ou publicação em nuvem.
>
> Analise o enunciado e me ajude a estruturar e implementar uma solução proporcional ao escopo do desafio. O sistema deve permitir cadastrar produtos, registrar entradas e saídas, reservar unidades para solicitações, bloquear unidades, liberar reservas e bloqueios e consultar as quantidades total, disponível, reservada e bloqueada.
>
> Considere que um produto pode ter várias reservas e bloqueios simultâneos. Explique como identificar cada registro, preservar a consistência do estoque e impedir operações superiores à quantidade disponível. Inclua o comportamento esperado diante de requisições concorrentes, falhas durante uma operação e tentativas repetidas de liberação.
>
> Proponha uma estrutura de pastas e defina as responsabilidades das rotas, dos schemas, dos serviços e do acesso ao banco. Justifique as decisões e explicite as premissas que não estiverem determinadas pelo enunciado.
>
> Implemente uma interface que permita executar as operações e compreender seus resultados, com estados de carregamento, sucesso, erro e ausência de dados. Prepare testes relevantes para as regras de negócio e para a integração entre as partes da aplicação.
>
> Documente a instalação, a execução local, as decisões técnicas, as limitações conhecidas e as possíveis evoluções. Diferencie o que foi implementado, o que foi efetivamente validado e o que ainda depende de verificação.

A conversa ocorreu de forma incremental. Primeiro, foi solicitada a organização do projeto. Em seguida, o escopo foi ajustado para retirar Docker. Depois, foi solicitada a implementação da estrutura e das funcionalidades propostas. Essa sequência permitiu alinhar a solução às escolhas do projeto antes da geração do código.

## 2. Principais contribuições da IA

### Interpretação dos requisitos e modelagem

A IA ajudou a transformar as funcionalidades do enunciado em entidades, operações e regras verificáveis. Um ponto central foi representar reservas e bloqueios como registros individuais, cada um com identificador próprio e vínculo com o produto. Isso permite consultar e liberar uma reserva específica sem afetar outras solicitações.

A modelagem adotada armazena a quantidade total no produto e calcula os demais saldos a partir dos registros ativos:

```text
quantidade disponível = quantidade total - quantidade reservada - quantidade bloqueada
```

Essa decisão reduz a necessidade de sincronizar vários contadores. Também torna explícita uma regra importante: reservar, bloquear ou liberar unidades altera sua disponibilidade, mas não modifica a quantidade total existente.

### Organização e implementação do código

A IA propôs e implementou uma divisão por funcionalidades, com módulos de produtos e estoque. Dentro deles, as responsabilidades foram separadas: rotas recebem as requisições; schemas validam os contratos; serviços coordenam as regras de negócio; repositories realizam o acesso aos dados.

Essa organização facilita localizar uma regra e testar seu comportamento. Por exemplo, a verificação de saldo suficiente fica no serviço de estoque e é aplicada independentemente de como a operação foi acionada pela interface. A confirmação da transação também fica sob responsabilidade do serviço, evitando que uma operação seja gravada parcialmente por chamadas isoladas ao banco.

No frontend, a contribuição incluiu componentes para cadastro, seleção de produtos, apresentação dos saldos, movimentações e liberação de registros. As chamadas à API e o controle de carregamento e mensagens foram separados dos componentes de apresentação.

### Consistência e tratamento de concorrência

A discussão com a IA destacou que uma sequência de leitura, validação e gravação precisa considerar outras requisições atuando sobre o mesmo saldo. Duas reservas podem parecer válidas individualmente e, juntas, ultrapassar a disponibilidade.

Na implementação, as operações de escrita iniciam uma transação com `BEGIN IMMEDIATE` antes de consultar o estoque. Isso permite coordenar as escritas no SQLite e validar o saldo dentro da mesma transação que realizará a alteração. Quando ocorre uma falha, a operação é desfeita por rollback.

A liberação foi definida como idempotente: uma segunda chamada para liberar o mesmo registro mantém o estado já liberado. Essa propriedade evita que uma repetição devolva unidades ao estoque mais de uma vez.

### Testes e documentação

A IA auxiliou na geração e execução de testes que cobrem situações além do fluxo de sucesso, como quantidades inválidas, saldo insuficiente, múltiplas reservas, liberações repetidas, falhas após uma gravação e acesso concorrente.

Um exemplo é o cenário de duas solicitações tentando reservar sete unidades quando existem apenas dez disponíveis. O comportamento esperado é que uma reserva seja aceita, a outra seja rejeitada e o saldo final permaneça em três unidades.

A documentação foi estruturada para registrar tanto o funcionamento da aplicação quanto os motivos das escolhas. Isso inclui as instruções de execução, as premissas de negócio e os pontos que precisariam evoluir em um contexto de produção.

## 3. Sugestão modificada e decisões de escopo

A proposta inicial incluía Docker para executar os componentes. Decidi retirar essa opção porque o projeto seria utilizado localmente e não haveria publicação em nuvem. A implementação foi ajustada para executar o backend com Uvicorn e o frontend com Vite, mantendo o SQLite em um arquivo local.

Essa alteração reduziu as etapas de preparação do ambiente para a finalidade pretendida. O projeto passou a documentar diretamente a instalação das dependências e a inicialização dos dois processos.

Outra decisão incorporada à solução foi limitar o escopo funcional ao necessário para demonstrar as regras de estoque. Recursos como autenticação, expiração automática de reservas, liberação parcial e auditoria completa de movimentações ficaram registrados como possibilidades de evolução. A prioridade foi entregar operações consistentes e uma estrutura compreensível dentro do contexto do case.

## 4. Avaliação crítica das respostas e do código gerado

O uso da IA exigiu verificar as sugestões com exemplos concretos e resultados observáveis. Uma explicação plausível sobre consistência precisa ser acompanhada de uma implementação que adquira o acesso de escrita no momento correto e de testes que exercitem chamadas concorrentes.

Também foi considerado o risco de calcular saldos incorretamente ao combinar reservas e bloqueios em uma consulta. Como ambas as relações podem conter vários registros, um join direto pode multiplicar as linhas e distorcer as somas. A solução utiliza subconsultas agregadas separadas; o teste com múltiplas reservas e bloqueios verifica o saldo resultante.

Durante a geração, houve ainda um erro concreto no CSS: um `@import` vazio produziu um aviso de compilação. A instrução foi removida e a compilação foi executada novamente. Esse caso reforça a necessidade de verificar o código produzido, mesmo quando a alteração parece simples.

Uma limitação adicional esteve na validação em navegador: o ambiente não permitiu concluir a execução do Chromium. Por isso, os testes de navegador preparados não foram apresentados como aprovados. A integração React + FastAPI foi validada separadamente com DOM simulado e banco real, mantendo explícito que essa verificação não comprova a aparência ou o comportamento visual da interface.

## 5. Resultados verificados e limitações conhecidas

Na validação automatizada realizada durante o desenvolvimento assistido, foram aprovados 61 testes de backend e três testes de integração do React com a API real e SQLite temporário. Também foram concluídas a verificação de tipos e a compilação do frontend. O detalhamento está em [validacao.md](validacao.md).

Esses resultados apoiam a avaliação das regras implementadas, mas não equivalem a uma validação completa de produção. Permanecem como evoluções a inspeção visual no navegador, os testes de carga, a autenticação, as migrações de esquema e a auditoria de entradas e saídas.

Também há uma distinção importante entre as operações: a liberação pode ser repetida com segurança, enquanto entradas e criações de reservas ainda não possuem uma chave de idempotência. Se uma resposta se perder após a confirmação no banco, repetir a requisição pode duplicar a operação. Essa limitação foi documentada, e o frontend não repete automaticamente essas chamadas.

## 6. Papel da IA no processo de engenharia

A principal contribuição da IA foi acelerar a passagem dos requisitos para uma implementação verificável, além de ampliar a discussão sobre situações de falha e concorrência. A ferramenta participou efetivamente da geração do código, dos testes e da documentação, enquanto as escolhas de tecnologias e a restrição de execução local orientaram o trabalho.

O critério para incorporar uma sugestão foi sua adequação ao problema: preservar os saldos, permitir a identificação individual das reservas e bloqueios, manter responsabilidades claras e tornar a execução reproduzível. O valor do uso de IA esteve em combinar essa velocidade de desenvolvimento com decisões justificadas, verificação automatizada e limites explicitamente documentados.
