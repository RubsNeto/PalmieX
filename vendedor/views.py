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
from django.http import HttpResponse
import csv
import datetime

from pedidos.models import Pedido  # Ajuste conforme a localização do seu model

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

# ---------------------------------------------------------------------
# Restante das views (lista_vendedores, criar, editar, deletar) - igual
# ---------------------------------------------------------------------

@permission_required(4)
def lista_vendedores(request):
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
            return redirect('vendedor:lista_vendedores')
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





@login_required
def download_excel_report(request, vendedor_id):
    """
    Gera um relatório Excel com várias planilhas (1 por mês que tenha pedidos).
    Em cada planilha:
      - Estatísticas mesclando A..D,
      - Título mesclado A1..L3,
      - Tabela de pedidos nas colunas a partir de A..L
    """
    vendedor = get_object_or_404(Vendedor, pk=vendedor_id)
    ano_atual = datetime.datetime.now().year

    # Obtem todos os pedidos do vendedor (se quiser filtrar só do ano atual, inclua .filter(data__year=ano_atual))
    pedidos_todos = (Pedido.objects.filter(vendedor=vendedor)
                     .prefetch_related('itens', 'itens__produto')
                     .order_by('-id'))

    # Cria o workbook e remove a planilha "padrão"
    wb = openpyxl.Workbook()
    sheet_padrao = wb.active
    wb.remove(sheet_padrao)

    # -----------------------------
    # Definição de estilos globais
    # -----------------------------
    titulo_fill = GradientFill(stop=("2C7A7B", "4FD1C5"))  # Gradiente teal
    titulo_font = Font(color="FFFFFF", size=16, bold=True)
    titulo_alignment = Alignment(horizontal="center", vertical="center")

    thin_border = Border(
        left=Side(style="thin", color="888888"),
        right=Side(style="thin", color="888888"),
        top=Side(style="thin", color="888888"),
        bottom=Side(style="thin", color="888888")
    )

    cabecalho_fill = PatternFill(start_color="2C7A7B", end_color="2C7A7B", fill_type="solid")
    cabecalho_font = Font(color="FFFFFF", bold=True)
    cabecalho_alignment = Alignment(horizontal="center", vertical="center")

    try:
        wb.remove_named_style("ZebraPar")
    except:
        pass
    zebra_par = NamedStyle(name="ZebraPar")
    zebra_par.fill = PatternFill(start_color="E6FFFA", end_color="E6FFFA", fill_type="solid")
    zebra_par.border = thin_border
    wb.add_named_style(zebra_par)

    nomes_meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    # ------------------------------------
    # Funções auxiliares
    # ------------------------------------
    def criar_planilha_mes(mes):
        """ Cria e retorna a planilha para o mês indicado (1=Jan...). """
        nome_mes = nomes_meses[mes - 1] if 1 <= mes <= 12 else f"Mes_{mes}"
        ws = wb.create_sheet(title=f"{nome_mes}_{ano_atual}")
        return ws   

    def write_info(ws, row_index, label, value):
        ws.merge_cells(start_row=row_index, start_column=1, end_row=row_index, end_column=4)
        cell_info = ws.cell(row=row_index, column=1)
        
        if isinstance(value, (int, float)):
            # Se quiser sempre mostrar separador de milhar com ponto
            value_str = f"{int(value):,}".replace(",", ".")
            cell_info.value = f"{label}: {value_str}"
        else:
            cell_info.value = f"{label}: {value}"
        
        cell_info.font = Font(size=12, bold=False, color="333333")
        # (Opcional) alinhar à direita, mas lembre que a célula é mesclada
        cell_info.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[row_index].height = 20

    # Agrupa pedidos por mês
    pedidos_por_mes = defaultdict(list)
    for p in pedidos_todos:
        mes_pedido = p.data.month
        pedidos_por_mes[mes_pedido].append(p)

    # ---------------------------------------------------
    # Criamos 1 planilha para cada mês que TIVER pedidos
    # ---------------------------------------------------
    for mes in range(1, 13):
        if mes not in pedidos_por_mes:
            continue

        pedidos_do_mes = pedidos_por_mes[mes]
        ws = criar_planilha_mes(mes)

        # 1) Calcula estatísticas para este mês
        pedidos_analise = [pd for pd in pedidos_do_mes if pd.status != 'Cancelado']
        total_vendas = len(pedidos_analise)
        cancelados = sum(1 for pd in pedidos_do_mes if pd.status == 'Cancelado')

        vendas_por_cliente = defaultdict(int)
        vendas_por_dia = defaultdict(int)
        maior_venda = None
        maior_venda_itens = 0
        total_itens_mes = 0

        for pedido in pedidos_do_mes:
            # Contagem de pedidos por cliente (todos, até cancelados):
            vendas_por_cliente[pedido.cliente] += 1

            # Contagem de pedidos por dia (somente não cancelados ou todos, escolha):
            if pedido.status != 'Cancelado':
                dia_pedido = pedido.data.date()
                vendas_por_dia[dia_pedido] += 1

            # Soma itens
            soma_itens = sum(it.quantidade for it in pedido.itens.all())
            if pedido.status != 'Cancelado':
                total_itens_mes += soma_itens

            # Maior venda (mais itens)
            if soma_itens > maior_venda_itens and pedido.status != 'Cancelado':
                maior_venda_itens = soma_itens
                maior_venda = pedido

        if vendas_por_dia:
            best_day = max(vendas_por_dia, key=vendas_por_dia.get)
            best_day_pedidos = vendas_por_dia[best_day]
            best_day_str = best_day.strftime("%d/%m/%Y")
        else:
            best_day = None
            best_day_pedidos = 0
            best_day_str = "N/A"

        # 2) Título mesclado A1..L3
        ws.merge_cells('A1:K3')
        cell_titulo = ws['A1']
        nome_mes = nomes_meses[mes - 1]
        cell_titulo.value = f"RELATÓRIO - {nome_mes.upper()} {ano_atual} - Vendedor: {vendedor.nome.upper()}"
        cell_titulo.font = titulo_font
        cell_titulo.alignment = titulo_alignment
        cell_titulo.fill = titulo_fill
        cell_titulo.border = thin_border
        ws.row_dimensions[1].height = 25

        # Espaço
        ws.row_dimensions[4].height = 10

        # 3) Escrever estatísticas (A..D)
        linha_info = 5
        write_info(ws, linha_info, "Loja", vendedor.loja); linha_info += 1
        write_info(ws, linha_info, "Total de Vendas ", total_vendas); linha_info += 1
        write_info(ws, linha_info, "Pedidos Cancelados", cancelados); linha_info += 1
        write_info(ws, linha_info, "Total de Pares Vendidos", total_itens_mes); linha_info += 1

        write_info(ws, linha_info, "Melhor Dia", f"{best_day_str} - ({best_day_pedidos} pedidos)")
        linha_info += 1

        if maior_venda:
            info_maior_venda = f"Pedido {maior_venda.pk} - {maior_venda.cliente}, {maior_venda_itens} itens"
        else:
            info_maior_venda = "N/A"
        write_info(ws, linha_info, "Maior Venda", info_maior_venda)
        linha_info += 1

        # Espaço antes da tabela
        linha_info += 1

        # 4) Cabeçalho da tabela em A..L (12 colunas)
        headers = [
            'Pedido ID', 'Cliente', 'Data', 'Status',
            'Produto', 'Quantidade', 'Tamanho',
            'Tipo serviço', 'Sintético', 'Cor', 'Obs'
        ]
        row_header = linha_info
        for col_index, header in enumerate(headers, start=1):
            cell = ws.cell(row=row_header, column=col_index)
            cell.value = header
            cell.font = cabecalho_font
            cell.fill = cabecalho_fill
            cell.alignment = cabecalho_alignment
            cell.border = thin_border
        ws.row_dimensions[row_header].height = 25

        # ...
        # 5) Lista todos os pedidos (incluindo cancelados) nesse mês
        linha_atual = row_header + 1
        for pedido in sorted(pedidos_do_mes, key=lambda x: x.id, reverse=True):
            for item in pedido.itens.all():
                data_str = pedido.data.strftime("%d/%m/%Y %H:%M")
                row_data = [
                    pedido.pk,
                    pedido.cliente,
                    data_str,
                    pedido.status,
                    #/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    item.produto.nome,
                    item.quantidade,
                    item.tamanho,
                    item.tipo_servico,
                    item.sintetico,
                    item.cor,
                    item.obs
                ]
                
                for col_index, valor in enumerate(row_data, start=1):
                    cell = ws.cell(row=linha_atual, column=col_index)

                    # Se for valor numérico, converte para texto com ponto e alinha à direita
                    if isinstance(valor, (int, float)):
                        valor_str = f"{int(valor):,}".replace(",", ".")  # ex: 5000 -> "5.000" como TEXTO
                        cell.value = valor_str
                        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
                    else:
                        # Qualquer outro tipo de valor (string, etc.) fica alinhado à esquerda
                        cell.value = valor
                        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

                    cell.border = thin_border
                    if (linha_atual % 2) == 0:
                        cell.style = "ZebraPar"

                ws.row_dimensions[linha_atual].height = 20
                linha_atual += 1

        # 6) Ajustar a largura das colunas - MAS vamos tratar a coluna A separadamente

        max_row = ws.max_row
        max_col = ws.max_column

        # (a) Ajuste automático para colunas B..max_col
        for col in range(2, max_col + 1):
            max_length = 0
            col_letter = get_column_letter(col)
            for row_ in range(1, max_row + 1):
                val = ws.cell(row=row_, column=col).value
                if val:
                    length = len(str(val))
                    if length > max_length:
                        max_length = length
            ws.column_dimensions[col_letter].width = max_length + 2

        # (b) Ajuste específico para coluna A (ID)
        #     - Acha o maior len(str(pedido.pk)) entre todos pedidos do mês
        max_id_len = 0
        for p in pedidos_do_mes:
            id_len = len(str(p.pk))
            if id_len > max_id_len:
                max_id_len = id_len

        # Acrescente +2 ou +3 para dar "folga"
        ws.column_dimensions['A'].width = 10


    # --------------------------------
    # Resposta HTTP - baixar o arquivo
    # --------------------------------
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    filename = f"Relatorio_{vendedor.nome}_{ano_atual}.xlsx"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    wb.save(response)
    return response