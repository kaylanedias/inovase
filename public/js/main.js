// Configurações Globais
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    configurarToggleSenha();
    configurarLogin();
    configurarCadastro();
    configurarMascaras();
});

function alternarEstadoBotao(btn, carregando, textoCarregando = 'Aguarde...') {
    if (carregando) {
        btn.dataset.textoOriginal = btn.innerText;
        btn.innerText = textoCarregando;
        btn.disabled = true;
    } else {
        btn.innerText = btn.dataset.textoOriginal || 'Enviar';
        btn.disabled = false;
    }
}

function configurarToggleSenha() {
    const btnToggle = document.getElementById('btnToggleSenha');
    const inputSenha = document.getElementById('senha');

    if (!btnToggle || !inputSenha) return;

    btnToggle.addEventListener('click', () => {
        const tipoAtual = inputSenha.getAttribute('type');
        const novoTipo = tipoAtual === 'password' ? 'text' : 'password';
        const novoIcone = tipoAtual === 'password' ? 'visibility_off' : 'visibility';

        inputSenha.setAttribute('type', novoTipo);
        btnToggle.textContent = novoIcone;
    });
}

function configurarLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = form.querySelector('button');
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        alternarEstadoBotao(btnSubmit, true, 'Entrando...');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('usuarioLogado', JSON.stringify(data.user));
                
                const destino = data.user.nivel_acesso === 'admin' ? 'admin.html' : 'painel.html';
                window.location.href = destino;
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            alternarEstadoBotao(btnSubmit, false);
        }
    });
}

function configurarCadastro() {
    const form = document.getElementById('cadastroForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = form.querySelector('button');
        
        const dadosCadastro = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            cpf_cnpj: document.getElementById('cpf_cnpj').value,
            telefone: document.getElementById('telefone').value,
            senha: document.getElementById('senha').value
        };

        alternarEstadoBotao(btnSubmit, true, 'Criando conta...');

        try {
            const response = await fetch(`${API_BASE_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCadastro)
            });

            const data = await response.json();

            if (data.success) {
                alert('Conta criada com sucesso! Redirecionando para o login...');
                window.location.href = 'index.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            alternarEstadoBotao(btnSubmit, false);
        }
    });
}

// MÁSCARAS DE INPUT

function configurarMascaras() {
    const inputCpf = document.getElementById('cpf_cnpj');
    const inputTel = document.getElementById('telefone');

    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, ''); // Remove letras
            
            if (x.length > 11) {
                // Máscara de CNPJ (00.000.000/0000-00)
                x = x.replace(/^(\d{2})(\d)/, '$1.$2');
                x = x.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                x = x.replace(/\.(\d{3})(\d)/, '.$1/$2');
                x = x.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                // Máscara de CPF (000.000.000-00)
                x = x.replace(/(\d{3})(\d)/, '$1.$2');
                x = x.replace(/(\d{3})(\d)/, '$1.$2');
                x = x.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = x;
        });
    }

    if (inputTel) {
        inputTel.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, ''); // Remove letras
            // Máscara Celular (00) 00000-0000
            x = x.replace(/^(\d{2})(\d)/g, '($1) $2');
            x = x.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = x;
        });
    }
}