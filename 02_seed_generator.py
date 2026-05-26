"""
CUSTODYCORE — Seed Data Generator
Generates ordered INSERT statements with FK ordering and chronological consistency.
Output: 03_data.sql
"""

import random
from datetime import datetime, timedelta, date

random.seed(42)
OUTPUT_FILE = "03_data.sql"

# ============================================================================
# RAW DATA
# ============================================================================

courts_data = [
    ("Central District Court", "100 Main Street, Capital City", "+1-555-0101"),
    ("North District Court", "200 Oak Avenue, Northville", "+1-555-0102"),
    ("South District Court", "300 Pine Road, Southtown", "+1-555-0103"),
    ("East District Court", "400 Elm Boulevard, Eastside", "+1-555-0104"),
    ("West District Court", "500 Maple Drive, Westpark", "+1-555-0105"),
]

personnel_data = [
    ("Detective Sarah Chen",       "OFC-001", "Detective Bureau",    "Homicide",          "sarah.chen@pd.gov",          "officer"),
    ("Detective Marcus Johnson",   "OFC-002", "Detective Bureau",    "Narcotics",          "marcus.johnson@pd.gov",      "officer"),
    ("Officer David Ramirez",      "OFC-003", "Patrol Division",     "Street Crime",       "david.ramirez@pd.gov",       "officer"),
    ("Detective Emily Watson",     "OFC-004", "Detective Bureau",    "Digital Forensics",  "emily.watson@pd.gov",        "officer"),
    ("Sergeant James O'Brien",     "OFC-005", "Detective Bureau",    "Homicide",           "james.obrien@pd.gov",        "officer"),
    ("Dr. Lisa Park",              "LAB-001", "Crime Lab",           "DNA Analysis",       "lisa.park@lab.gov",          "lab_technician"),
    ("Technician Robert Kim",      "LAB-002", "Crime Lab",           "Digital Forensics",  "robert.kim@lab.gov",         "lab_technician"),
    ("Analyst Maria Garcia",       "LAB-003", "Crime Lab",           "Toxicology",         "maria.garcia@lab.gov",       "lab_technician"),
    ("ADA Thomas Mitchell",        "PRO-001", "Prosecution Office",  "Major Crimes",       "thomas.mitchell@da.gov",     "prosecutor"),
    ("ADA Rachel Nguyen",          "PRO-002", "Prosecution Office",  "Narcotics Unit",     "rachel.nguyen@da.gov",       "prosecutor"),
    ("ADA Kevin Brown",            "PRO-003", "Prosecution Office",  "General Crimes",     "kevin.brown@da.gov",         "prosecutor"),
    ("Attorney Michael Torres",    "DEF-001", "Public Defender's Office", "Homicide Defense", "michael.torres@pd.defense.gov", "defense_attorney"),
    ("Attorney Jennifer Foster",   "DEF-002", "Public Defender's Office", "General Defense", "jennifer.foster@pd.defense.gov", "defense_attorney"),
    ("Attorney Christopher Lee",   "DEF-003", "Private Defense",     "White Collar",       "chris.lee@defense-law.com",  "defense_attorney"),
    ("Clerk Amanda White",         "CLK-001", "Court Administration","Records",            "amanda.white@courts.gov",    "court_clerk"),
]

storage_locations_data = [
    ("Room 101", "Locker A1", None,         None,    "Standard evidence locker",                    "restricted"),
    ("Room 101", "Locker A2", None,         None,    "Standard evidence locker",                    "restricted"),
    ("Room 102", None,        "Refrigerator B1", None, "Biological evidence — 4C",                  "restricted"),
    ("Room 103", "Locker C1", None,         "Vault D1", "Firearms and currency vault — 24hr monitoring", "high"),
    ("Room 104", None,        None,         None,    "Digital evidence processing — anti-static",   "restricted"),
    ("Room 105", "Locker E1", "Refrigerator B2", None, "Narcotics — double-locked",                 "high"),
    ("Room 201", "Locker F1", None,         None,    "Long-term storage — climate controlled",      "restricted"),
    ("Crime Lab DNA", None,   "Refrigerator B3", None, "DNA lab refrigerator — CofC log required",  "high"),
    ("Crime Lab Tox", None,   "Refrigerator B4", None, "Toxicology samples — secure",               "high"),
    ("Courtroom 1", "Court Locker 1", None,  None,    "Temporary holding during court",             "restricted"),
]

# Cases: (title, description, status, prosecutor_idx, defense_idx, court_idx, priority)
# Indices reference personnel_data and courts_data
cases_data = [
    ("2026-CR-001", "critical", "State v. John Doe",         "Home invasion and aggravated assault",          "closed",  8, 11, 0, date(2026,3,15),  date(2026,1,20)),
    ("2026-CR-002", "major",    "State v. Jane Smith",        "Drug trafficking — large quantity narcotics",   "closed",  9, 12, 1, date(2026,4,10),  date(2026,2,1)),
    ("2026-CR-003", "major",    "State v. Robert Wilson",     "Armed robbery of convenience store",            "closed",  8, 13, 2, date(2026,5,1),   date(2026,2,15)),
    ("2026-CR-004", "critical", "State v. Angela Martinez",   "Homicide — first degree murder",                "active",  8, 11, 0, date(2026,6,20),  date(2026,3,1)),
    ("2026-CR-005", "major",    "State v. Derek Brown",       "Digital fraud and identity theft ring",         "active", 10, 13, 3, date(2026,7,15),  date(2026,3,10)),
    ("2026-CR-006", "critical", "State v. Patricia Davis",    "Officer-involved shooting investigation",       "active",  8, 11, 0, date(2026,6,1),   date(2026,4,1)),
    ("2026-CR-007", "minor",    "State v. Kevin Miller",      "Petty theft from retail establishment",         "open",   10, 12, 4, None,             date(2026,5,1)),
    ("2026-CR-008", "major",    "State v. Laura Wilson",      "Burglary and criminal trespass",                "open",    9, 12, 1, None,             date(2026,5,10)),
]

# Evidence items per case: (tag, description, etype_idx, collected_by_personnel_idx)
# etype_idx: 0=weapon,1=biological,2=digital,3=narcotic,4=document,5=firearm,6=currency,7=controlled_substance
evidence_data = {
    "2026-CR-001": [
        ("TAG-001001", "9mm handgun — Smith & Wesson, serial SW94827",                5, 0),
        ("TAG-001002", "Blood sample from crime scene — living room floor",           1, 0),
        ("TAG-001003", "Fingerprint lift — door frame, front entrance",               1, 0),
        ("TAG-001004", "Surveillance footage — neighbor security camera",             2, 3),
    ],
    "2026-CR-002": [
        ("TAG-002001", "Cocaine hydrochloride — 500g vacuum-sealed brick",             7, 1),
        ("TAG-002002", "Digital scale — Ohaus brand, residue present",                 0, 1),
        ("TAG-002003", "Plastic baggies — 200-count, unused",                          4, 1),
        ("TAG-002004", "Cellphone — iPhone 15, seizure from suspect",                  2, 1),
    ],
    "2026-CR-003": [
        ("TAG-003001", "Shotgun — Remington 870, serial RM45123",                      5, 0),
        ("TAG-003002", "Cash register receipt — timestamp 22:47",                      4, 0),
        ("TAG-003003", "Fingerprint lift — counter surface",                           1, 0),
        ("TAG-003004", "Surveillance footage — store CCTV hard drive",                 2, 3),
    ],
    "2026-CR-004": [
        ("TAG-004001", "Knife — kitchen knife, bloodstains present",                   0, 0),
        ("TAG-004002", "DNA swab — victim fingernail scrapings",                       1, 4),
        ("TAG-004003", "Blood spatter pattern — photographic evidence",                1, 4),
        ("TAG-004004", "Clothing — victim shirt, torn and bloodstained",               1, 0),
    ],
    "2026-CR-005": [
        ("TAG-005001", "Laptop — Dell XPS 15, password-protected",                     2, 3),
        ("TAG-005002", "External hard drive — 2TB Seagate",                            2, 3),
        ("TAG-005003", "Fake ID documents — 5x driver licenses",                       4, 3),
        ("TAG-005004", "Cellphone — Samsung Galaxy S25",                               2, 3),
    ],
    "2026-CR-006": [
        ("TAG-006001", "Service weapon — Glock 17, officer firearm",                   5, 4),
        ("TAG-006002", "Body camera footage — officer body cam",                       2, 4),
        ("TAG-006003", "Shell casings — 5x 9mm casings from scene",                    5, 4),
        ("TAG-006004", "DNA swab — suspect cheek swab",                                1, 4),
    ],
    "2026-CR-007": [
        ("TAG-007001", "Stolen merchandise — 3x designer handbags",                    6, 2),
    ],
    "2026-CR-008": [
        ("TAG-008001", "Crowbar — pry marks match door frame",                         0, 2),
        ("TAG-008002", "Footwear impression — mud cast from backyard",                 1, 2),
    ],
}

etype_names = ["weapon", "biological", "digital", "narcotic", "document", "firearm", "currency", "controlled_substance"]
etype_ids_from_name = {n: i + 1 for i, n in enumerate(etype_names)}


def esc(val):
    """Escape a string for SQL: double single quotes."""
    return val.replace("'", "''")


def _diff_pid(rng, pool, current):
    """Pick a PID from pool different from current."""
    choices = [p for p in pool if p != current]
    return rng.choice(choices) if choices else current


def build_custody_chain(evidence_id, collected_date, coll_by_pid, case_status, rng):
    """Generate chrono-consistent custody transfers for one evidence item."""
    t = []
    current_time = collected_date
    holder = coll_by_pid

    officer_pids = [1, 2, 3, 4, 5]
    lab_tech_pids = [6, 7, 8]
    defense_pids = [12, 13, 14]

    # 1. Collection
    t.append((evidence_id, None, holder, current_time, 1, "collection", "Initial collection from crime scene"))
    current_time += timedelta(hours=2)

    # 2. Transport to storage
    storage_keeper = _diff_pid(rng, officer_pids, holder)
    t.append((evidence_id, holder, storage_keeper, current_time, 1, "transport", "Transport to central evidence storage"))
    holder = storage_keeper
    current_time += timedelta(hours=1)

    # 3. Lab submission (60% chance)
    if rng.random() < 0.6:
        lab_tech = _diff_pid(rng, lab_tech_pids, holder)
        lab_storage = rng.choice([8, 9])
        t.append((evidence_id, holder, lab_tech, current_time, lab_storage, "lab_submission", "Submitted for forensic analysis"))
        holder = lab_tech
        current_time += timedelta(days=rng.randint(1, 7))
        return_pid = _diff_pid(rng, officer_pids, holder)
        t.append((evidence_id, holder, return_pid, current_time, 1, "lab_return", "Returned from lab — analysis complete"))
        holder = return_pid
        current_time += timedelta(days=1)

    # 4. Court delivery (70% chance for closed/active)
    if case_status in ("closed", "active") and rng.random() < 0.7:
        court_officer = _diff_pid(rng, officer_pids, holder)
        t.append((evidence_id, holder, court_officer, current_time, 10, "court_delivery", "Delivered for court proceedings"))
        holder = court_officer
        current_time += timedelta(days=rng.randint(1, 3))
        return_pid = _diff_pid(rng, officer_pids, holder)
        t.append((evidence_id, holder, return_pid, current_time, 1, "transport", "Returned from court to evidence storage"))
        holder = return_pid
        current_time += timedelta(days=1)

    # 5. Defense viewing (40% chance)
    if rng.random() < 0.4:
        defense_attorney = _diff_pid(rng, defense_pids, holder)
        t.append((evidence_id, holder, defense_attorney, current_time, 1, "defense_viewing", "Defense attorney evidence inspection"))
        holder = defense_attorney
        current_time += timedelta(hours=2)
        return_pid = _diff_pid(rng, officer_pids, holder)
        t.append((evidence_id, holder, return_pid, current_time, 1, "transport", "Returned after defense viewing"))
        holder = return_pid
        current_time += timedelta(days=1)

    # 6. Disposal (if case closed)
    if case_status == "closed" and holder != 15:
        t.append((evidence_id, holder, 15, current_time, 1, "disposal", "Evidence disposed — case closed"))
        current_time += timedelta(hours=1)

    return t


def main():
    rng = random.Random(42)
    lines = []
    L = lines.append

    L("-- ============================================================================")
    L("-- CUSTODYCORE — Seed Data")
    L("-- Auto-generated by 02_seed_generator.py")
    L(f"-- Generated: {datetime.now().isoformat()}")
    L("-- ============================================================================")
    L("")
    L("BEGIN;")
    L("")

    # --- 1. Courts ---
    L("-- Courts (5)")
    for name, addr, phone in courts_data:
        L(f"INSERT INTO courts (court_name, address, contact_phone) VALUES ('{esc(name)}', '{esc(addr)}', '{phone}');")
    L("")

    # --- 2. Storage Locations ---
    L("-- Storage Locations (10)")
    for room, locker, fridge, vault, climate, access in storage_locations_data:
        lk = f"'{esc(locker)}'" if locker else "NULL"
        fr = f"'{esc(fridge)}'" if fridge else "NULL"
        va = f"'{esc(vault)}'" if vault else "NULL"
        L(f"INSERT INTO storage_locations (room, locker, refrigerator, vault, climate_notes, access_level) VALUES ('{esc(room)}', {lk}, {fr}, {va}, '{esc(climate)}', '{access}');")
    L("")

    # --- 3. Personnel ---
    L("-- Personnel (15)")
    pid_by_badge = {}
    for i, (name, badge, dept, unit, contact, role) in enumerate(personnel_data, 1):
        pid_by_badge[badge] = i
        d = f"'{esc(dept)}'" if dept else "NULL"
        u = f"'{esc(unit)}'" if unit else "NULL"
        L(f"INSERT INTO personnel (name, badge_number, department, unit, contact, role) VALUES ('{esc(name)}', '{badge}', {d}, {u}, '{contact}', '{role}');")
    L("")

    # --- 4. Cases ---
    L("-- Cases (8)")
    case_map = {}  # case_number -> {id, status, opened}
    for i, (cnum, priority, title, desc, status, pros_idx, def_idx, court_idx, hearing, opened) in enumerate(cases_data, 1):
        pros_pid = pros_idx + 1
        def_pid = def_idx + 1
        cid = court_idx + 1
        hval = f"'{hearing}'" if hearing else "NULL"
        closed_val = "NULL"
        if status == "closed":
            closed = opened + timedelta(days=rng.randint(60, 120))
            closed_val = f"'{closed}'"
        L(f"INSERT INTO cases (case_number, case_priority, title, description, status, prosecutor_id, defense_id, court_id, hearing_date, opened_date, closed_date)")
        L(f"VALUES ('{cnum}', '{priority}', '{esc(title)}', '{esc(desc)}', '{status}', {pros_pid}, {def_pid}, {cid}, {hval}, '{opened}', {closed_val});")
        case_map[cnum] = {"id": i, "status": status, "opened": opened, "closed_str": closed_val}
    L("")

    # --- 5. Evidence Items ---
    L("-- Evidence Items (25)")
    ev_list = []
    eid = 0
    for cnum, items in evidence_data.items():
        ci = case_map[cnum]
        for tag, desc, etype_idx, coll_idx in items:
            eid += 1
            etype_id = etype_ids_from_name[etype_names[etype_idx]]
            coll_pid = coll_idx + 1
            collected = datetime.combine(ci["opened"], datetime.min.time()) + timedelta(
                hours=rng.randint(2, 48), minutes=rng.randint(0, 59)
            )
            if ci["status"] == "closed":
                ev_status = "disposed"
                disposal_val = ci["closed_str"]
            else:
                ev_status = "collected"
                disposal_val = "NULL"

            L(f"INSERT INTO evidence_items (asset_tag, description, case_id, evidence_type_id, collected_date, crime_scene_location, current_status, disposal_date, collected_by)")
            L(f"VALUES ('{tag}', '{esc(desc)}', {ci['id']}, {etype_id}, '{collected.isoformat()}', 'Crime scene — {cnum}', '{ev_status}', {disposal_val}, {coll_pid});")

            ev_list.append({
                "eid": eid, "case_num": cnum, "case_id": ci["id"],
                "cstatus": ci["status"], "collected": collected,
                "coll_pid": coll_pid,
            })
    L("")

    # --- 6. Custody Transfers ---
    L("-- Custody Transfers (~50)")
    tx_count = 0
    for ev in ev_list:
        transfers = build_custody_chain(
            ev["eid"], ev["collected"], ev["coll_pid"], ev["cstatus"], rng
        )
        for tx in transfers:
            tx_count += 1
            ev_id, frm, to, ts, loc_id, ttype, notes = tx
            frm_s = "NULL" if frm is None else str(frm)
            L(f"INSERT INTO custody_transfers (evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes)")
            L(f"VALUES ({ev_id}, {frm_s}, {to}, '{ts.isoformat()}', {loc_id}, '{ttype}', '{esc(notes)}');")
    L("")

    # --- 7. Lab Tests ---
    L("-- Lab Tests (12)")
    lab_types = ["dna", "fingerprint", "toxicology", "ballistics", "digital_forensics"]
    lab_tech_pids = [6, 7, 8]
    lab_count = 0
    for ev in ev_list:
        if lab_count >= 12:
            break
        if rng.random() > 0.5:
            continue
        lab_count += 1
        ttype = rng.choice(lab_types)
        req_by = ev["coll_pid"]
        tech_pid = rng.choice(lab_tech_pids)
        req_date = ev["collected"].date()

        if ev["cstatus"] == "closed":
            status = "completed"
            comp = req_date + timedelta(days=rng.randint(3, 21))
            result = rng.choice([
                "DNA match confirmed — suspect identified",
                "Fingerprint match — positive identification",
                "Toxicology positive — controlled substances detected",
                "Ballistics match — weapon linked to crime scene",
                "Digital evidence extracted — relevant files recovered",
            ])
            L(f"INSERT INTO lab_tests (evidence_item_id, test_type, requested_by, lab_technician, status, results_summary, request_date, completion_date)")
            L(f"VALUES ({ev['eid']}, '{ttype}', {req_by}, {tech_pid}, '{status}', '{esc(result)}', '{req_date}', '{comp}');")
        else:
            status = rng.choice(["requested", "in_progress"])
            result = "'Preliminary analysis underway'" if status == "in_progress" else "NULL"
            L(f"INSERT INTO lab_tests (evidence_item_id, test_type, requested_by, lab_technician, status, results_summary, request_date, completion_date)")
            L(f"VALUES ({ev['eid']}, '{ttype}', {req_by}, {tech_pid}, '{status}', {result}, '{req_date}', NULL);")
    L("")

    # --- 8. Evidence Requests + Disclosure Logs ---
    L("-- Evidence Requests (8)")
    req_count = 0
    disc_count = 0
    for ev in ev_list:
        if req_count >= 8:
            break
        if rng.random() > 0.4:
            continue
        req_count += 1
        # Find defense attorney for this case
        case_idx = ev["case_id"] - 1
        def_pid = cases_data[case_idx][6] + 1
        pros_pid = cases_data[case_idx][5] + 1

        rstatus = rng.choice(["pending", "approved", "fulfilled", "denied"])
        decision = "NULL"
        denial = "NULL"
        if rstatus in ("approved", "fulfilled", "denied"):
            decision = f"'{ev['collected'].date() + timedelta(days=rng.randint(5, 30))}'"
        if rstatus == "denied":
            denial = "'Insufficient relevance to case — evidence not material to defense'"

        L(f"INSERT INTO evidence_requests (evidence_item_id, requesting_attorney_id, status, request_date, decision_date, approved_by_id, denial_reason)")
        L(f"VALUES ({ev['eid']}, {def_pid}, '{rstatus}', '{ev['collected'].date()}', {decision}, {pros_pid}, {denial});")

        if rstatus == "fulfilled" and disc_count < 5:
            disc_count += 1
            vtype = rng.choice(["physical_inspection", "certified_copy", "digital_copy"])
            sup_pid = rng.randint(1, 5)
            view_date = ev["collected"] + timedelta(days=rng.randint(10, 40), hours=rng.randint(8, 16))
            L(f"INSERT INTO disclosure_logs (evidence_item_id, evidence_request_id, viewing_attorney_id, supervising_officer_id, view_date, view_type)")
            L(f"VALUES ({ev['eid']}, {req_count}, {def_pid}, {sup_pid}, '{view_date.isoformat()}', '{vtype}');")
    L("")

    L("COMMIT;")
    L("")
    L("-- ============================================================================")
    L("-- Verification: Row counts")
    L("-- ============================================================================")
    L("SELECT 'courts' AS tbl, COUNT(*)::text AS cnt FROM courts")
    L("UNION ALL SELECT 'storage_locations', COUNT(*)::text FROM storage_locations")
    L("UNION ALL SELECT 'personnel', COUNT(*)::text FROM personnel")
    L("UNION ALL SELECT 'cases', COUNT(*)::text FROM cases")
    L("UNION ALL SELECT 'evidence_items', COUNT(*)::text FROM evidence_items")
    L("UNION ALL SELECT 'custody_transfers', COUNT(*)::text FROM custody_transfers")
    L("UNION ALL SELECT 'lab_tests', COUNT(*)::text FROM lab_tests")
    L("UNION ALL SELECT 'evidence_requests', COUNT(*)::text FROM evidence_requests")
    L("UNION ALL SELECT 'disclosure_logs', COUNT(*)::text FROM disclosure_logs")
    L("UNION ALL SELECT 'ai_summaries', COUNT(*)::text FROM ai_summaries")
    L("ORDER BY tbl;")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  Courts:              {len(courts_data)}")
    print(f"  Storage Locations:   {len(storage_locations_data)}")
    print(f"  Personnel:           {len(personnel_data)}")
    print(f"  Cases:               {len(cases_data)}")
    print(f"  Evidence Items:      {len(ev_list)}")
    print(f"  Custody Transfers:   {tx_count}")
    print(f"  Lab Tests:           {lab_count}")
    print(f"  Evidence Requests:   {req_count}")
    print(f"  Disclosure Logs:     {disc_count}")


if __name__ == "__main__":
    main()
