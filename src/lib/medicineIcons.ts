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
  [/heart|cardiac|cardio|blood.pres|b\.?p\b|amlodip|atenolol|metoprolol|lisinop|ramipril|warfarin|aspirin|clopidogrel|bisoprolol|digoxin|furosemide/i, 'heart'],
  [/lung|asthma|breath|inhaler|respiratory|salbutamol|budesonide|montelukast|fluticasone|tiotropium|ipratropium|theophylline/i, 'lungs'],
  [/kidney|renal|nephro|creatinine|dialysis/i, 'kidney'],
  [/bladder|urolog|cystitis/i, 'bladder'],
  [/liver|hepat|gallblad|bile|ursodeoxycholic/i, 'liver'],
  [/brain|neuro|psych|mental|anxiety|depres|sleep|melatonin|sertraline|fluoxetine|escitalopram|duloxetine|amitriptyline|quetiapine|olanzapine|risperidone|gabapentin|pregabalin|phenytoin|levetiracetam|lamotrigine|carbamazepine|donepezil|memantine|lacoset|lacosamide/i, 'brain'],
  [/stomach|gastro|acid|digest|antacid|omeprazole|lansoprazole|pantoprazole|domperidone|metoclopramide|ondansetron|esomeprazole/i, 'stomach'],
  [/intestine|bowel|colon|ibs|crohn|loperamide|mesalazine/i, 'intestine'],
  [/spine|back|disc|vertebr|osteoarthritis/i, 'spine'],
  [/eye|ophthalm|conjunctiv|glaucoma|latanoprost|timolol.*eye/i, 'eye'],
  [/ear|ENT|cerumen|otitis/i, 'ear'],
  [/skin|derma|eczema|psoriasis|acne|topical/i, 'skin'],
  [/blood|haemoglob|anemia|haematol|iron|folic|b12|vitamin.*b|warfarin|heparin/i, 'blood'],
  [/thyroid|levothyroxine|thyroxine|propylthiouracil|carbimazole/i, 'thyroid'],
  [/thymus|immune|immunosuppres|tacrolimus|mycophenolate/i, 'thymus'],
]

export function getMedicineIcon(medicineName: string): OrganIcon {
  const name = medicineName?.trim() ?? ''
  for (const [pattern, key] of KEYWORD_MAP) {
    if (pattern.test(name)) return ICONS[key]
  }
  return ICONS.general
}

export { ICONS as ORGAN_ICONS }
