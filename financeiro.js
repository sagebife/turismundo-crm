// =========================================================================
// MÓDULO ISOLADO: FINANCEIRO E CAIXA (financeiro.js)
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Interceptador de clique: Recarrega o financeiro sempre que a aba for acessada
    document.body.addEventListener('click', (e) => {
        const navItem = e.target.closest('a, button, li, .menu-item');
        if (navItem && navItem.innerText && navItem.innerText.trim().toLowerCase() === 'financeiro') {
            if (typeof window.renderFinanceiro === 'function') {
                window.renderFinanceiro();
            }
        }
    });
});

// Utilitário interno de conversão de moedas
function extrairNumero(valor) {
    if (!valor) return 0;
    if (typeof valor === "number") return valor;
    let limpo = String(valor).replace(/R\$/gi, "").replace(/USD/gi, "").trim();
    if (limpo.includes(",")) {
        limpo = limpo.replace(/\./g, "").replace(",", ".");
    }
    return Number(limpo) || 0;
}

// 1. RENDERIZAR PAINEL FINANCEIRO
window.renderFinanceiro = async function() {
    const tableBody = document.getElementById("financeTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Calculando caixa...</td></tr>`;

    let totalFaturamento = 0;
    let totalRepasses = 0;
    let totalLucro = 0;
    let totalPendente = 0;

    try {
        let list = [];
        // Busca inteligente: Prioriza a nuvem, mas tem o fallback global
        if (window.isConnectedToSupabase && window.supabaseClient) {
            // CORREÇÃO: Buscando apenas as colunas que realmente existem no seu banco de dados
            let { data, error } = await window.supabaseClient
                .from("reservas")
                .select("*, clientes(nome, whatsapp), motoristas(nome, valor_combinado)");
            
            if (error) throw error;
            list = data || [];
        } else {
            list = window.databaseAgenda || [];
        }

        // Ordena da mais recente para a mais antiga
        list.sort((a, b) => String(b.dia || b.data || b.date || "").localeCompare(String(a.dia || a.data || a.date || "")));

        const linhasHTML = list.map((item) => {
            const rawValorCliente = item.valor_total || item.valorCliente || 0;
            const rawValorMotorista = item.valor_repasse_motorista || item.valorMotorista || 0;

            const valorCliente = extrairNumero(rawValorCliente);
            const valorMotorista = extrairNumero(rawValorMotorista);
            const lucro = valorCliente - valorMotorista;

            totalFaturamento += valorCliente;
            totalRepasses += valorMotorista;
            totalLucro += lucro;

            // Tratamento blindado de booleanos
            const isPagoCliente = item.pago_cliente === true || item.pago_cliente === "true" || item.pagoCliente === true;
            const isPagoMotorista = item.pago_motorista === true || item.pago_motorista === "true" || item.pagoMotorista === true;

            if (!isPagoCliente) {
                totalPendente += valorCliente;
            }

            // Formatação de data visual
            let dataFormatada = "--/--";
            const dataOriginal = item.dia || item.data || item.date;
            if (dataOriginal && dataOriginal.includes("-")) {
                const partes = dataOriginal.split("-");
                dataFormatada = `${partes[2]}/${partes[1]}`;
            } else {
                dataFormatada = dataOriginal || "--/--";
            }

            // Ícones dinâmicos
            const tipoServico = String(item.tipo || item.category || "").toLowerCase();
            let iconeServico = (tipoServico.includes("transfer") || tipoServico.includes("translado") || tipoServico.includes("chegada") || tipoServico.includes("eze"))
                ? "🚐 Transfer"
                : "📸 Passeio";

            // Nomes Reais (tratando o JOIN do banco de dados sem pedir colunas inexistentes)
            const nomeDoCliente = (item.clientes ? item.clientes.nome : null) || item.cliente || item.nome || "Cliente Sem Nome";
            const nomeDoMotorista = (item.motoristas ? item.motoristas.nome : null) || item.motorista || "Não alocado";

            // Botões de Status Dinâmicos
            const statusClienteBtn = isPagoCliente
                ? `<button onclick="toggleFinanceStatus('${item.id}', 'cliente')" class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] shadow-sm hover:bg-emerald-200 transition"><i class="fas fa-check-double mr-1"></i> Recebido</button>`
                : `<button onclick="toggleFinanceStatus('${item.id}', 'cliente')" class="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[10px] shadow-sm hover:bg-amber-200 transition"><i class="fas fa-clock mr-1"></i> Pendente</button>`;

            const statusMotoristaBtn = isPagoMotorista
                ? `<button onclick="toggleFinanceStatus('${item.id}', 'motorista')" class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] shadow-sm hover:bg-emerald-200 transition"><i class="fas fa-check-double mr-1"></i> Pago</button>`
                : `<button onclick="toggleFinanceStatus('${item.id}', 'motorista')" class="px-2 py-1 bg-red-100 text-red-800 rounded-lg font-bold text-[10px] shadow-sm hover:bg-red-200 transition"><i class="fas fa-hand-holding-usd mr-1"></i> A pagar</button>`;

            return `
            <tr class="hover:bg-gray-50/50 transition border-b border-gray-100/50">
                <td class="p-4 font-bold text-gray-900">
                    <div class="truncate max-w-[150px]" title="${nomeDoCliente}">${nomeDoCliente}</div>
                    <div class="text-[10px] text-gray-400 font-normal mt-0.5">${iconeServico} • Dia ${dataFormatada}</div>
                </td>
                <td class="p-4 font-medium text-gray-600 text-sm truncate max-w-[120px]" title="${nomeDoMotorista}">${nomeDoMotorista}</td>
                <td class="p-4 text-right font-bold text-blue-900">R$ ${valorCliente.toFixed(2)}</td>
                <td class="p-4 text-right font-bold text-red-600">R$ ${valorMotorista.toFixed(2)}</td>
                <td class="p-4 text-right font-black text-emerald-600">R$ ${lucro.toFixed(2)}</td>
                <td class="p-4 text-center">${statusClienteBtn}</td>
                <td class="p-4 text-center">${statusMotoristaBtn}</td>
            </tr>
            `;
        }).join("");

        tableBody.innerHTML = linhasHTML || `<tr><td colspan="7" class="text-center py-8 text-gray-500 text-sm">Nenhuma movimentação financeira encontrada.</td></tr>`;

        // Atualização dos Cards de Topo
        const formatadorBR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
        if (document.getElementById("fin-faturamento")) document.getElementById("fin-faturamento").innerText = formatadorBR.format(totalFaturamento);
        if (document.getElementById("fin-repasses")) document.getElementById("fin-repasses").innerText = formatadorBR.format(totalRepasses);
        if (document.getElementById("fin-lucro")) document.getElementById("fin-lucro").innerText = formatadorBR.format(totalLucro);
        if (document.getElementById("fin-pendente")) document.getElementById("fin-pendente").innerText = formatadorBR.format(totalPendente);

    } catch (error) {
        console.error("Erro ao carregar o Financeiro:", error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-red-500 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i> Erro ao carregar dados financeiros.</td></tr>`;
    }
};

// 2. FUNÇÃO UNIFICADA E BLINDADA DE ATUALIZAÇÃO DE STATUS
window.toggleFinanceStatus = async function(idReserva, target) {
    if (!idReserva) return;

    // Acha a reserva na memória global (se existir) para atualizar a tela instantaneamente
    if (window.databaseAgenda) {
        const index = window.databaseAgenda.findIndex((item) => String(item.id) === String(idReserva));
        if (index !== -1) {
            if (target === "cliente") {
                window.databaseAgenda[index].pago_cliente = !window.databaseAgenda[index].pago_cliente;
            } else {
                window.databaseAgenda[index].pago_motorista = !window.databaseAgenda[index].pago_motorista;
            }
        }
    }

    // Atualiza a tela AGORA (UX de alta performance)
    window.renderFinanceiro();

    let updateObject = {};
    if (target === "cliente") {
        updateObject = { pago_cliente: window.databaseAgenda.find(i => String(i.id) === String(idReserva))?.pago_cliente || false };
    } else {
        updateObject = { pago_motorista: window.databaseAgenda.find(i => String(i.id) === String(idReserva))?.pago_motorista || false };
    }

    // Sincroniza em segundo plano com o Supabase
    if (window.isConnectedToSupabase && window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from("reservas")
                .update(updateObject)
                .eq("id", idReserva);

            if (error) throw error;
            if (typeof window.showToast === 'function') window.showToast("Alteração salva na nuvem! 💸", false);
            
            // Força a atualização do Dashboard também, pois o Faturamento/Pendente mudou
            if (typeof window.renderDashboard === 'function') window.renderDashboard();

        } catch (err) {
            console.error("Erro ao atualizar finanças no Supabase: ", err);
            if (typeof window.showToast === 'function') window.showToast("Erro ao salvar. Tente novamente.", true);
            
            // Reverte a ação localmente em caso de erro na internet
            window.renderFinanceiro(); 
        }
    }
};