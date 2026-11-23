import pathlib

# Windows-1252 including the five bytes Python's codec rejects.
EXTRA = {
    0x80: "\u20ac",
    0x82: "\u201a",
    0x83: "\u0192",
    0x84: "\u201e",
    0x85: "\u2026",
    0x86: "\u2020",
    0x87: "\u2021",
    0x88: "\u02c6",
    0x89: "\u2030",
    0x8a: "\u0160",
    0x8b: "\u2039",
    0x8c: "\u0152",
    0x8e: "\u017d",
    0x91: "\u2018",
    0x92: "\u2019",
    0x93: "\u201c",
    0x94: "\u201d",
    0x95: "\u2022",
    0x96: "\u2013",
    0x97: "\u2014",
    0x98: "\u02dc",
    0x99: "\u2122",
    0x9a: "\u0161",
    0x9b: "\u203a",
    0x9c: "\u0153",
    0x9e: "\u017e",
    0x9f: "\u0178",
}
# Undefined historical bytes often survive as C1 controls.
for b in (0x81, 0x8D, 0x8F, 0x90, 0x9D):
    EXTRA[b] = chr(b)

REV = {ch: b for b, ch in EXTRA.items()}


def to_bytes(s: str) -> bytes:
    out = bytearray()
    for ch in s:
        o = ord(ch)
        if o < 256 and ch not in REV:
            out.append(o)
        elif ch in REV:
            out.append(REV[ch])
        else:
            raise ValueError(hex(o))
    return bytes(out)


def peel(s: str) -> str:
    cur = s
    for _ in range(12):
        try:
            raw = to_bytes(cur)
            nxt = raw.decode("utf-8")
        except Exception:
            return cur
        if nxt == cur:
            return cur
        cur = nxt
    return cur


p = pathlib.Path(r"C:\Users\admin\Downloads\project\FocusToDoPro\src\focus_to_do_personal_edition pro.tsx")
lines = p.read_text(encoding="utf-8").splitlines()
for i, line in enumerate(lines, 1):
    if any(ord(c) > 127 for c in line):
        print(f"{i}: {peel(line).strip()[:220]}")
