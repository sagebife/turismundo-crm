// =========================================================================
// MÓDULO ISOLADO: PAINEL DE CONTROLE (dashboard.js)
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Interceptador para recarregar os números sempre que você voltar para a aba Dashboard
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

window.renderDashboard = function () {
  try {
    const agenda = window.databaseAgenda || [];
    const motoristas = window.drivers || [];

    // 🔴 CORREÇÃO DO DASHBOARD: Ignora a data selecionada da agenda e força a leitura do dia de HOJE nativo
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const diaAtual = `${ano}-${mes}-${dia}`;

    const hoje = agenda.filter((item) => {
      const itemDia = String(item.dia || "").trim();
      const selDia = String(diaAtual).trim();
      const diaApenas = selDia.split("-")[2];

      return (
        itemDia === selDia ||
        itemDia.startsWith(selDia) ||
        itemDia === String(Number(diaApenas)) ||
        itemDia === diaApenas
      );
    });

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
      container.innerHTML = `<p class="text-xs text-gray-400 py-4 text-center italic">Nenhuma atividade programada para esta data.</p>`;
      return;
    }

    if (
      typeof window.gerarCardAtividade === "function" ||
      typeof gerarCardAtividade === "function"
    ) {
      const factory = window.gerarCardAtividade || gerarCardAtividade;
      container.innerHTML = hoje.map((item) => factory(item)).join("");
    } else {
      container.innerHTML = hoje
        .map(
          (item) => `
                <div class="p-3 bg-white border border-gray-100 rounded-xl mb-2 text-sm shadow-sm">
                    <strong class="text-blue-900">${item.hora || "--:--"}</strong> - ${item.cliente} <span class="text-gray-500 text-xs">(${item.tipo})</span>
                </div>
            `,
        )
        .join("");
    }
  } catch (e) {
    console.error("Erro crônico ao renderizar Dashboard:", e);
  }
};
