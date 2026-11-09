# Cinco aspectos prioritários de engenharia

## 1. Consistência das quantidades

A disponibilidade precisa corresponder ao total menos as reservas e os bloqueios ativos. As operações validam o saldo dentro de uma transação de escrita iniciada antes da leitura, com rollback em falhas. Saldos derivados são calculados e restrições locais são reforçadas no banco. Essa propriedade protege a regra central do sistema.

## 2. Testes que reproduzem falhas relevantes

Além do caminho de sucesso, a suíte testa saldo insuficiente, entradas inválidas, duas reservas simultâneas, liberações concorrentes, rollback após gravação e persistência após reiniciar a aplicação. Testes usam SQLite em arquivo e conexões independentes para reproduzir o comportamento escolhido. Testes React em DOM simulado verificam a integração com a API real. A suíte adicional de navegador foi preparada, mas sua execução ficou bloqueada no ambiente de geração.

## 3. Responsabilidades claras

Rotas adaptam HTTP, schemas validam contratos, services coordenam regras e transações e repositories executam acesso a dados. No frontend, chamadas HTTP e estado são separados dos componentes. A separação facilita explicar, localizar e modificar uma regra sem introduzir muitas abstrações.

## 4. Execução e diagnóstico reproduzíveis

Instruções para Windows, versões de dependências, arquivos de exemplo de configuração, banco criado automaticamente e dados opcionais facilitam reproduzir a solução. Erros de domínio têm códigos previsíveis. Falhas inesperadas de banco são registradas no servidor sem expor SQL ao usuário. Os testes ficam isolados dos dados de uso local.

## 5. Evolução baseada em limites conhecidos

O projeto explicita que escritas SQLite são serializadas, que entradas e saídas ainda não possuem auditoria completa e que criações não têm idempotência. Esses limites orientam melhorias concretas: migrações, trilha de movimentações, controle de acesso, paginação, observabilidade e, se necessário, outro banco com uma estratégia de concorrência apropriada.
