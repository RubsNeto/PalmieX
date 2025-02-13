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

  // Função que mapeia os status para cores de acordo com a área
  function obterCorPorStatus(status, area) {
    if (area === 'balancinho' || area === 'solado') {
      if (status === 'Pendente') {
        return '#f3a600';  // amarelo
      } else if (status === 'Em Produção') {
        return '#17a2b8';  // azul
      } else if (status === 'Pedido Finalizado') {
        return '#00b244';  // verde
      } else if (status === 'Cliente em Espera') {
        return '#610061';
      } else if (status === 'Cancelado') {
        return '#ff0000';  // vermelho
      } else if (status === 'Pedido Pronto') {
        return '#4caf50';
      } else if (status === 'Reposição Pendente') {
        return '#862fab';
      } else {
        return '#333';     // cor padrão
      }
    } else {
      return '#333';
    }
  }

  // Atualiza as cores dos status já presentes no DOM
  function atualizarCoresStatus() {
    // Atualiza os status da coluna "Balancinho"
    document.querySelectorAll('.status-balancinho span').forEach(cell => {
      const statusTexto = cell.textContent.trim();
      cell.parentElement.style.color = obterCorPorStatus(statusTexto, 'balancinho');
    });
    // Atualiza os status da coluna "Solado"
    document.querySelectorAll('.status-solado span').forEach(cell => {
      const statusTexto = cell.textContent.trim();
      cell.parentElement.style.color = obterCorPorStatus(statusTexto, 'solado');
    });
  }
  atualizarCoresStatus();

  // Aplica um delay progressivo na animação de cada linha da tabela
  const rows = document.querySelectorAll('.pedidos-table tbody tr');
  rows.forEach((row, index) => {
    row.style.animationDelay = (index * 0.15) + 's';
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

          // Agrupa e ordena os itens para exibição
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

          const produtosAgrupados = {};
          data.itens.forEach(item => {
            const chave = `${item.codigo}-${item.nome}`;
            if (!produtosAgrupados[chave]) {
              produtosAgrupados[chave] = {
                codigo: item.codigo,
                nome: item.nome,
                sintetico: item.sintetico,
                cor: item.cor,
                corPalmilha: item.corPalmilha,
                obs: item.obs,
                ref_balancinho: item.ref_balancinho,
                espessura: item.espessura,
                ref_palmilha: item.ref_palmilha,
                mat_palmilha: item.mat_palmilha,
                tipo_servico: item.tipo_servico,
                marca: item.marca,
                tamanhos: []
              };
            }
            produtosAgrupados[chave].tamanhos.push({
              tamanho: item.tamanho,
              quantidade: item.quantidade
            });
          });

          let html = `
            <h2>Cliente: ${data.cliente}</h2>
            <div class="conteudo">
              <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
              <p><strong>Pedido:</strong> ${data.pedido_id}</p>
              <p><strong>Data:</strong> ${data.data}</p>
              <p><strong>Hora:</strong> ${data.hora}</p>
              <p><strong>Status: <span id="pedido-status-modal" style="color: ${obterCorPorStatus(data.status_balancinho, 'balancinho')};">
                ${data.status_balancinho}</strong>
              </span></p>

              ${data.status_balancinho === 'Cancelado' ? 
                `<p><strong>Autorizado por:</strong> 
                  <span class="gerente-cancelamento">${data.gerente_cancelamento || 'N/A'}</span>
                </p>`:''}

              </div>

              ${data.status_balancinho === 'Cancelado' ? 
                `<p><strong>Motivo do Cancelamento:</strong> 
                  <span class="motivo-cancelamento">${data.motivo_cancelamento || 'N/A'}</span>
                </p>`:''}
            ${data.descricao_reposicao ? `<p><strong>Reposicao</strong> ${data.descricao_reposicao}</p>` : ''}
            <ul class="lista-itens">
          `;

          const todosTamanhos = Array.from({ length: 43 - 15 + 1 }, (_, i) => i + 15);

          Object.values(produtosAgrupados).forEach(produto => {
            html += `
              <li class="item-list">
                <div class="produto-cabecalho">
                  <span class="item-nome">
                    <div>
                      ${ (productionArea === 'balancinho' || productionArea === 'vendedor') 
                          ? `<p><strong>Ref. Sintético:</strong> ${produto.ref_balancinho || ''}</p>`
                          : ''
                      }
                      ${ (productionArea === 'solado' || productionArea === 'vendedor' ) 
                          ? `<p><strong>Ref. Solado:</strong> ${produto.ref_palmilha || '' }</p>`
                          : ''
                      }
                    </div>
                    <div>
                      ${ (productionArea === 'balancinho' || productionArea === 'vendedor') 
                          ? `<p><strong>Sintético:</strong> ${produto.sintetico || ''}</p>` /////////////////////////////////////////////////////
                          : ''
                      }
                      ${ (productionArea === 'solado' || productionArea === 'vendedor' ) 
                          ? `<p><strong>Solado:</strong> ${produto.mat_palmilha || ''}</p>` 
                          : ''
                      }
                    </div>
                    <div>
                      ${ (productionArea === 'balancinho' || productionArea === 'vendedor') 
                          ? `<p><strong>Cor Sintético:</strong> ${produto.cor || ''}</p>`
                          : ''
                      }
                      ${ (productionArea === 'solado' || productionArea === 'vendedor') 
                          ? `<p><strong>Cor Solado:</strong> ${produto.corPalmilha || ''}</p>`
                          : ''
                      }
                    </div>
                    
                      ${
                        (productionArea === 'balancinho' || productionArea === 'vendedor')
                          ? `<div>
                              <p><strong>Serviço:</strong> ${produto.tipo_servico || 'Nenhum'}</p>
                            </div>`
                          : ''
                      }
                    
                    ${
                      (productionArea === 'vendedor')
                        ? `<div><p><strong>Marca:</strong> ${produto.marca || ''}</p></div>`
                        : ''
                    }

                    ${
                      (productionArea === 'balancinho')
                        ? `<div><p><strong>Marca:</strong> ${produto.marca || ''}</p></div>`
                        : ''
                    }

                    ${
                      (productionArea === 'balancinho' || productionArea === 'vendedor')
                      ? `<div><p><strong>Espessura Palmilha:</strong> ${produto.espessura || '0'} mm</p></div>`
                      : ''
                    }

                  </span> 
                  <div class="obs">
                    ${produto.obs ? `<p><strong>Obs:</strong> ${produto.obs}</p>` : ''}
                  </div>
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

          const statusModal = document.getElementById('status-pedido-modal');
          if (statusModal) {
            statusModal.style.color = obterCorPorStatus(statusModal.textContent.trim(), productionArea);
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
  // VARIÁVEIS GLOBAIS PARA REPOSIÇÃO PENDENTE
  // ------------------------------------------------------------
  let pedidoIdReposicao = null;
  let novoStatusReposicao = null;

  // ------------------------------------------------------------
  // ALTERAR STATUS DO PEDIDO
  // ------------------------------------------------------------
  const botoesAlterarStatus = document.querySelectorAll('.alterar-status');

  // Função para atualizar o status (para status que não necessitam de modal)
  function atualizarStatusPedido(novoStatus, pedidoId, area) {
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

      // Atualiza a linha do pedido na tabela
      const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"]`);
      if (pedidoRow) {
        if (area === 'solado') {
          const soladoCell = pedidoRow.querySelector("td.status-solado span");
          if (soladoCell) {
            soladoCell.textContent = novoStatus;
            soladoCell.parentElement.style.color = obterCorPorStatus(novoStatus, 'solado');
          }
        } else if (area === 'balancinho') {
          const balancinhoCell = pedidoRow.querySelector("td.status-balancinho span");
          if (balancinhoCell) {
            balancinhoCell.textContent = novoStatus;
            balancinhoCell.parentElement.style.color = obterCorPorStatus(novoStatus, 'balancinho');
          }
        }
      }

      // Se houver um modal aberto para status, atualize-o também
      const statusModal = document.getElementById('status-pedido-modal');
      if (statusModal) {
        statusModal.textContent = novoStatus;
        statusModal.style.color = obterCorPorStatus(novoStatus, area);
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
      const area = this.getAttribute('data-area');
      // Se for "Reposição Pendente", abre o modal para informar a descrição
      if (novoStatus === "Reposição Pendente") {
        pedidoIdReposicao = pedidoId;
        novoStatusReposicao = novoStatus;
        document.getElementById('modalReposicao').style.display = 'block';
      } else {
        if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
          atualizarStatusPedido(novoStatus, pedidoId, area);
        }
      }
    });
  });

  // ------------------------------------------------------------
  // MODAL PARA REPOSIÇÃO PENDENTE
  // ------------------------------------------------------------
  // Ao clicar em "Confirmar" no modal de reposição, envia o AJAX com a descrição
  document.getElementById('confirmarReposicaoBtn').addEventListener('click', function() {
    const descricao = document.getElementById('descricaoReposicao').value.trim();
    if (!descricao) {
      alert("Por favor, descreva o que está faltando.");
      return;
    }
    atualizarStatusReposicao(pedidoIdReposicao, novoStatusReposicao, descricao);

    // Fecha o modal e limpa o campo
    document.getElementById('modalReposicao').style.display = 'none';
    document.getElementById('descricaoReposicao').value = '';
    pedidoIdReposicao = null;
    novoStatusReposicao = null;
  });

  // Função para atualizar o status de "Reposição Pendente" enviando a descrição
  function atualizarStatusReposicao(pedidoId, novoStatus, descricao) {
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
        'novo_status': novoStatus,
        'descricao_reposicao': descricao
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

      // Atualiza a linha do pedido na interface
      const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"]`);
      if (pedidoRow) {
        if (productionArea === 'solado') {
          const soladoCell = pedidoRow.querySelector("td.status-solado span");
          if (soladoCell) {
            soladoCell.textContent = novoStatus;
            soladoCell.parentElement.style.color = obterCorPorStatus(novoStatus, 'solado');
          }
        } else if (productionArea === 'balancinho') {
          const balancinhoCell = pedidoRow.querySelector("td.status-balancinho span");
          if (balancinhoCell) {
            balancinhoCell.textContent = novoStatus;
            balancinhoCell.parentElement.style.color = obterCorPorStatus(novoStatus, 'balancinho');
          }
        }
      }
    })
    .catch(err => {
      console.error("Erro ao atualizar o status do pedido:", err);
      alert(err.erro || 'Erro ao atualizar o status do pedido.');
    });
  }

  // Fechamento do modal de Reposição ao clicar no "X" ou fora do modal
  document.getElementById('closeReposicaoModal').addEventListener('click', function() {
    document.getElementById('modalReposicao').style.display = 'none';
    document.getElementById('descricaoReposicao').value = '';
  });
  window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('modalReposicao')) {
      document.getElementById('modalReposicao').style.display = 'none';
      document.getElementById('descricaoReposicao').value = '';
    }
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

  document.querySelectorAll('.cancelar-gerente').forEach(button => {
    button.addEventListener('click', () => {
      pedidoIdParaCancelar = button.getAttribute('data-pedido-id');
      senhaGerenteInput.value = '';
      motivoCancelamentoInput.value = '';
      modalSenhaGerente.style.display = 'block';
      modalContent.style.maxWidth = '400px';
    });
  });

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