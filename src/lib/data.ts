import type { FileEntry, SemesterData, SyllabusEntry } from './types.js';

/** Convert Google Drive file/folder URL to direct download URL */
export function getDirectDownloadUrl(url: string): string {
  // Match https://drive.google.com/file/d/FILE_ID/view?usp=drive_web
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.usercontent.google.com/download?id=${fileMatch[1]}&export=download&confirm=t`;
  }
  // Match https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://drive.usercontent.google.com/download?id=${openMatch[1]}&export=download&confirm=t`;
  }
  return url;
}

/** Extract short semester name from long key like 'Botany_CBCS_General_Sem III' -> 'Sem III' */
export function getShortSemesterName(name: string): string {
  // Try to match patterns like "Sem I", "Sem- III", "SEM I", "Semester 1", etc.
  const semMatch = name.match(/[Ss][Ee][Mm][\s\-]*[IVXivx\d]+/);
  if (semMatch) {
    // Normalize: "Sem- III" -> "Sem III", "SEM I" -> "Sem I"
    return semMatch[0]
      .replace(/[Ss][Ee][Mm]/, 'Sem')
      .replace(/\s*[-_]\s*/, ' ')
      .replace(/\s+/, ' ')
      .trim();
  }
  // Fallback: try "Semester N"
  const semesterMatch = name.match(/[Ss]emester\s*\d+/i);
  if (semesterMatch) {
    return semesterMatch[0].replace(/Semester\s*/i, 'Sem ');
  }
  // If no match, return the original name
  return name;
}

/** Convert roman numeral to number for sorting */
function romanToNum(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  const upper = roman.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const current = map[upper[i]] || 0;
    const next = map[upper[i + 1]] || 0;
    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result;
}

/** Extract semester number from name for sorting */
export function getSemesterNumber(name: string): number {
  // Try "Semester N"
  const semNumMatch = name.match(/[Ss]emester\s*(\d+)/);
  if (semNumMatch) return parseInt(semNumMatch[1], 10);
  // Try "Sem III", "SEM-III", etc.
  const romanMatch = name.match(/[Ss][Ee][Mm][\s\-]*([IVXivx]+)/);
  if (romanMatch) return romanToNum(romanMatch[1]);
  // Try just a number
  const numMatch = name.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 0;
}

export const subjectEmojis: Record<string, string> = {
  'Bengali': '📝',
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
