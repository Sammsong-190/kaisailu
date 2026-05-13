/** Peer support groups and stress toolbox content for the Support resources page. */

export const PEER_SUPPORT_GROUPS = [
  {
    id: "academic-stress",
    label: "Academic stress group",
    subtitle: "Exams · deadlines · performance anxiety · perfectionism loops",
    details:
      "Facilitator-led grounding + study pacing check-ins; share tactics without swapping grades or course outlines (honour anonymity). Weekly hybrid room.",
  },
  {
    id: "social-isolation",
    label: "Social isolation",
    subtitle: "Homesickness · club fit · quiet floor life · low belonging",
    details:
      "Low-pressure icebreakers, buddy matching scripts, and micro-challenges issued by seniors; emphasis on consent-before-DM etiquette.",
  },
  {
    id: "psychological-concerns",
    label: "Psychological problems · open talk",
    subtitle: "Mood dips · intrusive thoughts · medication questions routed carefully",
    details:
      "Psychoeducation and facilitator triage wording; crisis situations are referred to appropriate services. This channel is not for clinical diagnosis.",
  },
  {
    id: "others",
    label: "Open-topic · others",
    subtitle: "Identity · grief · sensory overload · anything that does not slot above",
    details:
      "Catch-all breakout with rotating peer moderators plus counselor drop-in summaries at the hour mark.",
  },
];

/** Eight stress-management tiles (videos, meditations, printable guides). */
export const STRESS_MANAGEMENT_ACTIVITIES = [
  {
    id: "act-breath-video",
    type: "video",
    title: "4-7-8 breathing walkthrough",
    duration: "6 min",
    blurb: "Voice-led cadence overlays on soft campus B-roll.",
  },
  {
    id: "act-pmf-video",
    type: "video",
    title: "Progressive muscle release",
    duration: "12 min",
    blurb: "Desk-friendly sequence after long LMS sessions.",
  },
  {
    id: "act-body-scan",
    type: "meditation",
    title: "Seated micro body scan",
    duration: "8 min",
    blurb: "Focus tiles from soles to scalp; captions included.",
  },
  {
    id: "act-sleep-medi",
    type: "meditation",
    title: "Pre-sleep downshift",
    duration: "10 min",
    blurb: "Dim UI and warm tones to support an evening wind-down routine.",
  },
  {
    id: "act-pom-guide",
    type: "guide",
    title: "Pomodoro + guilt-free breaks",
    duration: "2-page PDF stub",
    blurb: "Template grid for 25/5 blocks tuned to ADHD-ish drift moments.",
  },
  {
    id: "act-cbt-sheet",
    type: "guide",
    title: "Thought record lite",
    duration: "1-page worksheet",
    blurb: "ABC columns with campus-specific examples—not therapy, just scaffolding.",
  },
  {
    id: "act-move-video",
    type: "video",
    title: "Library stretch loop",
    duration: "5 min",
    blurb: "No mat required; librarians approved volume levels in this scenario.",
  },
  {
    id: "act-mindfulness-medi",
    type: "meditation",
    title: "Loving-kindness-lite for exam week",
    duration: "7 min",
    blurb: "Short phrases toward self → study pod → vague \"everyone cramming\"; skip if cheesy.",
  },
];

export const ACTIVITY_TYPE_LABEL = {
  video: "Video",
  meditation: "Meditation",
  guide: "Guide",
};
