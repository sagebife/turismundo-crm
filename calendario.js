// ==========================================
// MÓDULO: CALENDÁRIO MENSAL
// ==========================================

window.dataCalendarioVisualizacao =
  window.dataCalendarioVisualizacao || new Date();

function abrirCalendarioMensal() {
  const modal = document.getElementById("modal-calendario");
  if (!modal) return;
  dataCalendarioVisualizacao = new Date();
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    if (modal.querySelector("div"))
      modal.querySelector("div").classList.remove("scale-95");
  }, 10);
  renderizarCalendarioMensal();
}

function fecharCalendario() {
  const modal = document.getElementById("modal-calendario");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.add("opacity-0");
  const box = modal.querySelector("div");
  if (box) box.classList.add("scale-95");
}

function mudarMesCalendario(direcao) {
  dataCalendarioVisualizacao.setMonth(
    dataCalendarioVisualizacao.getMonth() + direcao,
  );
  renderizarCalendarioMensal();
}

function renderizarCalendarioMensal() {
  const ano = dataCalendarioVisualizacao.getFullYear();
  const mes = dataCalendarioVisualizacao.getMonth();

  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    dataCalendarioVisualizacao,
  );
  document.getElementById("mes-ano-calendario").innerText = `${nomeMes} ${ano}`;

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const mapaServicosMes = {};
  if (typeof databaseAgenda !== "undefined") {
    const prefixoMesAno = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    databaseAgenda.forEach((item) => {
      if (item.dia && item.dia.startsWith(prefixoMesAno)) {
        const diaDoServico = parseInt(item.dia.split("-")[2], 10);
        if (!mapaServicosMes[diaDoServico]) mapaServicosMes[diaDoServico] = 0;
        mapaServicosMes[diaDoServico]++;
      }
    });
  }

  const grid = document.getElementById("grid-dias-calendario");
  let htmlGrid = "";

  for (let i = 0; i < primeiroDiaMes; i++) {
    htmlGrid += `<div class="p-3 bg-transparent"></div>`;
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
      indicadorHtml = `
                <div class="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md border-2 border-white pointer-events-none">
                    ${qtdServicos}
                </div>
            `;
    } else if (ehHoje) {
      classesBase +=
        "bg-blue-50 border-blue-300 text-blue-800 font-black hover:bg-blue-100 hover:scale-105 ";
    } else {
      classesBase +=
        "bg-white border-gray-100 text-gray-600 font-medium hover:border-blue-300 hover:shadow-sm hover:scale-105 ";
    }

    const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    // O Gatilho Perfeito: Chama o fecharCalendario daqui mesmo, e depois chama a função global blindada!
    htmlGrid += `
            <div class="${classesBase}" title="${qtdServicos > 0 ? qtdServicos + " serviço(s)" : "Livre"}" onclick="fecharCalendario(); window.verDetalhesDoDia('${dataISO}')">
                <span class="text-sm pointer-events-none">${dia}</span>
                ${indicadorHtml}
            </div>
        `;
  }
  grid.innerHTML = htmlGrid;
}
