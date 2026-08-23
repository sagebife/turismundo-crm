// ==========================================
// MÓDULO: EXTRATO DO MOTORISTA
// ==========================================

window.motoristaExtratoAtual = null;
window.idsCorridasPendentesSemana = [];

function getExtremosDaSemanaISO(semanaISO) {
  if (!semanaISO) return null;
  const [anoStr, semanaStr] = semanaISO.split("-W");
  const ano = parseInt(anoStr, 10);
  const semana = parseInt(semanaStr, 10);

  const jan4 = new Date(ano, 0, 4);
  const diaJan4 = jan4.getDay() || 7;
  const segundaSemana1 = new Date(ano, 0, 4 - diaJan4 + 1);

  const inicioSemana = new Date(segundaSemana1);
  inicioSemana.setDate(segundaSemana1.getDate() + (semana - 1) * 7);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const pad = (n) => n.toString().padStart(2, "0");
  return {
    inicio: `${inicioSemana.getFullYear()}-${pad(inicioSemana.getMonth() + 1)}-${pad(inicioSemana.getDate())}`,
    fim: `${fimSemana.getFullYear()}-${pad(fimSemana.getMonth() + 1)}-${pad(fimSemana.getDate())}`,
  };
}

function renderizarFiltroSemanaExtrato() {
  const inputFiltroSemana = document.querySelector(
    "#modal-extrato-motorista input[type='week']",
  );
  if (!inputFiltroSemana || !motoristaExtratoAtual) return;

  const limites = getExtremosDaSemanaISO(inputFiltroSemana.value);
  if (!limites) return;

  let corridasMotorista =
    typeof databaseAgenda !== "undefined"
      ? databaseAgenda.filter(
          (item) =>
            String(item.motorista) === String(motoristaExtratoAtual.nome) ||
            String(item.motorista_id) === String(motoristaExtratoAtual.id),
        )
      : [];

  corridasMotorista = corridasMotorista.filter((corrida) => {
    if (!corrida.dia) return false;
    return corrida.dia >= limites.inicio && corrida.dia <= limites.fim;
  });

  corridasMotorista.sort(
    (a, b) =>
      new Date(`${a.dia}T${a.hora || "00:00"}`) -
      new Date(`${b.dia}T${b.hora || "00:00"}`),
  );

  let repasseTotalPendente = 0;
  let repasseTotalSemana = 0;

  const linhasTabela = corridasMotorista
    .map((corrida) => {
      const valorRepasse = Number(corrida.valorMotorista) || 0;
      const estaPago = corrida.pagoMotorista;

      repasseTotalSemana += valorRepasse;
      if (!estaPago) repasseTotalPendente += valorRepasse;

      const badgeStatus = estaPago
        ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold"><i class="fas fa-check"></i> Pago</span>`
        : `<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold"><i class="fas fa-clock"></i> Pendente</span>`;

      let dataBR = corrida.dia || "--";
      if (corrida.dia && corrida.dia.includes("-")) {
        const partes = corrida.dia.split("-");
        if (partes.length === 3)
          dataBR = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }

      return `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-3">
                    <div class="font-bold text-gray-800">${dataBR}</div>
                    <div class="text-[10px] text-gray-500">${corrida.hora || "--:--"}</div>
                </td>
                <td class="p-3">
                    <div class="font-bold text-gray-800">${corrida.cliente || "Cliente Oculto"}</div>
                    <div class="text-[10px] text-gray-500 truncate max-w-[150px]">${corrida.localizacao || corrida.tipo}</div>
                </td>
                <td class="p-3 text-right font-black text-red-600">
                    R$ ${valorRepasse.toFixed(2)}
                </td>
                <td class="p-3 text-center">${badgeStatus}</td>
            </tr>
        `;
    })
    .join("");

  const tbody = document.getElementById("extrato-tabela-corridas");
  if (tbody) {
    tbody.innerHTML =
      linhasTabela ||
      `<tr><td colspan="4" class="text-center p-4 text-gray-500 text-xs">Nenhuma viagem de <b>${motoristaExtratoAtual.nome}</b> na semana selecionada.</td></tr>`;
  }

  const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const labelFaturado = document.getElementById("extrato-faturado-semana");
  if (labelFaturado)
    labelFaturado.innerText = formatadorMoeda.format(repasseTotalSemana);
  document.getElementById("extrato-total-pendente").innerText =
    formatadorMoeda.format(repasseTotalPendente);
}

function abrirExtratoMotorista(driverId, driverName, driverPhone) {
  motoristaExtratoAtual = {
    id: driverId,
    nome: driverName,
    telefone: driverPhone,
  };

  document.getElementById("titulo-extrato-motorista").innerHTML = `
        <div class="flex flex-col gap-1.5">
            <div><i class="fas fa-file-invoice-dollar text-emerald-600"></i> Extrato: ${driverName}</div>
            <div class="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 w-fit px-2.5 py-0.5 rounded-md shadow-sm">
                Faturado na Semana: <span id="extrato-faturado-semana" class="font-bold text-gray-800">R$ 0,00</span>
            </div>
        </div>
    `;

  const inputFiltroSemana = document.querySelector(
    "#modal-extrato-motorista input[type='week']",
  );
  if (inputFiltroSemana) {
    const hoje = new Date();
    const d = new Date(
      Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    const weekString = `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;

    inputFiltroSemana.value = weekString;
    inputFiltroSemana.onchange = renderizarFiltroSemanaExtrato;
    inputFiltroSemana.onclick = function () {
      this.showPicker();
    };
  }

  renderizarFiltroSemanaExtrato();
  const modal = document.getElementById("modal-extrato-motorista");
  if (modal) modal.classList.remove("hidden");
}

function fecharModalExtrato() {
  document.getElementById("modal-extrato-motorista").classList.add("hidden");
  motoristaExtratoAtual = null;
}

function enviarExtratoWhatsApp() {
  if (!motoristaExtratoAtual) return;
  const valorPendenteTexto = document.getElementById(
    "extrato-total-pendente",
  ).innerText;
  let numLimpo = (motoristaExtratoAtual.telefone || "").replace(/[^0-9]/g, "");

  if (numLimpo && !numLimpo.startsWith("55") && !numLimpo.startsWith("54")) {
    numLimpo = "55" + numLimpo;
  }

  const msg = `Olá *${motoristaExtratoAtual.nome}*, segue o resumo atualizado dos seus repasses com a Turismundo:\n\n💰 *Total Pendente a Receber:* ${valorPendenteTexto}\n\nPara conferir os detalhes de cada corrida, por favor acesse seu painel ou responda a esta mensagem.`;
  window.open(
    `https://wa.me/${numLimpo}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

async function pagarSemanaMotorista() {
  if (window.idsCorridasPendentesSemana.length === 0) return;
  const btn = document.getElementById("btn-pagar-semana");
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processando...`;
  btn.disabled = true;

  try {
    if (window.isConnectedToSupabase && window.supabaseClient) {
      const { error } = await window.supabaseClient
        .from("reservas")
        .update({ pago_motorista: true })
        .in("id", window.idsCorridasPendentesSemana);
      if (error) throw error;
    }
    showToast("Repasses da semana marcados como Pagos! ✅", false);
    await carregarExtratoMotorista();
    if (typeof renderFinanceiro === "function") renderFinanceiro();
  } catch (error) {
    console.error("Erro ao pagar semana:", error);
    showToast("Erro ao processar o pagamento.", true);
  } finally {
    btn.innerHTML = `<i class="fas fa-check-double"></i> Pagar Semana`;
  }
}
