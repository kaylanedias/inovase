// Configurações Globais e Constantes
const API_BASE_URL = "http://localhost:3000/api";
let salasCache = [];
let todasReservasCache = [];

document.addEventListener("DOMContentLoaded", () => {
    const usuario = verificarLogin();
    if (!usuario) return;

    configurarInterfaceUsuario(usuario);
    carregarDadosIniciais();
    configurarEventosGlobais();
    configurarFormularios(usuario);
});

// 1. SEGURANÇA E UTILITÁRIOS

function verificarLogin() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!usuario) {
        window.location.href = "index.html";
        return null;
    }

    if (usuario.nivel_acesso !== "admin") {
        alert("Acesso Negado: Apenas administradores podem acessar esta área.");
        window.location.href = "painel.html";
        return null;
    }
    return usuario;
}

function configurarInterfaceUsuario(usuario) {
    const nomeElement = document.getElementById("adminName");
    if (nomeElement) {
        nomeElement.innerText = usuario.nome.split(" ")[0];
    }
}

async function carregarDadosIniciais() {
    await Promise.all([carregarStats(), carregarSalasResumidas()]);
}

// 2. NAVEGAÇÃO ENTRE ABAS

const views = {
    dashboard: document.getElementById("viewDashboard"),
    salas: document.getElementById("viewSalas"),
    reservas: document.getElementById("viewReservas"),
    usuarios: document.getElementById("viewUsuarios"),
};

const menus = {
    dashboard: document.getElementById("menuDashboard"),
    salas: document.getElementById("menuSalas"),
    reservas: document.getElementById("menuReservas"),
    usuarios: document.getElementById("menuUsuarios"),
};

function alternarAbaAdmin(abaAlvo) {
    Object.values(views).forEach((el) => el && (el.style.display = "none"));
    Object.values(menus).forEach((el) => el && el.classList.remove("active"));

    if (views[abaAlvo]) views[abaAlvo].style.display = "block";
    if (menus[abaAlvo]) menus[abaAlvo].classList.add("active");

    switch (abaAlvo) {
        case "dashboard":
            carregarStats();
            carregarSalasResumidas();
            break;
        case "salas":
            carregarTabelaCompleta();
            break;
        case "reservas":
            carregarReservasGeral();
            break;
        case "usuarios":
            carregarDadosPerfil();
            break;
    }
}

function configurarEventosGlobais() {
    Object.keys(menus).forEach((key) => {
        if (menus[key]) {
            menus[key].addEventListener("click", (e) => {
                e.preventDefault();
                alternarAbaAdmin(key);
            });
        }
    });

    const btnVerTodas = document.getElementById("btnVerTodas");
    if (btnVerTodas) {
        btnVerTodas.addEventListener("click", (e) => {
            e.preventDefault();
            alternarAbaAdmin("salas");
        });
    }

    const filtrosIds = ["filtroData", "filtroStatus", "filtroSala"];
    filtrosIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", aplicarFiltrosReservas);
    });

    const btnLimpar = document.getElementById("btnLimparFiltros");
    if (btnLimpar) {
        btnLimpar.addEventListener("click", () => {
            
            document.getElementById("filtroData").value = "";
            document.getElementById("filtroStatus").value = "";
            document.getElementById("filtroSala").value = "";

            aplicarFiltrosReservas();
        });
    }
}

// 3. GERENCIAMENTO DE SALAS (LISTAGEM, CADASTRO, EDIÇÃO)

async function carregarSalasResumidas() {
    const listaElement = document.getElementById("listaSalasResumida");

    try {
        const response = await fetch(`${API_BASE_URL}/espacos`);
        const data = await response.json();

        if (data.success) {
            listaElement.innerHTML = "";
            salasCache = data.espacos;

            if (data.espacos.length === 0) {
                listaElement.innerHTML =
                    '<p style="padding:10px; color:#666;">Nenhuma sala cadastrada.</p>';
                return;
            }

            const ultimasSalas = data.espacos.slice(-8).reverse();

            ultimasSalas.forEach((sala) => {
                const tipoFormatado = formatarTipoSala(sala.tipo);
                const html = `
                        <div class="item-sala" onclick="abrirModalDetalhes(${sala.id
                    })">
                            <img src="${sala.imagem_url}" alt="Foto">
                            <div class="item-info">
                                <h4>${sala.nome}</h4>
                                <span>${tipoFormatado} • Cap: ${sala.capacidade
                    }</span>
                            </div>
                            <div class="item-price">
                                ${formatarMoeda(sala.preco_hora)}/h
                            </div>
                        </div>
                    `;
                listaElement.innerHTML += html;
            });
        }
    } catch (error) {
        console.error("Erro:", error);
        listaElement.innerHTML = '<p style="color:red">Erro ao carregar lista.</p>';
    }
}

async function carregarTabelaCompleta() {
    const tbody = document.getElementById("tabelaSalasCompleta");

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7">Carregando dados...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/espacos`);
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = "";
            salasCache = data.espacos;

            if (data.espacos.length === 0) {
                tbody.innerHTML =
                    '<tr><td colspan="7">Nenhuma sala encontrada.</td></tr>';
                return;
            }

            data.espacos.forEach((sala) => {
                const tipoFormatado = formatarTipoSala(sala.tipo);

                const descSafe = sala.descricao
                    ? sala.descricao.replace(/'/g, "\\'")
                    : "";

                const html = `
                        <tr onclick="abrirModalDetalhes(${sala.id})">
                            <td>#${sala.id}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${sala.imagem_url
                    }" style="width:35px; height:35px; border-radius:5px; object-fit:cover;">
                                    <strong>${sala.nome}</strong>
                                </div>
                            </td>
                            <td>${tipoFormatado}</td>
                            <td>${sala.capacidade} pessoas</td>
                            <td style="color:var(--primary-color); font-weight:bold;">${formatarMoeda(
                        sala.preco_hora
                    )}</td>
                            <td><span class="status-badge status-confirmada">ATIVO</span></td>
                            <td>
                                <button class="btn-icon" title="Editar" 
                                    onclick="event.stopPropagation(); prepararEdicao('${sala.id
                    }', '${sala.nome}', '${sala.tipo}', '${sala.capacidade
                    }', '${sala.preco_hora}', '${sala.imagem_url}', '${descSafe}')">
                                    <span class="material-icons-outlined">edit</span>
                                </button>
                                
                                <button class="btn-icon" style="color:#ff5252;" title="Excluir" 
                                    onclick="event.stopPropagation(); deletarSala(${sala.id
                    })">
                                    <span class="material-icons-outlined">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
                tbody.innerHTML += html;
            });
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML =
            '<tr><td colspan="7">Erro ao carregar dados. Verifique o servidor.</td></tr>';
    }
}

window.deletarSala = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta sala permanentemente?"))
        return;

    try {
        const response = await fetch(`${API_BASE_URL}/espacos/${id}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            carregarTabelaCompleta();
            carregarStats();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao tentar excluir.");
    }
};

window.prepararEdicao = (id, nome, tipo, cap, preco, img, descricao) => {
    alternarAbaAdmin("dashboard");

    setVal("editId", id);
    setVal("salaNome", nome);
    setVal("salaTipo", tipo);
    setVal("salaCapacidade", cap);
    setVal("salaPreco", preco);
    setVal("salaDescricao", descricao || "");
    setVal("imgAntiga", img);
    setVal("salaImagemFile", "");

    const preview = document.getElementById("imgPreview");
    const previewContainer = document.getElementById("previewContainer");
    if (preview && previewContainer) {
        preview.src = img;
        previewContainer.style.display = "block";
    }

    const btn = document.querySelector('#formSala button[type="submit"]');
    if (btn) {
        btn.innerText = "Atualizar Espaço";
        btn.style.backgroundColor = "#ff9800";
    }

    document.getElementById("salaNome").focus();
};

// 4. ESTATÍSTICAS (DASHBOARD)

async function carregarStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        const data = await response.json();

        if (data.success) {
            setText("statSalasAtivas", data.salasAtivas);
            setText("statReservasHoje", data.reservasHoje);
            setText("statTotalReservas", data.totalReservas);
            setText("statReceita", formatarMoeda(data.receitaMensal));
        }
    } catch (error) {
        console.error("Erro ao carregar stats:", error);
    }
}

// 5. RESERVAS (LISTAGEM E FILTROS)

async function carregarReservasGeral() {
    const tbody = document.getElementById("tabelaReservasGeral");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7">Carregando reservas...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/reservas`);
        const data = await response.json();

        if (data.success) {
            todasReservasCache = data.reservas;
            preencherDropdownSalas(todasReservasCache);
            aplicarFiltrosReservas();
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar.</td></tr>';
    }
}

function preencherDropdownSalas(reservas) {
    const select = document.getElementById("filtroSala");
    if (!select) return;

    select.innerHTML = '<option value="">Todas as Salas</option>';
    const salasUnicas = [...new Set(reservas.map((r) => r.nome_espaco))];

    salasUnicas.forEach((nomeSala) => {
        const option = document.createElement("option");
        option.value = nomeSala;
        option.innerText = nomeSala;
        select.appendChild(option);
    });
}

function aplicarFiltrosReservas() {
    const dataFiltro = document.getElementById("filtroData").value;
    const statusFiltro = document.getElementById("filtroStatus").value;
    const salaFiltro = document.getElementById("filtroSala").value;

    const filtrados = todasReservasCache.filter(r => {
        const dataR = r.data_reserva.substring(0, 10);
        const matchData = dataFiltro ? dataR === dataFiltro : true;
        const matchStatus = statusFiltro ? r.status === statusFiltro : true;
        const matchSala = salaFiltro ? r.nome_espaco === salaFiltro : true;

        return matchData && matchStatus && matchSala;
    });

    renderizarTabelaReservas(filtrados);
}

function renderizarTabelaReservas(lista) {
    const tbody = document.getElementById("tabelaReservasGeral");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center; padding: 20px;">Nenhuma reserva encontrada.</td></tr>';
        return;
    }

    lista.forEach((res) => {
        const dataFormatada = new Date(res.data_reserva).toLocaleDateString(
            "pt-BR"
        );
        const horario = `${res.horario_inicio.slice(
            0,
            5
        )} - ${res.horario_fim.slice(0, 5)}`;

        let statusClass =
            res.status === "cancelada" ? "status-cancelada" : "status-confirmada";
        let statusTexto = res.status === "cancelada" ? "Cancelada" : "Confirmada";

        let htmlBotoes = "";

        if (res.status === "confirmada") {
            htmlBotoes += `
            <button onclick="cancelarReservaAdmin(${res.id})" class="btn-icon" title="Cancelar Reserva" style="color: var(--warning-color)">
                <span class="material-icons-outlined">block</span>
            </button>
        `;
        }

        htmlBotoes += `
            <button onclick="deletarReservaAdmin(${res.id})" class="btn-icon" title="Excluir do Banco" style="color: var(--danger-color)">
                <span class="material-icons-outlined">delete</span>
            </button>
        `;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${res.id}</td>
            <td>
                <div style="font-weight:bold;">${res.nome_usuario || "Cliente"
            }</div>
                <div style="font-size:0.8rem; color:var(--text-secondary)">${res.email_usuario || ""
            }</div>
            </td>
            <td>${res.nome_espaco || "Sala"}</td>
            <td>${dataFormatada}</td>
            <td>${horario}</td>
            <td><span class="status-badge ${statusClass}">${statusTexto}</span></td>
            <td>
                <div style="display:flex; gap: 5px;">
                    <button onclick="abrirModalReserva(${res.id
            })" class="btn-icon" title="Ver Detalhes">
                        <span class="material-icons-outlined">visibility</span>
                    </button>
                    ${htmlBotoes}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 6. MODAIS (DETALHES DE SALA E RESERVA)

// Detalhes da sala
window.abrirModalDetalhes = (id) => {
    const sala = salasCache.find((s) => s.id === id);
    if (!sala) return;

    document.getElementById("detalheImg").src = sala.imagem_url;
    setText("detalheNome", sala.nome);
    setText("detalheTipo", formatarTipoSala(sala.tipo));
    setText("detalheDescricao", sala.descricao || "Sem descrição disponível.");
    setText("detalheCapacidade", `${sala.capacidade} Pessoas`);
    setText("detalhePreco", formatarMoeda(sala.preco_hora));

    document.getElementById("modalDetalhesAdmin").classList.add("active");
};

window.fecharModalDetalhes = () => {
    document.getElementById("modalDetalhesAdmin").classList.remove("active");
};

// Detalhes da reserva
window.abrirModalReserva = (idReserva) => {
    const reserva = todasReservasCache.find(r => r.id === idReserva);
    if (!reserva) return;

    setText('resDetalheId', `#${reserva.id}`);
    setText('resDetalheCliente', reserva.nome_usuario);
    setText('resDetalheEmail', reserva.email);
    setText('resDetalheTelefone', reserva.telefone || 'Não informado');
    setText('resDetalheDoc', reserva.cpf_cnpj || 'Não informado');
    setText('resDetalheEspaco', reserva.nome_espaco);
    
    const imgEl = document.getElementById('resDetalheImg');
    if(imgEl) imgEl.src = reserva.imagem_url;
    
    setText('resDetalheData', new Date(reserva.data_reserva).toLocaleDateString('pt-BR'));

    const inicio = reserva.horario_inicio.slice(0, 5);
    const fim = reserva.horario_fim.slice(0, 5);
    setText('resDetalheHorario', `${inicio} às ${fim}`);

    const elExtras = document.getElementById('resDetalheExtras');
    if (elExtras) {
        elExtras.innerText = reserva.nomes_adicionais || "Nenhum item adicional.";
        elExtras.style.color = reserva.nomes_adicionais ? "#fff" : "#666";
    }

    const hInicio = parseInt(inicio.split(':')[0]) + (parseInt(inicio.split(':')[1]) / 60);
    const hFim = parseInt(fim.split(':')[0]) + (parseInt(fim.split(':')[1]) / 60);
    const duracao = hFim - hInicio;
    
    const valorSala = duracao * parseFloat(reserva.preco_hora);
    const valorExtras = parseFloat(reserva.total_adicionais || 0);
    const totalGeral = valorSala + valorExtras;

    setText('resDetalheTotal', formatarMoeda(totalGeral));

    // 4. Status e Cores
    const badge = document.getElementById('resDetalheStatus');
    badge.innerText = reserva.status.toUpperCase();
    badge.className = `status-badge ${reserva.status === 'cancelada' ? 'status-cancelada' : 'status-confirmada'}`;

    document.getElementById('modalReservaAdmin').classList.add('active');
};

window.fecharModalReserva = () => {
    document.getElementById("modalReservaAdmin").classList.remove("active");
};

["modalDetalhesAdmin", "modalReservaAdmin"].forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("active");
        });
    }
});

// 7. PERFIL DO USUÁRIO

window.carregarDadosPerfil = () => {
    const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (usuarioAtual) {
        setVal("perfilNome", usuarioAtual.nome);
        setVal("perfilEmail", usuarioAtual.email);
        setVal("perfilTelefone", usuarioAtual.telefone || "");
        setVal("perfilDoc", usuarioAtual.cpf_cnpj || "");
    }
};

// 8. CONFIGURAÇÃO DE FORMULÁRIOS

function configurarFormularios(usuario) {
    // Formulário de Sala (Cadastro/Edição)
    const formSala = document.getElementById("formSala");
    if (formSala) {
        formSala.addEventListener("submit", async (e) => {
            e.preventDefault();

            const editId = getVal("editId");
            const isEdicao = !!editId;

            const formData = new FormData();
            formData.append("usuario_id", usuario.id);
            formData.append("nome", getVal("salaNome"));
            formData.append("descricao", getVal("salaDescricao"));
            formData.append("tipo", getVal("salaTipo"));
            formData.append("capacidade", getVal("salaCapacidade"));
            formData.append("preco_hora", getVal("salaPreco"));

            const fileInput = document.getElementById("salaImagemFile");
            if (fileInput.files.length > 0) {
                formData.append("imagem", fileInput.files[0]);
            } else {
                formData.append("imagem_antiga", getVal("imgAntiga"));
            }

            const url = isEdicao
                ? `${API_BASE_URL}/espacos/${editId}`
                : `${API_BASE_URL}/espacos`;
            const method = isEdicao ? "PUT" : "POST";

            try {
                const response = await fetch(url, { method: method, body: formData });
                const resultado = await response.json();

                if (resultado.success) {
                    alert(
                        isEdicao ? "Atualizado com sucesso!" : "Cadastrado com sucesso!"
                    );
                    resetFormSala(formSala);
                    carregarSalasResumidas();
                } else {
                    alert("Erro: " + resultado.message);
                }
            } catch (error) {
                console.error(error);
                alert("Erro de conexão.");
            }
        });
    }

    // Formulário de Perfil
    const formPerfil = document.getElementById("formPerfil");
    if (formPerfil) {
        formPerfil.addEventListener("submit", async (e) => {
            e.preventDefault();

            const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado"));
            const btn = formPerfil.querySelector("button");
            const textoOriginal = btn.innerText;

            btn.innerText = "Salvando...";
            btn.disabled = true;

            const dadosAtualizados = {
                nome: getVal("perfilNome"),
                email: getVal("perfilEmail"),
                telefone: getVal("perfilTelefone"),
                cpf_cnpj: getVal("perfilDoc"),
            };

            try {
                const response = await fetch(
                    `${API_BASE_URL}/usuarios/${usuarioAtual.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dadosAtualizados),
                    }
                );
                const data = await response.json();

                if (data.success) {
                    alert("Perfil atualizado com sucesso!");
                    const novoUsuario = { ...usuarioAtual, ...data.user };
                    localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));
                    document.getElementById("adminName").innerText =
                        novoUsuario.nome.split(" ")[0];
                } else {
                    alert("Erro: " + data.message);
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
}

function resetFormSala(form) {
    form.reset();
    setVal("editId", "");
    setVal("imgAntiga", "");
    const preview = document.getElementById("previewContainer");
    if (preview) preview.style.display = "none";

    const btn = form.querySelector("button");
    btn.innerText = "Salvar Espaço";
    btn.style.backgroundColor = "";
}

// 9. CANCELAR RESERVA
window.cancelarReservaAdmin = async (id) => {
    if (!confirm("Tem certeza que deseja mudar o status desta reserva para CANCELADA?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reservas/${id}/cancelar`, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();

        if (data.success) {
            alert("Sucesso: Reserva cancelada!");
            carregarReservasGeral(); 
            carregarStats();
        } else {
            alert("Erro: " + data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão com o servidor.");
    }
};

// 10. DELETAR RESERVA
window.deletarReservaAdmin = async (id) => {
    if (
        confirm(
            "ATENÇÃO: Isso apagará o registro do banco de dados permanentemente.\n\nDeseja continuar?"
        )
    ) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (data.success) {
                alert("Registro apagado.");
                carregarReservasGeral();
                carregarStats();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        }
    }
};

// 11. FUNÇÕES UTILITÁRIAS

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function formatarMoeda(valor) {
    return parseFloat(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatarTipoSala(tipo) {
    return tipo.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
