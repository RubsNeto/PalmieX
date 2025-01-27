document.addEventListener('DOMContentLoaded', function() {
  // ------------------------------------------------------------
  // CONFIGURAÇÕES E FUNÇÕES GERAIS
  // ------------------------------------------------------------
  
  // Função para obter valor de cookie (CSRF)
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

  // Função para mapear status em cores (customize as cores conforme desejar)
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
        return '#4caf50';       // vermelho
    } else if (status === 'Reposição Pendente') {
        return '#862fab';      // roxo
    } else {
        return '#333';          // cor padrão
    }
}



  // Animação: delay progressivo em cada linha
  const rows = document.querySelectorAll('.pedidos-table tbody tr');
  rows.forEach((row, index) => {
      row.style.animationDelay = `${index * 0.15}s`;
  });

  // Ajusta a cor do texto do status para cada pedido na tabela
  const statusCells = document.querySelectorAll('.status-pedido');
  statusCells.forEach(cell => {
      const statusSpan = cell.querySelector('span');
      if (statusSpan) {
          const statusTexto = statusSpan.textContent.trim();
          cell.style.color = obterCorPorStatus(statusTexto);
      }
  });


  // ------------------------------------------------------------
  // EXIBIR DETALHES DO PEDIDO (MODAL COM LISTA DE ITENS)
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
                    throw new Error('Estrutura inesperada da resposta da API.');
                }
            
                // Ordenar itens por código e tamanho
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
            
                // Agrupar por produto (código-nome) e incluir novos campos
                const produtosAgrupados = {};
                data.itens.forEach(item => {
                    const chave = `${item.codigo}-${item.nome}`;
                    if (!produtosAgrupados[chave]) {
                        produtosAgrupados[chave] = {
                            codigo: item.codigo,
                            nome: item.nome,
                            sintetico: item.sintetico,
                            cor: item.cor,
                            obs: item.obs,
                            ref_balancinho: item.ref_balancinho,
                            mat_balancinho: item.mat_balancinho,
                            ref_palmilha: item.ref_palmilha,
                            mat_palmilha: item.mat_palmilha,
                            tipo_servico: item.tipo_servico,
                            tamanhos: []
                        };
                    }
                    produtosAgrupados[chave].tamanhos.push({
                        tamanho: item.tamanho,
                        quantidade: item.quantidade
                    });
                });
            
                // Construir HTML do modal
                let html = `
                    <h2>Cliente: ${data.cliente}</h2>
                    <div class="conteudo">
                        <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
                        <p><strong>Pedido:</strong> ${modal.dataset.pedidoId}</p>
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
            
                const todosTamanhos = Array.from({ length: 43 - 15 + 1 }, (_, i) => i + 15);
            
                Object.values(produtosAgrupados).forEach(produto => {
                    html += `
                        <li class="item-list">
                        <div class="produto-cabecalho">
                            <span class="item-nome">
                              <strong>Produto:</strong> ${produto.nome} 
                              <strong>Código:</strong> ${produto.codigo} 
                              <strong>Ref.Balancinho:</strong> ${produto.ref_balancinho || ''} 
                              <strong>Balancinho:</strong> ${produto.mat_balancinho || ''} 
                              <strong>Ref.Palmilha:</strong> ${produto.ref_palmilha || ''} 
                              <strong>Palmilha:</strong> ${produto.mat_palmilha || ''} 
                            </span>
                            <span class="item-nome">
                              <strong>Serviço:</strong> ${produto.tipo_servico || 'Nenhum'} 
                              <strong>Sintético:</strong> ${produto.sintetico}
                              <strong>Cor:</strong> ${produto.cor}
                              <strong>Obs:</strong> ${produto.obs}
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
                            <div class="numero" contenteditable="false">
                              ${quantidade}
                            </div>
                        </div>
                        `;
                    });
            
                    html += `
                        </div> <!-- fecha containerQuadradinhos -->
                        </li>
                    `;
                });
            
                html += `</ul>`;
                itensPedidoModal.innerHTML = html;
            
                // Aplicar cor ao status
                const statusModal = document.getElementById('status-pedido-modal');
                if (statusModal) {
                    statusModal.style.color = obterCorPorStatus(statusModal.textContent.trim());
                }
            
                modal.style.display = 'block';
                modal.dataset.pedidoId = data.pedido_id; // opcional se desejar armazenar ID no modal
            })
            .catch(err => {
                console.error("Erro ao buscar itens do pedido:", err);
                alert(`Ocorreu um erro ao carregar os detalhes do pedido: ${err.message || ''}`);
            });
      });
  });

  // Botão "Fechar" do modal de detalhes
  closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
      itensPedidoModal.innerHTML = '';
      modal.dataset.pedidoId = '';
  });

  // Fecha modal de detalhes se clicar fora dele
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
              const url = `/imprimir/${pedidoId}/`;
              window.open(url, '_blank');
          } else {
              alert('ID do pedido não encontrado.');
          }
      });
  });


  // ------------------------------------------------------------
  // ALTERAR STATUS (PENDENTE -> EM PRODUÇÃO -> FINALIZADO)
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

          // Atualiza o status na tabela principal
          const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"] .status-pedido`);
          if (pedidoRow) {
              const statusSpan = pedidoRow.querySelector('span');
              if (statusSpan) {
                  statusSpan.textContent = novoStatus;
              } else {
                  // Se não tiver o <span>, define o texto inteiro
                  pedidoRow.textContent = novoStatus;
              }
              pedidoRow.style.color = obterCorPorStatus(novoStatus);
          }

          // Atualiza o status no modal (se estiver aberto)
          const statusModal = document.getElementById('status-pedido-modal');
          if (statusModal) {
              statusModal.textContent = novoStatus;
              statusModal.style.color = obterCorPorStatus(novoStatus);
          }
      })
      .catch(err => {
          console.error("Erro ao atualizar o status do pedido:", err);
          if (err.erro) {
              alert(`Erro: ${err.erro}`);
          } else {
              alert('Ocorreu um erro ao atualizar o status do pedido.');
          }
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
  // NOVA LÓGICA: CANCELAMENTO VIA SENHA DE USUÁRIO NÍVEL 3
  // ------------------------------------------------------------

  // 1. Criamos (ou selecionamos) o modal de senha do gerente
  const modalSenhaGerente = document.getElementById('modalSenhaGerente');
  const modalcontent = document.querySelector('.modal-content');
  const closeGerenteModal = document.getElementById('closeGerenteModal');
  const senhaGerenteInput = modalSenhaGerente.querySelector('.senha-gerente');
  const confirmarCancelamentoBtn = document.getElementById('confirmarCancelamentoBtn');
  const motivoCancelamentoInput = modalSenhaGerente.querySelector('.motivo-cancelamento');

  // 2. Armazenaremos o pedidoId que o gerente quer cancelar
  let pedidoIdParaCancelar = null;

  // 3. Selecionar todos os botões "cancelar-gerente"
  //    (Você deve ter algo como: <button class="cancelar-gerente" data-pedido-id="...">)
  document.querySelectorAll('.cancelar-gerente').forEach(button => {
      button.addEventListener('click', () => {
          pedidoIdParaCancelar = button.getAttribute('data-pedido-id');
          // Limpa a senha antes de abrir o modal
          senhaGerenteInput.value = '';
          motivoCancelamentoInput.value = '';
          modalSenhaGerente.style.display = 'block';
          modalcontent.style.maxWidth = '400px';
      });
  });

  // 4. Fechar modal ao clicar no X
  closeGerenteModal.addEventListener('click', () => {
      modalSenhaGerente.style.display = 'none';
      pedidoIdParaCancelar = null;
  });

  // 5. Fechar modal se clicar fora do conteúdo
  window.addEventListener('click', (event) => {
      if (event.target === modalSenhaGerente) {
          modalSenhaGerente.style.display = 'none';
          pedidoIdParaCancelar = null;
      }
  });

  // 6. Confirmar cancelamento (enviando senha ao back-end)
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
          // (Opcional) recarrega a página ou atualiza o status na tabela
          window.location.reload();
      })
      .catch(err => {
          console.error(err);
          alert(err.erro || 'Erro ao cancelar o pedido. Verifique a senha.');
      });
  });

});
