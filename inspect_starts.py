import openpyxl

path = r"c:/Users/admin-c606415/Documents/inventario/Prueba de Inventario avance.xlsx"
wb = openpyxl.load_workbook(path, data_only=False)

for name in ["Inventario Global", "Inventario Sede", "Inventario Oficina"]:
    ws = wb[name]
    print(f"\n=== {name} ===")
    for r in range(1, 40):
        vals = [ws.cell(r, c).value for c in range(1, 12)]
        non_empty = sum(v is not None and v != "" for v in vals)
        if non_empty:
            print(r, non_empty, vals)
