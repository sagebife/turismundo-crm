// ==========================================
// MÓDULO: ORÇAMENTOS E LEADS
// ==========================================

window.itensOrcamentoAtual = [];
window.servicosDisponiveis = [];
window.servicoSelecionado = null;

async function carregarOrcamentos() {
  if (!window.supabaseClient) return;
  const tbody = document.getElementById("tabela-orcamentos-body");
  if (!tbody) return;

  try {
    const { data, error } = await window.supabaseClient
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    carregarTabelaFiltrada(data || []);
  } catch (err) {
    console.error("Erro ao buscar orçamentos:", err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Erro ao carregar orçamentos.</td></tr>`;
  }
}

async function filtrarOrcamentos(status) {
  ["todos", "Pendente", "Aprovado"].forEach((s) => {
    const btnId = `btn-filtro-${s.toLowerCase()}`;
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (
      s.toLowerCase() === status.toLowerCase() ||
      (status === "todos" && s === "todos")
    ) {
      btn.className =
        "px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg shadow-sm transition";
    } else {
      btn.className =
        "px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition";
    }
  });

  if (!window.supabaseClient) return;
  try {
    let query = window.supabaseClient
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (status.toLowerCase() !== "todos") {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    carregarTabelaFiltrada(data || []);
  } catch (err) {
    console.error("Erro ao filtrar orçamentos:", err);
  }
}

function carregarTabelaFiltrada(lista) {
  const tbody = document.getElementById("tabela-orcamentos-body");
  if (!tbody) return;

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum orçamento encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista
    .map((orc) => {
      const statusAtual = orc.status || "Pendente";
      let badgeClass = "bg-yellow-100 text-yellow-800";
      if (statusAtual === "Aprovado")
        badgeClass = "bg-green-100 text-green-800";
      if (statusAtual === "Agendado")
        badgeClass = "bg-purple-100 text-purple-800";

      let acoesHtml = `<button onclick="gerarPDFOrcamentoDinamico('${orc.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium">PDF</button>`;

      if (statusAtual === "Aprovado" || statusAtual === "Agendado") {
        acoesHtml += `
                <button onclick="abrirModalAgendamentoOrcamento('${orc.id}')" class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium">Agendar</button>
                <button onclick="deletarOrcamento('${orc.id}')" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">Excluir</button>
            `;
      } else {
        acoesHtml += `
                <button onclick="enviarOrcamentoWhatsAppDinamico('${orc.id}')" class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">WhatsApp</button>
                <button onclick="aprovarOrcamento('${orc.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium">Aprovar</button>
            `;
      }

      return `
            <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${orc.nome_lead || "Cliente"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${orc.whatsapp || "-"}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${orc.servicos_solicitados}">${orc.servicos_solicitados || "-"}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">R$ ${Number(orc.valor_total || 0).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full ${badgeClass}">${statusAtual}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div class="flex items-center justify-center gap-1.5">${acoesHtml}</div>
                </td>
            </tr>
        `;
    })
    .join("");
}

async function abrirModalOrcamento() {
  const modal = document.getElementById("modal-orcamento");
  if (modal) modal.classList.remove("hidden");

  document.getElementById("form-orcamento").reset();
  itensOrcamentoAtual = [];
  renderizarTabelaItensOrcamento();

  document.getElementById("input-busca-servico").value = "";
  document.getElementById("orc-valor-unit").value = "";
  servicoSelecionado = null;

  if (!window.supabaseClient) return;
  try {
    const { data: servicos, error } = await window.supabaseClient
      .from("servicos")
      .select("*")
      .order("categoria", { ascending: true });
    if (error) throw error;
    servicosDisponiveis = servicos || [];
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
  }
}

function adicionarItemOrcamento() {
  if (!servicoSelecionado) {
    return alert(
      "Por favor, pesquise e clique em um serviço da lista antes de adicionar.",
    );
  }
  const quantidade = parseInt(document.getElementById("orc-qtd").value) || 1;
  const valorUnit =
    parseFloat(document.getElementById("orc-valor-unit").value) || 0;
  const valorTotalItem = quantidade * valorUnit;

  itensOrcamentoAtual.push({
    servico_id: servicoSelecionado.id,
    categoria: servicoSelecionado.categoria || "Geral",
    servico: servicoSelecionado.nome,
    quantidade: quantidade,
    valor_unitario: valorUnit,
    valor_total: valorTotalItem,
  });

  renderizarTabelaItensOrcamento();
  document.getElementById("orc-qtd").value = "1";
  document.getElementById("orc-valor-unit").value = "";
  document.getElementById("input-busca-servico").value = "";
  servicoSelecionado = null;
}

function removerItemOrcamento(index) {
  itensOrcamentoAtual.splice(index, 1);
  renderizarTabelaItensOrcamento();
}

function renderizarTabelaItensOrcamento() {
  const tbody = document.getElementById("orc-tabela-itens");
  const labelTotal = document.getElementById("orc-label-total");
  const inputTotalGeral = document.getElementById("orc-valor-total-geral");
  if (!tbody) return;

  if (itensOrcamentoAtual.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-3 text-center text-gray-400 italic">Nenhum item adicionado.</td></tr>`;
    labelTotal.innerText = "R$ 0,00";
    inputTotalGeral.value = 0;
    return;
  }

  tbody.innerHTML = "";
  let somaTotal = 0;
  itensOrcamentoAtual.forEach((item, index) => {
    somaTotal += item.valor_total;
    tbody.innerHTML += `
            <tr>
                <td class="p-2 font-medium text-gray-800">${item.servico}</td>
                <td class="p-2 text-center">${item.quantidade}</td>
                <td class="p-2 text-right">R$ ${item.valor_unitario.toFixed(2)}</td>
                <td class="p-2 text-right font-bold text-blue-900">R$ ${item.valor_total.toFixed(2)}</td>
                <td class="p-2 text-center">
                    <button type="button" onclick="removerItemOrcamento(${index})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
  });
  labelTotal.innerText = `R$ ${somaTotal.toFixed(2)}`;
  inputTotalGeral.value = somaTotal;
}

async function salvarOrcamentoDinamico(event) {
  if (event) event.preventDefault();
  if (!window.supabaseClient) return;

  const nomeLead = document.getElementById("orc-nome").value.trim();
  const whatsapp = document.getElementById("orc-whatsapp").value.trim();
  const valorTotal =
    parseFloat(document.getElementById("orc-valor-total-geral").value) || 0;

  if (itensOrcamentoAtual.length === 0)
    return alert("Adicione serviços ao orçamento.");

  const resumoServicos = itensOrcamentoAtual
    .map((i) => `${i.quantidade}x ${i.servico}`)
    .join(", ");

  try {
    const { data, error } = await window.supabaseClient
      .from("orcamentos")
      .insert([
        {
          nome_lead: nomeLead,
          whatsapp: whatsapp,
          valor_total: valorTotal,
          servicos_solicitados: resumoServicos,
          dados_detalhados: itensOrcamentoAtual,
          status: "Pendente",
        },
      ])
      .select();

    if (error) throw error;
    fecharModalOrcamento();
    carregarOrcamentos();

    if (data && data.length > 0) window.orcamentoAtualSalvo = data[0];

    const spanNome = document.getElementById("nomeLeadDestaque");
    if (spanNome) spanNome.innerText = nomeLead;
    const modalElement = document.getElementById("modal-pos-salvamento");
    if (modalElement) modalElement.classList.remove("hidden");
  } catch (err) {
    console.error("Erro ao salvar:", err);
    alert("Erro ao salvar orçamento.");
  }
}

async function aprovarOrcamento(id) {
  if (!window.supabaseClient) return;
  try {
    const { data: orc, error: errBusca } = await window.supabaseClient
      .from("orcamentos")
      .select("*")
      .eq("id", id)
      .single();
    if (errBusca || !orc) throw new Error("Orçamento não encontrado.");

    const clientId = await processarClienteBanco(
      orc.nome_lead || orc.nome || "Cliente sem nome",
      orc.whatsapp || "",
    );
    const { error: errUpdate } = await window.supabaseClient
      .from("orcamentos")
      .update({ status: "Aprovado" })
      .eq("id", id);

    if (errUpdate) throw errUpdate;
    carregarOrcamentos();
    if (typeof renderClientes === "function") renderClientes();
    showToast("Orçamento aprovado e cliente sincronizado!", false);
  } catch (err) {
    console.error("Erro na aprovação:", err);
    showToast("Erro ao tentar aprovar o orçamento.", true);
  }
}

async function deletarOrcamento(id) {
  if (!confirm("Excluir este orçamento?")) return;
  try {
    const { error } = await window.supabaseClient
      .from("orcamentos")
      .delete()
      .eq("id", id);
    if (error) throw error;
    carregarOrcamentos();
  } catch (error) {
    console.error("Erro:", error);
  }
}

async function enviarOrcamentoWhatsAppDinamico(id, dados = null) {
  let orc = dados;
  if (!orc) {
    const { data, error } = await window.supabaseClient
      .from("orcamentos")
      .select("*")
      .eq("id", id);
    if (error || !data) return alert("Orçamento não encontrado.");
    orc = data[0];
  }

  const cliente = orc.nome_lead || "Cliente";
  let numLimpo = (orc.whatsapp || "").replace(/[^0-9]/g, "");
  if (numLimpo && !numLimpo.startsWith("55") && !numLimpo.startsWith("54"))
    numLimpo = "55" + numLimpo;

  let textoMsg = `Olá, *${cliente.toUpperCase()}*! Segue o resumo do seu orçamento da *Turismundo*:\n\n`;
  if (orc.dados_detalhados && Array.isArray(orc.dados_detalhados)) {
    orc.dados_detalhados.forEach((item) => {
      textoMsg += `- ${item.quantidade}x ${item.servico} - R$ ${Number(item.valor_total).toFixed(2)}\n`;
    });
  } else {
    textoMsg += `- ${orc.servicos_solicitados}\n`;
  }
  textoMsg += `\n*Valor Total: R$ ${Number(orc.valor_total || 0).toFixed(2)}*\n\nValidade: 7 dias. Qualquer dúvida, estamos à disposição!`;
  window.open(
    `https://wa.me/${numLimpo}?text=${encodeURIComponent(textoMsg)}`,
    "_blank",
  );
}

async function gerarPDFOrcamentoDinamico(orcamentoId) {
  if (!window.supabaseClient) {
    alert("Supabase não está conectado.");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("orcamentos")
      .select("*")
      .eq("id", orcamentoId);

    if (error || !data || data.length === 0) {
      throw new Error("Orçamento não encontrado ou ID inválido.");
    }

    const orc = data[0];

    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(valor) || 0);
    };

    const formatarData = (dataStr) => {
      if (!dataStr) return new Date().toLocaleDateString("pt-BR");
      return new Date(dataStr).toLocaleDateString("pt-BR");
    };

    const carregarImagemFundo = () => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve("");
        img.src = "fundo-proposta.png";
      });
    };

    const imagemFundoBase64 = await carregarImagemFundo();

    let linhasTabela = "";
    const itens = Array.isArray(orc.dados_detalhados)
      ? orc.dados_detalhados
      : [];

    if (itens.length > 0) {
      itens.forEach((item, index) => {
        linhasTabela += `
          <tr style="border-bottom: 1px solid #cbd5e1; background-color: ${index % 2 === 0 ? "rgba(255,255,255,0.95)" : "rgba(248,250,252,0.95)"};">
            <td style="padding:10px 12px;font-size:11px;">
              <strong>${item.servico || item.nome || "Serviço"}</strong>
            </td>
            <td style="padding:10px 12px;text-align:center;font-size:11px;">
              ${item.quantidade || 1}
            </td>
            <td style="padding:10px 12px;text-align:right;font-size:11px;">
              ${formatarMoeda(item.valor_unitario || 0)}
            </td>
            <td style="padding:10px 12px;text-align:right;font-size:11px;font-weight:bold;color:#047857;">
              ${formatarMoeda(item.valor_total || 0)}
            </td>
          </tr>
        `;
      });
    } else {
      linhasTabela = `
        <tr>
          <td colspan="4" style="padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
            ${orc.servicos || orc.servicos_solicitados || "Nenhum detalhe informado."}
          </td>
        </tr>
      `;
    }

    // Cria o Iframe Invisível
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "200vw"; // Longe da vista do usuário
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;

    // Injeta o HTML completo e as regras CSS apenas dentro do Iframe
    const conteudoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div id="pdf-container" style="width: 210mm; height: 296mm; position: relative; overflow: hidden; color: #1f2937;">
          <div style="position:absolute;top:0;left:0;width:210mm;height:296mm;z-index:0;overflow:hidden;">
            <img src="${imagemFundoBase64}" style="width:100%;height:100%;object-fit:contain;display:block;">
          </div>
          
          <div style="position:relative;z-index:1;width:100%;height:100%;padding:12mm 15mm;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="height:180px;"></div>
              
              <div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.95);border:1px solid #cbd5e1;border-radius:6px;padding:10px 14px;margin-bottom:15px;font-size:11px;">
                <div>
                  <span style="color:#64748b;font-size:8px;font-weight:bold;display:block;">CLIENTE:</span>
                  <strong style="font-size:13px;color:#0f172a;">👤 ${(orc.nome_lead || orc.cliente || "Cliente").toUpperCase()}</strong>
                </div>
                <div style="text-align:right;">
                  <div style="color:#64748b;font-size:9.5px;">📋 <strong>Nº Proposta:</strong> ${String(orc.id).slice(-8)}</div>
                  <div style="color:#64748b;font-size:9.5px;margin-top:2px;">📅 <strong>Data:</strong> ${formatarData(orc.created_at)}</div>
                </div>
              </div>
              
              <div style="margin-bottom:15px;">
                <div style="background-color:#1e40af;color:#ffffff;padding:7px 12px;font-size:10.5px;font-weight:bold;border-radius:4px 4px 0 0;">
                  🚗 SERVIÇOS SOLICITADOS
                </div>
                <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;">
                  <thead>
                    <tr style="background-color:#e2e8f0;color:#334155;font-size:10px;">
                      <th style="padding:8px 12px;width:55%;text-align:left;">SERVIÇO</th>
                      <th style="padding:8px 12px;text-align:center;width:15%;">QTD</th>
                      <th style="padding:8px 12px;text-align:right;width:15%;">V. UNITÁRIO</th>
                      <th style="padding:8px 12px;text-align:right;width:15%;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>${linhasTabela}</tbody>
                </table>
              </div>
              
              <div style="display:flex;justify-content:flex-end;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);color:white;padding:9px 18px;border-radius:6px;display:flex;align-items:center;gap:15px;">
                  <span style="font-size:10.5px;font-weight:bold;">VALOR TOTAL DA PROPOSTA</span>
                  <span style="font-size:16px;font-weight:bold;">${formatarMoeda(orc.valor_total || orc.valorTotal || 0)}</span>
                </div>
              </div>
            </div>
            <div style="height:40px;"></div>
          </div>
        </div>
      </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(conteudoHTML);
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 350));

    // Captura apenas a div específica de dentro do Iframe
    const elementToCapture = iframeDoc.getElementById("pdf-container");

    await html2pdf()
      .set({
        margin: 0,
        filename: `Proposta_${orc.nome_lead || orc.cliente || "Cliente"}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(elementToCapture)
      .save();

    // Remove o Iframe após o download
    document.body.removeChild(iframe);
  } catch (err) {
    console.error("Erro ao gerar orçamento:", err);
    alert("Erro ao gerar orçamento:\n" + (err.message || "Erro desconhecido"));
  }
}
