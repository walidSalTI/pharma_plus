const CATEGORY_ICONS = {
  Cardiovascular: "heart-pulse",
  Respiratory: "lungs",
  Metabolic: "scale-bathroom",
  Neurological: "brain",
  Oncology: "ribbon",
  Immunology: "shield-cross",
  Endocrine: "hormone",
  Gastrointestinal: "stomach",
  Musculoskeletal: "bone",
  Psychiatric: "head-heart",
  Dermatologic: "skin",
  Renal: "kidney",
  Hepatic: "liver",
  Hematologic: "blood-bag",
  Infectious: "bacteria",
  Genetic: "dna",
};

const CONDITION_ICONS = {
  "alzheimer's disease": "brain",
  alzheimer: "brain",
  asthma: "lungs",
  "autoimmune diseases": "shield-cross",
  autoimmune: "shield-cross",
  "benign prostatic hyperplasia": "human-male",
  prostatic: "human-male",
  cancer: "ribbon",
  "chronic kidney disease": "kidney",
  "chronic obstructive pulmonary disease": "smoke",
  copd: "smoke",
  "diabetes mellitus": "needle",
  diabetes: "needle",
  dyslipidemia: "oil",
  epilepsy: "flash",
  "heart disease": "heart-pulse",
  hypertension: "gauge",
  "polycystic ovary syndrome": "human-female",
  pcos: "human-female",
  "rheumatic diseases": "bandage",
  rheumatic: "bandage",
  "rheumatoid arthritis": "bone",
  arthritis: "bone",
  thalassemia: "blood-bag",
};

const KEYWORD_ICONS = [
  { match: "kidney", icon: "kidney" },
  { match: "heart", icon: "heart-pulse" },
  { match: "diabet", icon: "needle" },
  { match: "asthm", icon: "lungs" },
  { match: "pulmon", icon: "smoke" },
  { match: "cancer", icon: "ribbon" },
  { match: "oncolog", icon: "ribbon" },
  { match: "epilep", icon: "flash" },
  { match: "alzheim", icon: "brain" },
  { match: "autoimmun", icon: "shield-cross" },
  { match: "arthrit", icon: "bone" },
  { match: "rheumat", icon: "bandage" },
  { match: "lipid", icon: "oil" },
  { match: "cholest", icon: "oil" },
  { match: "hypertens", icon: "gauge" },
  { match: "thalassem", icon: "blood-bag" },
  { match: "polycystic", icon: "human-female" },
  { match: "prostatic", icon: "human-male" },
  { match: "الزهايمر", icon: "brain" },
  { match: "الربو", icon: "lungs" },
  { match: "السكر", icon: "needle" },
  { match: "السرطان", icon: "ribbon" },
  { match: "الكلى", icon: "kidney" },
  { match: "القلب", icon: "heart-pulse" },
  { match: "الصرع", icon: "flash" },
  { match: "ضغط الدم", icon: "gauge" },
  { match: "المناعية الذاتية", icon: "shield-cross" },
  { match: "المفاصل", icon: "bone" },
  { match: "الدم", icon: "blood-bag" },
  { match: "البويضات", icon: "human-female" },
];

const FALLBACK_ICON = "medical-bag";

const normalize = (value) => String(value || "").toLowerCase().trim();

export function getDiseaseIcon(disease = {}) {
  const category = normalize(disease.category);
  if (category && CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];

  const nameEn = normalize(disease.name_en);
  if (nameEn && CONDITION_ICONS[nameEn]) return CONDITION_ICONS[nameEn];

  const nameAr = normalize(disease.name_ar);
  const haystack = `${nameEn} ${nameAr}`;
  for (const rule of KEYWORD_ICONS) {
    if (haystack.includes(rule.match)) return rule.icon;
  }

  return FALLBACK_ICON;
}

export { CATEGORY_ICONS, CONDITION_ICONS };
