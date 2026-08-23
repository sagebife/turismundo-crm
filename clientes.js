// =========================================================================
// MÓDULO ISOLADO: GESTÃO DE CLIENTES E DOSSIÊ (clientes.js)
// =========================================================================

let clientesCache = []; // Guarda os clientes em memória para a busca instantânea

document.addEventListener("DOMContentLoaded", () => {
  // Interceptador de clique: Carrega os clientes automaticamente ao abrir a aba
  document.body.addEventListener("click", (e) => {
    const navItem = e.target.closest("a, button, li, .menu-item");
    if (
      navItem &&
      navItem.innerText &&
      navItem.innerText.trim().toLowerCase() === "clientes"
    ) {
      if (typeof window.renderClientes === "function") {
        window.renderClientes();
      }
    }
  });

  // Motor de busca em tempo real na barra de clientes
  const inputBusca = document.getElementById("buscaClienteDossie");
  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase().trim();
      const filtrados = clientesCache.filter(
        (c) =>
          (c.nome && c.nome.toLowerCase().includes(termo)) ||
          (c.whatsapp && c.whatsapp.toLowerCase().includes(termo)),
      );
      window.desenharListaClientes(filtrados);
    });
  }
});

// 1. BUSCAR E RENDERIZAR CLIENTES DO SUPABASE
window.renderClientes = async function () {
  const container = document.getElementById("clientesList");
  if (!container) return;

  if (!window.supabaseClient || !window.isConnectedToSupabase) {
    container.innerHTML = `<p class="text-xs text-gray-400 text-center py-8 italic"><i class="fas fa-wifi mr-2"></i>Modo simulação: Lista de clientes indisponível offline.</p>`;
    return;
  }

  container.innerHTML = `<p class="text-xs text-blue-500 text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Carregando base de clientes...</p>`;

  try {
    const { data, error } = await window.supabaseClient
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    clientesCache = data || [];
    window.desenharListaClientes(clientesCache);
  } catch (err) {
    console.error("Erro ao renderizar clientes:", err);
    container.innerHTML = `<p class="text-xs text-red-500 text-center py-8"><i class="fas fa-exclamation-triangle mr-2"></i>Erro ao carregar clientes do banco.</p>`;
  }
};

// 2. FUNÇÃO AUXILIAR PARA DESENHAR OS CARDS (Linha inteira clicável + Lixeira)
window.desenharListaClientes = function (lista) {
  const container = document.getElementById("clientesList");
  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 text-center py-8">Nenhum cliente encontrado.</p>`;
    return;
  }

  container.innerHTML = lista
    .map(
      (cliente) => `
        <div onclick="openClientDossier('${cliente.id}', '${cliente.nome || ""}', '${cliente.whatsapp || ""}', '${cliente.biografia || ""}')" class="p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group mb-2">
            <div>
                <h3 class="font-bold text-gray-900 group-hover:text-blue-700 transition text-sm">${cliente.nome || "Cliente sem nome"}</h3>
                <p class="text-xs text-gray-500 mt-1"><i class="fab fa-whatsapp text-emerald-500 mr-1 text-sm"></i> ${cliente.whatsapp || "Sem WhatsApp"}</p>
                ${cliente.biografia ? `<p class="text-[11px] text-gray-600 mt-2 italic line-clamp-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">${cliente.biografia}</p>` : ""}
            </div>
            <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button onclick="deletarCliente('${cliente.id}')" class="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 hover:text-red-700 transition shadow-sm" title="Deletar Cliente">
                    <i class="fas fa-trash-alt mr-1"></i> Deletar
                </button>
            </div>
        </div>
    `,
    )
    .join("");
};

// 3. FUNÇÃO DE EXCLUSÃO DE CLIENTE BLINDADA
window.deletarCliente = async function (id) {
  if (!id) return;

  const confirmacao = confirm(
    "⚠️ ATENÇÃO: Tem certeza que deseja deletar este cliente permanentemente?",
  );
  if (!confirmacao) return;

  if (window.isConnectedToSupabase && window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from("clientes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (typeof window.showToast === "function") {
        window.showToast("Cliente removido com sucesso!", false);
      }

      window.renderClientes();
    } catch (err) {
      console.error("Erro ao deletar cliente:", err);
      if (typeof window.showToast === "function") {
        window.showToast("Erro ao deletar cliente.", true);
      }
    }
  }
};

// 4. ESTRUTURA DO DOSSIÊ
if (typeof window.openClientDossier === "undefined") {
  window.openClientDossier = function (id, nome, whatsapp, biografia) {
    console.log("Abrindo dossiê para:", { id, nome, whatsapp, biografia });
    if (typeof window.showToast === "function")
      window.showToast(`Abrindo dossiê de ${nome}...`, false);
  };
}
