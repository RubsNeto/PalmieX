// vendedor/static/js/deletar_vendedor.js

document.addEventListener('DOMContentLoaded', function() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const vendedorId = this.getAttribute('data-id');
            if (confirm('Tem certeza que deseja deletar este vendedor?')) {
                fetch(`/vendedor/deletar/${vendedorId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Accept': 'application/json',
                    },
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remover a linha da tabela
                        this.closest('tr').remove();
                        alert('Vendedor deletado com sucesso!');
                    } else {
                        alert('Erro ao deletar o vendedor.');
                    }
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
