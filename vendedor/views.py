# vendedor/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages 
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, GradientFill
)
from openpyxl.styles import NamedStyle
import openpyxl
from django.http import JsonResponse
from collections import defaultdict
from .models import Vendedor
from .forms import VendedorForm
from django.contrib.auth.decorators import login_required
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from functools import wraps
from django.http import JsonResponse, HttpResponseForbidden
import csv
from django.http import HttpResponse
from pedidos.models import Pedido
import datetime

def permission_required(min_level):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Verifica se o usuário está autenticado e possui o nível mínimo
            if not request.user.is_authenticated or request.user.permission_level < min_level:
                return HttpResponseForbidden("Você não tem permissão para acessar esta página.")
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


@login_required
def download_excel_report(request, vendedor_id):
    """
    Gera um relatório Excel com design moderno e elegante,
    exibindo estatísticas e listagem detalhada de pedidos.
    """

    # ----------------------------------------------------------------
    # 1. Obter os dados do Vendedor e Pedidos
    # ----------------------------------------------------------------
    vendedor = get_object_or_404(Vendedor, pk=vendedor_id)

    # Todos os pedidos, ordenados por data decrescente
    pedidos = (Pedido.objects.filter(vendedor=vendedor)
               .prefetch_related('itens', 'itens__produto')
               .order_by('-data'))

    # Se quiser desconsiderar os cancelados nas estatísticas:
    pedidos_analise = pedidos.exclude(status='Cancelado')

    total_vendas = pedidos_analise.count()
    vendas_por_cliente = defaultdict(int)
    vendas_por_dia = defaultdict(int)
    maior_venda = None
    maior_venda_total = 0

    for pedido in pedidos_analise:
        vendas_por_cliente[pedido.cliente] += 1
        dia = pedido.data.date()
        vendas_por_dia[dia] += 1

        total_itens_pedido = sum(item.quantidade for item in pedido.itens.all())
        if total_itens_pedido > maior_venda_total:
            maior_venda_total = total_itens_pedido
            maior_venda = pedido

    if vendas_por_cliente:
        maior_cliente = max(vendas_por_cliente, key=vendas_por_cliente.get)
        maior_cliente_pedidos = vendas_por_cliente[maior_cliente]
    else:
        maior_cliente = "N/A"
        maior_cliente_pedidos = 0

    if vendas_por_dia:
        melhor_dia = max(vendas_por_dia, key=vendas_por_dia.get)
        vendas_no_melhor_dia = vendas_por_dia[melhor_dia]
    else:
        melhor_dia = "N/A"
        vendas_no_melhor_dia = 0

    # Formata o melhor dia
    if melhor_dia != "N/A" and isinstance(melhor_dia, (datetime.date, datetime.datetime)):
        melhor_dia_formatado = melhor_dia.strftime("%d/%m/%Y")
    else:
        melhor_dia_formatado = "N/A"

    # ----------------------------------------------------------------
    # 2. Criação e Configuração do Workbook
    # ----------------------------------------------------------------
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Relatório {vendedor.nome}"

    # ----------------------------------------------------------------
    # 3. Definir Estilos (Cores, Fontes, Bordas)
    # ----------------------------------------------------------------

    # a) Estilo para título principal, com gradiente
    titulo_fill = GradientFill(stop=("2C7A7B", "4FD1C5"))  
    # Exemplo: tons de teal do Tailwind (4FD1C5 / 2C7A7B)

    # b) Fonte branca, negrito e grande para destaque
    titulo_font = Font(color="FFFFFF", size=16, bold=True)

    # c) Alinhamento central
    titulo_alignment = Alignment(horizontal="center", vertical="center")

    # d) Borda fina
    thin_border = Border(
        left=Side(style="thin", color="888888"),
        right=Side(style="thin", color="888888"),
        top=Side(style="thin", color="888888"),
        bottom=Side(style="thin", color="888888")
    )

    # e) Estilo para cabeçalhos de tabela
    cabecalho_fill = PatternFill(start_color="2C7A7B", end_color="2C7A7B", fill_type="solid")
    cabecalho_font = Font(color="FFFFFF", bold=True)
    cabecalho_alignment = Alignment(horizontal="center", vertical="center")

    # f) Estilo para linhas listradas (zebra) - cria NamedStyle
    zebra_light = "E6FFFA"  # tom claro de turquesa
    zebra_dark = "C6F6D5"   # tom de verde-claro
    # (Pode alternar a cada linha ou usar apenas um tom)

    # Vamos criar um NamedStyle para as linhas pares
    try:
        wb.remove_named_style("ZebraPar")
    except:
        pass

    zebra_par = NamedStyle(name="ZebraPar")
    zebra_par.fill = PatternFill(start_color=zebra_light, end_color=zebra_light, fill_type="solid")
    zebra_par.border = thin_border
    wb.add_named_style(zebra_par)

    # ----------------------------------------------------------------
    # 4. Criar Cabeçalho com Título (Mergindo Células)
    # ----------------------------------------------------------------
    ws.merge_cells('A1:L3')  # 3 linhas de altura, 12 colunas de largura (A a L)
    cell_titulo = ws['A1']
    cell_titulo.value = f"RELATÓRIO DE VENDAS - {vendedor.nome.upper()} (Cód: {vendedor.codigo})"
    cell_titulo.font = titulo_font
    cell_titulo.alignment = titulo_alignment
    cell_titulo.fill = titulo_fill
    cell_titulo.border = thin_border

    # Deixar um espaço
    ws.row_dimensions[4].height = 10

    # ----------------------------------------------------------------
    # 5. Bloco de Informações do Vendedor e Estatísticas
    # ----------------------------------------------------------------
    linha_info = 5

    def write_info(label, value):
        nonlocal linha_info
        ws.merge_cells(start_row=linha_info, start_column=1, end_row=linha_info, end_column=12)
        cell_info = ws.cell(row=linha_info, column=1)
        cell_info.value = f"{label}: {value}"
        cell_info.font = Font(size=12, bold=False, color="333333")
        cell_info.border = thin_border
        cell_info.alignment = Alignment(vertical="center", indent=1)
        ws.row_dimensions[linha_info].height = 20
        linha_info += 1

    write_info("Loja", vendedor.loja)
    write_info("Total de Vendas: ", total_vendas)
    write_info("Maior Cliente", f"{maior_cliente} ({maior_cliente_pedidos} pedidos)")
    write_info("Dia com Mais Vendas", f"{melhor_dia_formatado} ({vendas_no_melhor_dia} vendas)")

    if maior_venda:
        write_info("Maior Venda", f"{maior_venda.pk}  Qtd Total: {maior_venda_total}")
    else:
        write_info("Maior Venda", "N/A")

    # Deixar mais um espaço
    linha_info += 1

    # ----------------------------------------------------------------
    # 6. Criar Cabeçalho da Tabela
    # ----------------------------------------------------------------
    headers = [
        'Pedido ID', 'Cliente', 'Data', 'Status',
        'Produto', 'Quantidade', 'Tamanho',
        'Subpalmilha', 'Costura', 'Sintetico', 'Cor', 'Obs'
    ]

    # Escreve cabeçalho na linha_info
    row_header = linha_info
    for col_index, header in enumerate(headers, start=1):
        cell = ws.cell(row=row_header, column=col_index)
        cell.value = header
        cell.font = cabecalho_font
        cell.fill = cabecalho_fill
        cell.alignment = cabecalho_alignment
        cell.border = thin_border

    # Ajustar a altura da linha do cabeçalho
    ws.row_dimensions[row_header].height = 25

    # ----------------------------------------------------------------
    # 7. Preencher Dados Detalhados (Incluindo Cancelados)
    # ----------------------------------------------------------------
    linha_atual = row_header + 1

    for pedido in pedidos:
        for item in pedido.itens.all():
            # Montar a linha
            data_str = pedido.data.strftime("%Y-%m-%d %H:%M")
            row = [
                pedido.pk,
                pedido.cliente,
                data_str,
                pedido.status,
                item.produto.nome,
                item.quantidade,
                item.tamanho,
                item.subpalmilha,
                item.costura,
                item.sintetico,
                item.cor,
                item.obs
            ]

            for col_index, valor in enumerate(row, start=1):
                cell = ws.cell(row=linha_atual, column=col_index)
                cell.value = valor
                cell.alignment = Alignment(vertical="center", wrap_text=True)
                cell.border = thin_border

                # Alterna cor de fundo (zebra) para linhas pares
                if (linha_atual % 2) == 0:  # linha par
                    cell.style = "ZebraPar"

            ws.row_dimensions[linha_atual].height = 20
            linha_atual += 1

    # ----------------------------------------------------------------
    # 8. Ajustar Largura das Colunas Automaticamente
    # ----------------------------------------------------------------
    max_row = ws.max_row
    max_col = ws.max_column

    for col in range(1, max_col + 1):
        max_length = 0
        col_letter = get_column_letter(col)
        for row_ in range(1, max_row + 1):
            cell = ws.cell(row=row_, column=col)
            if cell.value:
                length = len(str(cell.value))
                if length > max_length:
                    max_length = length
        ws.column_dimensions[col_letter].width = max_length + 2

    # ----------------------------------------------------------------
    # 9. Preparar Resposta HTTP
    # ----------------------------------------------------------------
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    filename = f"Relatorio_{vendedor.nome}.xlsx"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    wb.save(response)
    return response


@permission_required(4)
def lista_vendedores(request):
    # Ordena os vendedores pelo campo 'codigo' de forma crescente
    vendedores = Vendedor.objects.all().order_by('codigo')
    return render(request, 'vendedor/lista_vendedores.html', {'vendedores': vendedores})

@permission_required(4)
def criar_vendedor(request):
    if request.method == 'POST':
        form = VendedorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('vendedor:lista_vendedores')
    else:
        form = VendedorForm()
    return render(request, 'vendedor/form_vendedor.html', {'form': form})

@permission_required(4)
def editar_vendedor(request, pk):
    vendedor = get_object_or_404(Vendedor, pk=pk)
    if request.method == 'POST':
        form = VendedorForm(request.POST, instance=vendedor)
        if form.is_valid():
            form.save()
            return redirect('vendedor:lista_vendedores')  # Redireciona para a lista de vendedores
    else:
        form = VendedorForm(instance=vendedor)
    return render(request, 'vendedor/form_vendedor.html', {'form': form})

@permission_required(4)
def deletar_vendedor(request, pk):
    if request.method == 'POST':
        vendedor = get_object_or_404(Vendedor, pk=pk)
        vendedor.delete()
        return redirect('vendedor:lista_vendedores')
    else:
        return redirect('vendedor:lista_vendedores')