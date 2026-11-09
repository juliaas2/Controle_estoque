# Validação da entrega

Verificações realizadas durante a geração do projeto. Estes resultados descrevem o ambiente de desenvolvimento, não uma execução no computador da candidata.

| Verificação | Resultado |
| --- | --- |
| Backend: pytest | 61 testes aprovados |
| Cobertura de linhas do backend | 98% no relatório pytest-cov, incluindo o seed |
| Regras de estoque e services | Linhas executáveis dos services cobertas pelos testes |
| Concorrência | Duas reservas de 7 para saldo 10: um sucesso, um conflito e saldo final 3 |
| Liberação concorrente | Duas liberações preservam o mesmo saldo e a mesma data de liberação |
| Rollback | Falha simulada depois de INSERT não deixa reserva nem saldo alterado |
| Persistência | Produto, saldo e reserva recuperados após reinicialização da aplicação |
| Seed | Nova execução não duplica produtos nem altera seus saldos |
| Ruff | Análise e formatação aprovadas |
| Frontend: TypeScript + Vite | Compilação aprovada |
| Frontend: Vitest + Testing Library | 3 testes de integração aprovados, conectados a FastAPI e SQLite reais |
| Prettier | Formatação verificada |
| Playwright em Chromium | Execução bloqueada antes das interações; não aprovado |
| Inspeção visual desktop e móvel | Não concluída neste ambiente |

## Escopo dos testes React

O frontend foi renderizado em jsdom, sem substituir as respostas da API por saldos fictícios. Os testes iniciam FastAPI em um subprocesso com banco temporário e percorrem cadastro, entrada, reserva, erro por saldo insuficiente, liberação, bloqueio, saída, filtro de ativos e recarregamento dos dados. Outros testes verificam SKU duplicado com erro no formulário e recuperação após falha de conexão simulada.

O DOM simulado não reproduz renderização de pixels, regras de layout nem foco nativo de um diálogo modal. O método `showModal` é substituído apenas nesse ambiente de teste. Portanto, a suíte não comprova aparência nem acessibilidade visual.

## Limitação dos testes de navegador

O download do Chromium do Playwright não foi concluído. A tentativa com o Chromium já instalado foi bloqueada por restrição de sockets do ambiente antes de abrir a página. O navegador remoto também não alcançou o servidor local. Nenhuma dessas tentativas é contada como teste aprovado.

A suíte `npm run test:e2e` está incluída para executar localmente, após `npx playwright install chromium`. Contém fluxo completo, cenário móvel e recuperação de conexão. Valide o layout e o uso por teclado no navegador antes da entrega definitiva do case.

## Observações

- O pytest apresentou um aviso de depreciação do Starlette sobre o uso de HTTPX no TestClient. A suíte passou com as versões fixadas; uma atualização futura pode exigir adaptação desse cliente.
- Cobertura de linhas não demonstra ausência de todos os defeitos. Não foram feitos testes de carga, auditoria de segurança ou testes em Windows neste ambiente.
- O projeto tem instruções para Windows e caminhos compatíveis via pathlib; a execução efetiva de validação ocorreu em Linux, Python 3.12.14 e Node.js 24.22.1.
