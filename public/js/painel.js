const API_BASE_URL = "http://localhost:3000/api";
let usuarioLogado = null;
let minhasReservasCache = [];
let reservaEmEdicaoId = null;
let espacosCache = [];
let cacheAdicionais = [];


document.addEventListener("DOMContentLoaded", () => {
    if (!verificarLogin()) return;

    atualizarSaudacao();
    configurarNavegacao();
    configurarModalReserva();
    configurarFormularioPerfil();
    configurarCalculadoraEmTempoReal();

    carregarEspacos();
});

// 1. SEGURANÇA E UTILITÁRIOS
function verificarLogin() {
    const dados = localStorage.getItem("usuarioLogado");
    if (!dados) {
        window.location.href = "index.html";
        return false;
    }
    usuarioLogado = JSON.parse(dados);
    return true;
}

function atualizarSaudacao() {
    const el = document.getElementById("userGreeting");
    if (el) el.innerText = `Olá, ${usuarioLogado.nome.split(" ")[0]}!`;
}

function formatarMoeda(valor) {
    return parseFloat(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

// 2. NAVEGAÇÃO
function configurarNavegacao() {
    const menus = {
        explorar: document.getElementById("menuExplorar"),
        reservas: document.getElementById("menuReservas"),
        usuarios: document.getElementById("menuUsuarios"),
    };
    const views = {
        explorar: document.getElementById("viewExplorar"),
        reservas: document.getElementById("viewReservas"),
        usuarios: document.getElementById("viewUsuarios"),
    };

    function alternarAba(abaAlvo) {
        Object.values(menus).forEach((el) => el && el.classList.remove("active"));
        Object.values(views).forEach((el) => el && (el.style.display = "none"));
        if (menus[abaAlvo]) menus[abaAlvo].classList.add("active");
        if (views[abaAlvo]) views[abaAlvo].style.display = "block";

        if (abaAlvo === "explorar") carregarEspacos();
        if (abaAlvo === "reservas") carregarMinhasReservas();
        if (abaAlvo === "usuarios") carregarDadosPerfil();
    }

    if (menus.explorar)
        menus.explorar.addEventListener("click", (e) => {
            e.preventDefault();
            alternarAba("explorar");
        });
    if (menus.reservas)
        menus.reservas.addEventListener("click", (e) => {
            e.preventDefault();
            alternarAba("reservas");
        });
    if (menus.usuarios)
        menus.usuarios.addEventListener("click", (e) => {
            e.preventDefault();
            alternarAba("usuarios");
        });
}

// 3. ESPAÇOS E RESERVAS

async function carregarEspacos() {
    const grid = document.getElementById('gridEspacos');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/espacos`);
        const data = await response.json();

        if (data.success) {
            espacosCache = data.espacos;
            renderizarGrid(espacosCache);
        } else {
            grid.innerHTML = '<p>Não foi possível carregar os espaços.</p>';
        }
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p>Erro de conexão ao carregar espaços.</p>';
    }
}

function aplicarFiltrosEspacos() {
    const termo = document.getElementById('filtroBuscaNome').value.toLowerCase();
    const tipo = document.getElementById('filtroBuscaTipo').value;

    const filtrados = espacosCache.filter(sala => {
        const matchNome = sala.nome.toLowerCase().includes(termo);
        const matchTipo = tipo ? sala.tipo === tipo : true;

        return matchNome && matchTipo;
    });

    renderizarGrid(filtrados);
}

function renderizarGrid(lista) {
    const grid = document.getElementById('gridEspacos');
    grid.innerHTML = '';

    if (lista.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">Nenhuma sala encontrada com esses filtros.</p>';
        return;
    }

    lista.forEach(sala => {
        const tipoFormatado = sala.tipo.replace('_', ' ');
        const descricaoSafe = sala.descricao ? sala.descricao.replace(/"/g, '&quot;') : 'Sem descrição.';

        const html = `
            <div class="card-sala-user js-abrir-modal"
                data-id="${sala.id}" 
                data-nome="${sala.nome}" 
                data-preco="${sala.preco_hora}" 
                data-img="${sala.imagem_url}"
                data-descricao="${descricaoSafe}">
                
                <img src="${sala.imagem_url}" class="card-img-top" alt="${sala.nome}">
                <div class="card-body-user">
                    <h4>${sala.nome}</h4>
                    <p style="text-transform: capitalize;">${tipoFormatado} • Cap: ${sala.capacidade}</p>
                    <div class="card-footer-user">
                        <span class="price-tag">${formatarMoeda(sala.preco_hora)}/h</span>
                        <button class="btn-small" style="pointer-events: none;">Reservar</button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });

    document.querySelectorAll('.js-abrir-modal').forEach(card => {
        card.addEventListener('click', () => abrirModalReserva(card.dataset));
    });
}

async function carregarMinhasReservas() {
    const tbody = document.getElementById("listaMinhasReservas");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';

    try {
        const response = await fetch(
            `${API_BASE_URL}/reservas/${usuarioLogado.id}`
        );
        const data = await response.json();

        if (data.success) {
            minhasReservasCache = data.reservas;
            preencherFiltroSalasUser(minhasReservasCache);
            aplicarFiltrosUser();
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML =
            '<tr><td colspan="6" style="color:red;">Erro ao buscar histórico.</td></tr>';
    }
}

function preencherFiltroSalasUser(reservas) {
    const select = document.getElementById("filtroSalaUser");
    if (!select) return;
    select.innerHTML = '<option value="">Todas as Salas</option>';
    const salasUnicas = [...new Set(reservas.map((r) => r.nome_espaco))];
    salasUnicas.forEach((nome) => {
        const opt = document.createElement("option");
        opt.value = nome;
        opt.innerText = nome;
        select.appendChild(opt);
    });
}

function aplicarFiltrosUser() {
    const dataFiltro = document.getElementById("filtroDataUser").value;
    const statusFiltro = document.getElementById("filtroStatusUser").value;
    const salaFiltro = document.getElementById("filtroSalaUser").value;

    const filtradas = minhasReservasCache.filter((r) => {
        const dataR = r.data_reserva.substring(0, 10);
        return (
            (dataFiltro ? dataR === dataFiltro : true) &&
            (statusFiltro ? r.status === statusFiltro : true) &&
            (salaFiltro ? r.nome_espaco === salaFiltro : true)
        );
    });

    renderizarTabelaUser(filtradas);
}

["filtroDataUser", "filtroStatusUser", "filtroSalaUser"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", aplicarFiltrosUser);
});

window.limparFiltrosUser = () => {
    document.getElementById("filtroDataUser").value = "";
    document.getElementById("filtroStatusUser").value = "";
    document.getElementById("filtroSalaUser").value = "";
    aplicarFiltrosUser();
};

function renderizarTabelaUser(lista) {
    const tbody = document.getElementById("listaMinhasReservas");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Nenhuma reserva encontrada.</td></tr>';
        return;
    }

    lista.forEach((reserva) => {
        const dataFormatada = new Date(reserva.data_reserva).toLocaleDateString("pt-BR");
        const inicio = reserva.horario_inicio.slice(0, 5);
        const fim = reserva.horario_fim.slice(0, 5);

        const hInicio = parseInt(inicio.split(":")[0]) + parseInt(inicio.split(":")[1]) / 60;
        const hFim = parseInt(fim.split(":")[0]) + parseInt(fim.split(":")[1]) / 60;
        const precoHoras = (hFim - hInicio) * parseFloat(reserva.preco_hora);

        const precoAdicionais = parseFloat(reserva.total_adicionais || 0);
        
        const totalFinal = precoHoras + precoAdicionais;

        let botoes = "";
        let statusClass = `status-${reserva.status}`; 
        
        if (reserva.status !== "cancelada") {
            botoes = `
                <button class="btn-icon" title="Editar" onclick="event.stopPropagation(); prepararEdicaoReserva(${reserva.id})">
                    <span class="material-icons-outlined">edit</span>
                </button>
                <button class="btn-icon" style="color:#ff5252;" title="Cancelar" onclick="event.stopPropagation(); cancelarReservaUser(${reserva.id})">
                    <span class="material-icons-outlined">block</span>
                </button>
            `;
        } else {
            botoes = '<small class="text-secondary">Cancelada</small>';
        }

        botoes += `
            <button class="btn-icon" style="color:#9e9e9e;" title="Excluir Registro" onclick="event.stopPropagation(); deletarReservaUser(${reserva.id})">
                <span class="material-icons-outlined">delete</span>
            </button>
        `;

        const html = `
            <tr onclick="abrirModalDetalheReserva(${reserva.id})" title="Ver detalhes" style="cursor:pointer;">
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${reserva.imagem_url}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
                        <strong>${reserva.nome_espaco}</strong>
                    </div>
                </td>
                <td>${dataFormatada}</td>
                <td>${inicio} - ${fim}</td>
                <td style="font-weight:bold; color: var(--success-color);">
                    ${formatarMoeda(totalFinal)}
                </td>
                <td><span class="status-badge ${statusClass}">${reserva.status}</span></td>
                <td>${botoes}</td>
            </tr>
        `;
        tbody.innerHTML += html;
    });
}

async function carregarAdicionaisNoModal(idsPreSelecionados = []) {
    const container = document.getElementById('listaAdicionais');
    if(!container) return;

    try {
        if (cacheAdicionais.length === 0) {
            const res = await fetch(`${API_BASE_URL}/adicionais`);
            const data = await res.json();
            if (data.success) cacheAdicionais = data.adicionais;
        }

        container.innerHTML = '<p>Deseja adicionar algo?</p>';
        
        cacheAdicionais.forEach(item => {

            const isChecked = idsPreSelecionados.map(String).includes(String(item.id)) ? 'checked' : '';

            const div = document.createElement('div');
            div.innerHTML = `
                <label>
                    <input type="checkbox" class="chk-adicional" value="${item.id}" data-preco="${item.preco}" ${isChecked}>
                    <span>${item.nome}</span>
                    <strong>+${formatarMoeda(item.preco)}</strong>
                </label>
            `;
            container.appendChild(div);
        });

        document.querySelectorAll('.chk-adicional').forEach(chk => {
            chk.addEventListener('change', calcularTotalEmTempoReal);
        });

        calcularTotalEmTempoReal();

    } catch (error) {
        console.error('Erro ao carregar adicionais', error);
    }
}

const inputBusca = document.getElementById('filtroBuscaNome');
const selectTipo = document.getElementById('filtroBuscaTipo');

if (inputBusca) inputBusca.addEventListener('input', aplicarFiltrosEspacos);
if (selectTipo) selectTipo.addEventListener('change', aplicarFiltrosEspacos);

// 4. EDITAR, CANCELAR E DELETAR

// A. Cancelar
window.cancelarReservaUser = async (id) => {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reservas/${id}/cancelar`, {
            method: "PUT",
        });
        const data = await response.json();

        if (data.success) {
            alert("Reserva cancelada com sucesso.");
            carregarMinhasReservas();
        } else {
            alert("Erro: " + data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
};

// B. Editar
window.prepararEdicaoReserva = (idReserva) => {
    const reserva = minhasReservasCache.find((r) => r.id === idReserva);
    if (!reserva) return;

    reservaEmEdicaoId = idReserva;
    
    document.getElementById("modalTitulo").innerText = "Editar Reserva";
    const btnConfirmar = document.querySelector('#formReserva button[type="submit"]');
    btnConfirmar.innerText = "Atualizar Reserva";
    btnConfirmar.style.backgroundColor = "#ff9800"; 
    
    const salaOriginal = espacosCache.find(s => s.nome === reserva.nome_espaco);
    const idSala = salaOriginal ? salaOriginal.id : null;

    const dadosSala = {
        id: idSala,
        nome: reserva.nome_espaco,
        preco: reserva.preco_hora,
        img: reserva.imagem_url,
        descricao: reserva.descricao,
    };

    let idsParaMarcar = [];
    if (reserva.ids_adicionais) {
        idsParaMarcar = String(reserva.ids_adicionais).split(',');
    }

    abrirModalReserva(dadosSala, true, idsParaMarcar);

    document.getElementById("reservaData").value = reserva.data_reserva.substring(0, 10);
    document.getElementById("reservaInicio").value = reserva.horario_inicio.slice(0, 5);
    document.getElementById("reservaFim").value = reserva.horario_fim.slice(0, 5);
    
    if(idSala) document.getElementById("salaIdHidden").value = idSala;

    setTimeout(calcularTotalEmTempoReal, 200);
};

// C. Deletar
window.deletarReservaUser = async (idReserva) => {
    if (!confirm('Deseja remover esta reserva do seu histórico visual?')) return;

    const payload = { usuario_id: usuarioLogado.id };

    try {
        const response = await fetch(`${API_BASE_URL}/reservas/${idReserva}/esconder`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
            carregarMinhasReservas();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
};

// 5. MODAL DE RESERVA

function abrirModalReserva(dataset, isEdicao = false, idsExtras = []) {
    
    if (!isEdicao) {
        reservaEmEdicaoId = null;
        document.getElementById("modalTitulo").innerText = "Reservar Sala";
        const btn = document.querySelector('#formReserva button[type="submit"]');
        btn.innerText = "Confirmar Reserva";
        
        const hoje = new Date().toISOString().split("T")[0];
        document.getElementById("reservaData").value = hoje;
        document.getElementById("reservaInicio").value = "";
        document.getElementById("reservaFim").value = "";
    }

    if (dataset.id) document.getElementById("salaIdHidden").value = dataset.id;

    document.getElementById("salaPrecoRawHidden").value = dataset.preco;
    document.getElementById("modalNomeSala").innerText = dataset.nome;
    document.getElementById("modalDescricaoSala").innerText = dataset.descricao || "Detalhes...";
    document.getElementById("modalPrecoSala").innerText = formatarMoeda(dataset.preco) + " / hora";
    document.getElementById("modalImg").src = dataset.img;

    carregarAdicionaisNoModal(idsExtras);

    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("reservaData").min = hoje;

    calcularTotalEmTempoReal();
    document.getElementById("modalReserva").classList.add("active");
}

function calcularTotalEmTempoReal() {
    const inicio = document.getElementById("reservaInicio").value;
    const fim = document.getElementById("reservaFim").value;
    const precoHora = parseFloat(document.getElementById("salaPrecoRawHidden").value || 0);

    let totalAdicionais = 0;
    const checkboxes = document.querySelectorAll('.chk-adicional:checked');
    
    checkboxes.forEach(chk => {
        const valorItem = parseFloat(chk.getAttribute('data-preco') || 0);
        totalAdicionais += valorItem;
    });

    const elDuracao = document.getElementById("calcDuracao");
    const elTotal = document.getElementById("calcTotal");

    if (!inicio || !fim) {
        elDuracao.innerText = "0h 00m";
        elTotal.innerText = formatarMoeda(totalAdicionais);
        return;
    }

    const mInicio = parseInt(inicio.split(":")[0]) * 60 + parseInt(inicio.split(":")[1]);
    const mFim = parseInt(fim.split(":")[0]) * 60 + parseInt(fim.split(":")[1]);
    let diff = mFim - mInicio;

    if (diff <= 0) {
        elDuracao.innerText = "Horário inválido";
        elTotal.innerText = "---";
        return;
    }

    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    
    const precoSalaTotal = (diff / 60) * precoHora;
    
    const precoFinal = precoSalaTotal + totalAdicionais;

    elDuracao.innerText = `${horas}h ${minutos.toString().padStart(2, "0")}m`;
    elTotal.innerText = formatarMoeda(precoFinal);
}

function configurarCalculadoraEmTempoReal() {
    const i1 = document.getElementById("reservaInicio");
    const i2 = document.getElementById("reservaFim");
    if (i1 && i2) {
        i1.addEventListener("input", calcularTotalEmTempoReal);
        i2.addEventListener("input", calcularTotalEmTempoReal);
    }
}

function configurarModalReserva() {
    const modal = document.getElementById("modalReserva");
    const btnClose = document.querySelector(".close-modal");
    
    if (btnClose) btnClose.addEventListener("click", fecharModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharModal();
        });
    }

    const form = document.getElementById("formReserva");

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const btn = newForm.querySelector('button[type="submit"]');
        const textoOriginal = btn.innerText;
        const msgConflito = document.getElementById("msgConflito");

        if (document.getElementById('calcTotal').innerText === '---') {
            alert('Horários inválidos.');
            return;
        }

        const isEdicao = reservaEmEdicaoId !== null;
        
        const url = isEdicao 
            ? `${API_BASE_URL}/reservas/${reservaEmEdicaoId}` 
            : `${API_BASE_URL}/reservas`;
        
        const method = isEdicao ? "PUT" : "POST";

        console.log(`Enviando ${method} para ${url} (ID Edição: ${reservaEmEdicaoId})`);

        const itensAdicionais = Array.from(document.querySelectorAll('.chk-adicional:checked')).map(el => el.value);

        const espacoId = document.getElementById("salaIdHidden").value;

        const payload = {
            usuario_id: usuarioLogado.id,
            espaco_id: espacoId,
            data: document.getElementById("reservaData").value,
            inicio: document.getElementById("reservaInicio").value,
            fim: document.getElementById("reservaFim").value,
            itens_adicionais: itensAdicionais 
        };

        btn.innerText = "Processando...";
        btn.disabled = true;
        if(msgConflito) msgConflito.style.display = "none";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (result.success) {
                alert(isEdicao ? "Reserva atualizada com sucesso!" : "Reserva realizada com sucesso!");
                fecharModal();

                if (document.getElementById("viewReservas").style.display === "block") {
                    carregarMinhasReservas();
                } else {
                    document.getElementById("menuReservas").click();
                }
            } else {
                if(msgConflito) {
                    msgConflito.innerText = result.message;
                    msgConflito.style.display = "block";
                } else {
                    alert(result.message);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    });
}

function buscarIdSalaDaReserva(idReserva) {
    if (!idReserva) return null;
    const r = minhasReservasCache.find((x) => x.id === idReserva);
    return document.getElementById("salaIdHidden").value;
}

window.fecharModal = () => {
    document.getElementById("modalReserva").classList.remove("active");
    document.getElementById("msgConflito").style.display = "none";
};

// 6. MODAL DETALHE

window.abrirModalDetalheReserva = (id) => {
    const reserva = minhasReservasCache.find((r) => r.id === id);
    if (!reserva) return;

    document.getElementById("detId").innerText = `#${reserva.id}`;
    
    const badge = document.getElementById("detStatus");
    badge.innerText = reserva.status.toUpperCase();
    badge.className = `status-badge status-${reserva.status}`;

    document.getElementById("detNome").innerText = reserva.nome_espaco;
    document.getElementById("detImg").src = reserva.imagem_url;
    document.getElementById("detDesc").innerText = reserva.descricao || "Sem descrição";

    document.getElementById("detData").innerText = new Date(reserva.data_reserva).toLocaleDateString("pt-BR");
    
    const inicio = reserva.horario_inicio.slice(0, 5);
    const fim = reserva.horario_fim.slice(0, 5);
    document.getElementById("detHorario").innerText = `${inicio} - ${fim}`;

    const hInicio = parseInt(inicio.split(":")[0]) * 60 + parseInt(inicio.split(":")[1]);
    const hFim = parseInt(fim.split(":")[0]) * 60 + parseInt(fim.split(":")[1]);
    const diff = hFim - hInicio;
    
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    document.getElementById("detDuracao").innerText = `${horas}h ${minutos}m`;

    const elExtras = document.getElementById("detExtras");
    if (elExtras) {
        elExtras.innerText = reserva.nomes_adicionais || "Nenhum adicional selecionado.";
    }

    const precoSala = (diff / 60) * parseFloat(reserva.preco_hora);
    const precoExtras = parseFloat(reserva.total_adicionais || 0);
    
    const totalGeral = precoSala + precoExtras;

    document.getElementById("detTotal").innerText = formatarMoeda(totalGeral);

    document.getElementById("modalDetalheReserva").classList.add("active");
};

window.fecharModalDetalhe = () => {
    document.getElementById("modalDetalheReserva").classList.remove("active");
};
const modalDet = document.getElementById("modalDetalheReserva");
if (modalDet)
    modalDet.addEventListener("click", (e) => {
        if (e.target === modalDet) fecharModalDetalhe();
    });

// 7. PERFIL
function carregarDadosPerfil() {
    if (usuarioLogado) {
        document.getElementById("perfilNome").value = usuarioLogado.nome;
        document.getElementById("perfilEmail").value = usuarioLogado.email;
        document.getElementById("perfilTelefone").value =
            usuarioLogado.telefone || "";
        document.getElementById("perfilDoc").value = usuarioLogado.cpf_cnpj || "";
    }
}
function configurarFormularioPerfil() {
    const form = document.getElementById("formPerfil");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = form.querySelector("button");
        const textoOriginal = btn.innerText;
        btn.innerText = "Salvando...";
        btn.disabled = true;
        const dados = {
            nome: document.getElementById("perfilNome").value,
            email: document.getElementById("perfilEmail").value,
            telefone: document.getElementById("perfilTelefone").value,
            cpf_cnpj: document.getElementById("perfilDoc").value,
        };
        try {
            const response = await fetch(
                `${API_BASE_URL}/usuarios/${usuarioLogado.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dados),
                }
            );
            const data = await response.json();
            if (data.success) {
                alert("Perfil atualizado!");
                const novoUsuario = { ...usuarioLogado, ...data.user };
                localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));
                usuarioLogado = novoUsuario;
                actualizarSaudacao();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    });
}