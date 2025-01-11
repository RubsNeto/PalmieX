document.addEventListener('DOMContentLoaded', function() {


    const rows = document.querySelectorAll('.pedidos-table tbody tr');

    rows.forEach((row, index) => {
      row.style.animationDelay = `${index * 0.15}s`; // Delay progressivo
    });

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


  
  buttonsDetalhes.forEach(button => {
    button.addEventListener('click', function() {
      const pedidoId = this.getAttribute('data-pedido-id');
      console.log('Buscando itens para o pedido:', pedidoId);
      fetch(`/api/pedido/${pedidoId}/itens/`)
        .then(resp => {
          console.log('Resposta da API:', resp);
          if (!resp.ok) {
            throw new Error(`Erro na requisição: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then(data => {
          console.log('Dados recebidos:', data);
  
          // Verifica se data.itens existe e é um array
          if (!data || !Array.isArray(data.itens)) {
            throw new Error('Estrutura inesperada da resposta da API.');
          }
  
          // Ordenar itens por código e, dentro do mesmo código, por tamanho de forma decrescente
        data.itens.sort((a, b) => {
            const codigoA = String(a.codigo || '');
            const codigoB = String(b.codigo || '');
            const tamanhoA = String(a.tamanho || '');
            const tamanhoB = String(b.tamanho || '');
        
            if (codigoA !== codigoB) {
            return codigoB.localeCompare(codigoA); // Ordem decrescente para código
            }
            return tamanhoB.localeCompare(tamanhoA);   // Ordem decrescente para tamanho
        });
  
  
          const produtosAgrupados = {};
          data.itens.forEach(item => {
            const chave = `${item.codigo}-${item.nome}`;
            if (!produtosAgrupados[chave]) {
              produtosAgrupados[chave] = {
                codigo: item.codigo,
                nome: item.nome,
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
              <p><strong>Pedido:</strong> ${pedidoId}</p>
              <p><strong>Data:</strong> ${data.data}</p>
              <p><strong>Hora:</strong> ${data.hora}</p>
              <p><strong>Status:</strong> <span id="status-pedido-modal">${data.status}</span></p>
            </div>
            <ul class="lista-itens">
          `;
  
          Object.values(produtosAgrupados).forEach(produto => {
            html += `<li class="item-list">`;
            html += `<div class="produto-cabecalho">`;
            if(produto.codigo && produto.codigo !== produto.nome) {
              html += `<span class="item-codigo" style = "font-size: 17px"><strong>Código:</strong> ${produto.codigo}</span>`;
            }
            html += `<span class="item-nome" style = "font-size: 17px"><strong>Produto:</strong> ${produto.nome}</span>`;
            html += `</div>`;
  
            html += `<ul class="lista-tamanhos">`;
            produto.tamanhos.forEach(item => {
              html += `<li><strong>Tamanho:</strong> ${item.tamanho} – <strong>Quantidade:</strong> ${item.quantidade}</li>`;
            });
            html += `</ul>`;
  
            html += `</li>`;
          });
  
          html += `</ul>`;
          itensPedidoModal.innerHTML = html;
          modal.style.display = 'block';
          modal.dataset.pedidoId = pedidoId;
        })
        .catch(err => {
          console.error("Erro ao buscar itens do pedido:", err);
          alert(`Ocorreu um erro ao carregar os detalhes do pedido: ${err.message || ''}`);
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
