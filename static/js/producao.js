// pedidos/static/js/producao.js

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todos os botões de "Detalhes"
    const botoes = document.querySelectorAll('.ver-detalhes');
    console.log('Número de botões encontrados:', botoes.length);
  
    // Seleciona o Modal e seus elementos
    const modal = document.getElementById('detalhesModal');
    const closeButton = document.querySelector('.close-button');
    const itensPedidoModal = document.querySelector('.itens-do-pedido-modal');
    const botoesStatus = document.querySelectorAll('.alterar-status');
  
    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        const pedidoId = btn.dataset.pedidoId;
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
              <h2>Pedido #${pedidoId}</h2>
              <p><strong>Cliente:</strong> ${data.cliente}</p>
              <p><strong>Vendedor:</strong> ${data.vendedor_nome}</p>
              <p><strong>Data:</strong> ${data.data}</p>
              <p><strong>Hora:</strong> ${data.hora}</p>
              <p><strong>Status:</strong> <span id="status-pedido-modal">${data.status}</span></p>
              <h3>Itens do Pedido:</h3>
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

            // Armazena o ID do pedido no modal para referência
            modal.dataset.pedidoId = pedidoId;
          })
          .catch(err => {
            console.error("Erro ao buscar itens do pedido:", err);
            alert("Ocorreu um erro ao carregar os detalhes do pedido.");
          });
      });
    });

    /**
     * Função para obter o valor de um cookie pelo nome
     */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Verifica se este cookie começa com o nome desejado
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
            }
          }
        }
        return cookieValue;
    }

    // Função para atualizar o status do pedido
    function atualizarStatusPedido(novoStatus) {
      const pedidoId = modal.dataset.pedidoId;
      if (!pedidoId) {
        alert("ID do pedido não encontrado.");
        return;
      }

      const csrftoken = getCookie('csrftoken');
      console.log(`CSRF Token: ${csrftoken}`);

      fetch('pedido/atualizar-status-pedido/', {
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
        console.log('Resposta da requisição:', response);
        if (!response.ok) {
            return response.json().then(data => { throw data; });
        }
        return response.json();
      })
      .then(data => {
        console.log('Dados recebidos:', data);
        alert(data.mensagem);
        // Atualizar o status no modal
        document.getElementById('status-pedido-modal').textContent = novoStatus;
        // Atualizar o status na tabela principal
        const pedidoRow = document.querySelector(`.pedido-resumo[data-pedido-id="${pedidoId}"] .status-pedido`);
        if (pedidoRow) {
          pedidoRow.textContent = novoStatus;
        }
        // Fechar o modal após atualização
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

    // Adicionar eventos aos botões de alterar status
    botoesStatus.forEach(btn => {
      btn.addEventListener('click', () => {
        const novoStatus = btn.dataset.novoStatus;
        if (confirm(`Deseja realmente marcar o pedido como '${novoStatus}'?`)) {
          atualizarStatusPedido(novoStatus);
        }
      });
    });

    // Fechar o Modal ao clicar no botão de fechar
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
      itensPedidoModal.innerHTML = '';
      modal.dataset.pedidoId = ''; // Limpa o ID do pedido
    });

    // Fechar o Modal ao clicar fora do conteúdo
    window.addEventListener('click', (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
        itensPedidoModal.innerHTML = '';
        modal.dataset.pedidoId = ''; // Limpa o ID do pedido
      }
    });
});
