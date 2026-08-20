// --- MÓDULO ISOLADO: AGENDA E RESERVAS (Supabase) ---

// Função blindada para pegar o dia de HOJE no fuso horário local correto
function getHojeLocal() {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

if (typeof window.selectedDay === 'undefined' || window.selectedDay === "undefined") {
    window.selectedDay = getHojeLocal();
}
if (typeof window.selectedCategory === 'undefined') {
    window.selectedCategory = 'todos';
}
if (typeof window.carrosselAnchorDate === 'undefined') {
    window.carrosselAnchorDate = new Date();
}

document.addEventListener('DOMContentLoaded', () => {
    gerarDiasAgenda();
    renderAgenda();
    
    // 1. Interceptador do Menu Principal: Reseta para HOJE ao clicar na aba Agenda
    document.body.addEventListener('click', (e) => {
        // Verifica se é um clique real do mouse (isTrusted = true)
        if (!e.isTrusted) return;

        // Procura se o clique foi em um item do menu principal de navegação que seja da "Agenda"
        const navItem = e.target.closest('a, button, li, .cursor-pointer');
        if (navItem && navItem.innerText && navItem.innerText.trim().toLowerCase() === 'agenda') {
            // Garante que não estamos clicando no título dentro da própria view
            if (!navItem.closest('#view-agenda') && !navItem.closest('.fixed')) {
                // Reseta a agenda para a data de hoje
                window.selectedDay = getHojeLocal();
                window.carrosselAnchorDate = new Date();
                
                gerarDiasAgenda();
                renderAgenda();
            }
        }
    });

    // 2. Interceptador genérico para outros calendários (garantia)
    document.body.addEventListener('click', (e) => {
        const calendarCell = e.target.closest('[data-date], [data-day], td[onclick], div[onclick*="selecionar"]');
        if (calendarCell && e.isTrusted) {
            let possibleDate = calendarCell.getAttribute('data-date') || calendarCell.getAttribute('data-day');
            if (possibleDate) {
                window.selectDay(possibleDate, true);
            }
        }
    });
});

function gerarDiasAgenda() {
    const containerDias = document.getElementById("containerDiasAgenda");
    if (!containerDias) return;
    containerDias.innerHTML = "";

    const baseDate = window.carrosselAnchorDate;

    const mesAnoLabel = document.getElementById("labelMesAnoAgenda");
    if (mesAnoLabel) {
        const optionsMes = { month: 'long', year: 'numeric' };
        const mesAnoFormatado = baseDate.toLocaleDateString('pt-BR', optionsMes);
        mesAnoLabel.innerText = mesAnoFormatado.charAt(0).toUpperCase() + mesAnoFormatado.slice(1);
    }

    for (let i = -3; i <= 3; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);

        const anoLoc = d.getFullYear();
        const mesLoc = String(d.getMonth() + 1).padStart(2, "0");
        const diaLoc = String(d.getDate()).padStart(2, "0");
        const diaStr = `${anoLoc}-${mesLoc}-${diaLoc}`;

        const diaNumero = d.getDate();
        const diaSemana = d
            .toLocaleDateString("pt-BR", { weekday: "short" })
            .replace(".", "");
        const isSelected = diaStr === window.selectedDay;

        containerDias.innerHTML += `
            <div data-date="${diaStr}" onclick="selectDay('${diaStr}', false)" class="day-btn cursor-pointer min-w-[65px] p-3 rounded-xl text-center transition ${isSelected ? "bg-blue-900 text-white shadow-md border border-blue-900" : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-100"}">
                <span class="block text-xs uppercase ${isSelected ? "text-blue-200" : "text-gray-500"}">${diaSemana}</span>
                <span class="text-lg font-bold ${isSelected ? "text-white" : "text-gray-800"}">${diaNumero}</span>
            </div>
        `;
    }
}

window.selectDay = function(diaStr, moverCarrossel = true) {
    window.selectedDay = diaStr;
    
    if (moverCarrossel) {
        window.carrosselAnchorDate = new Date(diaStr + 'T00:00:00');
    }

    gerarDiasAgenda();
    renderAgenda();
}

// O Sequestro Oficial da Função do Modal Mensal
window.verDetalhesDoDia = function(diaStr) {
    // A. Atualiza as variáveis
    window.selectDay(diaStr, true);

    // B. Muda de Tela
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.add('hidden');
    });
    const viewAgenda = document.getElementById('view-agenda');
    if (viewAgenda) {
        viewAgenda.classList.remove('hidden');
    }

    // C. Simula clique no Menu para ativar a barrinha visual (sem resetar a data graças ao isTrusted: false)
    const navLinks = document.querySelectorAll('nav a, nav button, header a, header button, .menu-item, [onclick*="agenda"]');
    navLinks.forEach(link => {
        if (link.innerText && link.innerText.trim().toLowerCase() === 'agenda') {
            link.click(); 
        }
    });

    // D. Fecha os modais
    const closeBtn = document.querySelector('[onclick*="fechar"], [onclick*="close"]');
    if (closeBtn) closeBtn.click();
    
    document.querySelectorAll('.fixed.z-50').forEach(modal => {
        if (!modal.classList.contains('hidden') && modal.innerHTML.includes('Calend')) {
            modal.classList.add('hidden');
        }
    });
};

window.selecionarDiaCalendario = function(diaStr) {
    window.verDetalhesDoDia(diaStr);
};

async function renderAgenda() {
    const currentDay = window.selectedDay;
    const currentCategory = window.selectedCategory;

    const titleEl = document.getElementById("tituloDiaSelecionado");
    if (titleEl && currentDay) {
        const [ano, mes, dia] = currentDay.split("-");
        const dataObj = new Date(ano, mes - 1, dia);
        const options = { weekday: "long", day: "numeric", month: "long" };
        const dataFormatada = dataObj.toLocaleDateString("pt-BR", options);
        const dataFormatadaCapitalizada =
            dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
        titleEl.innerText = `Agenda: ${dataFormatadaCapitalizada}`;
    }

    const container = document.getElementById("timelineContainer");
    if (!container) return;
    container.innerHTML =
        '<div class="text-center py-8 text-gray-500">Carregando agenda...</div>';

    try {
        let list = [];
        if (window.isConnectedToSupabase && window.supabaseClient) {
            let { data, error } = await window.supabaseClient.from("reservas").select(`
                *,
                clientes (
                    nome
                )
            `);
            if (error) throw error;

            list = (data || []).map((item) => ({
                ...item,
                cliente: item.nome || item.cliente || (item.clientes ? item.clientes.nome : null) || "Cliente sem nome",
            }));
        } else {
            list = window.databaseAgenda || [];
        }

        let dayList = list.filter((item) => {
            const dataItemFull = String(item.dia || "").trim();
            if (!dataItemFull) return false;
            const dataItem = dataItemFull.substring(0, 10);
            return dataItem === String(currentDay);
        });

        const totalTransfers = dayList.filter((i) => {
            const t = String(i.tipo || i.category || "").toLowerCase();
            return t.includes("transfer") || t.includes("translado");
        }).length;

        const totalPasseios = dayList.filter((i) => {
            const t = String(i.tipo || i.category || "").toLowerCase();
            return (
                t.includes("passeio") ||
                t.includes("tango") ||
                t.includes("tour") ||
                t.includes("show")
            );
        }).length;

        const countTodos = document.getElementById("count-todos");
        const countTransfers = document.getElementById("count-transfers");
        const countPasseios = document.getElementById("count-passeios");

        if (countTodos) countTodos.innerText = dayList.length;
        if (countTransfers) countTransfers.innerText = totalTransfers;
        if (countPasseios) countPasseios.innerText = totalPasseios;

        let displayList = dayList;
        if (currentCategory && currentCategory !== "todos") {
            displayList = dayList.filter((item) => {
                const t = String(item.tipo || item.category || "").toLowerCase();
                if (currentCategory === "transfer") {
                    return t.includes("transfer") || t.includes("translado");
                } else if (currentCategory === "passeio") {
                    return (
                        t.includes("passeio") ||
                        t.includes("tango") ||
                        t.includes("tour") ||
                        t.includes("show")
                    );
                }
                return t === currentCategory;
            });
        }

        displayList.sort((a, b) =>
            String(a.hora || "").localeCompare(String(b.hora || ""))
        );

        if (displayList.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p class="text-gray-500 mb-3">Nenhuma reserva ou passeio para este filtro (${currentDay}).</p>
                    <button onclick="openQuickAddModal()" class="text-blue-900 font-semibold text-sm hover:underline">+ Adicionar Agora</button>
                </div>`;
            return;
        }

        container.innerHTML = displayList
            .map((item) => {
                let statusBadge =
                    '<span class="bg-gray-50 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Pendente</span>';
                let borderStatusColor = "border-l-4 border-gray-300";
                let bgCardColor = "bg-white";

                const status = String(item.status || "").toLowerCase();
                const isTransfer =
                    String(item.tipo || "")
                        .toLowerCase()
                        .includes("transfer") ||
                    String(item.tipo || "")
                        .toLowerCase()
                        .includes("translado");

                if (
                    status.includes("concluido") ||
                    status.includes("concluído")
                ) {
                    statusBadge =
                        '<span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><i class="fas fa-check-double mr-1"></i>Concluído</span>';
                    borderStatusColor = "border-l-4 border-emerald-500";
                    bgCardColor = "bg-emerald-50/40";
                } else if (status.includes("aterrissou")) {
                    statusBadge =
                        '<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"><i class="fas fa-plane-arrival mr-1"></i>Aterrissou</span>';
                    borderStatusColor = "border-l-4 border-blue-500";
                } else if (status.includes("andamento")) {
                    statusBadge =
                        '<span class="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Em Andamento</span>';
                    borderStatusColor = "border-l-4 border-sky-500";
                } else if (status.includes("atrasado")) {
                    statusBadge =
                        '<span class="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Atrasado</span>';
                    borderStatusColor = "border-l-4 border-red-500";
                } else if (status.includes("confirmado")) {
                    statusBadge =
                        '<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Confirmado</span>';
                    borderStatusColor = "border-l-4 border-blue-900";
                }

                const nomeClienteFinal = item.cliente || "Cliente";

                return `
                <div onclick="openClientDossier('${item.cliente_id || ""}', '${nomeClienteFinal}', '${item.telefone || ""}', '')" class="w-full relative ${bgCardColor} p-4 sm:p-5 rounded-2xl ${borderStatusColor} shadow-sm border border-gray-100 mb-3 hover:shadow-md cursor-pointer transition group">
                    
                    <div class="flex items-center gap-3 w-full">
                        
                        <div class="text-center w-28 shrink-0 flex flex-col justify-center bg-white px-2 py-2 rounded-lg border border-gray-100 shadow-sm">
                            <span class="block text-sm font-black text-gray-900">${item.hora || "--:--"}</span>
                            <span class="text-[9px] font-bold text-gray-400 uppercase truncate w-full block mt-0.5" title="${item.tipo || "Serviço"}">${item.tipo || "Serviço"}</span>
                        </div>
                        
                        <div class="space-y-1 flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2 w-full">
                                <h4 class="font-extrabold text-gray-800 text-sm leading-none group-hover:text-blue-900 transition-colors truncate">
                                    ${nomeClienteFinal}
                                </h4>
                                <div class="shrink-0 mt-0.5">
                                    ${statusBadge}
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-600 font-medium flex items-center gap-1.5 truncate">
                                <i class="fas fa-map-marker-alt text-gray-400 shrink-0"></i> 
                                <span class="truncate">${item.localizacao || item.local || "Local não informado"}</span>
                            </p>
                            
                            <div class="mt-3 pt-2 border-t border-gray-100/60 flex flex-wrap items-center gap-2" onclick="event.stopPropagation()">
                                ${
                                    !status.includes("concluido")
                                        ? `
                                <button onclick="acaoRapidaReserva('${item.id}', 'Concluído')" class="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-gray-500 hover:text-emerald-600 rounded text-[10px] font-bold uppercase transition-colors shadow-sm">
                                    <i class="fas fa-check"></i> Finalizar
                                </button>`
                                        : ""
                                }
                                
                                ${
                                    isTransfer && !status.includes("concluido")
                                        ? `
                                <button onclick="alertaVooPousou('${item.id}', '${nomeClienteFinal}')" class="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-500 hover:text-blue-600 rounded text-[10px] font-bold uppercase transition-colors shadow-sm">
                                    <i class="fas fa-plane-arrival"></i> Pousou
                                </button>`
                                        : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>`;
            })
            .join("");
    } catch (err) {
        console.error("Erro ao renderizar agenda:", err);
        container.innerHTML =
            '<div class="text-center py-8 text-red-500">Erro ao carregar os serviços da agenda.</div>';
    }
}