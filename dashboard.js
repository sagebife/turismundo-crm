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

    // Se estiver conectado ao Supabase, busca sempre do banco
    if (window.isConnectedToSupabase && window.supabaseClient) {
      let { data, error } = await window.supabaseClient.from("reservas")
        .select(`
          *,
          clientes (
            nome,
            whatsapp
          )
        `);
      if (!error && data) {
        agenda = data.map((item) => ({
          ...item,
          cliente:
            item.nome ||
            item.cliente ||
            (item.clientes ? item.clientes.nome : null) ||
            "Cliente sem nome",
          telefone:
            item.telefone ||
            (item.clientes ? item.clientes.whatsapp : null) ||
            "",
          status: item.status || "Pendente",
        }));
        window.databaseAgenda = agenda;
      }
    }

    // Pega a data de HOJE no formato YYYY-MM-DD local
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const diaAtual = `${ano}-${mes}-${dia}`;

    // Filtra as atividades de hoje
    const hoje = agenda.filter((item) => {
      const itemDia = String(item.dia || "")
        .trim()
        .substring(0, 10);
      return itemDia === diaAtual;
    });

    // ORDENAÇÃO INTELIGENTE
    hoje.sort((a, b) => {
      const getStatusScore = (item) => {
        const s = String(item.status || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (
          s.includes("concluido") ||
          s.includes("executado") ||
          s.includes("finalizado") ||
          s.includes("declinado") ||
          s.includes("cancelado")
        ) {
          return 1;
        }
        return 0;
      };
      const scoreA = getStatusScore(a);
      const scoreB = getStatusScore(b);
      if (scoreA === scoreB) {
        return String(a.hora || "").localeCompare(String(b.hora || ""));
      }
      return scoreA - scoreB;
    });

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

    const faturamentoTotal = agenda.reduce(
      (sum, item) => sum + (Number(item.valorCliente || item.valor_total) || 0),
      0,
    );

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

    // 🔥 AQUI ESTÁ O SEGREDO: REMOVEMOS O IF/ELSE QUE BUSCAVA A FUNÇÃO VELHA 🔥
    // O sistema é obrigado a usar esse layout novo, blindado e completo.
    container.innerHTML = hoje
      .map((item) => {
        // Extrator de Serviço Blindado (Igual à Agenda)
        let categoriaExibida = "TRANSLADOS AEP";
        let servicoExibido =
          item.servico || item.localizacao || "Serviço Padrão";

        if (servicoExibido.includes("Hotel/Endereço:")) {
          servicoExibido = item.localizacao || "Translado Regular";
        }

        if (servicoExibido.includes(" - ")) {
          const partes = servicoExibido.split(" - ");
          categoriaExibida = partes[0].trim().toUpperCase();
          servicoExibido = partes.slice(1).join(" - ").trim();
        }

        const tipoBanco = String(item.tipo || "").trim();
        if (
          tipoBanco &&
          tipoBanco.toLowerCase() !== "geral" &&
          tipoBanco.toLowerCase() !== "translado"
        ) {
          categoriaExibida = tipoBanco.toUpperCase();
        }

        // Estilização dinâmica do status e da BORDA DO CARD
        const statusStr = String(item.status || "Pendente")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        let dotColor = "bg-amber-400";
        let badgeBorderColor = "border-amber-400 text-amber-800 bg-amber-50";
        let cardBorderColor = "border-amber-400"; // <--- Borda amarela para pendente

        if (
          statusStr.includes("concluido") ||
          statusStr.includes("finalizado")
        ) {
          dotColor = "bg-emerald-500";
          badgeBorderColor =
            "border-emerald-300 text-emerald-800 bg-emerald-50";
          cardBorderColor = "border-emerald-400"; // <--- Borda verde para concluído
        } else if (
          statusStr.includes("declinado") ||
          statusStr.includes("cancelado")
        ) {
          dotColor = "bg-red-500";
          badgeBorderColor = "border-red-300 text-red-800 bg-red-50";
          cardBorderColor = "border-red-400"; // <--- Borda vermelha para declinado
        }

        return `
          <div class="p-3.5 bg-white border ${cardBorderColor} rounded-xl mb-3 shadow-sm hover:shadow-md transition">
              <div class="flex items-start justify-between">
                  
                  <div class="flex-1 min-w-0 pr-2 space-y-1.5">
                      <!-- Hora e Nome -->
                      <div class="flex items-center gap-2">
                          <span class="text-blue-900 font-black text-sm shrink-0">${item.hora || "--:--"}</span>
                          <span class="font-extrabold text-gray-800 text-sm truncate max-w-[200px]">${item.cliente}</span>
                      </div>

                      <!-- Serviço e Categoria -->
                      <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                          ${categoriaExibida ? `<span class="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide border border-blue-200 shrink-0">${categoriaExibida}</span>` : ""}
                          <span class="truncate">${servicoExibido}</span>
                      </div>

                      <!-- Localização / Endereço -->
                      <p class="text-[11px] text-gray-500 flex items-center gap-1 truncate w-full">
                          <i class="fas fa-map-marker-alt opacity-70 shrink-0"></i> 
                          <span class="truncate">${item.localizacao || "Endereço não informado"}</span>
                      </p>
                  </div>

                  <!-- Status Badge -->
                  <div class="shrink-0 pt-1">
                      <span class="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${badgeBorderColor} uppercase tracking-wider">
                          <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                          ${item.status || "Pendente"}
                      </span>
                  </div>

              </div>
          </div>
        `;
      })
      .join("");
  } catch (e) {
    console.error("Erro crônico ao renderizar Dashboard:", e);
  }
};
