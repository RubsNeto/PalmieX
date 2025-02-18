// produto/static/js/deletar_produto.js

document.addEventListener('DOMContentLoaded', function() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const produtoId = this.getAttribute('data-id');
            const row = document.getElementById(`produto-${produtoId}`);
            
            if (confirm('Tem certeza que deseja deletar este produto?')) {
                fetch(`/produto/deletar/${produtoId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Accept': 'application/json',
                    },
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na requisição');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Remover a linha da tabela
                        if (row) {
                            row.remove();
                        }
                        alert('Produto deletado com sucesso!');
                    } else {
                        alert('Erro ao deletar o produto.');
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Ocorreu um erro ao deletar o produto.');
                });
            }
        });
    });
});

// Função para obter o cookie CSRF
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
