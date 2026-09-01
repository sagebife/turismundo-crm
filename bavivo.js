// --- SISTEMA MÚLTIPLO: BUENOS AIRES AO VIVO (Supabase) ---
let listaAvisosBA = [];
let indiceTickerBA = 0;
let intervaloTickerBA = null;

// Inicializa o sistema ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  carregarAvisosBA();
});

async function carregarAvisosBA() {
  try {
    const { data, error } = await window.supabaseClient
      .from("avisos_bavivo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      listaAvisosBA = data;
    } else {
      listaAvisosBA = [
        {
          categoria: "Turismo & Agenda",
          tempo: "Hoje",
          mensagem:
            "Bem-vindo ao CRM Turismundo na nuvem! Adicione seus avisos.",
          link: "https://linda.buenosaires.gob.ar/",
          cor: "verde",
        },
      ];
    }
    iniciarTickerBA();
  } catch (err) {
    console.error("Erro ao carregar avisos do Supabase:", err);
  }
}

function iniciarTickerBA() {
  clearInterval(intervaloTickerBA);
  if (listaAvisosBA.length === 0) {
    atualizarCardVisualBA({
      categoria: "Sem Avisos",
      tempo: "-",
      mensagem: "Nenhum aviso cadastrado.",
      link: "#",
      cor: "azul",
    });
    return;
  }

  indiceTickerBA = 0;
  atualizarCardVisualBA(listaAvisosBA[indiceTickerBA]);

  if (listaAvisosBA.length > 1) {
    intervaloTickerBA = setInterval(() => {
      indiceTickerBA = (indiceTickerBA + 1) % listaAvisosBA.length;
      animarTrocaTickerBA(listaAvisosBA[indiceTickerBA]);
    }, 5000);
  }
}

function animarTrocaTickerBA(aviso) {
  const card = document.getElementById("tickerNewsCard");
  if (!card) return;

  card.classList.remove("opacity-100", "translate-y-0");
  card.classList.add("opacity-0", "translate-y-2");

  setTimeout(() => {
    atualizarCardVisualBA(aviso);
    card.classList.remove("opacity-0", "translate-y-2");
    card.classList.add("opacity-100", "translate-y-0");
  }, 300);
}

function atualizarCardVisualBA(aviso) {
  const elCategoria = document.getElementById("bavivo-categoria");
  const elTempo = document.getElementById("bavivo-tempo");
  const elMensagem = document.getElementById("bavivo-mensagem");
  const linkEl = document.getElementById("bavivo-link");

  if (!elCategoria) return;

  elTempo.innerText = aviso.tempo || "";
  elMensagem.innerText = aviso.mensagem || "";
  if (linkEl)
    linkEl.setAttribute(
      "href",
      aviso.link && aviso.link !== "#"
        ? aviso.link
        : "https://linda.buenosaires.gob.ar/",
    );

  elCategoria.innerText = aviso.categoria || "";

  elCategoria.className = "text-[9px] font-extrabold uppercase ";
  const cor = aviso.cor || "azul";

  if (cor === "vermelho") {
    elCategoria.className += "text-red-600";
  } else if (cor === "verde") {
    elCategoria.className += "text-emerald-600";
  } else if (cor === "amarelo") {
    elCategoria.className += "text-amber-600";
  } else if (cor === "roxo") {
    elCategoria.className += "text-purple-600";
  } else {
    elCategoria.className += "text-blue-900";
  }
}

// --- FUNÇÕES DO GERENCIADOR (MODAL) ---

function abrirGerenciadorBA() {
  const modal = document.getElementById("modal-bavivo");
  if (!modal) return;

  voltarParaListaBA();
  renderizarListaAvisosBA();

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    modal.querySelector("div").classList.remove("scale-95");
  }, 10);
}

function fecharGerenciadorBA() {
  const modal = document.getElementById("modal-bavivo");
  if (!modal) return;
  modal.classList.add("opacity-0");
  modal.querySelector("div").classList.add("scale-95");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

function renderizarListaAvisosBA() {
  const container = document.getElementById("lista-avisos-container");
  if (!container) return;

  if (listaAvisosBA.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-6">Nenhum aviso cadastrado.</div>`;
    return;
  }

  container.innerHTML = listaAvisosBA
    .map(
      (aviso) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-sm transition">
            <div class="flex-1 min-w-0 pr-3">
                <p class="text-[10px] font-bold text-blue-900 uppercase">${aviso.categoria}</p>
                <p class="text-xs text-gray-600 truncate">${aviso.mensagem}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="mostrarFormularioBA('${aviso.id}')" class="w-7 h-7 flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition" title="Editar">
                    <i class="fas fa-pencil-alt text-[10px]"></i>
                </button>
                <button onclick="excluirAvisoBA('${aviso.id}')" class="w-7 h-7 flex items-center justify-center bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition" title="Excluir">
                    <i class="fas fa-trash text-[10px]"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function mostrarFormularioBA(idEditar) {
  document.getElementById("bavivo-view-lista").classList.add("hidden");
  document.getElementById("bavivo-view-form").classList.remove("hidden");

  if (idEditar && idEditar !== "undefined") {
    const aviso = listaAvisosBA.find((a) => String(a.id) === String(idEditar));
    if (aviso) {
      document.getElementById("input-ba-id").value = aviso.id;
      document.getElementById("input-ba-categoria").value =
        aviso.categoria || "";
      document.getElementById("input-ba-cor").value = aviso.cor || "azul";
      document.getElementById("input-ba-tempo").value = aviso.tempo || "";
      document.getElementById("input-ba-mensagem").value = aviso.mensagem || "";
      document.getElementById("input-ba-link").value =
        aviso.link === "#" ? "" : aviso.link || "";
    }
  } else {
    document.getElementById("input-ba-id").value = "";
    document.getElementById("input-ba-categoria").value = "";
    document.getElementById("input-ba-cor").value = "azul";
    document.getElementById("input-ba-tempo").value = "Hoje";
    document.getElementById("input-ba-mensagem").value = "";
    document.getElementById("input-ba-link").value = "";
  }
}

function voltarParaListaBA() {
  document.getElementById("bavivo-view-form").classList.add("hidden");
  document.getElementById("bavivo-view-lista").classList.remove("hidden");
}

async function salvarAvisoBA() {
  const idField = document.getElementById("input-ba-id").value;

  const dadosAviso = {
    categoria:
      document.getElementById("input-ba-categoria").value.trim() || "Aviso",
    cor: document.getElementById("input-ba-cor").value,
    tempo: document.getElementById("input-ba-tempo").value.trim() || "Agora",
    mensagem:
      document.getElementById("input-ba-mensagem").value.trim() ||
      "Sem detalhes.",
    link: document.getElementById("input-ba-link").value.trim() || "#",
  };

  try {
    if (idField) {
      const { error } = await window.supabaseClient
        .from("avisos_bavivo")
        .update(dadosAviso)
        .eq("id", idField);
      if (error) throw error;
    } else {
      const { error } = await window.supabaseClient
        .from("avisos_bavivo")
        .insert([dadosAviso]);
      if (error) throw error;
    }

    await carregarAvisosBA();
    voltarParaListaBA();
    renderizarListaAvisosBA();
  } catch (err) {
    console.error("Erro ao salvar aviso no Supabase:", err);
    alert("Erro ao salvar no banco de dados. Verifique o console.");
  }
}

async function excluirAvisoBA(id) {
  if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

  try {
    const { error } = await window.supabaseClient
      .from("avisos_bavivo")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await carregarAvisosBA();
    renderizarListaAvisosBA();
  } catch (err) {
    console.error("Erro ao excluir aviso no Supabase:", err);
    alert("Erro ao excluir do banco de dados.");
  }
}
