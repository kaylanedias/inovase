const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

const dbQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// FUNÇÕES DE SEGURANÇA E VALIDAÇÃO

const apenasNumeros = (str) => str ? String(str).replace(/\D/g, '') : '';

const emailValido = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const senhaForte = (senha) => senha && senha.length >= 6;

const imageFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ROTAS DE AUTENTICAÇÃO
// Cadastro
app.post('/api/cadastro', async (req, res) => {
    const { nome, email, cpf_cnpj, telefone, senha } = req.body;
    const cpfLimpo = apenasNumeros(req.body.cpf_cnpj);
    const telLimpo = apenasNumeros(req.body.telefone);

    if (!nome || !email || !senha) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios.' });
    }

    if (!emailValido(email)) {
        return res.status(400).json({ success: false, message: 'Formato de e-mail inválido.' });
    }

    if (!senhaForte(senha)) {
        return res.status(400).json({ success: false, message: 'A senha é muito fraca. Use no mínimo 6 caracteres.' });
    }

    if (cpfLimpo.length < 11) {
        return res.status(400).json({ success: false, message: 'CPF ou CNPJ inválido (números insuficientes).' });
    }

    if (telLimpo.length < 10) {
        return res.status(400).json({ success: false, message: 'Telefone inválido. Informe o DDD e o número.' });
    }

    try {
        const users = await dbQuery('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ success: false, message: 'E-mail já cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const result = await dbQuery(
            'INSERT INTO usuarios (nome, email, cpf_cnpj, telefone, senha_hash) VALUES (?, ?, ?, ?, ?)',
            [nome, email, cpfLimpo, telLimpo, senhaHash]
        );
        res.status(201).json({ success: true, message: 'Usuário criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao cadastrar.' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) return res.status(400).json({ success: false, message: 'Preencha e-mail e senha.' });

    try {
        const users = await dbQuery('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });

        const usuario = users[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });

        res.json({
            success: true,
            message: 'Login realizado!',
            user: { id: usuario.id, nome: usuario.nome, email: usuario.email, nivel_acesso: usuario.nivel_acesso }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno.' });
    }
});

// ROTAS DE USUÁRIOS
// Atualizar Perfil
app.put('/api/usuarios/:id', async (req, res) => {
    const { nome, email, telefone, cpf_cnpj } = req.body;
    const { id } = req.params;

    if (!nome || !email) return res.status(400).json({ success: false, message: 'Nome e E-mail são obrigatórios.' });

    try {
        await dbQuery(
            'UPDATE usuarios SET nome = ?, email = ?, telefone = ?, cpf_cnpj = ? WHERE id = ?',
            [nome, email, String(telefone), String(cpf_cnpj), id]
        );
        res.json({
            success: true,
            message: 'Perfil atualizado!',
            user: { id, nome, email, telefone, cpf_cnpj }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar perfil.' });
    }
});

// ROTAS DE ESPAÇOS
// Listar Espaços
app.get('/api/espacos', async (req, res) => {
    try {
        const espacos = await dbQuery('SELECT * FROM espacos WHERE status = "ativo"');
        res.json({ success: true, espacos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar espaços.' });
    }
});

// Criar Espaço
app.post('/api/espacos', upload.single('imagem'), async (req, res) => {
    const { usuario_id, nome, tipo, capacidade, descricao, preco_hora } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1497366216548-37526070297c';

    try {
        const admins = await dbQuery('SELECT nivel_acesso FROM usuarios WHERE id = ?', [usuario_id]);
        if (!admins.length || admins[0].nivel_acesso !== 'admin') {
            return res.status(403).json({ success: false, message: 'Sem permissão.' });
        }

        await dbQuery(
            'INSERT INTO espacos (nome, tipo, capacidade, descricao, preco_hora, imagem_url) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, tipo, capacidade, descricao, preco_hora, imagem_url]
        );
        res.json({ success: true, message: 'Espaço criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao criar espaço.' });
    }
});

// Atualizar Espaço
app.put('/api/espacos/:id', upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { nome, tipo, capacidade, descricao, preco_hora, imagem_antiga } = req.body;
    const imagem_url = req.file ? `/uploads/${req.file.filename}` : imagem_antiga;

    try {
        await dbQuery(
            'UPDATE espacos SET nome=?, tipo=?, capacidade=?, descricao=?, preco_hora=?, imagem_url=? WHERE id=?',
            [nome, tipo, capacidade, descricao, preco_hora, imagem_url, id]
        );
        res.json({ success: true, message: 'Espaço atualizado!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar espaço.' });
    }
});

// Excluir Espaço
app.delete('/api/espacos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const reservas = await dbQuery("SELECT * FROM reservas WHERE espaco_id = ? AND status = 'confirmada'", [id]);
        if (reservas.length > 0) {
            return res.status(400).json({ success: false, message: 'Não é possível excluir: Existem reservas ativas.' });
        }

        await dbQuery('DELETE FROM espacos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Espaço excluído.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir espaço.' });
    }
});

// ROTAS DE RESERVAS
// Criar Reserva
app.post('/api/reservas', async (req, res) => {
    const { usuario_id, espaco_id, data, inicio, fim, itens_adicionais } = req.body;

    if (!usuario_id || !espaco_id || !data || !inicio || !fim) {
        return res.status(400).json({ success: false, message: 'Dados incompletos.' });
    }
    if (inicio >= fim) {
        return res.status(400).json({ success: false, message: 'Horário inválido (início maior que fim).' });
    }

    const agora = new Date();
    const dataHoraReserva = new Date(`${data}T${inicio}`);

    if (dataHoraReserva < agora) {
        return res.status(400).json({ success: false, message: 'Não é permitido realizar reservas no passado.' });
    }

    try {
        const conflito = await dbQuery(`
            SELECT * FROM reservas 
            WHERE espaco_id = ? 
            AND data_reserva = ? 
            AND status = 'confirmada'
            AND horario_inicio < ? 
            AND horario_fim > ?
        `, [espaco_id, data, fim, inicio]);

        if (conflito.length > 0) {
            return res.status(409).json({ success: false, message: 'Horário indisponível! Já existe uma reserva neste intervalo.' });
        }

        const result = await dbQuery(
            'INSERT INTO reservas (usuario_id, espaco_id, data_reserva, horario_inicio, horario_fim) VALUES (?, ?, ?, ?, ?)',
            [usuario_id, espaco_id, data, inicio, fim]
        );

        const novaReservaId = result.insertId;

        if (itens_adicionais && Array.isArray(itens_adicionais) && itens_adicionais.length > 0) {
            const values = itens_adicionais.map(adicionalId => [novaReservaId, adicionalId]);
            await dbQuery('INSERT INTO reserva_adicionais (reserva_id, adicional_id) VALUES ?', [values]);
        }

        res.status(201).json({ success: true, message: 'Reserva realizada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao reservar.' });
    }
});

// Editar Reserva
app.put('/api/reservas/:id', async (req, res) => {
    const { id } = req.params;

    const { espaco_id, data, inicio, fim, itens_adicionais } = req.body;

    if (!espaco_id || !data || !inicio || !fim) {
        return res.status(400).json({ success: false, message: 'Dados incompletos.' });
    }
    if (inicio >= fim) return res.status(400).json({ success: false, message: 'Horário inválido.' });

    try {

        const conflito = await dbQuery(`
            SELECT * FROM reservas 
            WHERE espaco_id = ? AND data_reserva = ? AND status = 'confirmada' AND id != ?
            AND ((horario_inicio < ? AND horario_fim > ?))
        `, [espaco_id, data, id, fim, inicio]);

        if (conflito.length > 0) {
            return res.status(409).json({ success: false, message: 'Conflito! Horário indisponível.' });
        }

        await dbQuery(
            'UPDATE reservas SET data_reserva=?, horario_inicio=?, horario_fim=? WHERE id=?',
            [data, inicio, fim, id]
        );

        await dbQuery('DELETE FROM reserva_adicionais WHERE reserva_id = ?', [id]);

        if (itens_adicionais && Array.isArray(itens_adicionais) && itens_adicionais.length > 0) {
            const values = itens_adicionais.map(adicionalId => [id, adicionalId]);
            await dbQuery('INSERT INTO reserva_adicionais (reserva_id, adicional_id) VALUES ?', [values]);
        }

        res.json({ success: true, message: 'Reserva atualizada com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar reserva.' });
    }
});

// Listar Minhas Reservas
app.get('/api/reservas/:usuario_id', async (req, res) => {
    try {
        const sql = `
            SELECT r.id, r.data_reserva, r.horario_inicio, r.horario_fim, r.status, 
                   e.nome AS nome_espaco, e.imagem_url, e.preco_hora, e.descricao,
                   -- Nomes para exibir na lista
                   GROUP_CONCAT(a.nome SEPARATOR ', ') as nomes_adicionais,
                   -- IDs para preencher os checkboxes na edição (ESTAVA FALTANDO ISSO)
                   GROUP_CONCAT(ra.adicional_id) as ids_adicionais, 
                   -- Soma total
                   SUM(a.preco) as total_adicionais
            FROM reservas r 
            JOIN espacos e ON r.espaco_id = e.id
            LEFT JOIN reserva_adicionais ra ON r.id = ra.reserva_id
            LEFT JOIN adicionais a ON ra.adicional_id = a.id
            WHERE r.usuario_id = ? 
            AND r.visivel_usuario = 1
            GROUP BY r.id
            ORDER BY r.data_reserva DESC, r.horario_inicio ASC
        `;
        
        const reservas = await dbQuery(sql, [req.params.usuario_id]);
        res.json({ success: true, reservas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao buscar reservas.' });
    }
});

// Listar Todas Reservas
app.get('/api/admin/reservas', async (req, res) => {
    try {
        const sql = `
            SELECT r.id, r.espaco_id, r.data_reserva, r.horario_inicio, r.horario_fim, r.status,
                   u.nome AS nome_usuario, u.email, u.telefone, u.cpf_cnpj,
                   e.nome AS nome_espaco, e.preco_hora, e.imagem_url,
                   -- Traz os nomes dos itens (ex: "Projetor, Café")
                   GROUP_CONCAT(a.nome SEPARATOR ', ') as nomes_adicionais,
                   -- Soma o valor dos itens
                   SUM(a.preco) as total_adicionais
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN espacos e ON r.espaco_id = e.id
            LEFT JOIN reserva_adicionais ra ON r.id = ra.reserva_id
            LEFT JOIN adicionais a ON ra.adicional_id = a.id
            GROUP BY r.id
            ORDER BY r.data_reserva DESC, r.horario_inicio ASC
        `;

        const reservas = await dbQuery(sql);
        res.json({ success: true, reservas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao buscar reservas.' });
    }
});

// Cancelar Reserva
app.put('/api/reservas/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    console.log(`Tentando cancelar reserva ID: ${id}`);

    try {
        const result = await dbQuery("UPDATE reservas SET status = 'cancelada' WHERE id = ?", [id]);

        console.log('Resultado do DB:', result);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Reserva cancelada com sucesso.' });
        } else {
            res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
        }
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao cancelar.' });
    }
});

// Excluir Reserva
app.delete('/api/reservas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await dbQuery('DELETE FROM reservas WHERE id = ?', [id]);
        res.json({ success: true, message: 'Reserva excluída do histórico permanentemente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao excluir reserva.' });
    }
});

// Esconder Reserva do usuário
app.put('/api/reservas/:id/esconder', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.body;

    if (!usuario_id) return res.status(400).json({ success: false, message: 'ID do usuário obrigatório.' });

    try {
        const reserva = await dbQuery('SELECT usuario_id FROM reservas WHERE id = ?', [id]);

        if (reserva.length === 0) return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });

        if (reserva[0].usuario_id != usuario_id) {
            return res.status(403).json({ success: false, message: 'Você não tem permissão para alterar esta reserva.' });
        }

        await dbQuery(
            "UPDATE reservas SET visivel_usuario = 0, status = 'cancelada' WHERE id = ?",
            [id]
        );

        res.json({ success: true, message: 'Reserva removida e horário liberado.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno.' });
    }
});

// DASHBOARD & EXTRAS
// Estatísticas
app.get('/api/reservas/:usuario_id', async (req, res) => {
    try {
        const sql = `
            SELECT r.id, r.data_reserva, r.horario_inicio, r.horario_fim, r.status, 
                   e.nome AS nome_espaco, e.imagem_url, e.preco_hora, e.descricao,
                   -- Traz os nomes (para exibir na tabela)
                   GROUP_CONCAT(a.nome SEPARATOR ', ') as nomes_adicionais,
                   -- Traz os IDs (para preencher os checkboxes na edição)
                   GROUP_CONCAT(ra.adicional_id) as ids_adicionais, 
                   -- Soma o valor
                   SUM(a.preco) as total_adicionais
            FROM reservas r 
            JOIN espacos e ON r.espaco_id = e.id
            LEFT JOIN reserva_adicionais ra ON r.id = ra.reserva_id
            LEFT JOIN adicionais a ON ra.adicional_id = a.id
            WHERE r.usuario_id = ? 
            AND r.visivel_usuario = 1
            GROUP BY r.id
            ORDER BY r.data_reserva DESC, r.horario_inicio ASC
        `;

        const reservas = await dbQuery(sql, [req.params.usuario_id]);
        res.json({ success: true, reservas });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar reservas.' });
    }
});

// Itens Adicionais
app.get('/api/adicionais', async (req, res) => {
    try {
        const adicionais = await dbQuery('SELECT * FROM adicionais ORDER BY preco ASC');
        res.json({ success: true, adicionais });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar adicionais.' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const queryReceita = `
            SELECT 
                SUM(
                    -- Cálculo do Preço da Sala (Horas * Preço/Hora)
                    ((TIME_TO_SEC(TIMEDIFF(r.horario_fim, r.horario_inicio)) / 3600) * e.preco_hora) 
                    + 
                    -- Cálculo dos Adicionais (Soma dos itens extras dessa reserva)
                    COALESCE((
                        SELECT SUM(a2.preco) 
                        FROM reserva_adicionais ra 
                        JOIN adicionais a2 ON ra.adicional_id = a2.id 
                        WHERE ra.reserva_id = r.id
                    ), 0)
                ) as total
            FROM reservas r 
            JOIN espacos e ON r.espaco_id = e.id
            WHERE r.status = 'confirmada' 
            AND MONTH(r.data_reserva) = MONTH(CURRENT_DATE()) 
            AND YEAR(r.data_reserva) = YEAR(CURRENT_DATE())
        `;

        const querySalas = 'SELECT COUNT(*) as total FROM espacos';
        const queryReservasHoje = 'SELECT COUNT(*) as total FROM reservas WHERE data_reserva = CURRENT_DATE()';
        const queryReservasTotal = 'SELECT COUNT(*) as total FROM reservas';

        const [receitaResult] = await dbQuery(queryReceita);
        const [salasResult] = await dbQuery(querySalas);
        const [hojeResult] = await dbQuery(queryReservasHoje);
        const [totalResult] = await dbQuery(queryReservasTotal);

        res.json({
            success: true,
            receitaMensal: receitaResult.total || 0,
            salasAtivas: salasResult.total || 0,
            reservasHoje: hojeResult.total || 0,
            totalReservas: totalResult.total || 0
        });

    } catch (error) {
        console.error('Erro ao carregar stats:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar estatísticas' });
    }
});

app.get('/status', (req, res) => res.send({ message: 'Servidor Online!' }));

app.get('/', (req, res) => res.redirect('/html/index.html'));

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});