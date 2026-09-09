import json, re, unicodedata, collections

raw = json.load(open("raw.json"))

RE_MIN = re.compile(r"Min entries for official:\s*(\d+)\s*\|\s*Split at:\s*(\d+)\s*\|\s*Drops:\s*(\d+)")
RE_PEN = re.compile(r"Penalty (?:every|at) (\d+) incidents")
RE_DQ = re.compile(r"DQ at (\d+) incidents")
RE_LIC = re.compile(r"^(.*?)\s*\(([\d.]+)\)\s*-->\s*(.*?)\s*\(([\d.]+)\)$")


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def clean_track(t):
    # collapse an exactly-repeated suffix e.g. "X - Oval - 2011 - Oval - 2011"
    for n in range(len(t) // 2, 6, -1):
        if t[-n:] == t[-2 * n:-n]:
            return t[:-n].strip(" -")
    return t


def parse_duration(d):
    m = re.fullmatch(r"(\d+) laps", d)
    if m:
        return {"type": "laps", "laps": int(m.group(1)), "minutes": None, "label": f"{m.group(1)} voltas"}
    m = re.fullmatch(r"(\d+) mins", d)
    if m:
        v = int(m.group(1))
        h = v // 60
        label = f"{v} min" if v < 60 else (f"{h}h" if v % 60 == 0 else f"{h}h{v % 60:02d}")
        return {"type": "time", "laps": None, "minutes": v, "label": label}
    parts = dict(re.findall(r"([HCF]):(\d+)L", d))
    if parts:
        return {"type": "heat", "laps": int(parts.get("F", 0)) or None, "minutes": None,
                "label": " / ".join(f"{k}{v}" for k, v in parts.items()),
                "heats": {k.lower(): int(v) for k, v in parts.items()}}
    return {"type": "other", "laps": None, "minutes": None, "label": d}


series = []
for s in raw:
    notes = s["notes"]
    joined = " ".join(notes)
    m = RE_MIN.search(joined)
    pen = RE_PEN.search(joined)
    dq = RE_DQ.search(joined)
    lic = RE_LIC.match(s["licenseRange"] or "")

    cars = [] if s["weeklyCars"] else [c.strip() for c in s["carsRaw"].split(",") if c.strip()]

    weeks = []
    for w in s["weeks"]:
        d = parse_duration(w["duration"])
        weeks.append({
            "week": w["week"],
            "start": w["start"],
            "track": clean_track(w["track"]),
            "cars": w["cars"],
            "simTime": w["simTime"],
            "timeScale": w["timeScale"],
            "tempC": w["weather"].get("tempC"),
            "rain": w["weather"].get("rain"),
            "settings": w["settings"],
            "carRules": w["carRules"],
            "duration": d,
        })

    mins = [w["duration"]["minutes"] for w in weeks if w["duration"]["minutes"]]
    laps = [w["duration"]["laps"] for w in weeks if w["duration"]["laps"]]
    dtypes = sorted({w["duration"]["type"] for w in weeks})

    all_cars = sorted({c for w in weeks if w["cars"] for c in w["cars"]}) if s["weeklyCars"] else cars
    tracks = sorted({w["track"] for w in weeks})

    name = s["name"]
    short = re.sub(r"\s*[-–]?\s*20\d\d\s+Season(\s+\d+)?(\s+(Fixed|Open))?\s*$", "", name).strip(" -")

    series.append({
        "id": slug(name),
        "name": name,
        "shortName": short or name,
        "category": s["category"],
        "licenseClass": s["licenseClass"] or "-",
        "fixedSetup": bool(re.search(r"\bfixed\b", name, re.I)),
        "cars": all_cars,
        "weeklyCars": s["weeklyCars"],
        "multiclass": any("Grid by class" in w["settings"] for w in weeks),
        "licenseFrom": lic.group(1) if lic else None,
        "licenseFromSR": float(lic.group(2)) if lic else None,
        "licenseTo": lic.group(3) if lic else None,
        "raceFrequency": s["schedule"],
        "minEntries": int(m.group(1)) if m else None,
        "splitAt": int(m.group(2)) if m else None,
        "drops": int(m.group(3)) if m else None,
        "incidentPenalty": int(pen.group(1)) if pen else None,
        "incidentDQ": int(dq.group(1)) if dq else None,
        "ruleSet": next((n for n in notes if n.endswith("rule set")), None),
        "durationTypes": dtypes,
        "minMinutes": min(mins) if mins else None,
        "maxMinutes": max(mins) if mins else None,
        "minLaps": min(laps) if laps else None,
        "maxLaps": max(laps) if laps else None,
        "weekCount": len(weeks),
        "tracks": tracks,
        "weeks": weeks,
    })

# --- catalogo de conteudo ---
car_index = collections.defaultdict(list)
track_index = collections.defaultdict(list)
for s in series:
    for c in s["cars"]:
        car_index[c].append(s["id"])
    for t in s["tracks"]:
        track_index[t].append(s["id"])

cars = [{"name": k, "series": sorted(set(v)), "count": len(set(v))} for k, v in sorted(car_index.items())]
tracks = [{"name": k, "series": sorted(set(v)), "count": len(set(v))} for k, v in sorted(track_index.items())]

week_starts = sorted({w["start"] for s in series for w in s["weeks"]})
main_weeks = sorted({w["start"] for s in series for w in s["weeks"] if w["start"] >= "2026-09-15"})

data = {
    "season": "2026 Season 4",
    "generatedFrom": "2026s4.pdf",
    "categories": sorted({s["category"] for s in series}),
    "licenseClasses": ["R", "D", "C", "B", "A", "-"],
    "weekStarts": week_starts,
    "seasonWeeks": main_weeks[:13],
    "series": series,
    "cars": cars,
    "tracks": tracks,
}

json.dump(data, open("schedule.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("series", len(series), "cars", len(cars), "tracks", len(tracks))
print("size KB", round(len(open("schedule.json").read()) / 1024))
print("exemplo:", json.dumps(series[0]["weeks"][0], ensure_ascii=False)[:300])
print("durations types:", collections.Counter(t for s in series for t in s["durationTypes"]))
print("faixas min:", sorted({s["maxMinutes"] for s in series if s["maxMinutes"]}))
