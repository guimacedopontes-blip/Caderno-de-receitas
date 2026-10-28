"""Import the official TACO 4th edition after `pdftotext -layout source.pdf source.txt`.
Usage: python scripts/import-taco.py source.txt
Source: https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf
All values refer to 100 g edible portion. IDs remain the official table IDs.
"""
import json
import re
import sys
from pathlib import Path

rows = {}
for line in Path(sys.argv[1]).read_text().splitlines():
    match = re.match(r'^\s*(\d+)\s{2,}([A-Za-zÀ-ÿ].*?)\s{2,}(.*)$', line)
    if not match:
        continue
    ident, name, values = int(match[1]), match[2], match[3].split()
    if not 1 <= ident <= 597 or ident in rows or name in ('Tr', 'NA'):
        continue
    # Aguardente has blank unrequested analyses. Never shift its columns or invent zero.
    if ident == 472:
        rows[ident] = dict(id=ident, name='Cana, aguardente', nutrients=None,
                          note='Macros não analisados na TACO; energia publicada: 216 kcal/100 g.')
        continue
    if len(values) < 7:
        continue
    raw = {key: values[pos] for key, pos in [('kcal', 1), ('protein', 3), ('carbs', 6), ('fat', 4)]}
    note = ''
    if '*' in raw.values():
        nutrients = None
        note = 'Análises em reavaliação na TACO. Selecione outra referência ou informe o rótulo.'
    else:
        # NA means not applicable, not missing. Only the explicitly enumerated pure
        # oils and salts use zero contribution for their non-applicable macros.
        allowed_na = ident in {259, 260, 267, 268, 269, 270, 271, 272, 516, 517}
        assert allowed_na or 'NA' not in raw.values(), (ident, raw)
        nutrients = {k: 0 if v == 'Tr' or (allowed_na and v == 'NA') else float(v.replace(',', '.')) for k, v in raw.items()}
        if allowed_na:
            note = 'NA (não aplicável) contribui com zero para energia/macros em óleos puros e sais. Não representa análise de sódio.'
    rows[ident] = dict(id=ident, name=name, nutrients=nutrients, **({'note': note} if note else {}))
assert set(rows) == set(range(1, 598)), 'Expected all 597 official IDs'
for ident, row in rows.items():
    row['source'] = f'TACO / NEPA–Unicamp, 4ª edição, 2011; alimento {ident}'
Path('lib/foods.json').write_text(json.dumps([rows[i] for i in sorted(rows)], ensure_ascii=False, indent=2) + '\n')
print(f'{len(rows)} alimentos; {sum(r["nutrients"] is not None for r in rows.values())} com energia e macros utilizáveis.')
