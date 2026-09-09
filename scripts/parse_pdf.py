import json, re, itertools, collections
import pdfplumber

PDF = "2026s4.pdf"  # aponte para o PDF do schedule
COLS = [58, 158, 358, 518]


def col_of(x0):
    c = 0
    for i, cx in enumerate(COLS):
        if x0 >= cx - 3:
            c = i
    return c


def lines_of_page(page):
    ws = page.extract_words(extra_attrs=["fontname", "size"])
    ws.sort(key=lambda w: (round(w["top"], 1), w["x0"]))
    out = []
    for top, g in itertools.groupby(ws, key=lambda w: round(w["top"], 1)):
        g = list(g)
        segs = collections.defaultdict(list)
        for w in g:
            segs[col_of(w["x0"])].append(w["text"])
        out.append({
            "top": top,
            "bold": g[0]["fontname"].endswith("Bold"),
            "size": round(g[0]["size"]),
            "x0": round(g[0]["x0"]),
            "cols": {k: " ".join(v) for k, v in segs.items()},
            "text": " ".join(w["text"] for w in g),
        })
    return out


RE_CLASS = re.compile(r"^([RDCBA]) Class Series \((.+)\)$")
RE_LICENSE = re.compile(r"\(\d+\.\d+\)\s*-->")
RE_WEEK = re.compile(r"^Week\s+(\d+)\s+\((\d{4}-\d{2}-\d{2})\)")
RE_SIMTIME = re.compile(r"^\((\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?:\s+([\d.]+x))?\)$")
RE_PAGENUM = re.compile(r"^\d{1,3}$")
RE_TEMP = re.compile(r"(\d+)°F/(\d+)°C")
RE_RAIN = re.compile(r"Rain chance ([^,]+)")
RE_CARRULE = re.compile(r"^[A-Z0-9][A-Za-z0-9]*:\s")


def flush_week(series, buf, weekly_cars_mode):
    if not buf:
        return
    c0 = " ".join(b["cols"].get(0, "") for b in buf if b["cols"].get(0)).strip()
    c1_lines = [b["cols"][1].strip() for b in buf if b["cols"].get(1)]
    c2_lines = [b["cols"][2].strip() for b in buf if b["cols"].get(2)]
    c3 = " ".join(b["cols"].get(3, "") for b in buf if b["cols"].get(3)).strip()

    m = RE_WEEK.match(c0)
    if not m:
        return

    sim_date = sim_time = time_scale = None
    keep = []
    for l in c1_lines:
        sm = RE_SIMTIME.match(l)
        if sm:
            sim_date, sim_time, time_scale = sm.group(1), sm.group(2), sm.group(3)
        else:
            keep.append(l)

    if weekly_cars_mode and len(keep) > 1:
        track = keep[0]
        week_cars = " ".join(keep[1:])
    else:
        track = " ".join(keep)
        week_cars = None

    # settings column: main text + per-car rules
    main, rules = [], []
    for l in c2_lines:
        (rules if RE_CARRULE.match(l) else main).append(l)
    settings = " ".join(main)

    weather = {}
    t = RE_TEMP.search(settings)
    if t:
        weather["tempF"], weather["tempC"] = int(t.group(1)), int(t.group(2))
    r = RE_RAIN.search(settings)
    if r:
        weather["rain"] = r.group(1).strip()
    settings = RE_TEMP.sub("", settings)
    settings = re.sub(r"Rain chance [^,]+,?\s*", "", settings).lstrip(", ").strip()

    series["weeks"].append({
        "week": int(m.group(1)),
        "start": m.group(2),
        "track": re.sub(r"\s+", " ", track).strip(),
        "cars": [c.strip() for c in week_cars.split(",")] if week_cars else None,
        "simDate": sim_date,
        "simTime": sim_time,
        "timeScale": time_scale,
        "weather": weather,
        "settings": re.sub(r"\s+", " ", settings),
        "carRules": rules or None,
        "duration": re.sub(r"\s+", " ", c3),
    })


def parse():
    pdf = pdfplumber.open(PDF)
    out = []
    category = lic_class = None
    cur = None
    header_buf = []
    week_buf = []

    def close_series():
        nonlocal cur, week_buf
        if cur:
            flush_week(cur, week_buf, cur["weeklyCars"])
            out.append(cur)
        week_buf = []
        cur = None

    def close_header():
        nonlocal cur, header_buf
        if not header_buf:
            return
        lic_i = next((i for i, l in enumerate(header_buf) if RE_LICENSE.search(l)), None)
        races_i = next((i for i, l in enumerate(header_buf) if l.startswith("Races ")), None)
        end = lic_i if lic_i is not None else (races_i if races_i is not None else len(header_buf))
        cars_raw = " ".join(header_buf[1:end]).strip()
        cur = {
            "category": category,
            "licenseClass": lic_class,
            "name": header_buf[0],
            "carsRaw": cars_raw,
            "weeklyCars": cars_raw.lower().startswith("see race week"),
            "licenseRange": header_buf[lic_i] if lic_i is not None else None,
            "schedule": header_buf[races_i] if races_i is not None else None,
            "notes": [],
            "weeks": [],
        }
        header_buf = []

    for pi in range(5, len(pdf.pages)):
        for ln in lines_of_page(pdf.pages[pi]):
            txt = ln["text"].strip()
            if not txt or (ln["top"] > 745 and RE_PAGENUM.match(txt)):
                continue

            if ln["bold"] and ln["size"] == 14 and ln["x0"] <= 57:
                close_header(); close_series()
                m = RE_CLASS.match(txt)
                if m:
                    lic_class = m.group(1)
                elif txt.upper() == txt:
                    category, lic_class = txt, None
                continue

            if ln["bold"] and ln["size"] == 14:
                if cur is not None or week_buf:
                    close_header(); close_series()
                header_buf.append(txt)
                continue

            if ln["bold"] and ln["size"] == 12:
                close_header()
                if cur:
                    cur["notes"].append(txt)
                continue

            close_header()
            if cur is None:
                continue
            if RE_WEEK.match(ln["cols"].get(0, "")):
                flush_week(cur, week_buf, cur["weeklyCars"])
                week_buf = [ln]
            else:
                week_buf.append(ln)

    close_header(); close_series()
    return out


if __name__ == "__main__":
    s = parse()
    print("series:", len(s), "weeks:", sum(len(x["weeks"]) for x in s))
    json.dump(s, open("raw.json", "w"), indent=1, ensure_ascii=False)
