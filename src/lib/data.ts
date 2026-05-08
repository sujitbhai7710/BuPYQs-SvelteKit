import type { FileEntry, SemesterData, SyllabusEntry } from './types.js';

export const subjectEmojis: Record<string, string> = {
  'Bengali': 'বাংলা',
  'Botany': '🌿',
  'Chemistry': '⚗️',
  'Commerce': '💼',
  'Defence Studies': '🛡️',
  'Economics': '📊',
  'Education': '📚',
  'English': '📖',
  'Geography': '🌍',
  'History': '🏛️',
  'Mathematics': '📐',
  'Microbiology': '🔬',
  'Philosophy': '💭',
  'Physical Education': '⚽',
  'Physics': '⚛️',
  'Political Science': '⚖️',
  'Sanskrit': '🕉️',
  'Statistics': '📈',
  'Zoology': '🦁',
  'IDC/MDC': '📋'
};

export const syllabusEmojis: Record<string, string> = {
  'Chemistry': '⚗️',
  'Botany': '🌿',
  'Physics': '⚛️',
  'Mathematics': '📐',
  'Zoology': '🦁',
  'Statistics': '📈',
  'Microbiology': '🔬',
  'Computer Science': '💻',
  'Electronics': '⚡',
  'Environmental Science': '🌱',
  'Geology': '🪨',
  'Nutrition': '🥗',
  'Physiology': '🫀',
  'Bengali': 'বাংলা',
  'English': '📖',
  'Sanskrit': '🕉️',
  'History': '🏛️',
  'Philosophy': '💭',
  'Political Science': '⚖️',
  'Economics': '📊',
  'Geography': '🌍',
  'Education': '📚',
  'Commerce': '💼',
  'Psychology': '🧠',
  'Anthropology': '🦴',
  'Physical Education': '⚽',
  'Music': '🎵',
  'Fine Arts': '🎨',
  'Law': '⚖️',
  'Defence Studies': '🛡️',
  'VAC': '📋',
  'VOC': '🔧',
  'Environmental Studies': '🌱',
  'B.B.A.': '💼',
  'B.C.A.': '💻',
  'B.Com.': '💼',
  'B.Sc.': '🔬',
  'B.A.': '📜'
};

export function countFiles(sem: SemesterData): number {
  let c = sem.files.length;
  Object.values(sem.years).forEach((y) => {
    c += y.files.length;
  });
  return c;
}

export function getAllFiles(sem: SemesterData): { year: string; files: FileEntry[] }[] {
  const r: { year: string; files: FileEntry[] }[] = [];
  if (sem.files.length > 0) r.push({ year: '', files: sem.files });
  Object.entries(sem.years)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([yn, yd]) => {
      if (yd.files.length > 0) r.push({ year: yn, files: yd.files });
    });
  return r;
}

export function sortSyllabusEntries(entries: SyllabusEntry[]): SyllabusEntry[] {
  return [...entries].sort((a, b) => {
    const getRank = (e: SyllabusEntry) => (e.category.includes('NEP') ? 0 : e.category.includes('CBCS') ? 1 : 2);
    const ra = getRank(a);
    const rb = getRank(b);
    if (ra !== rb) return ra - rb;
    return b.category.localeCompare(a.category);
  });
}
