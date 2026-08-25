// =========================================================================
// MÓDULO ISOLADO: PAINEL DE CONTROLE (dashboard.js) - Versão Sincronizada
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const navItem = e.target.closest("a, button, li, .menu-item");
    if (
      navItem &&
      navItem.innerText &&
      navItem.innerText.trim().toLowerCase() === "dashboard"
    ) {
      if (typeof window.renderDashboard === "function") {
        window.renderDashboard();
      }
    }
  });
});

window.renderDashboard = async function () {
  try {
    let agenda = window.databaseAgenda || [];

    // Se estiver conectado ao Supabase, busca sempre do banco para pegar o status mais atualizado
    if (window.isConnectedToSupabase && window.supabaseClient) {
      let { data, error } = await window.supabaseClient
        .from("reservas")
        .select(`*, clientes (nome)`);
      if (!error && data) {
        agenda = data.map((item) => ({
          ...item,
          cliente:
            item.nome ||
            item.cliente ||
            (item.clientes ? item.clientes.nome : null) ||
            "Cliente sem nome",
          status: item.status || "Pendente", // Garante o status real do banco
        }));
        window.databaseAgenda = agenda; // Atualiza a global
      }
    }

    // Pega a data de HOJE no formato YYYY-MM-DD local
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const diaAtual = `${ano}-${mes}-${dia}`;

    // Filtra as atividades de hoje de forma flexível (compara os 10 primeiros caracteres da data)
    const hoje = agenda.filter((item) => {
      const itemDia = String(item.dia || "")
        .trim()
        .substring(0, 10);
      return itemDia === diaAtual;
    });

    // 🔴 ORDENAÇÃO CRONOLÓGICA: Do mais cedo para o mais tarde
    hoje.sort((a, b) =>
      String(a.hora || "").localeCompare(String(b.hora || "")),
    );

    const motoristas = window.drivers || [];

    const dashChegadas = document.getElementById("dash-chegadas-hoje");
    const dashPasseios = document.getElementById("dash-passeios-hoje");
    const dashDrivers = document.getElementById("dash-drivers-count");
    const dashFaturamento = document.getElementById("dash-faturamento");

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
      return (
        tipo.includes("passeio") ||
        tipo.includes("tango") ||
        tipo.includes("tour") ||
        tipo.includes("show")
      );
    }).length;

    const faturamentoTotal = agenda.reduce((sum, item) => {
      return sum + (Number(item.valorCliente || item.valor_total) || 0);
    }, 0);

    if (dashChegadas) dashChegadas.innerText = chegadasCount;
    if (dashPasseios) dashPasseios.innerText = passeiosCount;
    if (dashDrivers) dashDrivers.innerText = motoristas.length;
    if (dashFaturamento) {
      dashFaturamento.innerText = faturamentoTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    const container = document.getElementById("dashActivitiesContainer");
    if (!container) return;

    if (hoje.length === 0) {
      container.innerHTML = `<p class="text-xs text-gray-400 py-4 text-center italic">Nenhuma atividade programada para hoje (${diaAtual}).</p>`;
      return;
    }

    // Usa exatamente a mesma fábrica de cards da Agenda para garantir o mesmo semáforo visual!
    if (
      typeof window.gerarCardAtividade === "function" ||
      typeof gerarCardAtividade === "function"
    ) {
      const factory = window.gerarCardAtividade || gerarCardAtividade;
      container.innerHTML = hoje.map((item) => factory(item, false)).join("");
    } else {
      container.innerHTML = hoje
        .map(
          (item) => `
                <div class="p-3 bg-white border border-gray-100 rounded-xl mb-2 text-sm shadow-sm flex items-center justify-between">
                    <div>
                        <strong class="text-blue-900">${item.hora || "--:--"}</strong> - ${item.cliente} 
                        <span class="text-gray-500 text-xs">(${item.tipo || "Serviço"})</span>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">${item.status || "Pendente"}</span>
                </div>
            `,
        )
        .join("");
    }
  } catch (e) {
    console.error("Erro crônico ao renderizar Dashboard:", e);
  }
};

// Executa o render logo que o arquivo carrega para garantir dados na tela
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.renderDashboard === "function") {
    window.renderDashboard();
  }
});
