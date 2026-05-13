/**
 * Seeded peer and counselling threads (in-memory store).
 * Ensures every student in the roster appears in ≥1 peer thread and ≥1 counselor thread.
 * @param {Array<{ id: string; name: string }>} students
 * @param {Array<{ id: string; name: string }>} staff
 */
export function seedChatThreadsFromRoster(students, staff) {
  const ids = students.map((s) => s.id);
  const nameOf = (id) => students.find((s) => s.id === id)?.name || id;
  const s1 = ids[0] || "S1001";
  const s2 = ids[1] || "S1001";
  const s3 = ids[2] || s1;
  const rivera = staff.find((x) => x.id === "C01") || staff[0];
  const zhen = staff.find((x) => x.id === "C03") || staff[2] || staff[0];
  const amaka = staff.find((x) => x.id === "C02") || staff[1] || staff[0];

  const now = Date.now();
  const h = (n) => now - n * 3600000;

  /** @param {string} id */
  const M = (id, patch) => ({ id, ...patch });

  const peerAcademic = {
    id: "chat-peer-academic",
    kind: "peer",
    title: "Academic stress · peer pod",
    subtitle: "Peer-only messages",
    studentIds: Array.from(new Set([s1, s2])),
    counselorId: null,
    counselorName: null,
    messages: [
      M("m-p1", {
        ts: h(48),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Chem lab report is eating my sleep again. Anyone else stuck in the 2am LaTeX spiral?",
      }),
      M("m-p2", {
        ts: h(47.5),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Same. I'm trying the library Quiet 3 pact tomorrow — 25 min blocks, phone in an envelope.",
      }),
      M("m-p3", {
        ts: h(46),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Love that. I'll join if there's a slot after 4pm.",
      }),
      M("m-p4", {
        ts: h(18),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Update: two blocks done today. Still tired but less panicky — progress is progress.",
      }),
      M("m-p5", {
        ts: h(14),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "TA office hours were a zoo — I used the queue ticket app and still waited 40 min 😵",
      }),
      M("m-p6", {
        ts: h(13.5),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Brutal. 昨晚终于睡了将近 6 小时，虽然中途醒了一次—but I'll take it.",
      }),
      M("m-p7", {
        ts: h(6),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Small win counts. Anyone want a passive Pomodoro co-work on Discord voice (muted) Sat morning?",
      }),
      M("m-p8", {
        ts: h(5.25),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "I'm in — 10am my time? I'll drop the link here Friday night.",
      }),
      M("m-p9", {
        ts: h(2.1),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Perfect. We got this 💪",
      }),
    ],
  };

  const peerSleep = {
    id: "chat-peer-sleep",
    kind: "peer",
    title: "Sleep & wind-down",
    subtitle: "Student peer support",
    studentIds: Array.from(new Set([s1, s3])),
    counselorId: null,
    counselorName: null,
    messages: [
      M("m-s1", {
        ts: h(72),
        senderKind: "STUDENT",
        senderStudentId: s3,
        senderName: nameOf(s3),
        body: "Does the blue-light thing actually work or is it placebo? Asking for a friend (me).",
      }),
      M("m-s2", {
        ts: h(71),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Real but small effect for me. Bigger win was a hard stop on caffeine after 2pm.",
      }),
      M("m-s3", {
        ts: h(52),
        senderKind: "STUDENT",
        senderStudentId: s3,
        senderName: nameOf(s3),
        body: "I downloaded one of those red-sunset gradient screen apps… feels silly but visually it cues “wind-down mode”.",
      }),
      M("m-s4", {
        ts: h(51),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Not silly — ritual matters. Pair it with laying out tomorrow’s clothes so your brain trusts the day is sealed.",
      }),
      M("m-s5", {
        ts: h(41),
        senderKind: "STUDENT",
        senderStudentId: s3,
        senderName: nameOf(s3),
        body: "Also: earplugs + fan white noise > expensive melatonin for me personally.",
      }),
      M("m-s6", {
        ts: h(40),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Same stack here. If you spiral on “I must sleep NOW”, try naming 5 blue objects in the room — corny but it breaks the loop.",
      }),
      M("m-s7", {
        ts: h(36),
        senderKind: "SYSTEM",
        body: "This channel is moderated. Messages follow your institution's retention policy.",
      }),
      M("m-s8", {
        ts: h(8),
        senderKind: "STUDENT",
        senderStudentId: s3,
        senderName: nameOf(s3),
        body: "Reporting back: in bed by 12:30 two nights in a row. Still groggy but not crashing in afternoon lectures.",
      }),
      M("m-s9", {
        ts: h(7.2),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "That’s real progress. Celebrate boring wins — they compound.",
      }),
    ],
  };

  /** Extra peer pods so S1004–S1006 (and similar imports) already have scripted messages */
  const s4 = ids[3];
  const s5 = ids[4];
  const s6 = ids[5];

  /** @type {typeof peerAcademic | null} */
  let peerSocial = null;
  /** @type {typeof peerAcademic | null} */
  let peerVitality = null;

  if (s4 && s5 && s6) {
    peerSocial = {
      id: "chat-peer-social",
      kind: "peer",
      title: "Social battery · dining hall crew",
      subtitle: `${nameOf(s4)} · ${nameOf(s5)} · ${nameOf(s6)}`,
      studentIds: [s4, s5, s6],
      counselorId: null,
      counselorName: null,
      messages: [
        M("ps1", {
          ts: h(96),
          senderKind: "STUDENT",
          senderStudentId: s4,
          senderName: nameOf(s4),
          body: "Is it weird that I need headphones to eat in the dining hall? The clatter spikes my stress.",
        }),
        M("ps2", {
          ts: h(95.2),
          senderKind: "STUDENT",
          senderStudentId: s5,
          senderName: nameOf(s5),
          body: "Not weird — sensory load is real. I grab a corner booth + one friend max; anything more fries my battery.",
        }),
        M("ps3", {
          ts: h(94),
          senderKind: "STUDENT",
          senderStudentId: s6,
          senderName: nameOf(s6),
          body: "I pack a lunch twice a week just to breathe in the quad. Guilt about “missing out” but my nervous system says thanks.",
        }),
        M("ps4", {
          ts: h(50),
          senderKind: "STUDENT",
          senderStudentId: s4,
          senderName: nameOf(s4),
          body: "Update: tried lunch at 2pm — shorter line, same calories, fewer panic pings.",
        }),
        M("ps5", {
          ts: h(49.1),
          senderKind: "STUDENT",
          senderStudentId: s5,
          senderName: nameOf(s5),
          body: "Stealing that idea. Also: hydrate before caffeine — counselor cliché but it bluntens the jitter spiral.",
        }),
      ],
    };

    peerVitality = {
      id: "chat-peer-vitality",
      kind: "peer",
      title: "Movement & mood",
      subtitle: `${nameOf(s3)} · ${nameOf(s5)} · ${nameOf(s6)}`,
      studentIds: Array.from(new Set([s3, s5, s6])),
      counselorId: null,
      counselorName: null,
      messages: [
        M("pv1", {
          ts: h(88),
          senderKind: "STUDENT",
          senderStudentId: s5,
          senderName: nameOf(s5),
          body: "10-minute walk between stats and chem saved my brain yesterday — posting in case someone else is sedentary-shamed.",
        }),
        M("pv2", {
          ts: h(87.4),
          senderKind: "STUDENT",
          senderStudentId: s3,
          senderName: nameOf(s3),
          body: "I’ve been all-or-nothing with gym. Micro walks feel less like failure.",
        }),
        M("pv3", {
          ts: h(86.5),
          senderKind: "STUDENT",
          senderStudentId: s6,
          senderName: nameOf(s6),
          body: "Stretched between library sessions — not ‘real’ workout but my shoulders unlocked.",
        }),
        M("pv4", {
          ts: h(42),
          senderKind: "SYSTEM",
          body: "Movement tips are informational — follow advice from your own care team.",
        }),
      ],
    };
  }

  const dmRivera = {
    id: `chat-cdr-${rivera?.id || "C01"}-${s1}`,
    kind: "counselor",
    title: `Counseling · ${rivera?.name || "Counselor"}`,
    subtitle: `${nameOf(s1)} ↔ clinical team`,
    studentIds: [s1],
    counselorId: rivera?.id || "C01",
    counselorName: rivera?.name || "Counselor",
    messages: [
      M("m-c1", {
        ts: h(168),
        senderKind: "STAFF",
        senderStaffId: rivera?.id || "C01",
        senderName: rivera?.name || "Counselor",
        body: `Hi ${nameOf(s1).split(" ")[0]} — thanks for booking. How have stress and sleep been since we last touched base?`,
      }),
      M("m-c2", {
        ts: h(167),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Mixed. Exams are loud in my head but I'm using the grounding sheet you sent.",
      }),
      M("m-c3", {
        ts: h(166.5),
        senderKind: "STAFF",
        senderStaffId: rivera?.id || "C01",
        senderName: rivera?.name || "Counselor",
        body: "That helps a lot — keep tagging what works. Bring one win and one snag to Thursday so we sequence next steps.",
      }),
      M("m-c4", {
        ts: h(120),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Quick note before Thursday: family text thread blew up last night — not crisis, but my chest tightens when the phone buzzes after 10pm.",
      }),
      M("m-c5", {
        ts: h(119.4),
        senderKind: "STAFF",
        senderStaffId: rivera?.id || "C01",
        senderName: rivera?.name || "Counselor",
        body: "Thanks for flagging early. Let’s draft a one-line boundary you can paste (“I care — I’ll reply tomorrow”) and a 10-min phone-down ritual after 9:30.",
      }),
      M("m-c6", {
        ts: h(24),
        senderKind: "STUDENT",
        senderStudentId: s1,
        senderName: nameOf(s1),
        body: "Tried the boundary text once — mom actually respected it 🤯 Feeling guilty but lighter.",
      }),
      M("m-c7", {
        ts: h(23.2),
        senderKind: "STAFF",
        senderStaffId: rivera?.id || "C01",
        senderName: rivera?.name || "Counselor",
        body: "Guilt after healthy limits is noisy but expected. Bring that feeling to session — we'll map whose voice it echoes.",
      }),
    ],
  };

  const dmZhen = {
    id: `chat-cdr-${zhen?.id || "C03"}-${s2}`,
    kind: "counselor",
    title: `Writing support · ${zhen?.name || "Counselor"}`,
    subtitle: `${nameOf(s2)} ↔ academic resilience desk`,
    studentIds: [s2],
    counselorId: zhen?.id || "C03",
    counselorName: zhen?.name || "Counselor",
    messages: [
      M("m-z1", {
        ts: h(90),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Thesis paragraph freeze is real. I re-read the same intro six times.",
      }),
      M("m-z2", {
        ts: h(89.2),
        senderKind: "STAFF",
        senderStaffId: zhen?.id || "C03",
        senderName: zhen?.name || "Counselor",
        body: "Let's try a messy outline voice memo first — no full sentences. Send 90 seconds of raw thoughts; I'll mirror structure back.",
      }),
      M("m-z3", {
        ts: h(76),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Sent (cringe voice memo inbound). Basically: lit review terror + impostor-ish + fear of citing wrong.",
      }),
      M("m-z4", {
        ts: h(74.9),
        senderKind: "STAFF",
        senderStaffId: zhen?.id || "C03",
        senderName: zhen?.name || "Counselor",
        body:
          "Heard three pillars: breadth anxiety, fairness to sources, paralysis. Proposal: skim 5 abstracts, write 8 bullet disagreements ONLY — no smooth prose yet.",
      }),
      M("m-z5", {
        ts: h(54),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Did the 8 bullets. Ugly but I have angles. Worst citation fear is accidental plagiarism when paraphrasing too close.",
      }),
      M("m-z6", {
        ts: h(53.1),
        senderKind: "STAFF",
        senderStaffId: zhen?.id || "C03",
        senderName: zhen?.name || "Counselor",
        body:
          "Great — we'll use a citation checklist + “quote sandwich” worksheet next. Book 25 min with CTL writing desk if you want live eyes on paraphrasing.",
      }),
      M("m-z7", {
        ts: h(30),
        senderKind: "STUDENT",
        senderStudentId: s2,
        senderName: nameOf(s2),
        body: "Booked Wed 3pm with CTL. Thesis brain still loud but quieter than Monday — thanks.",
      }),
    ],
  };

  /** @type {unknown[]} */
  const dmDaniel =
    s3 !== s1 && s3 !== s2
      ? [
          {
            id: `chat-cdr-${amaka?.id || "C02"}-${s3}`,
            kind: "counselor",
            title: `Care check-in · ${amaka?.name || "Lead counselor"}`,
            subtitle: `${nameOf(s3)} ↔ clinician`,
            studentIds: [s3],
            counselorId: amaka?.id || "C02",
            counselorName: amaka?.name || "Counselor",
            messages: [
              M("dan-c1", {
                ts: h(142),
                senderKind: "STAFF",
                senderStaffId: amaka?.id || "C02",
                senderName: amaka?.name || "Counselor",
                body: `${nameOf(s3).split(" ")[0]}, I noticed you toggled wellness data consent off — totally your call. Want to revisit what feels safe vs what could help outreach?`,
              }),
              M("dan-c2", {
                ts: h(141.2),
                senderKind: "STUDENT",
                senderStudentId: s3,
                senderName: nameOf(s3),
                body: "Thanks for naming it plainly. I'm not opposed to counselling — I'm wary of dashboards scoring me without context.",
              }),
              M("dan-c3", {
                ts: h(140.5),
                senderKind: "STAFF",
                senderStaffId: amaka?.id || "C02",
                senderName: amaka?.name || "Counselor",
                body:
                  "Fair. Here we walk consent screens together step by step. Your campus may use additional disclosures.",
              }),
              M("dan-c4", {
                ts: h(112),
                senderKind: "STUDENT",
                senderStudentId: s3,
                senderName: nameOf(s3),
                body: "That framing helps. Can we brainstorm one non-data-heavy signal I'd still be OK sharing?",
              }),
            ],
          },
        ]
      : [];

  /** Counselor chats for Sara, Ryan, Olivia when roster has ≥6 ids */
  const dmSara =
    s4 && s4 !== s1 && s4 !== s2
      ? {
          id: `chat-cdr-${rivera?.id || "C01"}-${s4}`,
          kind: "counselor",
          title: `Short-term coping · ${rivera?.name || "Counselor"}`,
          subtitle: `${nameOf(s4)} ↔ clinical team`,
          studentIds: [s4],
          counselorId: rivera?.id || "C01",
          counselorName: rivera?.name || "Counselor",
          messages: [
            M("sar-c1", {
              ts: h(138),
              senderKind: "STAFF",
              senderStaffId: rivera?.id || "C01",
              senderName: rivera?.name || "Counselor",
              body: `Hey ${nameOf(s4).split(" ")[0]} — looping back after crisis line triage ping (you’re safe offline). What's one grounding move that worked even 30% this week?`,
            }),
            M("sar-c2", {
              ts: h(137),
              senderKind: "STUDENT",
              senderStudentId: s4,
              senderName: nameOf(s4),
              body: "Cold water on wrists + counting backward from 83 by primes. Weird but slows the spike.",
            }),
            M("sar-c3", {
              ts: h(136.2),
              senderKind: "STAFF",
              senderStaffId: rivera?.id || "C01",
              senderName: rivera?.name || "Counselor",
              body: "Not weird — it’s somatic budgeting. Slot it into tier-1 SOS card; we iterate Thursday.",
            }),
          ],
        }
      : null;

  const dmRyan =
    s5 && s5 !== s1 && s5 !== s2 && s5 !== s3
      ? {
          id: `chat-cdr-${amaka?.id || "C02"}-${s5}`,
          kind: "counselor",
          title: `Athletics liaison · ${amaka?.name || "Lead counselor"}`,
          subtitle: `${nameOf(s5)} ↔ care office`,
          studentIds: [s5],
          counselorId: amaka?.id || "C02",
          counselorName: amaka?.name || "Counselor",
          messages: [
            M("ry-c1", {
              ts: h(134),
              senderKind: "STUDENT",
              senderStudentId: s5,
              senderName: nameOf(s5),
              body: "Coach piled on extra drills after the loss — teammates say shrug it off but my sleep tanked.",
            }),
            M("ry-c2", {
              ts: h(133.2),
              senderKind: "STAFF",
              senderStaffId: amaka?.id || "C02",
              senderName: amaka?.name || "Counselor",
              body: "Bodies keep score after public shame moments. Draft a fatigue log + one sentence you'd want coach to rehearse differently.",
            }),
            M("ry-c3", {
              ts: h(131),
              senderKind: "STUDENT",
              senderStudentId: s5,
              senderName: nameOf(s5),
              body: "Will do — thanks for validating without trashing athletics; I love my sport, just furious at pacing.",
            }),
          ],
        }
      : null;

  const dmOlivia =
    s6 && s6 !== s1 && s6 !== s2 && s6 !== s3
      ? {
          id: `chat-cdr-${zhen?.id || "C03"}-${s6}`,
          kind: "counselor",
          title: `Executive function coaching · ${zhen?.name || "Counselor"}`,
          subtitle: `${nameOf(s6)} ↔ CTL wellness`,
          studentIds: [s6],
          counselorId: zhen?.id || "C03",
          counselorName: zhen?.name || "Counselor",
          messages: [
            M("olv-c1", {
              ts: h(129),
              senderKind: "STAFF",
              senderStaffId: zhen?.id || "C03",
              senderName: zhen?.name || "Counselor",
              body: `${nameOf(s6).split(" ")[0]}, you mentioned calendar ghosting assignments — want to pilot a ugly calendar with only three colors?`,
            }),
            M("olv-c2", {
              ts: h(127.9),
              senderKind: "STUDENT",
              senderStudentId: s6,
              senderName: nameOf(s6),
              body: "Yes — pastel chaos is prettier but I ignore it. Red = due in 48h, grey = backlog, teal = DONE party.",
            }),
            M("olv-c3", {
              ts: h(126.5),
              senderKind: "STAFF",
              senderStaffId: zhen?.id || "C03",
              senderName: zhen?.name || "Counselor",
              body: "Love DONE party. Celebrate closing loops even when new ones spawn — capitalist grind hates rest, defend micro pauses anyway.",
            }),
          ],
        }
      : null;

  /** @type {unknown[]} */
  let threads = [
    peerAcademic,
    peerSleep,
    dmRivera,
    dmZhen,
    ...dmDaniel,
    ...(peerSocial ? [peerSocial] : []),
    ...(peerVitality ? [peerVitality] : []),
    ...(dmSara ? [dmSara] : []),
    ...(dmRyan ? [dmRyan] : []),
    ...(dmOlivia ? [dmOlivia] : []),
  ].filter(Boolean);

  augmentMissingCoverage(students, staff, threads, nameOf, now);

  for (const th of threads) {
    if (Array.isArray(th.messages)) th.messages.sort((a, b) => a.ts - b.ts);
  }

  return threads;
}

/**
 * Covers arbitrary roster sizes: guarantee each id has peer + counselor thread membership.
 */
function augmentMissingCoverage(students, staff, threads, nameOf, now) {
  if (!students.length || !staff.length) return;
  const ids = students.map((s) => s.id).filter(Boolean);
  const peerKeys = new Set();

  /** @param {string} sid */
  const inPeer = (sid) => threads.some((t) => t.kind === "peer" && Array.isArray(t.studentIds) && t.studentIds.includes(sid));
  /** @param {string} sid */
  const inCdr = (sid) => threads.some((t) => t.kind === "counselor" && Array.isArray(t.studentIds) && t.studentIds.includes(sid));

  let autoSalt = 0;
  const hOff = () => now - (++autoSalt) * 970000;

  for (let i = 0; i < ids.length; i++) {
    const sid = ids[i];
    const stf = staff[i % staff.length];

    if (!inCdr(sid)) {
      const first = nameOf(sid).split(" ")[0];
      threads.push({
        id: `chat-cdr-fill-${stf.id}-${sid}`,
        kind: "counselor",
        title: `Counseling · ${stf.name}`,
        subtitle: `${nameOf(sid)} ↔ clinician (automatic)`,
        studentIds: [sid],
        counselorId: stf.id,
        counselorName: stf.name,
        messages: [
          {
            id: `fill-c-${sid}-a`,
            ts: hOff(),
            senderKind: "STAFF",
            senderStaffId: stf.id,
            senderName: stf.name,
            body: `${first}, checking in — what's one pinch point this week (even a small one)?`,
          },
          {
            id: `fill-c-${sid}-b`,
            ts: hOff(),
            senderKind: "STUDENT",
            senderStudentId: sid,
            senderName: nameOf(sid),
            body: "Mostly time slicing — lectures plus part-time scramble. Breathing drills before opening email helps a notch.",
          },
          {
            id: `fill-c-${sid}-c`,
            ts: hOff(),
            senderKind: "STAFF",
            senderStaffId: stf.id,
            senderName: stf.name,
            body: "Good data. Keep tagging what moves the notch; we'll widen the playbook next chat.",
          },
        ],
      });
    }

    if (!inPeer(sid)) {
      let buddy = ids[(i + 1) % ids.length];
      if (ids.length === 1) buddy = sid;
      const pairKey = sid <= buddy ? `${sid}:${buddy}` : `${buddy}:${sid}`;
      const threadId =
        buddy === sid
          ? `chat-peer-solo-${sid}`
          : `chat-peer-pair-${pairKey.replace(":", "__")}`;
      if (peerKeys.has(pairKey)) continue;
      peerKeys.add(pairKey);

      if (buddy === sid) {
        threads.push({
          id: threadId,
          kind: "peer",
          title: `${nameOf(sid).split(" ")[0]} · solo pod`,
          subtitle: "Auto peer thread (single-student roster)",
          studentIds: [sid],
          counselorId: null,
          counselorName: null,
          messages: [
            {
              id: `fill-p-${sid}-sys`,
              ts: hOff(),
              senderKind: "SYSTEM",
              body: `[System] Peer thread generated for roster coverage.`,
            },
            {
              id: `fill-p-${sid}-hi`,
              ts: hOff(),
              senderKind: "STUDENT",
              senderStudentId: sid,
              senderName: nameOf(sid),
              body: "Solo pod check-in: still syncing with campus pacing — waving hi to future classmates 👋",
            },
          ],
        });
      } else {
        threads.push({
          id: threadId,
          kind: "peer",
          title: `${nameOf(sid).split(" ")[0]} & ${nameOf(buddy).split(" ")[0]} · quick pulse`,
          subtitle: "Auto peer pair coverage",
          studentIds: Array.from(new Set([sid, buddy])),
          counselorId: null,
          counselorName: null,
          messages: [
            {
              id: `fill-p-${sid}-1`,
              ts: hOff(),
              senderKind: "STUDENT",
              senderStudentId: sid,
              senderName: nameOf(sid),
              body: `${nameOf(buddy).split(" ")[0]} — wanna trade one micro-win before Friday? Mine: turned in quiz 6 min early (small flex).`,
            },
            {
              id: `fill-p-${buddy}-2`,
              ts: hOff(),
              senderKind: "STUDENT",
              senderStudentId: buddy,
              senderName: nameOf(buddy),
              body: "Love that. Mine was drinking water before doomscrolling — sounds silly but spikes felt flatter.",
            },
            {
              id: `fill-p-sys-${pairKey}`,
              ts: hOff(),
              senderKind: "SYSTEM",
              body: `[System] Automatically paired peer thread.`,
            },
          ],
        });
      }
    }
  }

  for (const th of threads) {
    if (Array.isArray(th.messages)) th.messages.sort((a, b) => a.ts - b.ts);
  }
}
