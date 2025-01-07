document.addEventListener('DOMContentLoaded', function() {

  // Seleciona todos os botões de "Detalhes" e "Imprimir Pedido"
  const buttonsDetalhes = document.querySelectorAll('.ver-detalhes');
  const imprimirButtons = document.querySelectorAll('.imprimir-pedido');

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
  function atualizarStatusPedido(novoStatus) {
      const pedidoId = modal.dataset.pedidoId;
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
          // Atualiza o status no modal
          document.getElementById('status-pedido-modal').textContent = novoStatus;
          // Atualiza o status na tabela principal
          const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"] .status-pedido`);
          if (pedidoRow) {
              pedidoRow.textContent = novoStatus;
          }
          // Fecha o modal após atualização
          modal.style.display = 'none';
          itensPedidoModal.innerHTML = '';
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

  // Lida com cliques nos botões "Detalhes" para abrir o modal e carregar detalhes do pedido
  buttonsDetalhes.forEach(button => {
      button.addEventListener('click', function() {
          const pedidoId = this.getAttribute('data-pedido-id');
          console.log(`Buscando detalhes para o Pedido ID: ${pedidoId}`);
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
                      <div class=conteudo>
                      <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
                      <p><strong>Pedido </strong> ${pedidoId}</p>
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
                  // Armazena o ID do pedido no modal para referência futura
                  modal.dataset.pedidoId = pedidoId;
              })
              .catch(err => {
                  console.error("Erro ao buscar itens do pedido:", err);
                  alert("Ocorreu um erro ao carregar os detalhes do pedido.");
              });
      });
  });

  // Lida com cliques nos botões "Imprimir Pedido" para abrir a página de impressão numa nova aba
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

  // Seleciona botões de alterar status dentro do modal
  const botoesStatus = document.querySelectorAll('.alterar-status');
  botoesStatus.forEach(btn => {
      btn.addEventListener('click', () => {
          const novoStatus = btn.dataset.novoStatus;
          if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
              atualizarStatusPedido(novoStatus);
          }
      });
  });

});
