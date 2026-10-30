#!/usr/bin/env python3
"""
Keep Me Online — STRICT whole-site audit suite (pure Python orchestrator).

What it tests, and how strict it is:
  * Repo & built assets      : entry HTML, favicon resolvable, meta description, og tags.
  * Toolchain                : tsc typecheck and vite production build must be green.
  * Calculation ENGINE       : every case is executed against the REAL TypeScript modules
                               (bundled with esbuild, run in node) and every numeric field is
                               compared against an independent Python mirror of the
                               specification (thresholds, efficiencies, reserve, etc.).
  * Validation               : every rule and exact user-facing error message, per field.
  * Formatting               : exact output strings of every formatter (incl. boundaries).
  * Sharing / storage        : the real JS encoder's share payload is decoded in Python and
                               compared field-by-field; localStorage save/load/default-removal
                               behaviour verified through the real modules.
  * Scenarios                : essentials scenario, suggestion ranking & marginal savings.
  * Summary / examples       : exact strings, recomputed expectations.
  * Content claims           : numbers published in blog posts and the FAQ are recomputed with
                               the real engine — a claim that disagrees with the calculator FAILS.
  * Blog data                : inventory: slugs, categories, strictly descending dates, sections.
  * HEADER / FOOTER / PAGES  : the whole <App/> is rendered server-side for all 7 routes; markup,
                               nav order, aria-current state, copyright year, disclaimer and the
                               legal notes are checked on EVERY page. Failures carry a "why".

Usage:
    python audit/website_audit.py [--keep]

Exit 0 = everything passed; 1 = at least one check failed (details in the dashboard).
Requires: npm install already run; node >= 18.
"""

from __future__ import annotations

import html as htmllib
import json
import math
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # .../keepmeonline
SRC = os.path.join(ROOT, "src")
RUN_DIR = os.path.join(ROOT, "audit", "_run")
JSON_MARK = "====AUDIT_JSON===="
KEEP = "--keep" in sys.argv

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]

# --------------------------------------------------------------------------- #
# Console helpers                                                              #
# --------------------------------------------------------------------------- #

USE_COLOR = sys.stdout.isatty() or os.environ.get("FORCE_COLOR") == "1"


def colored(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m" if USE_COLOR else text


def fmtv(v) -> str:
    """Compact repr of a value for expected/actual lines."""
    if isinstance(v, float):
        return f"{v:.12g}"
    if v is None:
        return "null"
    if isinstance(v, (dict, list)):
        return json.dumps(v, sort_keys=False, default=str)[:500]
    return str(v)[:500]


# --------------------------------------------------------------------------- #
# Check bookkeeping                                                            #
# --------------------------------------------------------------------------- #


@dataclass
class Check:
    group: str
    gid: str
    title: str
    ok: bool
    why: str = ""
    expected: str = ""
    actual: str = ""


@dataclass
class Group:
    name: str
    blurb: str = ""
    checks: list = field(default_factory=list)


GROUPS: list = []


def group(name: str, blurb: str = "") -> Group:
    g = Group(name, blurb)
    GROUPS.append(g)
    return g


def check(g: Group, gid: str, title: str, ok: bool, *, why: str = "",
          expected=None, actual=None) -> bool:
    ck = Check(g.name, gid, title, bool(ok), why=why,
               expected=fmtv(expected), actual=fmtv(actual))
    g.checks.append(ck)
    return ck.ok


def eq(g: Group, gid: str, title: str, expected, actual, *, why: str = "", tol: float = None):
    """Equality check with a failure explanation."""
    if tol is not None and isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        ok = math.isclose(expected, actual, rel_tol=tol, abs_tol=tol)
    else:
        ok = expected == actual
    why_full = why or (f"expected {expected!r} but got {actual!r}; the site's behaviour does not "
                       f"match the audited specification — a regression was introduced.")
    return check(g, gid, title, ok, why=why_full, expected=expected, actual=actual)


def contains(g: Group, gid: str, title: str, haystack: str, needle: str, *,
             why: str = "", invert: bool = False):
    found = needle in haystack
    ok = (not found) if invert else found
    reason = why or (f"the page {'did not contain' if not found else 'contained'} the substring "
                     f"{needle!r} in its rendered output")
    if not ok:
        reason += (f" — expected it {'absent' if invert else 'present'}, so the page markup or "
                   f"copy changed somewhere upstream.")
    return check(g, gid, title, ok, why=reason,
                 expected=f"{'absent' if invert else 'present'}: {needle!r}",
                 actual=f"{'absent' if found else 'present'}")


# --------------------------------------------------------------------------- #
# File utilities                                                               #
# --------------------------------------------------------------------------- #


def read(path: str) -> str:
    with open(os.path.join(ROOT, path), "r", encoding="utf-8", newline="") as fh:
        return fh.read()


def run(cmd: str, timeout: int = 600):
    return subprocess.run(cmd, cwd=ROOT, shell=True, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)


# --------------------------------------------------------------------------- #
# Independent Python mirror of the calculation specification                   #
# (semantics from src/types/calculator.ts + src/lib/calculations.ts)            #
# --------------------------------------------------------------------------- #


def avg_watts(d):
    return (d["watts"] * d["quantity"] * d["dutyPercent"]) / 100.0


def summarize(devices):
    ac = dc = plate = 0.0
    for d in devices:
        if not d["enabled"]:
            continue
        w = avg_watts(d)
        if d["path"] == "ac":
            ac += w
            plate += d["watts"] * d["quantity"]
        else:
            dc += w
    return ac, dc, plate


def calc(inp):
    ac, dc, plate = summarize(inp["devices"])
    usable = inp["nominalWh"] if inp["energyIsUsable"] else inp["nominalWh"] * inp["usableFraction"]
    planning = usable * (1.0 - inp["reserveFraction"])
    idle = inp["inverterIdleW"] if ac > 0 else 0
    draw = ac / inp["acEfficiencyFraction"] + dc / inp["dcEfficiencyFraction"] + idle
    exceed = inp["maxAcOutputW"] is not None and plate > inp["maxAcOutputW"]

    if draw <= 0:
        return {"status": "no-load", "usableWh": usable, "planningWh": planning,
                "acLoadW": ac, "dcLoadW": dc, "acNameplateW": plate, "idleW": idle,
                "batteryDrawW": draw, "outputLimitExceeded": exceed,
                "runtimeHours": None, "differenceHours": None,
                "requiredUsableWh": None, "requiredNominalWh": None}

    runtime = planning / draw
    required_usable = (draw * inp["targetHours"]) / (1.0 - inp["reserveFraction"])
    required_nominal = None if inp["energyIsUsable"] else required_usable / inp["usableFraction"]
    if runtime >= inp["targetHours"]:
        status = "meets"
    elif runtime >= inp["targetHours"] * 0.9:  # CLOSE_THRESHOLD
        status = "close"
    else:
        status = "shortfall"
    return {"status": status, "usableWh": usable, "planningWh": planning, "acLoadW": ac,
            "dcLoadW": dc, "acNameplateW": plate, "idleW": idle, "batteryDrawW": draw,
            "outputLimitExceeded": exceed, "runtimeHours": runtime,
            "differenceHours": runtime - inp["targetHours"], "requiredUsableWh": required_usable,
            "requiredNominalWh": required_nominal}


def dev(did, name, watts, qty=1, duty=100, path="ac", essential=False, enabled=True):
    return {"id": did, "name": name, "watts": watts, "quantity": qty, "dutyPercent": duty,
            "path": path, "essential": essential, "enabled": enabled}


RESULT_FIELDS = ["status", "usableWh", "planningWh", "acLoadW", "dcLoadW", "acNameplateW",
                 "idleW", "batteryDrawW", "outputLimitExceeded", "runtimeHours",
                 "differenceHours", "requiredUsableWh", "requiredNominalWh"]


def compare_calc_result(g, gid, case_id, py_expected, js_result, context=""):
    """One check per case; on failure lists every differing field (the 'why')."""
    diffs = []
    for f in RESULT_FIELDS:
        e, a = py_expected.get(f), js_result.get(f)
        if e is None and a is None:
            continue
        if isinstance(e, (int, float)) and isinstance(a, (int, float)) \
                and math.isclose(e, a, rel_tol=1e-9, abs_tol=1e-9):
            continue
        if e != a:
            diffs.append(f"{f}: engine={a!r} vs spec-expected={e!r}")
    extra = sorted(set(js_result.keys()) - set(RESULT_FIELDS) - {"input"})
    why = (f"The real TS engine (calculateRuntime, executed in node) disagreed with the audited "
           f"specification for case {case_id}{' (' + context + ')' if context else ''}. "
           if diffs else "")
    why += "; ".join(diffs)
    if extra:
        why += f" | unexpected extra result fields: {extra}"
    return check(g, gid, f"engine case {case_id} matches the specification exactly"
                 f"{' — ' + context if context else ''}",
                 not diffs, why=why,
                 expected={f: py_expected.get(f) for f in RESULT_FIELDS},
                 actual={f: js_result.get(f) for f in RESULT_FIELDS})


# --------------------------------------------------------------------------- #
# Static expectations mirrored from the shipped data sources                    #
# --------------------------------------------------------------------------- #

DEFAULT_FORM_FIELDS = {
    "capacityMode": "wh", "whText": "500", "voltageText": "12", "ahText": "100",
    "usageMode": "percent", "usablePercentText": "80", "reservePercentText": "10",
    "acEfficiencyText": "85", "dcEfficiencyText": "95", "inverterIdleText": "0",
    "maxAcOutputText": "", "targetHoursText": "4", "targetMinutesText": "0",
}

DEVICE_PRESETS_EXPECTED = [
    ("Wi-Fi router", 10, 1, 100, "ac", True, True),
    ("Fiber ONT/modem", 8, 1, 100, "ac", True, True),
    ("Laptop", 45, 1, 100, "ac", False, True),
    ("Monitor", 25, 1, 100, "ac", False, False),
    ("LED light", 9, 1, 100, "ac", False, False),
    ("Fan", 45, 1, 100, "ac", False, False),
    ("Phone charger", 10, 1, 100, "ac", False, False),
]

BLOG_EXPECTED = [
    ("1", "choosing-the-right-ups-for-your-router", "Choosing the Right UPS for Your Wi-Fi Router",
     "Equipment", "4 min", "2026-10-20"),
    ("2", "understanding-battery-capacity-wh-vs-ah", "Understanding Battery Capacity: Wh vs Ah",
     "Basics", "5 min", "2026-10-18"),
    ("3", "laptop-battery-backup-during-power-cuts", "How Long Can a Laptop Run During a Power Cut?",
     "Planning", "4 min", "2026-10-15"),
    ("4", "inverter-efficiency-explained", "Inverter Efficiency Explained: Where Does Your Energy Go?",
     "Basics", "6 min", "2026-10-12"),
    ("5", "power-cut-checklist-for-remote-workers", "Power-Cut Checklist for Remote Workers",
     "Planning", "5 min", "2026-10-08"),
    ("6", "lead-acid-vs-lithium-for-backup-power", "Lead-Acid vs Lithium for Backup Power",
     "Equipment", "6 min", "2026-10-05"),
]

NAV_EXPECTED = [("/", "Calculator"), ("/blog", "Blog"), ("/about", "About"),
                ("/privacy", "Privacy"), ("/contact", "Contact")]
FOOTER_NAV_EXPECTED = ["Blog", "About", "Privacy", "Contact"]

DISCLAIMER = ("Planning estimate only. Actual runtime varies with battery condition, "
              "temperature, discharge rate, and equipment limits.")
FOOTER_TAGLINE = "Keep Me Online — a free power-cut backup planner."


# --------------------------------------------------------------------------- #
# Fixture builders sent to the JS harness                                      #
# --------------------------------------------------------------------------- #


def base_input(devices, **over):
    inp = {"nominalWh": 500, "energyIsUsable": False, "usableFraction": 0.8,
           "reserveFraction": 0.1, "acEfficiencyFraction": 0.85, "dcEfficiencyFraction": 0.95,
           "inverterIdleW": 0, "maxAcOutputW": None, "targetHours": 4, "devices": devices}
    inp.update(over)
    return inp


def preset_devices():
    """Mirror of DEVICE_PRESETS (with knobs), used by several engine cases."""
    return [
        dev("c-router", "Wi-Fi router", 10, essential=True),
        dev("c-ont", "Fiber ONT/modem", 8, essential=True),
        dev("c-laptop", "Laptop", 45),
        dev("c-monitor", "Monitor", 25, enabled=False),
        dev("c-led", "LED light", 9, enabled=False),
        dev("c-fan", "Fan", 45, enabled=False),
        dev("c-charger", "Phone charger", 10, enabled=False),
    ]


def build_engine_cases():
    router = preset_devices()[0]
    ont = preset_devices()[1]
    laptop = preset_devices()[2]

    return [
        ("c01-default-shipped-presets",
         base_input([dict(d) for d in preset_devices()]),
         "the exact device presets shipped in devicePresets.ts"),
        ("c02-router-ont-only",
         base_input([dict(router), dict(ont), dict(preset_devices()[3]),
                     dict(preset_devices()[4]), dict(preset_devices()[5]),
                     dict(preset_devices()[6])]),
         "only the internet equipment enabled"),
        ("c03-router-ont-laptop",
         base_input([dict(router), dict(ont), dict(laptop), dict(preset_devices()[3]),
                     dict(preset_devices()[4]), dict(preset_devices()[5]),
                     dict(preset_devices()[6])]),
         "router + ONT + 45 W laptop"),
        ("c04-laptop-duty-50",
         base_input([dict(router), dict(ont), {**laptop, "dutyPercent": 50}]),
         "laptop modelled at 50% duty (the blog article recommends doing this)"),
        ("c05-no-load",
         base_input([{**router, "enabled": False}, {**ont, "enabled": False},
                     {**laptop, "enabled": False}]),
         "all devices disabled -> status must be no-load with null runtime"),
        ("c06-dc-only-router",
         base_input([{**router, "path": "dc"}]),
         "router on the DC path (skips the inverter)"),
        ("c07-inverter-idle-10",
         base_input([dict(router), dict(ont)], inverterIdleW=10),
         "10 W inverter idle draw applies only when an AC load exists"),
        ("c08-close-boundary-85w",
         base_input([dev("b", "Big laptop", 85)]),
         "runtime should land on the 90%-of-target CLOSE_THRESHOLD boundary ('close')"),
        ("c09-shortfall-86w",
         base_input([dev("b", "Big load", 86)]),
         "1 W past the close boundary -> 'shortfall'"),
        ("c10-target-boundary-76p5w",
         base_input([dev("b", "Boundary load", 76.5)]),
         "load sized to consume the entire planning budget against a 4 h target"),
        ("c11-output-limit-breach",
         base_input([dict(router), dict(ont), dict(laptop)], maxAcOutputW=50),
         "nameplate 63 W exceeds the inverter's 50 W output limit"),
        ("c12-output-limit-exact",
         base_input([dict(router), dict(ont), dict(laptop)], maxAcOutputW=63),
         "nameplate equals the limit exactly (spec uses a strict > comparison)"),
        ("c13-usable-energy-mode",
         base_input([dict(router), dict(ont)], energyIsUsable=True),
         "battery already stated in usable Wh -> requiredNominalWh must be null"),
        ("c14-reserve-zero",
         base_input([dict(router), dict(ont)], reserveFraction=0),
         "no planning reserve"),
        ("c15-mixed-ac-dc",
         base_input([dev("m", "Monitor", 25, qty=2, duty=50),
                     dev("f", "Fan", 45, qty=2, duty=33.3, path="dc")]),
         "AC load (2 monitors at 50% duty) plus DC load (2 fans at 33.3% duty)"),
        ("c16-blog1-300wh-system",
         base_input([dict(router), dict(ont)], nominalWh=300),
         "the exact setup blog article no.1 quotes as 'roughly 11 hours'"),
        ("c17-blog4-100w-load",
         base_input([dev("r", "AC appliance", 100)]),
         "the 100 W AC draw the inverter blog quotes (battery ~118 W)"),
        ("c18-leadacid-50percent",
         base_input([dict(router), dict(ont)], nominalWh=1200, usableFraction=0.5),
         "12 V × 100 Ah lead-acid at 50% usable (blog article no.6)"),
    ]


def _vform(**over):
    f = dict(DEFAULT_FORM_FIELDS)
    f["devices"] = [
        {"id": "d1", "name": "Wi-Fi router", "wattsText": "10", "quantityText": "1",
         "dutyText": "100", "path": "ac", "essential": True, "enabled": True},
        {"id": "d2", "name": "Custom device", "wattsText": "5", "quantityText": "1",
         "dutyText": "50", "path": "dc", "essential": False, "enabled": True},
    ]
    f.update(over)
    return f


def _vdevice(**over):
    d = {"id": "d1", "name": "User device", "wattsText": "10", "quantityText": "1",
         "dutyText": "100", "path": "ac", "essential": False, "enabled": True}
    d.update(over)
    return d


def build_validation_cases():
    return [
        ("v01-valid-form", _vform(), True, {},
         "a complete, valid form validates with zero errors"),
        ("v02-watts-cap-10000", _vform(devices=[_vdevice(wattsText="10001"),
                                                _vdevice(id="d2", wattsText="5")]), False,
         {"device:d1:watts": "Enter watts from 0 to 10,000."},
         "10,000 W is the inclusive maximum for a device"),
        ("v03-watts-negative", _vform(devices=[_vdevice(wattsText="-1")]), False,
         {"device:d1:watts": "Enter watts from 0 to 10,000."},
         "negative watts rejected"),
        ("v04-watts-garbage", _vform(devices=[_vdevice(wattsText="12w")]), False,
         {"device:d1:watts": "Enter watts from 0 to 10,000."},
         "non-numeric watts rejected (unit suffixes are not allowed)"),
        ("v05-quantity-fractional", _vform(devices=[_vdevice(quantityText="2.5")]), False,
         {"device:d1:quantity": "Enter a whole number from 0 to 999."},
         "quantity must be an integer"),
        ("v06-quantity-cap-999", _vform(devices=[_vdevice(quantityText="1000")]), False,
         {"device:d1:quantity": "Enter a whole number from 0 to 999."},
         "quantity cap is 999"),
        ("v07-duty-over-100", _vform(devices=[_vdevice(dutyText="100.5")]), False,
         {"device:d1:duty": "Enter a percentage from 0 to 100."},
         "duty cap is 100 (inclusive)"),
        ("v08-duty-negative", _vform(devices=[_vdevice(dutyText="-0.1")]), False,
         {"device:d1:duty": "Enter a percentage from 0 to 100."},
         "duty floor is 0 (inclusive)"),
        ("v09-name-whitespace", _vform(devices=[_vdevice(name="   ")]), False,
         {"device:d1:name": "Give this device a name up to 40 characters."},
         "whitespace-only names count as length 0"),
        ("v10-name-41-chars", _vform(devices=[_vdevice(name="x" * 41)]), False,
         {"device:d1:name": "Give this device a name up to 40 characters."},
         "MAX_NAME_LENGTH = 40 must be enforced"),
        ("v11-wh-blank", _vform(whText=""), False,
         {"capacity": "Enter the battery energy in watt-hours."},
         "Wh mode requires the battery energy"),
        ("v12-wh-zero", _vform(whText="0"), False,
         {"capacity": "Battery energy must be greater than 0."},
         "0 Wh is not a battery"),
        ("v13-vah-blank-volts", _vform(capacityMode="voltAmpHour", voltageText="", ahText="100"),
         False, {"capacity": "Enter both the battery voltage and amp-hours."},
         "voltAmpHour mode needs BOTH fields"),
        ("v14-vah-zero-ah", _vform(capacityMode="voltAmpHour", voltageText="12", ahText="0"),
         False, {"capacity": "Voltage and amp-hours must be greater than 0."},
         "0 V or 0 Ah rejected"),
        ("v15-vah-ok-yields-1200", _vform(capacityMode="voltAmpHour", voltageText="12", ahText="100"),
         True, {}, "12 V × 100 Ah parses to exactly 1,200 Wh nominal"),
        ("v16-usable-zero", _vform(usablePercentText="0"), False,
         {"usable": "Enter a usable share above 0% and up to 100%."},
         "0% usable is not allowed"),
        ("v17-usable-100-ok", _vform(usablePercentText="100"), True, {},
         "100% usable is allowed"),
        ("v18-reserve-100", _vform(reservePercentText="100"), False,
         {"reserve": "Enter a reserve from 0% up to (not including) 100%."},
         "reserve must stay strictly below 100%"),
        ("v19-reserve-99.9-ok", _vform(reservePercentText="99.9"), True, {},
         "99.9% reserve is accepted"),
        ("v20-ac-eff-0", _vform(acEfficiencyText="0"), False,
         {"acEfficiency": "AC efficiency must be above 0% and up to 100%."},
         "0% efficiency would mean infinite draw"),
        ("v21-dc-eff-101", _vform(dcEfficiencyText="101"), False,
         {"dcEfficiency": "DC efficiency must be above 0% and up to 100%."},
         "efficiency caps at 100%"),
        ("v22-idle-negative", _vform(inverterIdleText="-1"), False,
         {"inverterIdle": "Enter inverter idle draw from 0 W to 10,000 W."},
         "idle floor is 0"),
        ("v23-idle-blank", _vform(inverterIdleText=""), False,
         {"inverterIdle": "Enter inverter idle draw from 0 W to 10,000 W."},
         "idle draw cannot be blank"),
        ("v24-output-limit-100001", _vform(maxAcOutputText="100001"), False,
         {"outputLimit": "Enter a positive wattage, or leave this blank."},
         "output limit ceiling is 100,000 W"),
        ("v25-output-limit-zero", _vform(maxAcOutputText="0"), False,
         {"outputLimit": "Enter a positive wattage, or leave this blank."},
         "0 is not a positive wattage"),
        ("v26-output-limit-blank-ok", _vform(), True, {},
         "leaving the output limit blank is fine (no monitoring)"),
        ("v27-target-0h-0m", _vform(targetHoursText="0", targetMinutesText="0"), False,
         {"target": "The target outage must be longer than 0."},
         "a zero-length outage is meaningless"),
        ("v28-target-60-minutes", _vform(targetMinutesText="60"), False,
         {"target": "Enter minutes from 0 to 59."},
         "60 minutes must be entered as one hour, not 00:60"),
        ("v29-target-fractional-hours", _vform(targetHoursText="4.5"), False,
         {"target": "Enter whole hours from 0 to 999."},
         "hours must be whole; the remainder goes in minutes"),
        ("v30-target-0h-30m-ok", _vform(targetHoursText="0", targetMinutesText="30"), True, {},
         "30 minutes is a valid target -> targetHours = 0.5"),
        ("v31-disabled-device-still-validated",
         _vform(devices=[_vdevice(wattsText="10001", enabled=False)]), False,
         {"device:d1:watts": "Enter watts from 0 to 10,000."},
         "even a disabled device must carry valid numbers (re-enabling it must not poison results)"),
    ]


def build_calls():
    calls = []

    def call(cid, mod, fn, args):
        calls.append(dict(id=cid, mod=mod, fn=fn, args=args))

    # formatting — every boundary
    call("f01-formatWh-0", "formatting", "formatWh", [0])
    call("f02-formatWh-999.4", "formatting", "formatWh", [999.4])
    call("f03-formatWh-999.6-rounds-up", "formatting", "formatWh", [999.6])
    call("f04-formatWh-1234567.8", "formatting", "formatWh", [1234567.8])
    call("f05-formatWh-360", "formatting", "formatWh", [360])
    call("f06-formatWatts-0", "formatting", "formatWatts", [0])
    call("f07-formatWatts-18", "formatting", "formatWatts", [18])
    call("f08-formatWatts-21.17647-rounds-1dp", "formatting", "formatWatts", [21.17647])
    call("f09-formatWatts-1234.56-grouped", "formatting", "formatWatts", [1234.56])
    call("f10-formatPercent-0.8", "formatting", "formatPercent", [0.8])
    call("f11-formatPercent-one-third", "formatting", "formatPercent", [1.0 / 3.0])
    call("f12-formatDuration-0", "formatting", "formatDuration", [0])
    call("f13-formatDuration-0.5", "formatting", "formatDuration", [0.5])
    call("f14-formatDuration-just-under-1h", "formatting", "formatDuration", [59.9 / 60.0])
    call("f15-formatDuration-1h", "formatting", "formatDuration", [1])
    call("f16-formatDuration-1.25h", "formatting", "formatDuration", [1.25])
    call("f17-formatDuration-17h", "formatting", "formatDuration", [17.0])
    call("f18-formatDuration-47.99h", "formatting", "formatDuration", [47.99])
    call("f19-formatDuration-48h-exact", "formatting", "formatDuration", [48])
    call("f20-formatDuration-72.25h", "formatting", "formatDuration", [72.25])
    call("f21-formatSignedDuration-minus-0.5", "formatting", "formatSignedDuration", [-0.5])
    call("f22-formatSignedDuration-minus-50h", "formatting", "formatSignedDuration", [-50])
    call("f23-formatSignedDuration-0-no-sign", "formatting", "formatSignedDuration", [0])
    call("f24-hoursFromParts-4h30m", "formatting", "hoursFromParts", [4, 30])
    call("f25-hoursFromParts-59min", "formatting", "hoursFromParts", [0, 59])
    call("f26-energy-12x100", "calculations", "energyFromVoltageAh", [12, 100])
    call("f27-energy-24x50", "calculations", "energyFromVoltageAh", [24, 50])
    # sharing — payload/error paths that don't need a form
    call("f28-share-none-hash", "sharing", "readShareHash", ["#/about"])
    call("f29-share-bad-suffix", "sharing", "readShareHash", ["#config=nonsense"])
    call("f30-share-v9-unsupported", "sharing", "readShareHash", ["#config=v9." + "A" * 8])
    call("f31-share-incomplete", "sharing", "readShareHash", ["#config=v1."])
    call("f32-share-invalid-charset", "sharing", "readShareHash", ["#config=v1.@@@%"])
    call("f33-share-too-large", "sharing", "readShareHash", ["#config=v1." + "A" * 9500])
    call("f34-share-empty-settings", "sharing", "readShareHash", ["#config=v1.e30"])
    call("f35-share-undecodable-payload", "sharing", "readShareHash", ["#config=v1.A"])
    return calls


# --------------------------------------------------------------------------- #
# The JS harness (generated, bundled with esbuild, executed by node)            #
# --------------------------------------------------------------------------- #

SHIMS_JS = """\
function install() {
  var store = new Map();
  var localStorage = {
    getItem: function (k) { return store.has(k) ? store.get(k) : null; },
    setItem: function (k, v) { store.set(String(k), String(v)); },
    removeItem: function (k) { store.delete(String(k)); },
    clear: function () { store.clear(); },
  };
  globalThis.window = {
    location: { hash: '', origin: 'http://localhost:4173', pathname: '/' },
    localStorage: localStorage,
    matchMedia: function () { return { matches: false, addEventListener: function () {} }; },
    scrollTo: function () {},
    devicePixelRatio: 1,
    isSecureContext: true,
    __store: store,
  };
  globalThis.isSecureContext = true;
}
module.exports = { install: install };
"""

APPBIN_TSX_TEMPLATE = r'''
/* audit harness entry (generated) — runs the REAL site modules in node */
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

import App from '@/App';
import FIXTURES from './fixtures.json';
import { calculateRuntime } from '@/lib/calculations';
import { buildScenarios } from '@/lib/scenarios';
import { validateForm } from '@/lib/validation';
import * as formatting from '@/lib/formatting';
import { buildShareHash, readShareHash } from '@/lib/sharing';
import * as storage from '@/lib/storage';
import { createDefaultForm } from '@/lib/formState';
import { DEVICE_PRESETS, CAPACITY_PRESETS, TARGET_SHORTCUTS } from '@/data/devicePresets';
import { BLOG_POSTS } from '@/data/blogPosts';
import { buildResultSummary } from '@/lib/summary';
import { WORKED_EXAMPLES } from '@/data/workedExamples';
import { siteConfig } from '@/config/site';
import * as calcMod from '@/lib/calculations';

const MODULES: Record<string, any> = {
  calculations: { ...calcMod },
  validation: { validateForm },
  formatting: formatting,
  sharing: { buildShareHash, readShareHash },
  storage: storage,
};

const FIXTURES_JSON = FIXTURES as unknown as Record<string, any>;

function stripIds(form: any) {
  return { ...form, devices: form.devices.map((d: any) => { const { id: _drop, ...rest } = d; return rest; }) };
}

function renderRoute(hash: string): string {
  (globalThis as any).window.location.hash = hash;
  return ReactDOMServer.renderToStaticMarkup(React.createElement(App as any));
}

function safeCall(fn: () => unknown): any {
  try { return fn(); } catch (err: any) {
    return { __harness_error__: String(err && err.message ? err.message : err) };
  }
}

const report: Record<string, unknown> = {};

// 1) RENDER THE WHOLE SITE for every route (fresh mount per route)
const pages: Record<string, string> = {};
for (const [key, hash] of Object.entries(FIXTURES_JSON.pageHashes)) {
  pages[key] = renderRoute(hash as string);
}
(report as any).pages = pages;

// 2) ENGINE cases — real calculateRuntime
(report as any).engine = FIXTURES_JSON.engineCases.map((c: any) => ({
  id: c.id, result: safeCall(() => calculateRuntime(c.input)),
}));

// 3) VALIDATION cases — real validateForm
(report as any).validation = FIXTURES_JSON.validationCases.map((c: any) => {
  const res = safeCall(() => validateForm(c.form)) as any;
  if (res && res.__harness_error__) return { id: c.id, threw: res.__harness_error__ };
  if (res.ok) {
    const inp = res.input;
    return { id: c.id, ok: true, errors: {},
      nominalWh: inp.nominalWh, targetHours: inp.targetHours,
      usableFraction: inp.usableFraction, reserveFraction: inp.reserveFraction,
      energyIsUsable: inp.energyIsUsable, maxAcOutputW: inp.maxAcOutputW };
  }
  return { id: c.id, ok: false, errors: res.errors };
});

// 4) GENERIC CALLS
(report as any).calls = FIXTURES_JSON.calls.map((c: any) => ({
  id: c.id,
  value: safeCall(() => {
    const mod = MODULES[c.mod];
    if (!mod || typeof mod[c.fn] !== 'function') throw new Error(`no function ${c.mod}.${c.fn}`);
    const out = mod[c.fn](...c.args);
    return out === undefined ? 'undefined' : out;
  }),
}));

// 5) SCENARIOS — default setup built from the app's OWN default form
const defaultForm = createDefaultForm();
const defaultValidation = validateForm(defaultForm);
const defaultScenario = defaultValidation.ok ? buildScenarios(defaultValidation.input) : null;
const customScenario = buildScenarios(FIXTURES_JSON.customScenarioInput);
const noEssentialScenario = buildScenarios(FIXTURES_JSON.noEssentialInput);
(report as any).scenarios = {
  default: defaultScenario,
  defaultValidationOk: defaultValidation.ok,
  custom: customScenario,
  noEssential: noEssentialScenario,
  defaultFormFields: (function () {
    const f: any = defaultForm;
    const keys = Object.keys(f).filter((k) => k !== 'devices') as Array<keyof typeof f>;
    const out: any = {};
    for (const k of keys) out[k as string] = f[k];
    out.deviceCount = f.devices.length;
    out.deviceNames = f.devices.map((d: any) => d.name);
    out.deviceEnabled = f.devices.map((d: any) => d.enabled);
    out.deviceEssential = f.devices.map((d: any) => d.essential);
    return out;
  })(),
};

// 6) SHARING round trip with the REAL modules
const shareForm = createDefaultForm();
const shareHash = buildShareHash(shareForm);
const shareRead = readShareHash(shareHash) as any;
const payloadMatch = /^#config=v(\d+)\.([A-Za-z0-9_-]+)$/.exec(shareHash);
(report as any).share = {
  hash: shareHash,
  payload: safeCall(() => payloadMatch ? (function () {
    const b64 = payloadMatch![2].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  })() : null),
  readKind: shareRead && shareRead.kind,
  readFormFields: shareRead && shareRead.kind === 'ok' ? stripIds(shareRead.form) : null,
  readError: shareRead && shareRead.kind === 'error' ? shareRead.message : null,
};

// 7) STORAGE — localStorage save/load/remove via the REAL modules
const win: any = (globalThis as any).window;
const storeReport: any = {};
storage.clearSavedForm();
storeReport.emptyLoad = storage.loadSavedForm();
const custom = createDefaultForm();
custom.whText = '779';
storage.saveForm(custom);
storeReport.keysAfterCustom = Array.from(win.__store.keys());
storeReport.rawAfterCustom = win.__store.get('keep-me-online:settings') || null;
const loadedCustom = storage.loadSavedForm();
storeReport.loadedCustomFields = loadedCustom ? stripIds(loadedCustom) : null;
storage.saveForm(createDefaultForm()); // the default form must NOT persist
storeReport.keysAfterDefault = Array.from(win.__store.keys());
(report as any).storage = storeReport;

// 8) META — shipped data as seen by the real modules
(report as any).meta = {
  closeThreshold: calcMod.CLOSE_THRESHOLD,
  defaultSummary: defaultScenario ? buildResultSummary(defaultScenario) : null,
  workedExamples: WORKED_EXAMPLES.map((w: any) => ({
    id: w.id, title: w.title, status: w.result.status,
    runtimeHours: w.result.runtimeHours,
  })),
  presets: DEVICE_PRESETS,
  capacityPresets: CAPACITY_PRESETS,
  targetShortcuts: TARGET_SHORTCUTS,
  siteConfig: siteConfig,
  blog: BLOG_POSTS.map((p: any) => ({
    id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
    readTime: p.readTime, date: p.date,
    sectionCount: p.content.length,
    headings: p.content.map((s: any) => s.heading),
    paragraphCounts: p.content.map((s: any) => s.paragraphs.length),
    renderedDate: safeCall(() =>
      new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })),
  })),
};

process.stdout.write('====AUDIT_JSON====' + JSON.stringify(report));
'''

ESBUILD_ARGS = ["--bundle", "--format=cjs", "--platform=node", "--jsx=automatic",
                "--log-level=error", "--target=node18", "--define:import.meta.env={}"]


def build_and_run_harness(engine_cases, validation_cases, calls):
    if not os.path.isdir(os.path.join(ROOT, "node_modules", "esbuild")):
        print(colored("FATAL: node_modules not found — run `npm install` first.", "31m"))
        sys.exit(2)
    os.makedirs(RUN_DIR, exist_ok=True)

    fixtures = {
        "pageHashes": {
            "home": "",
            "blog": "/blog",
            "blogPost": "/blog/choosing-the-right-ups-for-your-router",
            "blogPostMissing": "/blog/__missing__",
            "about": "/about",
            "privacy": "/privacy",
            "contact": "/contact",
        },
        "engineCases": [{"id": cid, "input": inp, "context": ctx}
                        for cid, inp, ctx in engine_cases],
        "validationCases": [{"id": cid, "form": form} for cid, form, _ok, _e, _w in validation_cases],
        "calls": calls,
        "customScenarioInput": base_input([
            dev("s-router", "Wi-Fi router", 10, essential=True),
            dev("s-laptop", "Laptop", 45),
            dev("s-monitor", "Monitor", 25),
        ]),
        "noEssentialInput": base_input([dev("n-laptop", "Laptop", 45)], targetHours=8),
    }

    with open(os.path.join(RUN_DIR, "fixtures.json"), "w", newline="", encoding="utf-8") as fh:
        json.dump(fixtures, fh, ensure_ascii=False)
    with open(os.path.join(RUN_DIR, "shims.cjs"), "w", newline="") as fh:
        fh.write(SHIMS_JS)
    with open(os.path.join(RUN_DIR, "appbin.tsx"), "w", newline="", encoding="utf-8") as fh:
        fh.write(APPBIN_TSX_TEMPLATE)
    with open(os.path.join(RUN_DIR, "driver.cjs"), "w", newline="") as fh:
        fh.write("require('./shims.cjs').install();\nrequire('./appbin.cjs');\n")

    out_cjs = os.path.join(RUN_DIR, "appbin.cjs")
    esbuild = os.path.join("node_modules", "esbuild", "bin", "esbuild")
    bundle = run(f'node "{esbuild}" "{os.path.join(RUN_DIR, "appbin.tsx")}" '
                 f'{" ".join(ESBUILD_ARGS)} --alias:@="{SRC}" --outfile="{out_cjs}"')
    if bundle.returncode != 0:
        print(colored("FATAL: esbuild failed to bundle the app:\n" + bundle.stderr[-4000:], "31m"))
        sys.exit(2)

    driver = run(f'node "{os.path.join(RUN_DIR, "driver.cjs")}"')
    if driver.returncode != 0:
        print(colored("FATAL: node harness crashed:\n" + driver.stderr[-4000:], "31m"))
        sys.exit(2)
    stdout = driver.stdout
    if JSON_MARK not in stdout:
        print(colored("FATAL: no report JSON found in harness stdout:\n" + stdout[-2000:], "31m"))
        sys.exit(2)
    return json.loads(stdout[stdout.index(JSON_MARK) + len(JSON_MARK):])


# --------------------------------------------------------------------------- #
# Static (repo-level) audit                                                    #
# --------------------------------------------------------------------------- #


def static_checks():
    g = group("BUILD & ASSETS", "repo structure, entry HTML, build integrity")

    idx = read("index.html")
    contains(g, "D-01", "<title> is exactly the site's product name", idx,
             "<title>Keep Me Online Backup Calculator</title>")
    contains(g, "D-02", "mobile viewport meta present", idx,
             'name="viewport" content="width=device-width, initial-scale=1.0"')
    eq(g, "D-03", "document declares lang=en", True, '<html lang="en"' in idx,
       why="Accessibility: every document needs an explicit language.")
    favicon_ref = 'href="/vite.svg"' in idx
    favicon_exists = (os.path.isfile(os.path.join(ROOT, "public", "vite.svg")) or
                      os.path.isfile(os.path.join(ROOT, "dist", "vite.svg")))
    eq(g, "D-04", "favicon reference actually resolves (no 404)", True,
       (not favicon_ref) or favicon_exists,
       why=("index.html references <link rel=icon href=\"/vite.svg\">, but the repo has no "
            "public/ directory and the built dist/ does not contain vite.svg — every visitor's "
            "browser gets a 404 for the favicon. Ship the icon or drop the tag.")
       if favicon_ref and not favicon_exists else "favicon reference resolves or is absent.")
    eq(g, "D-05", "index.html provides a meta description", True, 'name="description"' in idx,
       why='NO <meta name=\"description\"> in index.html — search engines will invent a snippet. '
           'Add one, e.g. \"Estimate how long your battery backup keeps your router, laptop and '
           'essentials running during a power cut.\"')
    eq(g, "D-06", "og:image does not point at a third-party placeholder domain", True,
       "bolt.new" not in idx,
       why='og:image and twitter:image point at https://bolt.new/static/og_default.png — a '
           'builder-tool placeholder leaking the build platform into link previews. Host a real '
           'preview image (e.g. /og-image.png) and reference it relatively.')
    contains(g, "D-07", "root element present for the SPA mount", idx, '<div id="root"></div>')
    contains(g, "D-08", "app script is wired (/src/main.tsx)", idx, '/src/main.tsx')

    pkg = read("package.json")
    contains(g, "D-09", "typecheck script exists", pkg, '"typecheck"')
    contains(g, "D-10", "build script exists", pkg, '"build"')
    ts = read("tsconfig.app.json")
    contains(g, "D-11", "TypeScript strict mode is on", ts, '"strict": true',
             why="A strictness regression silently changes what tsc accepts.")
    eq(g, "D-13", "dist/index.html exists (site has been built)", True,
       os.path.isfile(os.path.join(ROOT, "dist", "index.html")),
       why="dist/index.html missing — the site has never been built (or dist was wiped).")

    main = read(os.path.join("src", "main.tsx"))
    eq(g, "D-14", "main.tsx mounts <App/> into #root", True,
       "document.getElementById('root')" in main and "App" in main,
       why="Mount-point wiring changed.")

    appsrc = read(os.path.join("src", "App.tsx"))
    eq(g, "D-15", "App renders the shared <Header/> and <Footer/>", True,
       "<Header currentRoute={route} navigate={navigate} />" in appsrc and
       "<Footer navigate={navigate} />" in appsrc,
       why="Header/footer are the site-wide chrome; if App stops rendering them, every page "
           "loses its navigation shell.")

    router = read(os.path.join("src", "lib", "router.ts"))
    eq(g, "D-16", "router ignores '#config=' hashes (share links are not routes)", True,
       "startsWith('#config=')" in router,
       why="If hashchange stops ignoring #config=, opening a share link switches the page to "
           "the fallback route and loses the shared configuration.")

    stray = []
    for dirpath, _dirs, files in os.walk(SRC):
        if os.path.sep + "tests" in dirpath:
            continue
        for fn in files:
            if fn.endswith((".ts", ".tsx")):
                with open(os.path.join(dirpath, fn), encoding="utf-8", newline="") as fh:
                    if "console.log(" in fh.read():
                        stray.append(os.path.relpath(os.path.join(dirpath, fn), ROOT))
    eq(g, "D-17", "no debug console.log() in shipped source", [], stray,
       why="Console noise shipped to production is a debug artifact.")
    return g


# --------------------------------------------------------------------------- #
# Behavioural audit (needs the harness report)                                 #
# --------------------------------------------------------------------------- #


def engine_checks(rep):
    g = group("ENGINE", "physics of every calculation path, executed against the real TS engine")
    cases = build_engine_cases()
    js_by_id = {c["id"]: c for c in rep["engine"]}

    for cid, inp, context in cases:
        js = js_by_id.get(cid)
        py = calc(inp)
        result = js.get("result") if isinstance(js, dict) else None
        if result is None or not isinstance(result, dict) or result.get("__harness_error__"):
            check(g, cid, f"engine case {cid}", False,
                  why=(f"the real engine threw or never returned a result for case {cid}: "
                       f"{result.get('__harness_error__') if isinstance(result, dict) else 'missing case'}"),
                  expected=py, actual=js)
            continue
        compare_calc_result(g, cid, cid, py, result, context)

    eq(g, "E-K01", "CLOSE_THRESHOLD is exactly 0.9", 0.9, rep["meta"].get("closeThreshold"),
       why="The 'close to target' band relies on the 90% threshold; a silent change would alter "
           "every status label users see.")
    return g


def validation_checks(rep):
    g = group("VALIDATION", "every input rule and exact user-facing error message")
    js_by_id = {v["id"]: v for v in rep["validation"]}

    for cid, form, ok_expected, errors_expected, why in build_validation_cases():
        js = js_by_id.get(cid)
        if js is None or "threw" in js:
            check(g, cid, f"validation {cid} — {why}", False,
                  why=f"validateForm threw: {js.get('threw') if js else 'missing case'}",
                  expected={"ok": ok_expected, "errors": errors_expected}, actual=js)
            continue
        errs_js = dict(js["errors"])
        same_ok = js["ok"] == ok_expected
        same_errs = errs_js == errors_expected
        diff = []
        if not same_ok:
            diff.append(f"ok flag: engine={js['ok']} expected={ok_expected}")
        for k in sorted(set(errs_js) | set(errors_expected)):
            e, a = errors_expected.get(k), errs_js.get(k)
            if (e is None) != (a is None) or (e is not None and e != a):
                diff.append(f"errors[{k!r}]: engine={a!r} expected={e!r}")
        why_full = (f"{why}; but " + "; ".join(diff) +
                    " — the rule or its user-facing message deviates from the audited spec."
                    if diff else why)
        full = check(g, cid, f"validation {cid} — {why}", same_ok and same_errs,
                     why=why_full,
                     expected={"ok": ok_expected, "errors": errors_expected},
                     actual={"ok": js["ok"], "errors": errs_js})
        if full and ok_expected and cid == "v15-vah-ok-yields-1200":
            eq(g, cid + "-a", "12 V × 100 Ah parses to nominalWh = 1200", 1200.0,
               js.get("nominalWh"), tol=1e-9)
        if full and ok_expected and cid == "v30-target-0h-30m-ok":
            eq(g, cid + "-a", "0 h 30 m parses to targetHours = 0.5", 0.5,
               js.get("targetHours"), tol=1e-9)
    return g


FORMAT_EXPECTED = {
    "f01-formatWh-0": "0 Wh",
    "f02-formatWh-999.4": "999 Wh",
    "f03-formatWh-999.6-rounds-up": "1,000 Wh",
    "f04-formatWh-1234567.8": "1,234,568 Wh",
    "f05-formatWh-360": "360 Wh",
    "f06-formatWatts-0": "0 W",
    "f07-formatWatts-18": "18 W",
    "f08-formatWatts-21.17647-rounds-1dp": "21.2 W",
    "f09-formatWatts-1234.56-grouped": "1,234.6 W",
    "f10-formatPercent-0.8": "80%",
    "f11-formatPercent-one-third": "33.3%",
    "f12-formatDuration-0": "0 min",
    "f13-formatDuration-0.5": "30 min",
    "f14-formatDuration-just-under-1h": "1 h 0 min",
    "f15-formatDuration-1h": "1 h 0 min",
    "f16-formatDuration-1.25h": "1 h 15 min",
    "f17-formatDuration-17h": "17 h 0 min",
    "f18-formatDuration-47.99h": "47 h 59 min",
    "f19-formatDuration-48h-exact": "2 days 0 h",
    "f20-formatDuration-72.25h": "3 days 0 h",
    "f21-formatSignedDuration-minus-0.5": "-30 min",
    "f22-formatSignedDuration-minus-50h": "-2 days 2 h",
    "f23-formatSignedDuration-0-no-sign": "0 min",
    "f24-hoursFromParts-4h30m": 4.5,
    "f25-hoursFromParts-59min": 59.0 / 60.0,
    "f26-energy-12x100": 1200,
    "f27-energy-24x50": 1200,
    "f28-share-none-hash": {"kind": "none"},
    "f29-share-bad-suffix": {"kind": "error",
                             "message": "This share link is incomplete or damaged."},
    "f30-share-v9-unsupported": {"kind": "error",
                                 "message": "This share link was made by an unsupported version."},
    "f31-share-incomplete": {"kind": "error",
                             "message": "This share link is incomplete or damaged."},
    "f32-share-invalid-charset": {"kind": "error",
                                  "message": "This share link is incomplete or damaged."},
    "f33-share-too-large": {"kind": "error",
                            "message": "This share link is too large to load."},
    "f34-share-empty-settings": {"kind": "error",
                                 "message": "This share link contains settings that could not be read."},
    "f35-share-undecodable-payload": {"kind": "error",
                                      "message": "This share link is damaged and could not be read."},
}

FORMAT_TITLES = {
    "f01-formatWh-0": "formatWh(0)",
    "f02-formatWh-999.4": "formatWh(999.4) stays below the thousand grouping",
    "f03-formatWh-999.6-rounds-up": "formatWh(999.6) rounds into '1,000 Wh' (boundary)",
    "f04-formatWh-1234567.8": "formatWh(1234567.8) groups thousands",
    "f05-formatWh-360": "formatWh(360)",
    "f06-formatWatts-0": "formatWatts(0)",
    "f07-formatWatts-18": "formatWatts(18) shows no decimals",
    "f08-formatWatts-21.17647-rounds-1dp": "formatWatts rounds to 1 decimal",
    "f09-formatWatts-1234.56-grouped": "formatWatts(1234.56) groups thousands",
    "f10-formatPercent-0.8": "formatPercent(0.8)",
    "f11-formatPercent-one-third": "formatPercent(1/3) rounds to 33.3%",
    "f12-formatDuration-0": "formatDuration(0)",
    "f13-formatDuration-0.5": "formatDuration(0.5 h)",
    "f14-formatDuration-just-under-1h": "formatDuration(59.9 min) rounds up into the hour branch",
    "f15-formatDuration-1h": "formatDuration(1 h)",
    "f16-formatDuration-1.25h": "formatDuration(1.25 h)",
    "f17-formatDuration-17h": "formatDuration(17 h)",
    "f18-formatDuration-47.99h": "formatDuration just under the 2-day cutover",
    "f19-formatDuration-48h-exact": "formatDuration exactly at the 2-day cutover",
    "f20-formatDuration-72.25h": "formatDuration(72.25 h) shows days",
    "f21-formatSignedDuration-minus-0.5": "formatSignedDuration(-0.5)",
    "f22-formatSignedDuration-minus-50h": "formatSignedDuration(-50)",
    "f23-formatSignedDuration-0-no-sign": "formatSignedDuration(0) carries no sign",
    "f24-hoursFromParts-4h30m": "hoursFromParts(4, 30)",
    "f25-hoursFromParts-59min": "hoursFromParts(0, 59)",
    "f26-energy-12x100": "energyFromVoltageAh(12, 100) — the blog's 1200 Wh example",
    "f27-energy-24x50": "energyFromVoltageAh(24, 50) — the blog's second example",
    "f28-share-none-hash": "readShareHash('#/about') is not a share link",
    "f29-share-bad-suffix": "readShareHash('#config=nonsense') fails the payload pattern",
    "f30-share-v9-unsupported": "version-9 hash refused with the exact message",
    "f31-share-incomplete": "version-1 hash with an empty payload refused",
    "f32-share-invalid-charset": "payload with '%' fails the URL-safe charset pattern",
    "f33-share-too-large": ">8 KB payload refused with the exact message",
    "f34-share-empty-settings": "'{}' payload refused with the exact message",
    "f35-share-undecodable-payload": "charset-valid but atob-invalid payload ('A') hits the "
                                     "decoder's catch branch",
}


def formatting_checks(rep):
    g = group("FORMATTING", "exact output strings of every formatter, boundaries included")
    js = {c["id"]: c["value"] for c in rep["calls"]}
    for cid, exp in FORMAT_EXPECTED.items():
        a = js.get(cid, "<<missing from the harness report>>")
        if isinstance(exp, float):
            eq(g, cid, FORMAT_TITLES[cid], exp, a, tol=1e-9)
        else:
            eq(g, cid, FORMAT_TITLES[cid], exp, a)
    return g


def share_storage_checks(rep):
    g = group("SHARE & STORAGE", "share-link encode/decode + localStorage round-trip, real modules")
    s = rep.get("share", {})
    hash_v = s.get("hash", "")
    eq(g, "S-01", "share hash format is '#config=v1.<base64url>'", True,
       re.fullmatch(r"#config=v1\.[A-Za-z0-9_\-]+", hash_v or "") is not None,
       why="buildShareHash must emit the documented version-1 base64url format.")

    payload = s.get("payload")
    decoded = None
    if isinstance(payload, str):
        try:
            decoded = json.loads(payload)
        except Exception as exc:
            decoded = None
            decode_err = str(exc)
    if decoded is None:
        eq(g, "S-02", "the share payload decodes to the default-form JSON", True, False,
           why=("Python could not decode the share payload the JS encoder produced. "
                "Encoding and decoding are asymmetric: " + decode_err))
    else:
        eq(g, "S-03", "all 13 config fields survive encoding", True,
           all(decoded.get(k) == v for k, v in DEFAULT_FORM_FIELDS.items()),
           why="A config field was dropped or renamed during encoding — a shared link would "
               "load with silently different settings.")
        devs = decoded.get("devices", [])
        eq(g, "S-04", "the 7 shipped presets survive encoding (ids stripped, data intact)",
           [(n, w, q, d, p) for (n, w, q, d, p, _e, _fl) in DEVICE_PRESETS_EXPECTED],
           [(d.get("name"), float(d.get("wattsText")), float(d.get("quantityText")),
             float(d.get("dutyText")), d.get("path")) for d in devs])
        eq(g, "S-05", "encoded devices carry NO generated ids", True,
           all(not d.get("id") for d in devs),
           why="Device ids are regenerated per session (Date.now + random); embedding them in "
               "share links makes every link unique and non-reproducible.")

    rf = s.get("readFormFields")
    rp = rep.get("share", {}).get("readKind")
    eq(g, "S-06", "readShareHash succeeds on its own encode (kind = 'ok')", "ok", rp,
       why="Opening a fresh share URL must restore the config, not fall back to defaults.")
    if isinstance(rf, dict):
        eq(g, "S-07", "decode returns the same 13 config fields", True,
           all(rf.get(k) == v for k, v in DEFAULT_FORM_FIELDS.items()))
        eq(g, "S-08", "decode returns 7 devices with data AND essential/enabled flags intact",
           [(n, w, q, d, p, e, fl) for (n, w, q, d, p, e, fl) in DEVICE_PRESETS_EXPECTED],
           [(d.get("name"), float(d.get("wattsText")), float(d.get("quantityText")),
             float(d.get("dutyText")), d.get("path"), d.get("essential"), d.get("enabled"))
            for d in rf.get("devices", [])],
           why="A round-trip through buildShareHash -> readShareHash corrupted device data. "
               "The essential/enabled flags drive the essentials scenario and default loads.")

    st = rep.get("storage", {})
    eq(g, "S-09", "storage starts empty (loadSavedForm -> null)", True,
       st.get("emptyLoad") is None,
       why="loadSavedForm must return null when nothing has been saved.")
    eq(g, "S-10", "saveForm(custom) writes exactly one settings key",
       ["keep-me-online:settings"], st.get("keysAfterCustom"),
       why="saveForm must use the single documented storage key.")
    raw = st.get("rawAfterCustom")
    raw_obj = None
    raw_ok = False
    if isinstance(raw, str):
        try:
            raw_obj = json.loads(raw)
            raw_ok = raw_obj.get("version") == 1 and \
                raw_obj.get("form", {}).get("whText") == "779"
        except Exception:
            raw_ok = False
    check(g, "S-11", "saved blob is {version: 1, form: {...}} with the edited value", raw_ok,
       why="saveForm must write the version-1 wrapper; a version mismatch makes loadSavedForm "
           "ignore the data (silent loss for users on reload).",
       expected={"version": 1, "form.whText": "779"}, actual=(raw_obj or "unparseable"))
    lc = st.get("loadedCustomFields")
    eq(g, "S-12", "loadSavedForm round-trips an edited form", True,
       isinstance(lc, dict) and lc.get("whText") == "779")
    eq(g, "S-13", "saveForm(defaultForm) clears storage (defaults never persist)", [],
       st.get("keysAfterDefault"),
       why="The shipped default form must never be written to localStorage — storage.ts's "
           "isDefaultForm guard exists to keep 'first run' pristine.")
    return g


def scenario_checks(rep):
    g = group("SCENARIOS", "essentials-mode and per-device marginal-savings ranking")
    sc = rep.get("scenarios", {})
    d = sc.get("default") or {}
    cur = d.get("current") or {}
    ess = d.get("essentials") or {}
    sugg = d.get("suggestions") or []

    eq(g, "C-00", "the shipped default form validates out of the box", True,
       bool(sc.get("defaultValidationOk")),
       why="createDefaultForm() must feed validateForm without a single error, or the page "
           "boots in 'Cannot estimate' state.")

    eq(g, "C-01", "default setup: essentialCount == 2 (router + ONT)", 2,
       d.get("essentialCount"), tol=0)
    eq(g, "C-02", "default setup: battery draw == 63/0.85 W",
       63.0 / 0.85, cur.get("batteryDrawW"),
       why=f"batteryDrawW deviates (engine={cur.get('batteryDrawW')!r}, spec=63/0.85): load "
           "summation or efficiency handling changed.")
    eq(g, "C-03", "default setup: essentials-only runtime is 17.0 h", 17.0,
       ess.get("runtimeHours"), tol=1e-9,
       why="The essentials scenario lost the router/ONT or the efficiency handling changed.")
    eq(g, "C-04", "exactly 1 switch-off suggestion with shipped presets (only laptop qualifies)",
       1, len(sugg), tol=0,
       why="The suggestion filter must consider enabled + nonessential devices with a nonzero "
           "average draw only.")
    if len(sugg) == 1:
        first = sugg[0]
        eq(g, "C-05", "laptop ranked with battery-side saving 45/0.85 W",
           45.0 / 0.85, first.get("batteryDrawSavedW"), tol=1e-9,
           why="Marginal saving must be measured on the battery side (draw / efficiency), not "
               "the AC-side nameplate watts.")
        eq(g, "C-06", "laptop-off improvement equals 17.0 h − current runtime (306/63 h)",
           17.0 - 306.0 / 63.0, first.get("improvementHours"), tol=1e-9)

    cst = sc.get("custom") or {}
    eq(g, "C-07", "custom: suggestions strictly ordered by battery draw saved",
       ["s-laptop", "s-monitor"],
       [sg.get("device", {}).get("id") for sg in (cst.get("suggestions") or [])],
       why="Ranking must sort descending by batteryDrawSavedW; a broken comparator shows users "
           "the wrong device to switch off first.")
    eq(g, "C-08", "custom: current status is 'close' (runtime 306/80 h vs 4 h target, ≥90%)",
       "close", (cst.get("current") or {}).get("status"),
       why="Status thresholds changed.")
    eq(g, "C-09", "custom: essentialCount == 1", 1, cst.get("essentialCount"), tol=0)

    ne = sc.get("noEssential") or {}
    eq(g, "C-10", "no-essentials input: essentials scenario is 'no-load' with null runtime",
       {"status": "no-load", "runtimeHours": None},
       {"status": (ne.get("essentials") or {}).get("status"),
        "runtimeHours": (ne.get("essentials") or {}).get("runtimeHours")},
       why="With no essential devices the essentials scenario must be the no-load state — not a "
           "crash and not runtime = 0 h.")
    eq(g, "C-11", "no-essentials input: essentialCount == 0", 0, ne.get("essentialCount"), tol=0)

    df = sc.get("defaultFormFields") or {}
    eq(g, "C-12", "shipped defaults match their documented contract",
       {**DEFAULT_FORM_FIELDS, "deviceCount": 7,
        "deviceNames": [p[0] for p in DEVICE_PRESETS_EXPECTED],
        "deviceEnabled": [p[6] for p in DEVICE_PRESETS_EXPECTED],
        "deviceEssential": [p[5] for p in DEVICE_PRESETS_EXPECTED]},
       {**{k: v for k, v in df.items()
           if k not in ("deviceCount", "deviceNames", "deviceEnabled", "deviceEssential")},
        "deviceCount": df.get("deviceCount"),
        "deviceNames": df.get("deviceNames"),
        "deviceEnabled": df.get("deviceEnabled"),
        "deviceEssential": df.get("deviceEssential")},
       why="Someone changed the shipped defaults (createDefaultForm / devicePresets) — every "
           "number published in the docs assumes THESE defaults.")
    return g


def _worked_example2_input():
    """The exact fixtures shipped as worked example 2 (data/workedExamples.ts)."""
    return base_input([
        dev("router", "Wi-Fi router", 10, essential=True),
        dev("ont", "Fiber ONT/modem", 8, essential=True),
        dev("laptop", "Laptop", 45),
    ])


def summary_examples_checks(rep):
    g = group("SUMMARY & EXAMPLES", "share-text summary and shipped worked examples")
    meta = rep.get("meta", {})
    expected_summary = (
        "Keep Me Online power-cut estimate (planning estimate only)\n"
        "Battery: 500 Wh nominal\n"
        "Target outage: 4 h 0 min\n"
        "Current setup: 4 h 51 min (Meets target)\n"
        "Essential devices only: 17 h 0 min (Meets target)"
    )
    eq(g, "W-01", "buildResultSummary for the default setup (exact, line by line)",
       expected_summary, meta.get("defaultSummary"),
       why="The copy-summary text is user-facing; a changed formatter or status label shows up "
           "here first.")

    ex = {w.get("id"): w for w in meta.get("workedExamples", []) if isinstance(w, dict)}
    e1 = ex.get("router-ont") or {}
    e2 = ex.get("router-ont-laptop") or {}
    eq(g, "W-02", "worked example 1 runtime == 17.0 h (500 Wh, router + ONT)", 17.0,
       e1.get("runtimeHours"), tol=1e-9,
       why="Example 1's published figure no longer matches the engine — the page renders an "
           "inconsistent number.")
    eq(g, "W-03", "worked example 2 runtime recomputes from its own published inputs",
       calc(_worked_example2_input())["runtimeHours"], e2.get("runtimeHours"),
       tol=1e-9,
       why="Example 2's stored result no longer matches its inputs (stale cache after an "
           "assumption or engine change).")
    eq(g, "W-04", "example 2 keeps its published title", "Example 2: Router, ONT, and laptop",
       e2.get("title"))
    return g


def content_claims_checks(rep):
    """Blog posts and the FAQ state numbers; the REAL engine recomputes them."""
    g = group("CONTENT CLAIMS", "published blog/FAQ numbers recomputed by the real engine")
    eng = {c["id"]: (c.get("result") if isinstance(c.get("result"), dict) else {})
           for c in rep["engine"]}

    eq(g, "X-01", "FAQ claim: 500 Wh × 80% usable − 10% reserve = 360 Wh planning",
       360.0, calc(base_input([])) ["planningWh"],
       why="The FAQ answer no longer matches what the calculator computes.")

    r1 = eng.get("c16-blog1-300wh-system", {})
    rt1 = r1.get("runtimeHours") if isinstance(r1.get("runtimeHours"), (int, float)) else None
    check(g, "X-02", "Blog 1: 300 Wh @ 18 W router+ONT claim matches the engine (~11 h ±2%)",
          rt1 is not None and abs(rt1 - 11.0) / 11.0 <= 0.02,
          why=(f"Published claim: 'roughly 11 hours'. Engine value: "
               f"{round(rt1, 2) if rt1 is not None else 'no result'} h. The article's 11 h "
               f"equals 240 Wh usable × 0.85/18 = 11.33 h — it ignored the 10% planning "
               f"reserve the calculator applies (300×0.8×0.9 = 216 Wh of spending energy)."),
          expected="≈ 10.8 – 11.2 h (the claim)", actual=rt1)

    base_run = calc(base_input([dev("r", "Wi-Fi router", 10, essential=True),
                                dev("o", "Fiber ONT/modem", 8, essential=True)]))
    laptop_run = calc(_worked_example2_input())
    check(g, "X-03", "Blog 3: 'from about 11 hours' matches the engine (router+ONT, 500 Wh, ±5%)",
          abs(base_run["runtimeHours"] - 11.0) / 11.0 <= 0.05,
          why=(f"Blog article 'How Long Can a Laptop Run During a Power Cut?' claims router+ONT "
               f"on a 500 Wh battery runs 'about 11 hours'; the calculator's model gives "
               f"{base_run['runtimeHours']:.2f} h (500×0.8×0.9×0.85/18 = 17.0 h). The "
               f"published number looks like a 300-Wh figure copied into a 500-Wh sentence."),
          expected="≈ 11.0 h (the claim)", actual=base_run["runtimeHours"])
    check(g, "X-04", "Blog 3: 'down to roughly 3 hours' matches the engine (±5%)",
          abs(laptop_run["runtimeHours"] - 3.0) / 3.0 <= 0.05,
          why=(f"Same article claims adding a 45 W laptop cuts runtime 'down to roughly 3 "
               f"hours'; the calculator's model gives {laptop_run['runtimeHours']:.2f} h "
               f"(306 Wh / 63 h = 4.86 h)."),
          expected="≈ 3.0 h (the claim)", actual=laptop_run["runtimeHours"])

    r4 = eng.get("c17-blog4-100w-load", {})
    bd = r4.get("batteryDrawW")
    check(g, "X-05", "Blog 4: 100 W AC ≈ 118 W battery draw at 85% efficiency",
          isinstance(bd, (int, float)) and abs(bd - 118.0) / 118.0 <= 0.01,
          why="batteryDrawW = 100/0.85 = 117.65 W — 'about 118' holds.",
          expected="≈ 118 W", actual=(None if bd is None else round(bd, 2)))
    eq(g, "X-06", "Blog 4: 5 W idle × 10 h = 50 Wh ≈ 14% of 360 Wh planning energy", True,
       abs(50.0 / 360.0 - 0.14) <= 0.01,
       why="Article arithmetic: 50/360 = 13.9% ≈ 'nearly 14%'.")
    eq(g, "X-07", "Blog 6: 12 V × 100 Ah at 50% usable → 600 Wh",
       600.0, eng.get("c18-leadacid-50percent", {}).get("usableWh"), tol=1e-9,
       why="usableWh must equal nominal × usableFraction.")
    return g


def blog_data_checks(rep):
    g = group("BLOG DATA", "inventory: slugs, categories, dates, sections")
    js_blog = rep.get("meta", {}).get("blog", [])
    eq(g, "B-01", "exactly 6 blog posts shipped", 6, len(js_blog), tol=0)
    eq(g, "B-02", "slugs/titles/categories/readTime/dates match the audited inventory",
       BLOG_EXPECTED,
       [(b.get("id"), b.get("slug"), b.get("title"), b.get("category"),
         b.get("readTime"), b.get("date")) for b in js_blog])
    eq(g, "B-03", "every post has ≥3 sections and ≥1 paragraph per section", True,
       all(b.get("sectionCount", 0) >= 3 and
           all(p >= 1 for p in b.get("paragraphCounts", [])) for b in js_blog))
    dates = [b.get("date") for b in js_blog]
    eq(g, "B-04", "publication dates strictly descend (newest first)", True,
       all(a > b for a, b in zip(dates, dates[1:])),
       why="The blog list order is the array order; an out-of-order date breaks ordering.")
    eq(g, "B-05", "dates parse as ISO yyyy-mm-dd", True,
       all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", d or "") for d in dates))
    eq(g, "B-06", "excerpts exist (80..400 chars)", True,
       all(80 <= len(b.get("excerpt", "")) <= 400 for b in js_blog))
    eq(g, "B-07", "every post renders its date deterministically in en-US", True,
       all(isinstance(b.get("renderedDate"), str) and b["renderedDate"].startswith(
           MONTHS[int(b["date"][5:7]) - 1]) for b in js_blog),
       why="new Date(...).toLocaleDateString must yield '<Month> <day>, <year>'.")
    return g


def date_en_us(iso):
    """Mirror new Date('YYYY-MM-DD').toLocaleDateString('en-US', {month, day, year})."""
    y, m, d = (int(x) for x in iso.split("-"))
    local = datetime(y, m, d, tzinfo=timezone.utc).astimezone()
    return f"{MONTHS[local.month - 1]} {local.day}, {local.year}"


def _primary_nav(html_u):
    i = html_u.find('<nav aria-label="Primary">')
    if i < 0:
        return None
    return html_u[i:html_u.find("</nav>", i)]


def _nav_buttons(nav_html):
    return re.findall(r'<button([^>]*)>\s*([^<]*?)\s*</button>', nav_html)


def _footer_of(html_u):
    i = html_u.find("<footer")
    if i < 0:
        return ""
    return html_u[i:html_u.find("</footer>", i)]


def header_footer_checks(rep, unesc):
    gh = group("HEADER (rendered, every page)", "brand, nav inventory, active state, a11y")
    gf = group("FOOTER (rendered, every page)", "footer nav, disclaimer, copyright")
    pages = rep.get("pages", {})
    routes = {k: pages.get(k) for k in
              ("home", "blog", "blogPost", "blogPostMissing", "about", "privacy", "contact")}
    n = len([v for v in routes.values() if v])
    eq(gh, "H-00", "all 7 audited routes rendered", 7, n, tol=0,
       why="Some route failed to render server-side — the app cannot mount there.")

    hdr_one, nav_ok, brand_ok = [], [], []
    labels_by_route, active_by_route = {}, {}
    for name, raw in routes.items():
        if not raw:
            continue
        u = unesc(raw)
        hdr_one.append(u.count("<header") == 1)
        nav = _primary_nav(u)
        nav_ok.append(1 if nav else 0)
        brand_ok.append(1 if 'aria-label="Keep Me Online home"' in u else 0)
        if nav is not None:
            btns = _nav_buttons(nav)
            labels_by_route[name] = [b[1] for b in btns]
            active_by_route[name] = [1 if 'aria-current="page"' in b[0] else 0 for b in btns]

    def per_route(flags, gid, title, why):
        eq(gh, gid, title, n, sum(flags), why=why)

    per_route([1 if f else 0 for f in hdr_one], "H-01", "exactly one <header> on every page",
              "at least one page lost its header (App.tsx renders it globally) or a page "
              "renders a second one.")
    per_route(nav_ok, "H-02", "primary nav (aria-label='Primary') on every page",
              "the primary nav vanished on at least one page.")
    per_route(brand_ok, "H-03", "brand button keeps aria-label='Keep Me Online home'",
              "the brand link lost its accessible label (screen readers and users without "
              "images depend on it).")

    for name in labels_by_route:
        eq(gh, "H-10-" + name,
           f"nav shows exactly [Calculator, Blog, About, Privacy, Contact] on '{name}'",
           [lb for _, lb in NAV_EXPECTED], labels_by_route.get(name),
           why="Nav inventory/order changed — a missing item or wrong label strands users.")

    eq(gh, "H-20", "home: only 'Calculator' aria-current", [1, 0, 0, 0, 0],
       active_by_route.get("home"),
       why="The active-route indicator (aria-current='page') is wrong on '/': either the "
           "calculator is not highlighted or something else is highlighted too.")
    eq(gh, "H-21", "/blog: only 'Blog' aria-current", [0, 1, 0, 0, 0],
       active_by_route.get("blog"))
    eq(gh, "H-22", "deep blog article: 'Blog' STILL aria-current", [0, 1, 0, 0, 0],
       active_by_route.get("blogPost"),
       why="Header's isActive special-case for '/blog/post' broke — articles would show no "
           "active nav item (or light up the wrong one).")
    eq(gh, "H-23", "/about: only 'About' aria-current", [0, 0, 1, 0, 0], active_by_route.get("about"))
    eq(gh, "H-24", "/privacy: only 'Privacy' aria-current", [0, 0, 0, 1, 0],
       active_by_route.get("privacy"))
    eq(gh, "H-25", "/contact: only 'Contact' aria-current", [0, 0, 0, 0, 1],
       active_by_route.get("contact"))

    hdr_src = read(os.path.join("src", "components", "layout", "Header.tsx"))
    contains(gh, "H-30", "header class keeps 'sticky top-0' and 'no-print'", hdr_src,
             "no-print sticky top-0")
    eq(gh, "H-31", "each nav item routes via navigate('<route>')", True,
       all(("navigate('" + r + "')" in hdr_src) or ("navigate(\"" + r + "\")" in hdr_src) or
           "navigate(item.route)" in hdr_src for r, _ in NAV_EXPECTED),
       why="One nav item no longer routes — a click would dead-end.")
    contains(gh, "H-32", "brand includes the logo mark", hdr_src, '<Zap className="h-5 w-5"')
    eq(gh, "H-33", "aria-current uses the value 'page' specifically", True,
       "aria-current={isActive ? 'page' : undefined}" in hdr_src,
       why="aria-current must be the literal value 'page' for assistive tech, not a bare flag.")

    # ---- footer ----
    f_present, f_nav_ok, f_year_ok, f_disc_ok, f_tag_ok = [], [], [], [], []
    year = datetime.now().year
    for name, raw in routes.items():
        if not raw:
            continue
        u = unesc(raw)
        f = _footer_of(u)
        f_present.append(1 if f else 0)
        if '<nav aria-label="Footer">' in f:
            btns = _nav_buttons(f.split('<nav aria-label="Footer">')[1])
            f_nav_ok.append([b[1] for b in btns] == FOOTER_NAV_EXPECTED)
        else:
            f_nav_ok.append(False)
        f_year_ok.append(f"© {year} Keep Me Online." in f)
        f_disc_ok.append(DISCLAIMER in f)
        f_tag_ok.append(FOOTER_TAGLINE in f)

    per_route(f_present, "T-01", "<footer> present on every page",
              "the footer disappeared from at least one route (App renders it globally).")
    per_route([1 if v else 0 for v in f_nav_ok],
              "T-02", "footer nav shows exactly [Blog, About, Privacy, Contact] on every page",
              "the footer link inventory/columns changed (note: there is intentionally NO "
              "calculator link in the footer nav).")
    per_route([1 if v else 0 for v in f_year_ok],
              "T-03", f"footer copyright reads '© {year} Keep Me Online.' on every page",
              "the copyright year is stale or mangled — Footer uses new Date().getFullYear(), "
              "so a failure means the line was edited or the year got hardcoded.")
    per_route([1 if v else 0 for v in f_disc_ok],
              "T-04", "footer disclaimer present verbatim on every page",
              "the planning-estimate disclaimer is a legal/safety statement and must stay "
              "verbatim: " + DISCLAIMER)
    per_route([1 if v else 0 for v in f_tag_ok],
              "T-05", "footer tagline present on every page", "footer tagline text changed.")

    ftr_src = read(os.path.join("src", "components", "layout", "Footer.tsx"))
    eq(gf, "T-06", "footer year comes from new Date().getFullYear()", True,
       "new Date().getFullYear()" in ftr_src,
       why="A hardcoded year looks out of date every January.")
    return gh, gf


def page_checks(rep, unesc):
    g = group("PAGES (whole-site render)", "content <App/> actually renders on each route")
    pages = rep.get("pages", {})
    home = unesc(pages.get("home", ""))
    blog = unesc(pages.get("blog", ""))
    post = unesc(pages.get("blogPost", ""))
    missing = unesc(pages.get("blogPostMissing", ""))
    about = unesc(pages.get("about", ""))
    privacy = unesc(pages.get("privacy", ""))
    contact = unesc(pages.get("contact", ""))

    contains(g, "A-01", "home hero H1 present verbatim", home,
             "Will your backup power keep you online?")
    contains(g, "A-02", "hero badge text", home, "Power-cut backup planner")
    contains(g, "A-03", "hero CTA 'Calculate my backup'", home, "Calculate my backup")
    contains(g, "A-04", "trust line 'Free. No signup. Your inputs stay in your browser.'", home,
             "Free. No signup. Your inputs stay in your browser.")
    contains(g, "A-05", "FAQ section renders", home, "Frequently asked questions")
    contains(g, "A-06", "results card shows 'Current setup'", home, "Current setup")
    contains(g, "A-07", "actions panel has 'Copy share link'", home, "Copy share link")
    contains(g, "A-08", "device table lists the shipped 'Wi-Fi router' preset", home, "Wi-Fi router")
    contains(g, "A-09", "'Show my calculation' toggle present", home, "Show my calculation")
    contains(g, "A-10", "'Clear saved settings' button present", home, "Clear saved settings")
    contains(g, "A-11", "no ad placeholder while ads are disabled", home,
             "Advertisement placeholder", invert=True)
    contains(g, "A-12", "FAQ answer documents the local-storage choice", home,
             "Settings are saved to your device")

    contains(g, "A-20", "blog list headline", blog, "Power backup blog")
    for _id, slug, title, _cat, _rt, _date in BLOG_EXPECTED:
        contains(g, "A-21-" + slug[:14], f"blog list shows article '{title}'", blog, title)
    eq(g, "A-22", "blog list: 6 visible 'Read article' affordances", 6,
       blog.count(">Read article<"), tol=0)
    eq(g, "A-23", "blog list: 6 cards carry aria-label='Read article: …'", 6,
       blog.count('aria-label="Read article:'), tol=0,
       why="The cards are role=button and need accessible names for keyboard/screen-reader users.")

    first_post = BLOG_EXPECTED[0]
    _i, _slug, p_title, _cat, _rt, p_date = first_post
    contains(g, "A-30", f"article page: H1 contains '{p_title}'", post, p_title)
    js_blog = {b["slug"]: b for b in rep.get("meta", {}).get("blog", [])}
    b1 = js_blog.get(first_post[1], {})
    for h in (b1.get("headings") or [])[:1]:
        contains(g, "A-31", f"article page: render heading '{h}'", post, h)
    contains(g, "A-32", "article page: 'Back to blog' navigation", post, "Back to blog")
    contains(g, "A-33", "article page: 'Related articles' section", post, "Related articles")
    eq(g, "A-34", "article page: 3 related-article cards (h3 count)", 3, post.count("<h3"), tol=0)
    expected_date = date_en_us(p_date)
    contains(g, "A-35", f"article page: rendered date '{expected_date}' (en-US local)",
             post, expected_date,
             why="BlogPostPage renders new Date(post.date).toLocaleDateString('en-US'); a "
                 "mismatch means the shown day drifted (timezone handling) or the format "
                 "changed.")
    if b1.get("excerpt"):
        contains(g, "A-36", "article page: excerpt paragraph present", post, b1["excerpt"][:60])

    contains(g, "A-40", "unknown article slug -> fallback message", missing, "Article not found")
    contains(g, "A-41", "fallback offers 'Back to blog'", missing, "Back to blog")

    contains(g, "A-50", "about page title", about, "About Keep Me Online")
    contains(g, "A-51", "about page states the Peukert limitation", about, "Peukert")
    contains(g, "A-52", "about page keeps the critical-planning safety line", about,
             "Do not use it as the sole basis for critical power planning.")

    contains(g, "A-60", "privacy page title", privacy, "Privacy")
    contains(g, "A-61", "privacy: local storage disclosure", privacy, "Local storage")
    contains(g, "A-62", "privacy: 'No advertising or analytics' section", privacy,
             "No advertising or analytics")

    cfg = rep.get("meta", {}).get("siteConfig", {})
    if cfg.get("contactEmail"):
        eq(g, "A-70", "contact page renders a mailto link when an email is configured",
           True, "mailto:" in contact)
    else:
        contains(g, "A-70", "contact page: fallback copy when no email configured", contact,
                 "A public contact address has not yet been added.")
        contains(g, "A-71", "contact page renders NO mailto when email unset", contact,
                 "mailto:", invert=True)
    contains(g, "A-72", "contact page keeps the transparency note", contact,
             "This page does not include a contact form.")
    return g


# --------------------------------------------------------------------------- #
# Toolchain: typecheck + production build                                      #
# --------------------------------------------------------------------------- #


def toolchain_checks():
    g = group("TOOLCHAIN", "tsc typecheck and vite production build must be green")
    tc = run("npm run typecheck", timeout=300)
    eq(g, "T-06", "tsc --noEmit (typecheck) passes", True, tc.returncode == 0,
       why=("TypeScript compile errors:\n" + (tc.stdout + tc.stderr)[-2500:]
            if tc.returncode else "tsc reported no errors."))
    bc = run("npm run build", timeout=600)
    eq(g, "T-07", "vite production build succeeds", True, bc.returncode == 0,
       why=("Vite build failed:\n" + (bc.stdout + bc.stderr)[-2500:]
            if bc.returncode else "build produced fresh dist/ output."))
    return g


# --------------------------------------------------------------------------- #
# Dashboard rendering                                                          #
# --------------------------------------------------------------------------- #


def render_dashboard():
    total = sum(len(g.checks) for g in GROUPS)
    failed = [(g, c) for g in GROUPS for c in g.checks if not c.ok]

    print()
    print(colored("═" * 100, "36m"))
    print(colored("KEEP ME ONLINE — STRICT WEBSITE AUDIT DASHBOARD", "36m;1").center(58)
          if USE_COLOR else colored("KEEP ME ONLINE — STRICT WEBSITE AUDIT DASHBOARD", "1m"))
    print(colored("═" * 100, "36m"))

    for g in GROUPS:
        n_ok = sum(1 for c in g.checks if c.ok)
        n = len(g.checks)
        status = (colored(f"{n_ok}/{n} PASS", "32m") if n_ok == n
                  else colored(f"{n_ok}/{n} — {n - n_ok} FAILED", "31m"))
        dots = "." * max(3, 100 - len(g.name) - 16)
        line = f"▸ {g.name} {dots} {status}"
        print()
        print(line)
        if g.blurb:
            print(colored(f"   {g.blurb}", "2m"))
        for c in g.checks:
            mark = colored("✓", "32m") if c.ok else colored("✗", "31m")
            print(f"   {mark} {colored(c.gid, '2m')}  {c.title}")

    print()
    print(colored("─" * 100, "36m"))
    print(f"  TOTAL: {colored(str(total), '1m')} checks    "
          f"{colored('PASS', '32m')}: {total - len(failed)}    "
          f"{colored('FAIL', '31m')}: {len(failed)}")
    print(colored("─" * 100, "36m"))

    if failed:
        print()
        print(colored(f"  WHY DID THE FAILED CHECKS FAIL? ({len(failed)} explained)", "31m;1"))
        for g, c in failed:
            print()
            print(colored(f"  ✗ {c.gid}   [{c.group}]", "31m"))
            print(f"    what:     {c.title}")
            print(f"    why:      {c.why or '(no detail recorded)'}")
            print(colored(f"    expected: {c.expected}", "2m"))
            print(colored(f"    actual:   {c.actual}", "2m"))
        print()
        print(colored("  RESULT: AUDIT FAILED — exit code 1.", "31m;1"))
    else:
        print()
        print(colored("  RESULT: ALL CHECKS PASSED — the site matches the audited specification.",
                      "32m;1"))
    print()


# --------------------------------------------------------------------------- #
# main                                                                         #
# --------------------------------------------------------------------------- #


def main():
    try:  # Windows terminals default to cp1252 — force UTF-8-capable output
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    static_checks()

    try:
        rep = build_and_run_harness(build_engine_cases(),
                                    build_validation_cases(),
                                    build_calls())
        engine_checks(rep)
        validation_checks(rep)
        formatting_checks(rep)
        share_storage_checks(rep)
        scenario_checks(rep)
        summary_examples_checks(rep)
        content_claims_checks(rep)
        blog_data_checks(rep)
        gh, gf = header_footer_checks(rep, htmllib.unescape)
        assert gh and gf
        page_checks(rep, htmllib.unescape)
        toolchain_checks()
    finally:
        if not KEEP and os.path.isdir(RUN_DIR):
            shutil.rmtree(RUN_DIR, ignore_errors=True)

    render_dashboard()
    sys.exit(0 if all(c.ok for g in GROUPS for c in g.checks) else 1)


if __name__ == "__main__":
    main()
