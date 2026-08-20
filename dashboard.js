// =========================================================================
// MÓDULO ISOLADO: PAINEL DE CONTROLE (dashboard.js)
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Interceptador para recarregar os números sempre que você voltar para a aba Dashboard
    document.body.addEventListener('click', (e) => {
        const navItem = e.target.closest('a, button, li, .menu-item');
        if (navItem && navItem.innerText && navItem.innerText.trim().toLowerCase() === 'dashboard') {
            if (typeof window.renderDashboard === 'function') {
                window.renderDashboard();
            }
        }
    });
});

window.renderDashboard = function() {
    try {
        // 1. Busca os dados globais com proteção (fallback)
        const agenda = window.databaseAgenda || [];
        const motoristas = window.drivers || [];
        
        // Garante que usa o dia selecionado, ou o dia de hoje caso o sistema tenha acabado de ligar
        const diaAtual = window.selectedDay || new Date().toISOString().split('T')[0];

        // 2. Filtra as reservas da data selecionada usando a sua lógica original robusta
        const hoje = agenda.filter((item) => {
            const itemDia = String(item.dia || "").trim();
            const selDia = String(diaAtual).trim();
            const diaApenas = selDia.split("-")[2];
            
            return (
                itemDia === selDia ||
                itemDia.startsWith(selDia) || // Útil se o banco trouxer data e hora juntos
                itemDia === String(Number(diaApenas)) ||
                itemDia === diaApenas
            );
        });

        // 3. Captura os elementos do DOM
        const dashChegadas = document.getElementById("dash-chegadas-hoje");
        const dashPasseios = document.getElementById("dash-passeios-hoje");
        const dashDrivers = document.getElementById("dash-drivers-count");
        const dashFaturamento = document.getElementById("dash-faturamento");

        // 4. Cálculos Matemáticos
        const chegadasCount = hoje.filter((item) => {
            const tipo = String(item.tipo || "").toLowerCase();
            const loc = String(item.localizacao || item.local || "").toLowerCase();
            return (
                tipo.includes("transfer") ||
                tipo.includes("chegada") ||
                tipo.includes("translado") ||
                loc.includes("eze") ||
                loc.includes("aep") ||
                loc.includes("aeroporto") ||
                loc.includes("ezeiza")
            );
        }).length;

        const passeiosCount = hoje.filter((item) => {
            const tipo = String(item.tipo || "").toLowerCase();
            return tipo.includes("passeio") || tipo.includes("tango") || tipo.includes("tour") || tipo.includes("show");
        }).length;

        const faturamentoTotal = agenda.reduce((sum, item) => {
            return sum + (Number(item.valorCliente || item.valor_total) || 0);
        }, 0);

        // 5. Atualiza o visual da tela
        if (dashChegadas) dashChegadas.innerText = chegadasCount;
        if (dashPasseios) dashPasseios.innerText = passeiosCount;
        if (dashDrivers) dashDrivers.innerText = motoristas.length;
        if (dashFaturamento) {
            // Formatação monetária BRL nativa e profissional
            dashFaturamento.innerText = faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        // 6. Renderiza a lista de próximas atividades de hoje
        const container = document.getElementById("dashActivitiesContainer");
        if (!container) return;

        if (hoje.length === 0) {
            container.innerHTML = `<p class="text-xs text-gray-400 py-4 text-center italic">Nenhuma atividade programada para esta data.</p>`;
            return;
        }

        // Utiliza a sua Factory (gerarCardAtividade) se ela existir, ou um fallback visual seguro
        if (typeof window.gerarCardAtividade === 'function' || typeof gerarCardAtividade === 'function') {
            const factory = window.gerarCardAtividade || gerarCardAtividade;
            container.innerHTML = hoje.map((item) => factory(item)).join("");
        } else {
            console.warn("Aviso: Função gerarCardAtividade não encontrada. Usando modo de segurança.");
            container.innerHTML = hoje.map((item) => `
                <div class="p-3 bg-white border border-gray-100 rounded-xl mb-2 text-sm shadow-sm">
                    <strong class="text-blue-900">${item.hora || '--:--'}</strong> - ${item.cliente} <span class="text-gray-500 text-xs">(${item.tipo})</span>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Erro crônico ao renderizar Dashboard:", e);
    }
};