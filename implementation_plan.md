# Auditoria e Profissionalização do Sistema Finnancial

Esta etapa tem como objetivo auditar, padronizar e tornar o código do Finnancial altamente resiliente para uso profissional, garantindo integridade de banco de dados (MongoDB via Prisma), além de preparar e testar o build do executável para distribuição.

## User Review Required

> [!IMPORTANT]
> A refatoração abrangerá os métodos de `create`, `update` e `remove` dos Controllers que ainda não utilizam Transações Interativas do Prisma, garantindo consistência atômica.
> O processo de build será executado localmente. Peço a confirmação para iniciar a reconstrução do executável (`build.ps1`) assim que a refatoração e limpeza forem concluídas, o que vai gerar uma nova versão `.exe` na pasta `release` do frontend.

## Open Questions

> [!WARNING]
> Há alguma funcionalidade específica não detectada na auditoria inicial (como algo nas telas de relatórios ou categorias) que você gostaria de incluir nesta etapa?
> O script `build.ps1` lida com a geração do Executável. Caso você tenha tido problemas de atalho com o Electron Builder, por favor avise para que possamos adicionar scripts de atalho específicos.

## Proposed Changes

### finnancial-api/src/controllers

Refatoração em massa para uso de Transações Interativas (`prisma.$transaction`) em todas as mutações para manter um padrão ouro de atomicidade.

#### [MODIFY] [budgetController.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/controllers/budgetController.js)
- Envolver `create`, `update` e `remove` em blocos `prisma.$transaction`.

#### [MODIFY] [categoryController.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/controllers/categoryController.js)
- Envolver `create` e `update` em `prisma.$transaction` (o `remove` já possui).

#### [MODIFY] [goalController.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/controllers/goalController.js)
- Envolver `create`, `update` e `remove` em `prisma.$transaction`.

#### [MODIFY] [accountController.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/controllers/accountController.js)
- Envolver `create` e `remove` em `prisma.$transaction` (o `update` já possui).

#### [MODIFY] [recurringController.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/controllers/recurringController.js)
- Envolver `create`, `update` e `remove` em `prisma.$transaction`.

### finnancial-api/src/models

Garantir que os métodos estáticos dos modelos aceitem e repassem o objeto `tx` (transação interativa) para as chamadas do Prisma. 

#### [MODIFY] [Budget.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/models/Budget.js)
#### [MODIFY] [Category.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/models/Category.js)
#### [MODIFY] [Goal.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/models/Goal.js)
#### [MODIFY] [Recurring.js](file:///d:/Arquivos_Obsidian/Finnancial/finnancial-api/src/models/Recurring.js)

### Documentação (Raiz)

#### [MODIFY] [README.md](file:///d:/Arquivos_Obsidian/Finnancial/README.md)
- Remodelar o Readme com aspectos mais profissionais: escopo do projeto, regras de arquitetura, diagrama/stack (Node, React, Prisma, MongoDB Atlas), instruções robustas de execução e build. 

### Build e Distribuição

#### [MODIFY] [build.ps1](file:///d:/Arquivos_Obsidian/Finnancial/build.ps1)
- Revisar o processo de build do Electron, garantindo que atalhos na Área de Trabalho (`shortcut: true`) estejam bem configurados no empacotamento.

## Verification Plan

### Automated Tests
- Validar se o Prisma se conecta corretamente ao MongoDB (`npx prisma db pull` ou via test script).
- Reiniciar o backend local e executar requisições (verificando se o `$transaction` funciona perfeitamente ou se falha gracefully).

### Manual Verification
- Teste de build usando o `build.ps1` para gerar o `.exe`.
- Instalação e execução do `.exe` para validar a tela, comunicação backend e atalhos da Área de Trabalho.
