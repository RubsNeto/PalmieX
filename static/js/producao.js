document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------------------------------------
    // FUNÇÕES GERAIS
    // ------------------------------------------------------------
  
    // Função para obter o valor de um cookie (usado para CSRF)
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
  
    // Mapeia status para cores (você pode personalizar as cores)
    function obterCorPorStatus(status) {
      if (status === 'Pendente') {
        return '#f3a600';       // amarelo
      } else if (status === 'Em Produção') {
        return '#17a2b8';       // azul
      } else if (status === 'Pedido Finalizado') {
        return '#00b244';       // verde
      } else if (status === 'Cliente em Espera') {
        return '#610061';
      } else if (status === 'Cancelado') {
        return '#ff0000';       // vermelho
      } else if (status === 'Pedido Pronto') {
        return '#4caf50';       // verde
      } else if (status === 'Reposição Pendente') {
        return '#862fab';       // roxo
      } else {
        return '#333';          // cor padrão
      }
    }
  
    // Aplica um delay progressivo na animação de cada linha da tabela
    const rows = document.querySelectorAll('.pedidos-table tbody tr');
    rows.forEach((row, index) => {
      row.style.animationDelay = `${index * 0.15}s`;
    });
  
    // Atualiza a cor do texto do status para cada pedido
    const statusCells = document.querySelectorAll('.status-pedido');
    statusCells.forEach(cell => {
      const statusSpan = cell.querySelector('span');
      if (statusSpan) {
        const statusTexto = statusSpan.textContent.trim();
        cell.style.color = obterCorPorStatus(statusTexto);
      }
    });
  
    // ------------------------------------------------------------
    // EXIBIR DETALHES DO PEDIDO (MODAL)
    // ------------------------------------------------------------
    const buttonsDetalhes = document.querySelectorAll('.ver-detalhes');
    const modal = document.getElementById('detalhesModal');
    const closeButton = modal.querySelector('.close-button');
    const itensPedidoModal = document.querySelector('.itens-do-pedido-modal');
  
    buttonsDetalhes.forEach(button => {
        button.addEventListener('click', function() {
          const pedidoId = this.getAttribute('data-pedido-id');
          console.log('Buscando itens para o pedido:', pedidoId);
      
          fetch(`/api/pedido/${pedidoId}/itens/`)
            .then(resp => {
              if (!resp.ok) {
                throw new Error(`Erro na requisição: ${resp.statusText}`);
              }
              return resp.json();
            })
            .then(data => {
              if (!data || !Array.isArray(data.itens)) {
                throw new Error('Resposta da API com estrutura inesperada.');
              }
      
              // Ordena os itens por código e tamanho
              data.itens.sort((a, b) => {
                const codigoA = String(a.codigo || '');
                const codigoB = String(b.codigo || '');
                const tamanhoA = String(a.tamanho || '');
                const tamanhoB = String(b.tamanho || '');
                if (codigoA !== codigoB) {
                  return codigoB.localeCompare(codigoA);
                }
                return tamanhoB.localeCompare(tamanhoA);
              });
      
              // Agrupa os itens por produto (código e nome) e inclui as novas informações:
              const produtosAgrupados = {};
              data.itens.forEach(item => {
                const chave = `${item.codigo}-${item.nome}`;
                if (!produtosAgrupados[chave]) {
                  produtosAgrupados[chave] = {
                    codigo: item.codigo,
                    nome: item.nome,
                    sintetico: item.sintetico,
                    cor: item.cor,
                    corPalmilha: item.corPalmilha, // Corrigido para usar camelCase conforme enviado
                    obs: item.obs,
                    ref_balancinho: item.ref_balancinho,
                    espessura: item.espessura,
                    ref_palmilha: item.ref_palmilha,
                    mat_palmilha: item.mat_palmilha,
                    tipo_servico: item.tipo_servico,
                    marca: item.marca,
                    tam_palmilha: item.tamPalmilha || '', // Usa o valor de tamPalmilha enviado
                    tamanhos: []
                  };
                }
                produtosAgrupados[chave].tamanhos.push({
                  tamanho: item.tamanho,
                  quantidade: item.quantidade
                });
              });
      
              // Monta o HTML do modal com todas as informações:
              let html = `
                <h2>Cliente: ${data.cliente}</h2>
                <div class="conteudo">
                  <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
                  <p><strong>Pedido:</strong> ${data.pedido_id}</p>
                  <p><strong>Data:</strong> ${data.data}</p>
                  <p><strong>Hora:</strong> ${data.hora}</p>
                  <p><strong>Status:</strong> 
                    <span id="status-pedido-modal">${data.status}</span>
                  </p>
                  ${data.status === 'Cancelado' ? `
                    <p><strong>Autorizado por:</strong> 
                      <span class="gerente-cancelamento">${data.gerente_cancelamento || 'N/A'}</span>
                    </p>
                    <p><strong>Motivo do Cancelamento:</strong> 
                      <span class="motivo-cancelamento">${data.motivo_cancelamento || 'N/A'}</span>
                    </p>
                  ` : ''}
                </div>
                <ul class="lista-itens">
              `;
      
              // Define o intervalo de tamanhos (por exemplo, de 15 a 43)
              const todosTamanhos = Array.from({ length: 43 - 15 + 1 }, (_, i) => i + 15);
      
              Object.values(produtosAgrupados).forEach(produto => {
                html += `
                  <li class="item-list">
                    <div class="produto-cabecalho">
                      <span class="item-nome">
                        <div class="cima">
                          <p><strong>Ref. Balancinho:</strong> ${produto.ref_balancinho || ''}</p>
                          <p><strong>Sintetico:</strong> ${produto.nome || ''}</p>
                          <p><strong>Cor Balancinho:</strong> ${produto.cor || ''}</p>
                          <p><strong>Ref. Palmilha:</strong> ${produto.ref_palmilha || ''}</p>
                          <p><strong>Palmilha:</strong> ${produto.mat_palmilha || ''}</p>
                        </div>
                        <div class="baixo">
                          <p><strong>Espessur Palmilha:</strong> ${produto.tam_palmilha || ''}</p>
                          <p><strong>Marca:</strong> ${produto.marca || ''}</p>
                          <p><strong>Serviço:</strong> ${produto.tipo_servico || 'Nenhum'}</p>
                          <p><strong>Espessura Solado:</strong> ${produto.espessura || ''}</p>
                          <p><strong>Cor Solado:</strong> ${produto.corPalmilha || ''}</p>
                          ${produto.obs ? `<p><strong>Obs:</strong> ${produto.obs}</p>` : ''}
                        </div>
                      </span>
                    </div>
                    <div class="container containerQuadradinhos">
                `;
                todosTamanhos.forEach(tamanho => {
                  const matching = produto.tamanhos.find(t => t.tamanho == tamanho);
                  const quantidade = matching ? matching.quantidade : '';
                  html += `
                    <div class="botao-container">
                      <button class="botao">${tamanho}</button>
                      <div class="numero" contenteditable="false">${quantidade}</div>
                    </div>
                  `;
                });
                html += `
                    </div>
                  </li>
                `;
              });
      
              html += `</ul>`;
              itensPedidoModal.innerHTML = html;
      
              // Atualiza a cor do status no modal
              const statusModal = document.getElementById('status-pedido-modal');
              if (statusModal) {
                statusModal.style.color = obterCorPorStatus(statusModal.textContent.trim());
              }
      
              modal.style.display = 'block';
              modal.dataset.pedidoId = data.pedido_id;
            })
            .catch(err => {
              console.error("Erro ao buscar itens do pedido:", err);
              alert(`Erro ao carregar os detalhes do pedido: ${err.message || ''}`);
            });
        });
      });

    // Fechar o modal de detalhes
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
      itensPedidoModal.innerHTML = '';
      modal.dataset.pedidoId = '';
    });
    window.addEventListener('click', (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
        itensPedidoModal.innerHTML = '';
        modal.dataset.pedidoId = '';
      }
    });
  
    // ------------------------------------------------------------
    // IMPRESSÃO DO PEDIDO
    // ------------------------------------------------------------
    const imprimirButtons = document.querySelectorAll('.imprimir-pedido');
    imprimirButtons.forEach(button => {
      button.addEventListener('click', function() {
        const pedidoId = this.getAttribute('data-pedido-id');
        if (pedidoId) {
          window.open(`/imprimir/${pedidoId}/`, '_blank');
        } else {
          alert('ID do pedido não encontrado.');
        }
      });
    });
  
    // ------------------------------------------------------------
    // ALTERAR STATUS DO PEDIDO
    // ------------------------------------------------------------
    const botoesAlterarStatus = document.querySelectorAll('.alterar-status');
    function atualizarStatusPedido(novoStatus, pedidoId) {
      if (!pedidoId) {
        alert("ID do pedido não encontrado.");
        return;
      }
  
      const csrftoken = getCookie('csrftoken');
  
      fetch('/atualizar-status-pedido/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken    
        },
        body: JSON.stringify({
          'pedido_id': pedidoId,
          'novo_status': novoStatus
        })
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => { throw data; });
          }
          return response.json();
        })
        .then(data => {
          alert(data.mensagem);
  
          // Atualiza o status na linha da tabela
          const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"] .status-pedido`);
          if (pedidoRow) {
            const statusSpan = pedidoRow.querySelector('span');
            if (statusSpan) {
              statusSpan.textContent = novoStatus;
            } else {
              pedidoRow.textContent = novoStatus;
            }
            pedidoRow.style.color = obterCorPorStatus(novoStatus);
          }
  
          // Atualiza o status no modal, se aberto
          const statusModal = document.getElementById('status-pedido-modal');
          if (statusModal) {
            statusModal.textContent = novoStatus;
            statusModal.style.color = obterCorPorStatus(novoStatus);
          }
        })
        .catch(err => {
          console.error("Erro ao atualizar o status do pedido:", err);
          alert(err.erro || 'Erro ao atualizar o status do pedido.');
        });
    }
    botoesAlterarStatus.forEach(button => {
      button.addEventListener('click', function() {
        const pedidoId = this.getAttribute('data-pedido-id');
        const novoStatus = this.getAttribute('data-novo-status');
        if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
          atualizarStatusPedido(novoStatus, pedidoId);
        }
      });
    });
  
    // ------------------------------------------------------------
    // CANCELAMENTO COM SENHA DE GERENTE
    // ------------------------------------------------------------
    const modalSenhaGerente = document.getElementById('modalSenhaGerente');
    const modalContent = document.querySelector('.modal-content');
    const closeGerenteModal = document.getElementById('closeGerenteModal');
    const senhaGerenteInput = modalSenhaGerente.querySelector('.senha-gerente');
    const motivoCancelamentoInput = modalSenhaGerente.querySelector('.motivo-cancelamento');
    const confirmarCancelamentoBtn = document.getElementById('confirmarCancelamentoBtn');
    let pedidoIdParaCancelar = null;
  
    // Abre o modal de cancelamento
    document.querySelectorAll('.cancelar-gerente').forEach(button => {
      button.addEventListener('click', () => {
        pedidoIdParaCancelar = button.getAttribute('data-pedido-id');
        senhaGerenteInput.value = '';
        motivoCancelamentoInput.value = '';
        modalSenhaGerente.style.display = 'block';
        modalContent.style.maxWidth = '400px';
      });
    });
  
    // Fecha o modal de cancelamento
    closeGerenteModal.addEventListener('click', () => {
      modalSenhaGerente.style.display = 'none';
      pedidoIdParaCancelar = null;
    });
    window.addEventListener('click', (event) => {
      if (event.target === modalSenhaGerente) {
        modalSenhaGerente.style.display = 'none';
        pedidoIdParaCancelar = null;
      }
    });
  
    // Confirma o cancelamento (envia senha e motivo para o backend)
    confirmarCancelamentoBtn.addEventListener('click', () => {
      if (!pedidoIdParaCancelar) {
        alert('Pedido não encontrado.');
        return;
      }
      const senhaDigitada = senhaGerenteInput.value.trim();
      const motivoCancelamento = motivoCancelamentoInput.value.trim();
      
      if (!senhaDigitada) {
        alert('Digite a senha de um usuário nível 3.');
        return;
      }
      if (!motivoCancelamento) {
        alert('Digite o motivo do cancelamento.');
        return;
      }
  
      const csrftoken = getCookie('csrftoken');
  
      fetch(`/cancelar-pedido/${pedidoIdParaCancelar}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ 
          senhaNivel3: senhaDigitada,
          motivoCancelamento: motivoCancelamento 
        })
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => { throw data; });
          }
          return response.json();
        })
        .then(data => {
          alert('Pedido cancelado com sucesso!');
          modalSenhaGerente.style.display = 'none';
          window.location.reload();
        })
        .catch(err => {
          console.error(err);
          alert(err.erro || 'Erro ao cancelar o pedido. Verifique a senha.');
        });
    });
  });
  