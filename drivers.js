// =========================================================================
// MÓDULO ISOLADO: GESTÃO DE MOTORISTAS (drivers.js)
// =========================================================================

window.motoristaEmEdicaoId = null;

if (typeof window.drivers === "undefined") {
  window.drivers = [];
}

// --- MÁGICA AUTÔNOMA (Não precisa mexer no index.html) ---
// O sistema fica verificando a cada meio segundo se os dados já chegaram do Supabase.
// Assim que chegarem, ele desenha a tela e desliga o verificador sozinho!
let verificadorMotoristas = setInterval(() => {
  if (window.drivers && window.drivers.length > 0) {
    const container = document.getElementById("driversList");
    // Desenha apenas se a lista ainda estiver vazia
    if (container && container.innerHTML.trim() === "") {
      window.renderDrivers();
      window.updateDriverDropdowns();
    }
    clearInterval(verificadorMotoristas); // Desliga o radar
  }
}, 500);

document.addEventListener("DOMContentLoaded", () => {
  // Interceptador de clique: se você clicar no menu "Motoristas", ele garante que a lista apareça
  document.body.addEventListener("click", (e) => {
    const navItem = e.target.closest("a, button, li, .menu-item");
    if (
      navItem &&
      navItem.innerText &&
      navItem.innerText.trim().toLowerCase().includes("motorista")
    ) {
      if (window.drivers && window.drivers.length > 0) {
        window.renderDrivers();
      }
    }
  });
});

// 1. RENDERIZAR MOTORISTAS
window.renderDrivers = function (dataToRender = window.drivers) {
  const container = document.getElementById("driversList");
  if (!container) return;

  let totalViagensTodos = 0;

  const motoristasOrdenados = [...dataToRender].sort((a, b) => {
    const notaA =
      a.avaliacao !== undefined && a.avaliacao !== null
        ? Number(a.avaliacao)
        : 5;
    const notaB =
      b.avaliacao !== undefined && b.avaliacao !== null
        ? Number(b.avaliacao)
        : 5;

    if (notaB !== notaA) {
      return notaB - notaA;
    }
    return String(a.nome || "").localeCompare(String(b.nome || ""));
  });

  const driversHTML = motoristasOrdenados
    .map((driver) => {
      const agenda = window.databaseAgenda || [];
      const corridasReais = agenda.filter(
        (item) =>
          String(item.motorista) === String(driver.nome) ||
          String(item.motorista_id) === String(driver.id),
      );

      const qtdCorridas = corridasReais.length;
      totalViagensTodos += qtdCorridas;

      const repasseTotalGerado = corridasReais.reduce(
        (sum, item) => sum + (Number(item.valorMotorista) || 0),
        0,
      );

      const nota =
        driver.avaliacao !== undefined && driver.avaliacao !== null
          ? Number(driver.avaliacao)
          : 5;
      let stars = "";
      for (let i = 1; i <= 5; i++) {
        stars += `<i onclick="atualizarNotaMotorista('${driver.id}', ${i})" 
                         class="fas fa-star cursor-pointer transition-transform hover:scale-125 ${i <= nota ? "text-amber-400" : "text-gray-200"} text-xs" 
                         title="Dar nota ${i}"></i>`;
      }

      const partesNome = (driver.nome || "Motorista").split(" ");
      const inicial1 = partesNome[0]
        ? partesNome[0].charAt(0).toUpperCase()
        : "M";
      const inicial2 = partesNome[1]
        ? partesNome[1].charAt(0).toUpperCase()
        : "";

      return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200 flex flex-col justify-between group">
          <div>
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 font-bold flex items-center justify-center text-lg shadow-sm border border-blue-100">
                  ${inicial1}${inicial2}
                </div>
                <div>
                  <h3 class="font-bold text-gray-800 text-base leading-tight group-hover:text-blue-900 transition">${driver.nome}</h3>
                  <div class="flex gap-1 mt-1" title="Avaliação: ${nota} Estrelas">${stars}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <button onclick="editDriver('${driver.id}')" class="text-gray-300 hover:text-blue-500 transition text-sm p-1" title="Editar">
                  <i class="fas fa-pen"></i>
                </button>
                <button onclick="deleteDriver('${driver.id}')" class="text-gray-300 hover:text-red-500 transition text-sm p-1" title="Excluir">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>

            <div class="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 mb-3 border border-gray-100">
              <p class="flex justify-between items-center">
                <span class="font-medium text-gray-500">🚗 Veículo:</span>
                <span class="text-gray-900 font-bold truncate max-w-[130px]" title="${driver.veiculo || driver.modelo || driver.carro || "-"}">${driver.veiculo || driver.modelo || driver.carro || "-"}</span>
              </p>
              <p class="flex justify-between items-center">
                <span class="font-medium text-gray-500">🔢 Placa:</span>
                <span class="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-gray-900 font-bold tracking-wider">${driver.placa || "-"}</span>
              </p>
              <p class="flex justify-between items-center">
                <span class="font-medium text-gray-500">👥 Cap. Max:</span>
                <span class="text-gray-900 font-semibold">${driver.capacidade || "4"} pax</span>
              </p>
            </div>

            <div class="space-y-1 text-xs mb-4">
              <p class="flex justify-between items-center">
                <span class="text-gray-500 font-medium">💰 Repasse Histórico:</span>
                <span class="font-bold text-emerald-600 text-sm">R$ ${repasseTotalGerado.toFixed(2)}</span>
              </p>
              <div class="flex justify-between items-center gap-2 mt-1.5">
                <span class="text-gray-500 font-medium">🔑 Pix / Alias:</span>
                <div class="flex items-center gap-1.5">
                  <span class="truncate max-w-[120px] font-mono text-gray-700 bg-blue-50/50 px-1 rounded text-[10px] border border-blue-100" title="${driver.pix || "-"}">${driver.pix || "-"}</span>
                  <button onclick="copyToClipboard('${driver.pix}')" class="text-blue-600 hover:text-blue-800 transition p-1 bg-blue-50 rounded" title="Copiar PIX">
                    <i class="fas fa-copy text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 mt-2">
            <a href="https://wa.me/${driver.telefone}" target="_blank"
              class="py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm">
              <i class="fab fa-whatsapp text-sm"></i> Chamar
            </a>
            <button onclick="abrirExtratoMotorista('${driver.id}', '${driver.nome}', '${driver.telefone}')"
              class="py-2 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl hover:bg-blue-100 transition text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm">
              <i class="fas fa-file-invoice text-sm"></i> Extrato
            </button>
            <div class="py-2 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5" title="${qtdCorridas} Viagens Realizadas">
              <i class="fas fa-route text-blue-500 text-sm"></i> ${qtdCorridas}v
            </div>
          </div>
        </div>
        `;
    })
    .join("");

  container.innerHTML = driversHTML;

  const activeCountEl = document.getElementById("activeCount");
  const totalTripsEl = document.getElementById("totalTripsCount");

  if (activeCountEl) activeCountEl.innerText = dataToRender.length;
  if (totalTripsEl) totalTripsEl.innerText = totalViagensTodos;
};

// 2. SISTEMA DE BUSCA / FILTRO
window.filterDrivers = function (termo) {
  if (!termo || termo.trim() === "") {
    window.renderDrivers(window.drivers);
    return;
  }

  const lower = termo.toLowerCase().trim();
  const filtrados = window.drivers.filter(
    (d) =>
      (d.nome && d.nome.toLowerCase().includes(lower)) ||
      (d.veiculo && d.veiculo.toLowerCase().includes(lower)) ||
      (d.placa && d.placa.toLowerCase().includes(lower)),
  );

  window.renderDrivers(filtrados);
};

// 3. SISTEMA DE NOTAS
window.atualizarNotaMotorista = async function (driverId, novaNota) {
  const motoristaLocal = window.drivers.find(
    (d) => String(d.id) === String(driverId),
  );
  if (motoristaLocal) {
    motoristaLocal.avaliacao = novaNota;
    window.renderDrivers();
  }

  if (window.isConnectedToSupabase && window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from("motoristas")
        .update({ avaliacao: novaNota })
        .eq("id", driverId);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao atualizar nota:", err);
      if (typeof window.showToast === "function") {
        window.showToast("Erro ao sincronizar a nova avaliação.", true);
      }
    }
  }
};

// 4. ENTRAR EM MODO DE EDIÇÃO
window.editDriver = function (id) {
  const motorista = window.drivers.find((d) => String(d.id) === String(id));
  if (!motorista) return;

  window.motoristaEmEdicaoId = id;

  const preencherCampo = (idDoCampo, valor) => {
    const campo = document.getElementById(idDoCampo);
    if (campo) campo.value = valor;
  };

  preencherCampo("driverName", motorista.nome || "");
  preencherCampo("driverPhone", motorista.telefone || "");
  preencherCampo("driverVehicle", motorista.veiculo || "");
  preencherCampo("driverPlate", motorista.placa || "");
  preencherCampo("driverCapacity", motorista.capacidade || "4");
  preencherCampo(
    "driverValue",
    motorista.valor || motorista.valor_combinado || "",
  );
  preencherCampo("driverCurrency", motorista.moeda || "R$ ($)");
  preencherCampo("driverPix", motorista.pix || "");

  const btnSubmit = document.getElementById("btnSubmitDriver");
  if (btnSubmit) {
    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    btnSubmit.classList.add("bg-blue-600");
    btnSubmit.classList.remove("bg-blue-900");
  }

  const btnCancelar = document.getElementById("btnCancelarEdicao");
  if (btnCancelar) btnCancelar.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (typeof window.showToast === "function") {
    window.showToast(
      "Modo de edição ativado! Altere os dados no formulário.",
      false,
    );
  }
};

// 5. LIMPAR FORMULÁRIO
window.resetarFormularioMotorista = function () {
  const form = document.getElementById("driverForm");
  if (form) form.reset();

  const capField = document.getElementById("driverCapacity");
  if (capField) capField.value = "4";

  window.motoristaEmEdicaoId = null;

  const btnSubmit = document.getElementById("btnSubmitDriver");
  if (btnSubmit) {
    btnSubmit.innerHTML =
      '<i class="fas fa-plus-circle"></i> Cadastrar e Ativar';
    btnSubmit.classList.remove("bg-blue-600");
    btnSubmit.classList.add("bg-blue-900");
  }

  const btnCancelar = document.getElementById("btnCancelarEdicao");
  if (btnCancelar) btnCancelar.classList.add("hidden");
};

// 6. SALVAR OU ATUALIZAR (CRUD)
window.addDriver = async function (event) {
  if (event) event.preventDefault();

  const name = document.getElementById("driverName")?.value || "";
  const phone = document.getElementById("driverPhone")?.value || "";

  // Captura garantida do campo de veículo (pegando pelo ID correto do HTML)
  const vehicle =
    document.getElementById("driverVeiculo")?.value ||
    document.getElementById("driverVehicle")?.value ||
    "";

  const plate = (
    document.getElementById("driverPlate")?.value || ""
  ).toUpperCase();
  const pix = document.getElementById("driverPix")?.value || "";
  const value = document.getElementById("driverValue")?.value || "0";
  const currency = document.getElementById("driverCurrency")?.value || "R$ ($)";
  const capacity = document.getElementById("driverCapacity")?.value || "4";

  if (!name || !plate) {
    if (typeof window.showToast === "function")
      window.showToast("Nome e Placa são obrigatórios!", true);
    return;
  }

  // Objeto unificado dos dados que vão para o Supabase
  const dadosParaSalvar = {
    nome: name,
    telefone: phone,
    veiculo: vehicle, // Mapeado exatamente para a coluna do banco
    placa: plate,
    pix: pix,
    valor_combinado: parseFloat(value),
    moeda: currency,
    capacidade: parseInt(capacity),
  };

  if (window.isConnectedToSupabase && window.supabaseClient) {
    try {
      if (window.motoristaEmEdicaoId) {
        const { error } = await window.supabaseClient
          .from("motoristas")
          .update(dadosParaSalvar)
          .eq("id", window.motoristaEmEdicaoId);

        if (error) throw error;
        if (typeof window.showToast === "function")
          window.showToast("Motorista atualizado com sucesso!", false);
      } else {
        dadosParaSalvar.avaliacao = 5;
        const { error } = await window.supabaseClient
          .from("motoristas")
          .insert([dadosParaSalvar]);

        if (error) {
          if (error.code === "23505")
            throw new Error(`A placa ${plate} já está cadastrada!`);
          throw error;
        }
        if (typeof window.showToast === "function")
          window.showToast("Parceiro cadastrado com sucesso!", false);
      }

      if (typeof window.loadRealData === "function") {
        await window.loadRealData();
      } else if (typeof window.carregarDadosSupabase === "function") {
        await window.carregarDadosSupabase();
      } else {
        window.renderDrivers();
      }
      window.resetarFormularioMotorista();
    } catch (err) {
      console.error("Erro no Supabase:", err);
      if (typeof window.showToast === "function")
        window.showToast(err.message || "Erro ao salvar motorista.", true);
    }
  } else {
    // Modo local (caso não esteja conectado)
    if (window.motoristaEmEdicaoId) {
      const index = window.drivers.findIndex(
        (d) => String(d.id) === String(window.motoristaEmEdicaoId),
      );
      if (index > -1) {
        window.drivers[index] = {
          ...window.drivers[index],
          ...dadosParaSalvar,
        };
        if (typeof window.showToast === "function")
          window.showToast("Alterações salvas localmente!", false);
      }
    }
    window.renderDrivers();
    window.resetarFormularioMotorista();
  }
  window.updateDriverDropdowns();
};

// 7. ATUALIZAR LISTAS SUSPENSAS
window.updateDriverDropdowns = function () {
  const select = document.getElementById("modalDriverSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Sem motorista definido</option>';

  const motoristasOrdenados = [...window.drivers].sort((a, b) =>
    String(a.nome || "").localeCompare(String(b.nome || "")),
  );

  motoristasOrdenados.forEach((d) => {
    select.innerHTML += `<option value="${d.id}">${d.nome} (${d.veiculo || "S/V"}) - ${d.capacidade || 4}pax</option>`;
  });
};
// Abrir Modal
window.abrirModalDisparo = function () {
  const modal = document.getElementById("modalDisparoFrota");
  if (modal) modal.classList.remove("hidden");
};

// Fechar Modal
window.fecharModalDisparo = function () {
  const modal = document.getElementById("modalDisparoFrota");
  if (modal) modal.classList.add("hidden");
};

// Executar o Disparo de forma segura e controlada
window.executarDisparoInteligente = function () {
  const modeloSelecionado =
    document.getElementById("filtroModeloDisparo")?.value || "";
  const mensagemTexto =
    document.getElementById("textoMensagemDisparo")?.value || "";

  if (!mensagemTexto.trim()) {
    alert("Por favor, digite uma mensagem antes de disparar.");
    return;
  }

  if (!window.drivers || window.drivers.length === 0) {
    alert("Nenhum motorista cadastrado no sistema.");
    return;
  }

  // Filtra os motoristas pelo veículo cadastrado
  const motoristasAlvo = window.drivers.filter((d) => {
    if (modeloSelecionado === "todos") return true;
    const veiculo = (d.veiculo || d.modelo || d.carro || "").toLowerCase();
    return veiculo.includes(modeloSelecionado.toLowerCase());
  });

  if (motoristasAlvo.length === 0) {
    alert(
      `Nenhum motorista encontrado com o veículo selecionado (${modeloSelecionado}).`,
    );
    return;
  }

  fecharModalDisparo();

  // Dispara abrindo as abas com intervalo de 1.5s para o navegador não bloquear
  motoristasAlvo.forEach((driver, index) => {
    const telefoneLimpo = (driver.telefone || "").replace(/\D/g, "");
    if (!telefoneLimpo) return;

    const mensagemPersonalizada = `Olá ${driver.nome}, ${mensagemTexto}`;
    const urlWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagemPersonalizada)}`;

    setTimeout(() => {
      window.open(urlWhatsApp, "_blank");
    }, index * 1500);
  });

  if (typeof window.showToast === "function") {
    window.showToast(
      `Iniciando envio para ${motoristasAlvo.length} motoristas (${modeloSelecionado})!`,
      false,
    );
  } else {
    alert(`Disparo iniciado para ${motoristasAlvo.length} motoristas!`);
  }
};
