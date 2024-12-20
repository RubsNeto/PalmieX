// Função para atualizar o total de pares de um único pedido
function atualizarParesPedido(pedidoItem) {
    const numeros = pedidoItem.querySelectorAll('.numero');
    let soma = 0;
    numeros.forEach(num => {
        const valor = parseInt(num.textContent.trim(), 10) || 0;
        soma += valor;
    });
    const paresValorElem = pedidoItem.querySelector('.paresValor');
    if (paresValorElem) {
        paresValorElem.textContent = soma;
    }
    return soma;
}

// Função para atualizar o total global de todos os pedidos
function atualizarTotalGlobal() {
    const pedidoItens = document.querySelectorAll('.pedido-item');
    let somaGlobal = 0;
    pedidoItens.forEach(pedido => {
        somaGlobal += atualizarParesPedido(pedido);
    });
    const valorTotalElem = document.querySelector('.valorTotal b');
    if (valorTotalElem) {
        valorTotalElem.textContent = somaGlobal;
    }
}

// Função para coletar dados de todos os pedidos (para realizar pedido)
function coletarDadosPedidos() {
    const dados = {};

    const clienteInput = document.querySelector('.cliente');
    const codVendedorInput = document.querySelector('.codVendedor');
    const vendedorInput = document.querySelector('.vendedor');

    dados.cliente = clienteInput ? clienteInput.value : '';
    dados.codigoVendedor = codVendedorInput ? codVendedorInput.value : '';
    dados.vendedor = vendedorInput ? vendedorInput.value : '';
    dados.pedidos = [];

    const pedidoItens = document.querySelectorAll('.pedido-item');
    pedidoItens.forEach(pedido => {
        const referencia = pedido.querySelector('.referencia') ? pedido.querySelector('.referencia').value : '';
        const material = pedido.querySelector('.material') ? pedido.querySelector('.material').value : '';

        const tamanhos = {};
        const botaoContainers = pedido.querySelectorAll('.botao-container');
        botaoContainers.forEach((bc) => {
            const botao = bc.querySelector('.botao');
            const numeroDiv = bc.querySelector('.numero');
            if (botao && numeroDiv) {
                const tamanho = botao.textContent.trim();
                const valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                // Somente adiciona ao objeto se valor > 0, já que não queremos zeros
                if (valor > 0) {
                    tamanhos[tamanho] = valor;
                }
            }
        });

        dados.pedidos.push({
            referencia: referencia,
            material: material,
            tamanhos: tamanhos
        });
    });

    return dados;
}

// Função para aplicar estilo e mostrar/esconder zero
function atualizarEstiloValor(botaoContainer, valor) {
    const numeroDiv = botaoContainer.querySelector('.numero');

    if (valor > 0) {
        // Exibe o valor
        numeroDiv.textContent = valor;
        botaoContainer.classList.add('valor-positivo');
    } else {
        // Se valor = 0, não mostra nada (string vazia)
        numeroDiv.textContent = '';
        botaoContainer.classList.remove('valor-positivo');
    }
}

// Função para adicionar eventos a um pedido específico
function adicionarEventosPedido(pedidoItem) {
    // Incremento ao clicar no botão
    const botoes = pedidoItem.querySelectorAll('.botao');
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const botaoContainer = botao.parentElement;
            const numeroDiv = botaoContainer.querySelector('.numero');
            let valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
            valor += 1;

            atualizarEstiloValor(botaoContainer, valor);
            atualizarTotalGlobal();
        });
    });

    // Edição manual do valor
    const numeros = pedidoItem.querySelectorAll('.numero');
    numeros.forEach(num => {
        num.addEventListener('input', () => {
            let valor = parseInt(num.textContent.trim(), 10);
            if (isNaN(valor)) {
                valor = 0; 
            }

            // Aplica a lógica de esconder zero
            atualizarEstiloValor(num.parentElement, valor);
            atualizarTotalGlobal();
        });
    });

    // Remover pedido
    const removerBtn = pedidoItem.querySelector('.removerPedido');
    if (removerBtn) {
        removerBtn.addEventListener('click', () => {
            if (confirm("Deseja realmente remover este pedido?")) {
                pedidoItem.remove();
                atualizarTotalGlobal();
            }
        });
    }

    // Adicionar novo pedido
    const adicionarBtn = pedidoItem.querySelector('.adicionarPedido');
    if (adicionarBtn) {
        adicionarBtn.addEventListener('click', () => {
            const lista = document.querySelector('.lista-pedidos');

            const novoPedido = document.createElement('div');
            novoPedido.classList.add('pedido-item');

            // HTML do novo pedido com +, -, e Inf
            novoPedido.innerHTML = `
                <div class="pedidos">
                    <span class="campo">Referência:</span>
                    <input type="text" class="referencia">

                    <span class="campo">Material:</span>
                    <input type="text" class="material">

                    <div class="maisEmenos">
                        <button type="button" class="adicionarPedido">+</button>
                        <button type="button" class="removerPedido">-</button>
                        <button type="button" class="adicionarInfantil">Inf</button>
                    </div>
                </div>
                <div class="container containerQuadradinhos">
                    <!-- Quadradinhos Iniciais (15 a 43) -->
                    ${[...Array(14).keys()].map(i => {
                        const num = i + 30;
                        return `
                        <div class="botao-container">
                            <button class="botao">${num}</button>
                            <div class="numero" contenteditable="true"></div>
                        </div>`;
                    }).join('')}
                    <h5 class="pares">Pares: <b class="paresValor">0</b></h5>
                </div>
            `;

            lista.appendChild(novoPedido);
            adicionarEventosPedido(novoPedido);
            atualizarTotalGlobal();
        });
    }

    // Buscar material ao mudar referência
    const referenciaInput = pedidoItem.querySelector('.referencia');
    const materialInput = pedidoItem.querySelector('.material');
    if (referenciaInput && materialInput) {
        referenciaInput.addEventListener('input', function() {
            const referencia = this.value;
            fetch(`/buscar-material/?referencia=${encodeURIComponent(referencia)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.tamanho) {
                        materialInput.value = `Tamanho ${data.tamanho}`;
                    } else {
                        alert(data.erro);
                    }
                });
        });
    }

    // Adicionar funcionalidades para o botão Inf dentro deste pedido
    const botaoInf = pedidoItem.querySelector('.adicionarInfantil');
    const containerQuadradinhos = pedidoItem.querySelector('.containerQuadradinhos');

    if (botaoInf && containerQuadradinhos) {
        // Flag para evitar múltiplos cliques adicionando os mesmos botões
        let infAdicionado = false;

        botaoInf.addEventListener('click', () => {
            if (infAdicionado) {
                alert('Os botões de 15 a 29 já foram adicionados para este pedido.');
                return;
            }

            const inicio = 29;
            const fim = 15;
            let proximoTabindexBotao = containerQuadradinhos.querySelectorAll('.botao').length + 1; // Ajusta o tabindex baseado nos botões existentes
            let proximoTabindexNumero = containerQuadradinhos.querySelectorAll('.numero').length + 1;

            for (let num = inicio; num >= fim; num--) {
                // Verifica se o botão já existe
                const existe = Array.from(containerQuadradinhos.querySelectorAll('.botao')).some(botao => parseInt(botao.textContent) === num);
                if (existe) continue; // Pula se o botão já existir

                // Cria o container do quadradinho
                const botaoContainer = document.createElement('div');
                botaoContainer.className = 'botao-container';

                // Cria o botão
                const botao = document.createElement('button');
                botao.className = 'botao';
                botao.textContent = num;
                botao.setAttribute('tabindex', proximoTabindexBotao);
                proximoTabindexBotao++;

                // Cria o campo de escrita (div.numero)
                const numeroDiv = document.createElement('div');
                numeroDiv.className = 'numero';
                numeroDiv.setAttribute('contenteditable', 'true');
                numeroDiv.setAttribute('tabindex', proximoTabindexNumero);
                numeroDiv.setAttribute('aria-label', `Número ${num}`);
                numeroDiv.textContent = ''; // Mantém o div.numero vazio

                // Adiciona o botão e o div.numero ao container
                botaoContainer.appendChild(botao);
                botaoContainer.appendChild(numeroDiv);

                // Adiciona o container ao container principal
                containerQuadradinhos.insertBefore(botaoContainer, containerQuadradinhos.firstChild); // Insere no início para manter a ordem

                // Adiciona evento de incremento ao novo botão
                botao.addEventListener('click', () => {
                    let valor = parseInt(numeroDiv.textContent.trim(), 10) || 0;
                    valor += 1;
                    atualizarEstiloValor(botaoContainer, valor);
                    atualizarTotalGlobal();
                });

                // Adiciona evento de input ao novo campo numero
                numeroDiv.addEventListener('input', () => {
                    let valor = parseInt(numeroDiv.textContent.trim(), 10);
                    if (isNaN(valor)) {
                        valor = 0; 
                    }

                    // Aplica a lógica de esconder zero
                    atualizarEstiloValor(botaoContainer, valor);
                    atualizarTotalGlobal();
                });
            }

            // Atualiza a flag para evitar duplicações
            infAdicionado = true;
        });
    }
}

// Adicionar eventos ao pedido inicial
document.querySelectorAll('.pedido-item').forEach(pedido => {
    adicionarEventosPedido(pedido);
});

// Buscar vendedor ao alterar o código do vendedor
const codVendedorInput = document.querySelector('.codVendedor');
const vendedorInput = document.querySelector('.vendedor');
if (codVendedorInput && vendedorInput) {
    codVendedorInput.addEventListener('input', function() {
        const codigo = this.value;
        fetch(`/buscar-vendedor/?codigo=${encodeURIComponent(codigo)}`)
            .then(response => response.json())
            .then(data => {
                if (data.nome) {
                    vendedorInput.value = data.nome;
                } else {
                    alert(data.erro);
                }
            });
    });
}

// Ao clicar em "Realizar pedido"
const realizarPedidoBtn = document.querySelector('.realizarPedido');
if (realizarPedidoBtn) {
    realizarPedidoBtn.addEventListener('click', () => {
        const dados = coletarDadosPedidos();

        fetch('/realizar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao realizar pedido');
            }
            return response.json();
        })
        .then(data => {
            alert('Pedido realizado com sucesso!');
            console.log('Resposta do servidor:', data);
            // Caso deseje, limpar campos após o pedido
        })
        .catch(err => {
            alert('Ocorreu um erro ao realizar o pedido');
            console.error(err);
        });
    });
}

// Atualizar o total global assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    atualizarTotalGlobal();
});
