<div align="center">

# ✨ Gleam - Sistema de Gestão de Joalheria (Backend) ✨

</div>

---

## 📖 **Sobre o Projeto**

> **Gleam** é o backend de um sistema de gestão de stock e vendas (ERP) desenhado especificamente para o nicho de joalherias. A aplicação foi construída em Java utilizando o framework Spring Boot e segue uma arquitetura RESTful para se comunicar com qualquer interface de frontend.
>
> O core do sistema é a sua lógica de inventário: cada peça é tratada como um item único. Quando uma venda é registada, o produto é atomicamente movido do stock ativo para um registo histórico de vendas, garantindo a integridade e a rastreabilidade dos dados.

---

## 🚀 **Funcionalidades Principais**

* **Gestão de Fornecedores:**
    * CRUD completo para registar e gerir fornecedores de joias.

* **Gestão de Clientes:**
    * CRUD básico para manter um registo de clientes.

* **Gestão de Produtos (Inventário):**
    * Registo de produtos únicos com detalhes como preço de custo, preço de venda, acabamento e categoria.
    * Lógica de **"Mover na Venda"**: os produtos vendidos são removidos do inventário ativo.

* **Registo de Vendas:**
    * Criação de "recibos" de venda (`RegistrarVenda`) que podem conter múltiplos itens.
    * Cálculo automático do lucro para cada item vendido.
    * Armazenamento de detalhes da transação, como nome do cliente, forma de pagamento e situação.

---

## 🛠️ **Tecnologias Utilizadas**

* **☕ Linguagem:** Java 21+
* **🍃 Framework:** Spring Boot e Angular
* **💾 Acesso a Dados:** Spring Data JPA, Hibernate
* **🛢️ Base de Dados:** MySQL 8
* **📦 Gestão de Dependências:** Maven
* **📝 Utilitários:** Lombok

---

## 🧪 **Modo demonstração (sem backend)**

O frontend funciona mesmo sem a API no ar. Ao iniciar, ele tenta alcançar o backend em `http://localhost:8080`:

* **Backend respondendo:** usa a API real, com login pelo Google.
* **Backend fora do ar:** entra no **modo demonstração**. As requisições são respondidas no próprio navegador, com dados fictícios de uma joalheria (fornecedores, clientes, peças e vendas), e o botão de login vira **"Entrar na demo"**.

No modo demonstração dá para cadastrar, editar, registrar vendas, pagar parcelas e cancelar vendas. As regras seguem as do backend (prefixo do código por fornecedor, produto vendido não pode ser alterado, lucro só de vendas pagas/pendentes etc.). As alterações ficam no `localStorage` e o botão **"Restaurar dados"** volta ao estado inicial.

### Como rodar

```bash
npm install

# Com o backend (gleam-api) rodando em localhost:8080: usa a API real
# Sem o backend: entra sozinho no modo demonstração
npm start

# Forçar a demonstração mesmo com o backend ligado
# http://localhost:4200/?demo=1

# Build estático que sempre usa a demonstração, sem tentar acessar a API
npm run build:demo
```
