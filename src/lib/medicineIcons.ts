export interface OrganIcon {
  src?: string
  emoji: string
  label: string
  bg: string   // background colour for icon chip
  fg: string   // icon tint / emoji color
}

const ICONS: Record<string, OrganIcon> = {
  heart:    { src: '/organs/heart.png',   emoji: '❤️',  label: 'Heart',      bg: '#FFF1F0', fg: '#FF3B30' },
  lungs:    { src: '/organs/lungs.png',   emoji: '🫁',  label: 'Lungs',      bg: '#EDF5FF', fg: '#0A84FF' },
  kidney:   { src: '/organs/kidney.png',  emoji: '🫘',  label: 'Kidney',     bg: '#FFF4E5', fg: '#FF9F0A' },
  bladder:  { src: '/organs/bladder.png', emoji: '💧',  label: 'Bladder',    bg: '#E5F5FF', fg: '#32ADE6' },
  liver:    { src: '/organs/liver.png',   emoji: '🟤',  label: 'Liver',      bg: '#FFF1E8', fg: '#D4580A' },
  thymus:   { src: '/organs/thymus.png',  emoji: '🧬',  label: 'Thymus',     bg: '#F5EEFF', fg: '#AF52DE' },
  brain:    {                             emoji: '🧠',  label: 'Brain',      bg: '#F3EEFF', fg: '#7C3AED' },
  stomach:  {                             emoji: '🫃',  label: 'Stomach',    bg: '#ECFDF5', fg: '#059669' },
  intestine:{                             emoji: '🌀',  label: 'Intestine',  bg: '#FFF7ED', fg: '#D97706' },
  spine:    {                             emoji: '🦴',  label: 'Spine',      bg: '#F9FAFB', fg: '#6B7280' },
  eye:      {                             emoji: '👁️',  label: 'Eye',        bg: '#E0F2FE', fg: '#0284C7' },
  ear:      {                             emoji: '👂',  label: 'Ear',        bg: '#FEF9C3', fg: '#CA8A04' },
  skin:     {                             emoji: '🤚',  label: 'Skin',       bg: '#FFF7ED', fg: '#C2410C' },
  blood:    {                             emoji: '🩸',  label: 'Blood',      bg: '#FFF1F0', fg: '#DC2626' },
  thyroid:  {                             emoji: '🦋',  label: 'Thyroid',    bg: '#F5EEFF', fg: '#9333EA' },
  general:  {                             emoji: '💊',  label: 'General',    bg: '#FFFBEB', fg: '#D4A843' },
}

const KEYWORD_MAP: Array<[RegExp, keyof typeof ICONS]> = [
  // Heart / BP / cholesterol (keep aspirin here too for Ecosprin)
  [/heart|cardiac|cardio|blood.pres|b\.?p\b|amlodip|atenolol|metoprolol|lisinop|ramipril|warfarin|aspirin|ecosprin|clopidogrel|bisoprolol|digoxin|furosemide|telm|telmisartan|losartan|valsartan|olmesartan|cand|irbesartan/i, 'heart'],
  // Lungs / TB / respiratory
  [/lung|asthma|breath|inhaler|respiratory|salbutamol|budesonide|montelukast|fluticasone|tiotropium|ipratropium|theophylline|rifampicin|rifampin|isoniazid|pyrazin|ethambutol|combutol/i, 'lungs'],
  // Kidney / uric acid / gout
  [/kidney|renal|nephro|creatinine|dialysis|gout|uric|allopurinol|zyloric|febuxostat|fuberic/i, 'kidney'],
  [/bladder|urolog|cystitis/i, 'bladder'],
  // Liver / statins / cholesterol
  [/liver|hepat|gallblad|bile|ursodeoxycholic|statin|atorvastatin|atrova|rosuvastatin|rosuvas|simvastatin|pravastatin|cholesterol/i, 'liver'],
  // Brain / neuro / seizure / TB pyridoxine adjunct
  [/brain|neuro|psych|mental|anxiety|depres|sleep|melatonin|sertraline|fluoxetine|escitalopram|duloxetine|amitriptyline|quetiapine|olanzapine|risperidone|gabapentin|pregabalin|phenytoin|levetiracetam|lamotrigine|carbamazepine|donepezil|memantine|lacoset|lacosamide/i, 'brain'],
  [/stomach|gastro|acid|digest|antacid|omeprazole|lansoprazole|pantoprazole|pantocid|domperidone|metoclopramide|ondansetron|esomeprazole/i, 'stomach'],
  [/intestine|bowel|colon|ibs|crohn|loperamide|mesalazine/i, 'intestine'],
  // Spine / bone / calcium
  [/spine|back|disc|vertebr|osteoarthritis|calcium|calcitr|shelcal|vitamin.*d\b|cholecalciferol/i, 'spine'],
  [/eye|ophthalm|conjunctiv|glaucoma|latanoprost|timolol.*eye/i, 'eye'],
  [/ear|ENT|cerumen|otitis/i, 'ear'],
  [/skin|derma|eczema|psoriasis|acne|topical/i, 'skin'],
  // Blood / vitamins / pyridoxine (Benadon = B6)
  [/blood|haemoglob|anemia|haematol|iron|folic|b12|vitamin.*b|benadon|pyridoxin|warfarin|heparin/i, 'blood'],
  [/thyroid|levothyroxine|thyroxine|propylthiouracil|carbimazole/i, 'thyroid'],
  // Thymus / steroids / immune
  [/thymus|immune|immunosuppres|tacrolimus|mycophenolate|prednisolon|wysolone|steroid|methylpred|dexameth|prednison/i, 'thymus'],
]

export function getMedicineIcon(medicineName: string): OrganIcon {
  const name = medicineName?.trim() ?? ''
  for (const [pattern, key] of KEYWORD_MAP) {
    if (pattern.test(name)) return ICONS[key]
  }
  return ICONS.general
}

export { ICONS as ORGAN_ICONS }
