# 🧪 SaúdePlan Lab - Sistema de Gestão Laboratorial

O **SaúdePlan Lab** é um sistema web moderno e responsivo desenvolvido para clínicas e laboratórios de análises clínicas. Ele centraliza o gerenciamento de profissionais (usuários do sistema), o controle detalhado de fichas de pacientes com históricos clínicos e, futuramente, a emissão de laudos e exames.

---

## 🚀 Funcionalidades Concluídas

* **Autenticação Segura:** Sistema de login corporativo com proteção de rotas no front-end e tratamento de sessões via `localStorage`.
* **Gerenciamento de Usuários (CRUD):** Cadastro, listagem, edição e exclusão de profissionais do laboratório com níveis de acesso específicos (`admin`, `biomedico`, `tecnico`, `farmaceutico`).
* **Ficha Médica de Pacientes (CRUD Avançado):** * Coleta de dados pessoais e contatos.
    * Endereço completo estruturado.
    * Cálculo automático de idade em tempo real via JavaScript.
    * Campo dedicado para histórico clínico (comorbidades, medicações contínuas e alergias).

---

## 🛠️ Tecnologias Utilizadas

O ecossistema do projeto foi construído utilizando uma arquitetura minimalista, leve e de alta performance:

* **Front-end:** HTML5, CSS3 (Design moderno com variáveis CSS, responsivo e baseado na psicologia das cores da saúde) e JavaScript Puro (ES6+).
* **Back-end:** Python 3 + Flask (Servidor de API leve e veloz).
* **Banco de Dados:** PostgreSQL hospedado na nuvem através do **Neon.tech**.
* **Deploy & Produção:** Render (Hospedagem do Back+Front) e Gunicorn (Servidor HTTP WSGI de produção).

---

## 🗂️ Estrutura do Projeto

```text
seu-projeto/
├── .gitignore            # Arquivos ignorados no Git (como o .env)
├── app.py                # Servidor Backend em Flask (Python)
├── requirements.txt      # Dependências do Python para o Render
├── README.md             # Documentação do projeto
└── src/
    └── public/           # Arquivos estáticos do Front-end
        ├── css/
        │   └── style.css # Identidade visual unificada
        ├── js/
        │   └── main.js   # Regras de negócio do front e chamadas Fetch API
        ├── cadastro.html # Tela de gerenciamento de usuários
        ├── login.html    # Tela de autenticação
        └── pacientes.html# Tela de gerenciamento de pacientes
