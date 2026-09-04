// ==========================================
// MÓDULO: CALENDÁRIO MENSAL (ANTI-GHOST DOM)
// ==========================================
window.dataCalendarioVisualizacao =
  window.dataCalendarioVisualizacao || new Date();

window.abrirCalendarioMensal = function () {
  window.dataCalendarioVisualizacao = new Date();

  // 🔥 Abre TODOS os modais de calendário que existirem no código
  document
    .querySelectorAll("#modal-calendario, [id='modal-calendario']")
    .forEach((modal) => {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
        const box = modal.querySelector("div");
        if (box) box.classList.remove("scale-95");
      }, 10);
    });
  window.renderizarCalendarioMensal();
};

window.fecharCalendario = function () {
  // 🔥 Fecha TODOS os modais
  document
    .querySelectorAll("#modal-calendario, [id='modal-calendario']")
    .forEach((modal) => {
      modal.classList.add("hidden", "opacity-0");
      const box = modal.querySelector("div");
      if (box) box.classList.add("scale-95");
    });
};

window.mudarMesCalendario = function (direcao) {
  window.dataCalendarioVisualizacao.setMonth(
    window.dataCalendarioVisualizacao.getMonth() + direcao,
  );
  window.renderizarCalendarioMensal();
};

window.renderizarCalendarioMensal = function () {
  const ano = window.dataCalendarioVisualizacao.getFullYear();
  const mes = window.dataCalendarioVisualizacao.getMonth();

  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    window.dataCalendarioVisualizacao,
  );

  // Atualiza todos os títulos
  document
    .querySelectorAll("#mes-ano-calendario, [id='mes-ano-calendario']")
    .forEach((titulo) => {
      titulo.innerText = `${nomeMes.toUpperCase()} ${ano}`;
    });

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const mapaServicosMes = {};

  if (
    typeof window.databaseAgenda !== "undefined" &&
    Array.isArray(window.databaseAgenda)
  ) {
    const prefixoMesAno = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    window.databaseAgenda.forEach((item) => {
      if (!item) return;
      const diaSeguro = String(item.dia || "").trim();
      if (diaSeguro.startsWith(prefixoMesAno)) {
        const partesData = diaSeguro.split("-");
        if (partesData.length >= 3) {
          const diaDoServico = parseInt(partesData[2].substring(0, 2), 10);
          mapaServicosMes[diaDoServico] =
            (mapaServicosMes[diaDoServico] || 0) + 1;
        }
      }
    });
  }

  let htmlGrid = "";
  for (let i = 0; i < primeiroDiaMes; i++) {
    htmlGrid += `<div class="p-3 bg-transparent pointer-events-none"></div>`;
  }

  const hoje = new Date();
  const ehMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes;
  const diaAtual = hoje.getDate();

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const qtdServicos = mapaServicosMes[dia] || 0;
    const ehHoje = ehMesAtual && dia === diaAtual;

    let classesBase =
      "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 min-h-[60px] cursor-pointer select-none ";
    let indicadorHtml = "";

    if (qtdServicos > 0) {
      classesBase +=
        "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold shadow-sm hover:bg-emerald-100 hover:scale-105 ";
      indicadorHtml = `<div class="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-white pointer-events-none">${qtdServicos}</div>`;
    } else if (ehHoje) {
      classesBase +=
        "bg-blue-50 border-blue-300 text-blue-800 font-black hover:bg-blue-100 hover:scale-105 ";
    } else {
      classesBase +=
        "bg-white border-gray-100 text-gray-600 font-medium hover:border-blue-300 hover:shadow-sm hover:scale-105 ";
    }

    const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    htmlGrid += `
        <div class="${classesBase}" title="${qtdServicos > 0 ? qtdServicos + " serviço(s)" : "Livre"}"
             onclick="window.irParaAgendaDireto(event, '${dataISO}')">
            <span class="text-sm pointer-events-none">${dia}</span>
            ${indicadorHtml}
        </div>
    `;
  }

  // 🔥 O GRANDE SEGREDO: Atualiza TODOS os calendários no código
  document
    .querySelectorAll("#grid-dias-calendario, [id='grid-dias-calendario']")
    .forEach((grid) => {
      grid.innerHTML = htmlGrid;
    });
};

window.irParaAgendaDireto = function (event, dataISO) {
  // 1. Bloqueia múltiplos cliques acidentais
  if (event) {
    event.stopPropagation();
  }

  // 2. Fecha o modal do calendário
  window.fecharCalendario();

  // 3. O SEGREDO: Simula o clique exato do usuário no menu oficial!
  // Isso garante que o sistema ative a aba nativamente sem dessincronizar
  const botoesMenu = document.querySelectorAll(
    "nav a, nav button, .menu-item, a, button, li",
  );
  for (let btn of botoesMenu) {
    if (btn.innerText && btn.innerText.trim().toLowerCase() === "agenda") {
      btn.click();
      break;
    }
  }

  // 4. Injeta a data e reconstrói a tela
  const atualizarAgenda = () => {
    window.selectedDay = dataISO;
    window.carrosselAnchorDate = new Date(dataISO + "T12:00:00");

    // Reconstrói a barra horizontal
    if (typeof window.gerarDiasAgenda === "function") window.gerarDiasAgenda();

    // Renderiza os dados do banco
    if (typeof window.renderAgenda === "function") window.renderAgenda();

    // Marca o botão azul no carrossel usando a sua função limpa
    if (typeof window.selectDay === "function") window.selectDay(dataISO);
  };

  // Aplica os dados e sela com um timeout curto para aguardar o roteamento nativo
  atualizarAgenda();
  setTimeout(atualizarAgenda, 150);
};
