document.addEventListener('DOMContentLoaded', function() {


    // Função para mapear status em cores
  function obterCorPorStatus(status) {
    if(status === 'Pendente') {
      return '#ffc107';
    } else if(status === 'Em Produção') {
      return '#17a2b8';
    } else if(status === 'Pedido Finalizado') {
      return '#00b244';
    } else if(status === 'Cliente em Espera') {
        return '#ff0000';
    } else if(status === 'Cancelado') {
        return '#ff0000';
    } else {
      return '#333';
    }
  }

  

  // Define a cor inicial para cada status-pedido ao carregar a página
  const statusCells = document.querySelectorAll('.status-pedido');
  statusCells.forEach(cell => {
    const statusSpan = cell.querySelector('span');
    if(statusSpan) {
      const statusTexto = statusSpan.textContent.trim();
      cell.style.color = obterCorPorStatus(statusTexto);
    }
  });

  // Seleciona os botões
  const buttonsDetalhes = document.querySelectorAll('.ver-detalhes');
  const imprimirButtons = document.querySelectorAll('.imprimir-pedido');
  const botoesAlterarStatus = document.querySelectorAll('.alterar-status');
  const botoesAlterarStatusModal = document.querySelectorAll('.alterar-status-modal');

  const modal = document.getElementById('detalhesModal');
  const closeButton = modal.querySelector('.close-button');
  const itensPedidoModal = document.querySelector('.itens-do-pedido-modal');

  // Função para obter valor de cookie
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

  // Função para atualizar status do pedido
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
            // Atualiza o texto do status
            const statusSpan = pedidoRow.querySelector('span');
            if (statusSpan) {
                statusSpan.textContent = novoStatus;
            } else {
                pedidoRow.textContent = novoStatus;
            }
            // Atualiza a cor do status
            pedidoRow.style.color = obterCorPorStatus(novoStatus);
        }
        // Atualiza o status no modal
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

  // Lida com cliques nos botões "Detalhes"
  buttonsDetalhes.forEach(button => {
      button.addEventListener('click', function() {
          const pedidoId = this.getAttribute('data-pedido-id');
          fetch(`/api/pedido/${pedidoId}/itens/`)
              .then(resp => {
                  if (!resp.ok) {
                      throw new Error(`Erro na requisição: ${resp.statusText}`);
                  }
                  return resp.json();
              })
              .then(data => {
                  let html = `
                    <h2>Cliente: ${data.cliente}</h2>  
                    <div class="conteudo">
                      <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
                      <p><strong>Pedido:</strong> ${pedidoId}</p>
                      <p><strong>Data:</strong> ${data.data}</p>
                      <p><strong>Hora:</strong> ${data.hora}</p>
                      <p><strong>Status:</strong> <span id="status-pedido-modal">${data.status}</span></p>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nome</th>
                          <th>Tamanho</th>
                          <th>Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                  `;
                  data.itens.forEach(item => {
                      html += `
                        <tr>
                          <td>${item.codigo}</td>
                          <td>${item.nome}</td>
                          <td>${item.tamanho}</td>
                          <td>${item.quantidade}</td>
                        </tr>
                      `;
                  });
                  html += `
                      </tbody>
                    </table>
                  `;
                  itensPedidoModal.innerHTML = html;
                  modal.style.display = 'block';
                  modal.dataset.pedidoId = pedidoId;
              })
              .catch(err => {
                  console.error("Erro ao buscar itens do pedido:", err);
                  alert("Ocorreu um erro ao carregar os detalhes do pedido.");
              });
      });
  });

  // Lida com cliques nos botões "Imprimir Pedido"
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

  // Eventos para fechar o modal
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

  // Lida com cliques nos botões "Alterar Status" na tabela
  botoesAlterarStatus.forEach(button => {
      button.addEventListener('click', function() {
          const pedidoId = this.getAttribute('data-pedido-id');
          const novoStatus = this.getAttribute('data-novo-status');
          if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
              atualizarStatusPedido(novoStatus, pedidoId);
          }
      });
  });

  // Lida com cliques nos botões "Alterar Status" no modal
  botoesAlterarStatusModal.forEach(button => {
      button.addEventListener('click', function() {
          const pedidoId = modal.dataset.pedidoId;
          const novoStatus = this.getAttribute('data-novo-status');
          if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
              atualizarStatusPedido(novoStatus, pedidoId);
          }
      });
  });

});


// Lida com cliques nos botões "Alterar Status" no modal
botoesAlterarStatusModal.forEach(button => {
    button.addEventListener('click', function() {
        const pedidoId = modal.dataset.pedidoId;
        const novoStatus = this.getAttribute('data-novo-status');
        if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
            atualizarStatusPedido(novoStatus, pedidoId);
        }
    });
});
