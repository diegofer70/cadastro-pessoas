# Cadastro de Pessoas

CRUD completo (Criar, Listar, Editar, Remover) construído com **PHP puro (API REST) + MySQL** no back-end e **HTML/CSS/JavaScript puro** no front-end — sem frameworks.

## Estrutura do projeto

```
cadastro-pessoas/
├── database.sql          # script de criação do banco e tabela
├── config/
│   └── database.php       # conexão PDO com o MySQL
├── api/
│   └── pessoas.php        # API REST (GET, POST, PUT, DELETE)
├── css/
│   └── style.css
├── js/
│   └── app.js              # consome a API via fetch()
└── index.html
```

## Como rodar

1. **Banco de dados** — importe o script SQL:
   ```bash
   mysql -u root -p < database.sql
   ```

2. **Credenciais** — se necessário, ajuste usuário/senha em `config/database.php`.

3. **Servidor PHP** — na raiz do projeto:
   ```bash
   php -S localhost:8000
   ```
   Ou coloque a pasta em `htdocs` (XAMPP) / `www` (Laragon) e acesse pelo Apache.

4. Abra `http://localhost:8000` no navegador.

## Endpoints da API

| Método | Rota                          | Ação                        |
|--------|-------------------------------|-----------------------------|
| GET    | `api/pessoas.php`             | Lista todas as pessoas      |
| GET    | `api/pessoas.php?busca=texto` | Busca por nome/CPF/e-mail   |
| GET    | `api/pessoas.php?id=1`        | Retorna uma pessoa          |
| POST   | `api/pessoas.php`              | Cria uma pessoa (JSON)      |
| PUT    | `api/pessoas.php?id=1`        | Atualiza uma pessoa (JSON)  |
| DELETE | `api/pessoas.php?id=1`        | Remove uma pessoa           |

**Corpo esperado (POST/PUT):**
```json
{
  "nome": "Maria da Silva",
  "cpf": "123.456.789-00",
  "email": "maria@email.com",
  "telefone": "(85) 99999-0000",
  "data_nascimento": "1990-05-20"
}
```

## Validações já implementadas

- Nome, CPF e e-mail obrigatórios.
- CPF com 11 dígitos (máscara automática no front-end).
- E-mail validado por formato.
- CPF único no banco (bloqueia duplicidade em cadastro e edição).
- Todas as consultas usam **PDO com prepared statements** (proteção contra SQL Injection).

## Possíveis evoluções

- Autenticação (login) para proteger a API.
- Paginação na listagem.
- Validação de dígitos verificadores reais do CPF.
- Exportar cadastro em CSV/PDF.