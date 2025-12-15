# 🗄️ Guia de Instalação do MySQL e Setup do Banco de Dados - Linux

Este guia detalha como instalar e configurar o MySQL para a aplicação INOVASEHUB no Linux.

---

## 📋 Índice

1. [Instalar MySQL](#1-instalar-mysql)
2. [Configurar Segurança](#2-configurar-segurança)
3. [Configurar Autenticação com Senha](#3-configurar-autenticação-com-senha)
4. [Importar Banco de Dados](#4-importar-banco-de-dados)
5. [Verificar Instalação](#5-verificar-instalação)
6. [Instalar Dependências Node.js](#6-instalar-dependências-nodejs)
7. [Iniciar a Aplicação](#7-iniciar-a-aplicação)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Instalar MySQL

### Para Ubuntu/Debian:

```bash
sudo apt update
sudo apt install mysql-server -y
```

### Para Fedora/RedHat/CentOS:

```bash
sudo dnf install mysql-server -y
```

### Verificar instalação:

```bash
mysql --version
```

---

## 2. Configurar Segurança

Inicie o MySQL:

```bash
sudo systemctl start mysql
```

Verifique se está rodando:

```bash
sudo systemctl status mysql
```

Execute a configuração de segurança:

```bash
sudo mysql_secure_installation
```

Responda as perguntas assim:

| Pergunta                                                | Resposta |
| ------------------------------------------------------- | -------- |
| Setup VALIDATE PASSWORD component?                      | `y`      |
| Password validation policy (0=LOW, 1=MEDIUM, 2=STRONG)? | `2`      |
| Remove anonymous users?                                 | `y`      |
| Disallow root login remotely?                           | `n`      |
| Remove test database?                                   | `n`      |
| Reload privilege tables?                                | `y`      |

---

## 3. Configurar Autenticação com Senha

Após a configuração inicial, o MySQL usa autenticação `auth_socket`. Para usar a senha definida no `.env`:

### Acesse o MySQL com sudo (não precisa senha):

```bash
sudo mysql -u root
```

### Dentro do MySQL, execute:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '8m&s#C0N6V4zuKcvGFv@5*&!0yI21a';
FLUSH PRIVILEGES;
EXIT;
```

**⚠️ IMPORTANTE:** Saia do MySQL antes do próximo passo!

---

## 4. Importar Banco de Dados

Agora no **terminal** (não dentro do MySQL), execute:

```bash
mysql -u root -p < /home/guilherme/Documentos/kay/INOVASEHUB/database/init.sql
```

**Quando pedir senha, cole:** `8m&s#C0N6V4zuKcvGFv@5*&!0yI21a`

Se tudo correu bem, não haverá mensagens de erro.

---

## 5. Verificar Instalação

Verifique se o banco foi criado:

```bash
mysql -u root -p
```

**Quando pedir senha, cole:** `8m&s#C0N6V4zuKcvGFv@5*&!0yI21a`

Dentro do MySQL, execute:

```sql
SHOW DATABASES;
```

Você deve ver:

- `información_schema`
- `mysql`
- `performance_schema`
- **`sistema_locacao`** ← Seu banco!

### Verificar as tabelas:

```sql
USE sistema_locacao;
SHOW TABLES;
```

Você deve ver:

- `espacos` (15 espaços para alugar)
- `reservas` (1 reserva de exemplo)
- `usuarios` (usuários cadastrados)

### Contar dados:

```sql
SELECT COUNT(*) FROM espacos;
SELECT COUNT(*) FROM reservas;
SELECT COUNT(*) FROM usuarios;
```

### Sair do MySQL:

```sql
EXIT;
```

---

## 6. Instalar Dependências Node.js

Na pasta da aplicação:

```bash
cd /home/guilherme/Documentos/kay/INOVASEHUB
npm install
```

Isso instala todas as dependências listadas em `package.json`.

---

## 7. Iniciar a Aplicação

```bash
npm start
```

Você deve ver algo como:

```
Server running on port 3000
Database connected successfully
```

Abra o navegador em: **http://localhost:3000**

---

## 8. Troubleshooting

### ❌ Erro: "Access denied for user 'root'@'localhost'"

**Causa:** Está tentando usar a senha sem configurar autenticação.

**Solução:** Refaça o [Passo 3](#3-configurar-autenticação-com-senha).

---

### ❌ Erro: "Commands end with ;" (dentro do MySQL)

**Causa:** Você está tentando executar comandos do terminal dentro do MySQL.

**Solução:** Saia do MySQL com `EXIT;` antes de executar comandos do terminal.

---

### ❌ MySQL não inicia

```bash
sudo systemctl status mysql
```

Se não estiver rodando:

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

---

### ❌ Banco de dados não foi criado

Verifique se o arquivo `init.sql` existe:

```bash
ls -la /home/guilherme/Documentos/kay/INOVASEHUB/database/
```

Se existir, reimporte:

```bash
mysql -u root -p < /home/guilherme/Documentos/kay/INOVASEHUB/database/init.sql
```

---

### ✅ Resetar tudo (se necessário)

Se quiser começar do zero:

```bash
sudo mysql -u root
```

Dentro do MySQL:

```sql
DROP DATABASE sistema_locacao;
EXIT;
```

Depois reimporte o banco conforme o [Passo 4](#4-importar-banco-de-dados).

---

## 📌 Credenciais da Aplicação

Arquivo: `.env`

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS='8m&s#C0N6V4zuKcvGFv@5*&!0yI21a'
DB_NAME=sistema_locacao
```

**⚠️ SEGURANÇA:** Nunca compartilhe o `.env` em repositórios públicos!

---

## 🎉 Pronto!

Se tudo funcionou, sua aplicação está conectada e pronta para usar!

### Próximas ações:

- Acessar em **http://localhost:3000**
- Fazer login ou cadastro
- Reservar espaços
- Administrar (se tiver acesso admin)

---

## 📞 Dúvidas?

Se tiver problemas, verifique:

1. MySQL está rodando: `sudo systemctl status mysql`
2. Banco existe: `mysql -u root -p` → `SHOW DATABASES;`
3. Tabelas existem: `USE sistema_locacao;` → `SHOW TABLES;`
4. Arquivo `.env` está correto
5. Node.js está instalado: `node --version`

Boa sorte! 🚀
