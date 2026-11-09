# Fluxo — Controle de estoque

Aplicação local para gerenciar produtos, entradas, saídas, reservas por solicitação e bloqueios. Backend em **FastAPI + SQLAlchemy + SQLite** e frontend em **React + TypeScript + Vite**. Não usa Docker nem depende de publicação em nuvem.

## Começar no Windows

Requisitos: **Python 3.12 ou superior** e **Node.js 22.12 ou superior**. A implementação foi validada com Python 3.12 e Node.js 24. A primeira instalação precisa de acesso à internet para baixar as dependências. Extraia o ZIP e abra a pasta `controle-estoque` no VS Code.

### 1. Backend — primeiro terminal PowerShell

Execute na raiz do projeto:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Se `py` não estiver disponível, substitua a primeira chamada por `python -m venv .venv`. Os comandos usam o Python do ambiente diretamente, sem precisar ativar scripts do PowerShell.

- API: http://localhost:8000/api/health
- Documentação interativa: http://localhost:8000/docs
- Especificação OpenAPI: http://localhost:8000/openapi.json

### 2. Frontend — segundo terminal PowerShell

Abra outro terminal na raiz do projeto:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Abra **http://localhost:5173**. Os comandos `npm.cmd` evitam bloqueios de execução de scripts do PowerShell no Windows. Em outros shells, use `npm`.

Para encerrar cada servidor, pressione `Ctrl+C` no respectivo terminal. O banco permanece salvo em `backend/data/stock.db` após o encerramento.

### 3. Dados de demonstração — opcional

O aplicativo começa vazio. Para cadastrar quatro produtos fictícios com saldos, reservas e bloqueios, execute em outro terminal:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.seed
```

Clique em **Atualizar** na interface. O comando é transacional e pode ser repetido: produtos com os SKUs de demonstração já existentes são preservados. Não é executado automaticamente e não apaga dados.

### Linux e macOS

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m uvicorn app.main:app --reload
```

Em outro terminal, na raiz: `cd frontend`, `npm ci` e `npm run dev`.

## Como usar

1. Clique em **Novo produto** e informe nome e SKU. O produto começa com zero unidades.
2. Selecione o produto na lista e registre uma **Entrada**.
3. Use **Saída**, **Reserva** ou **Bloqueio**, sempre respeitando o saldo disponível.
4. Para reservar, informe a identificação da solicitação/pedido. Para bloquear, informe o motivo; a solicitação é opcional.
5. Consulte os registros nas abas **Reservas** e **Bloqueios**. Abra **Ver identificação** para visualizar UUID e datas.
6. Clique em **Liberar** para devolver as unidades à disponibilidade. Os registros liberados são mantidos.

O frontend atualiza os dados após operações confirmadas e permite atualização manual. Dados podem mudar em outra janela entre uma consulta e uma ação; o backend sempre valida o saldo novamente. Não há atualização em tempo real entre janelas.

## Estrutura e responsabilidades

```text
controle-estoque/
  backend/
    app/
      main.py                 # Aplicação, CORS, rotas e erros HTTP
      config.py               # Configuração e caminhos absolutos
      database.py             # Engine, sessões e transações
      exceptions.py           # Erros de negócio
      seed.py                 # Dados opcionais de demonstração
      products/               # Cadastro e consulta de produtos
        models.py
        schemas.py
        repository.py
        service.py
        router.py
      inventory/              # Operações, reservas e bloqueios
        models.py
        schemas.py
        repository.py
        service.py
        router.py
    tests/                    # API, negócio, concorrência e persistência
    data/                     # SQLite gerado localmente
    requirements.txt          # Dependências de execução
    requirements-dev.txt      # Dependências de desenvolvimento
    constraints.txt           # Versões do ambiente Python validado
    pyproject.toml            # pytest e Ruff
    .env.example
  frontend/
    src/
      pages/InventoryPage.tsx  # Composição da tela
      features/products/      # API, tipos, cadastro e seleção
      features/inventory/     # API, tipos, hook e operações
      shared/                 # Cliente HTTP e componentes compartilhados
      styles/global.css
      App.tsx
      main.tsx
    tests/inventory.spec.ts   # Fluxos para execução no navegador
    tests/integration.test.tsx # React + API real em DOM simulado
    playwright.config.ts
    package.json
    package-lock.json
    .env.example
  docs/
    uso-de-ia.md
    visao-de-engenharia.md
    validacao.md
```

As rotas tratam HTTP; schemas validam contratos; services aplicam regras e controlam transações; repositories acessam dados; models descrevem as tabelas. O frontend recebe saldos calculados pela API. Repositories não fazem `commit()`.

## Modelagem e invariantes

| Tabela | Conteúdo |
| --- | --- |
| `products` | ID inteiro, SKU único, nome, quantidade total e data de criação |
| `reservations` | UUID, produto, solicitação, quantidade, criação e liberação |
| `blocks` | UUID, produto, solicitação opcional, motivo, quantidade, criação e liberação |

Uma reserva ou bloqueio está ativo enquanto `released_at` é nulo. As datas são strings ISO 8601 com fuso UTC; a interface as apresenta no fuso local do navegador.

```text
reservado  = soma das reservas ativas
bloqueado  = soma dos bloqueios ativos
disponível = total - reservado - bloqueado
total      = disponível + reservado + bloqueado
```

Somente `total_quantity` é armazenado no produto. Os demais saldos são calculados em uma única consulta com subconsultas agregadas, evitando divergências entre contadores e multiplicação de somas em joins.

### Premissas documentadas

- Quantidades são inteiros estritos entre 1 e 1.000.000.000. Booleanos, números fracionários e strings numéricas são rejeitados na API. O total também tem limite de 1.000.000.000.
- SKU é normalizado para maiúsculas; aceita letras, números, ponto, hífen e sublinhado. Não pode se repetir.
- Cadastro começa com zero unidades; entrada aumenta o total e saída reduz o total.
- Saída, reserva e bloqueio só consomem saldo disponível.
- Reserva e bloqueio não alteram o total.
- Liberação integral devolve disponibilidade e preserva o registro. Repetir a liberação é idempotente: devolve o mesmo estado, sem crédito duplicado.
- Um pedido pode ter várias reservas. `request_id` é referência de negócio, não uma chave de idempotência.
- Não há expiração, liberação parcial, baixa direta de reserva, exclusão ou edição de produtos neste escopo.

## Consistência e concorrência

Cada requisição utiliza uma sessão SQLAlchemy própria. Services de escrita exigem uma sessão ainda sem transação e solicitam a opção `sqlite_write` na primeira conexão. Um evento de início emite `BEGIN IMMEDIATE` antes de consultar o saldo. Leituras usam `BEGIN` normal.

O driver `sqlite3` tem seu início implícito desabilitado, deixando SQLAlchemy controlar o `BEGIN`. Isso evita tanto a leitura fora da transação quanto um `BEGIN` duplicado. Chaves estrangeiras são habilitadas em cada conexão. CHECK constraints protegem os limites locais das quantidades.

O SQLite serializa as escritas. Após obter o acesso de escrita, o service lê, valida, altera e confirma a operação. Em qualquer exceção, há rollback. A soma de reservas e bloqueios versus total é uma regra entre tabelas garantida pelos services; alterar o arquivo por fora da aplicação pode violá-la.

O teste de concorrência inicia duas requisições independentes para reservar 7 unidades de um total de 10. O resultado esperado é um `201`, um `409` e saldo disponível de 3. Liberações simultâneas também são testadas. Se a espera pelo banco ultrapassar 5 segundos, a API retorna `503` com `Retry-After: 1`.

## API

Todas as rotas usam o prefixo `/api`.

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/health` | Verificar se a aplicação está respondendo |
| POST / GET | `/products` | Cadastrar / listar produtos |
| GET | `/products/{id}/stock` | Consultar os quatro saldos |
| POST | `/products/{id}/entries` | Entrada |
| POST | `/products/{id}/outputs` | Saída |
| POST / GET | `/products/{id}/reservations` | Criar / listar reservas |
| GET | `/reservations/{uuid}` | Consultar reserva |
| POST | `/reservations/{uuid}/release` | Liberar reserva |
| POST / GET | `/products/{id}/blocks` | Criar / listar bloqueios |
| GET | `/blocks/{uuid}` | Consultar bloqueio |
| POST | `/blocks/{uuid}/release` | Liberar bloqueio |

As listagens de reservas e bloqueios aceitam `?active=true` ou `?active=false`. Sem filtro, retornam todos os registros do produto.

Exemplo de reserva:

```json
{"quantity": 5, "request_id": "PEDIDO-123"}
```

Exemplo de bloqueio:

```json
{"quantity": 2, "reason": "Inspeção de qualidade", "request_id": "INSPECAO-10"}
```

Exemplo de erro:

```json
{"error": {"code": "insufficient_stock", "message": "Estoque insuficiente. Disponível: 3 unidade(s)."}}
```

Status: `201` para criação; `200` para consultas, movimentos e liberação; `404` para inexistência; `409` para conflito; `422` para dados inválidos; `503` para banco temporariamente ocupado. Falhas inesperadas de banco retornam mensagem genérica e são registradas no log do servidor.

## Configuração

Copiar `.env.example` para `.env` é opcional: os valores padrão já permitem executar localmente.

| Local | Variável | Padrão |
| --- | --- | --- |
| Backend | `DATABASE_PATH` | `data/stock.db`, relativo à pasta backend |
| Backend | `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |
| Frontend | `VITE_API_URL` | `http://localhost:8000/api` |

O caminho do banco é resolvido a partir do arquivo de configuração, independente da pasta de onde o Python é iniciado. `.env`, banco e arquivos auxiliares não são versionados. CORS permite apenas as origens configuradas; isso não substitui autenticação.

As tabelas são criadas na primeira inicialização. `create_all` não migra tabelas existentes: mudanças futuras no esquema exigirão migrações. O banco vazio nunca precisa ser incluído no Git.

## Verificação

No diretório `backend`, em PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
```

Os testes usam arquivos SQLite temporários, separados do banco local. Cobrem validação, movimentos, pedidos independentes, liberação idempotente, rollback após INSERT, concorrência, indisponibilidade temporária, restrições de banco, reinicialização e seed repetível.

No diretório `frontend`:

```powershell
npm.cmd run build
npm.cmd run format:check
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

`npm test` executa o React em um DOM simulado (jsdom), conectado à API FastAPI real na porta **8002** com SQLite temporário. Verifica comportamento e integração, sem avaliar layout visual ou o gerenciamento nativo de foco do navegador.

Os testes de navegador iniciam uma API na porta **8001** e um frontend na **5174**, com banco temporário próprio. As portas devem estar livres. Ambas as suítes usam o Python de `backend/.venv`. Para outro ambiente, defina `E2E_PYTHON` com o caminho absoluto do executável; `E2E_CHROMIUM` permite selecionar um Chromium já instalado. Nenhum teste usa o banco pessoal em `backend/data`.

`npm run build` verifica os tipos e gera a pasta `dist` localmente; não publica o projeto. A documentação dos resultados executados está em [docs/validacao.md](docs/validacao.md).

## Decisões, limitações e evolução

- **Monólito modular:** permite desenvolvimento e revisão em um único repositório, adequado ao case.
- **SQLite:** instalação simples e persistência local. A escrita é serializada no banco inteiro; não foi projetado aqui para alta concorrência ou múltiplas máquinas.
- **SQLAlchemy síncrono:** reduz complexidade; endpoints síncronos são executados pelo FastAPI fora do event loop principal.
- **React sem estado global adicional:** um hook coordena dados, carregamento, mensagens e operações. Respostas antigas de consultas são descartadas.
- **Reprodutibilidade:** dependências diretas fixadas, constraints do ambiente Python e `package-lock.json`. Não inclui ambientes virtuais, `node_modules` ou binários de navegador.

Em produção, as prioridades seriam autenticação e autorização, migrações Alembic, paginação, trilha de auditoria de entradas e saídas, métricas, backups e testes de carga. Caso o volume exija PostgreSQL, seria necessário adaptar a estratégia de concorrência com bloqueio por produto ou atualização condicional; não seria apenas trocar a URL.

Reservas e bloqueios preservam seu histórico, mas entradas e saídas atualizam apenas o total: não há um livro completo de movimentações. Criações e movimentos não possuem chave de idempotência; se uma resposta se perder depois do commit, repetir a requisição pode duplicar a operação. Por isso, o frontend não repete POST automaticamente. Também não há autenticação, paginação ou sincronização em tempo real. A solução destina-se ao case e à execução local.

## Materiais da entrega

- [Uso de IA](docs/uso-de-ia.md)
- [Cinco aspectos de engenharia](docs/visao-de-engenharia.md)
- [Validação realizada](docs/validacao.md)

Antes de entregar, revise o código e as decisões para conseguir explicá-los. O repositório do candidato deve conter os arquivos-fonte e esta documentação, respeitando o `.gitignore`.

## Referências técnicas

- FastAPI, organização por módulos: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- FastAPI, CORS: https://fastapi.tiangolo.com/tutorial/cors/
- SQLAlchemy, transações SQLite: https://docs.sqlalchemy.org/en/20/dialects/sqlite.html
- SQLite, transações e BEGIN IMMEDIATE: https://www.sqlite.org/lang_transaction.html
- SQLite, chaves estrangeiras: https://www.sqlite.org/foreignkeys.html
- Vite, configuração inicial: https://vite.dev/guide/
