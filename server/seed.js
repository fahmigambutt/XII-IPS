export const officialNames = [
  'AHMAD KUSYAIRI', 'AISYAH', 'AISYATURRIDHA', 'ALIFAH HUSNA', 'ANITA ZAHRA',
  'ARNITA NUR ZAHRA', 'AZIZAH', 'FAHMI ADRIAN', 'FATIA ZAHWA ALYA',
  'INDAH SRI RAHAYU', 'ISNAWATI', 'M. ALFIANOR', 'M. FAUZAN RAHMAN',
  'MADINA', 'MAULIDA', 'MONESA JAHRA', 'MUHAMMAD FARID FADHILLAH',
  'MUHAMMAD IQBAL', 'MUHAMMAD NIZAR', 'MUHAMMAD RAYYAN KHALI S',
  'NAILA MAHFUZHA', 'NAUFA NOR AZHORA', 'NOOR ALMIRA LAILA', 'NOR ASSYIFA',
  'NUR AZIZAH', 'NURRIPA SABILA', 'RAISYA SABILA', 'RIANTI DWI ANGGITA',
  'SHAYESHA SHABRINA SHARON', 'SHERA AZZAHRA', 'UMARUL AL-FAJRI', 'ZASKIA',
];

export function createSeed() {
  const titles = {
    2: ['Table of contents', 'Every chapter, a little closer to us.'],
    3: ['Our homeroom teacher', 'A guiding light in our story.'],
    4: ['Our togetherness', 'Little moments. Lasting memories.'],
    5: ['Our class memories', 'The days we keep with us.'],
    6: ['Better together', 'A collection of moments, waiting to be filled.'],
    7: ['Meet the students', '32 people. One shared story.'],
    8: ['Meet the students', 'Every name belongs to this chapter.'],
    9: ['Meet the students', 'Faces we will always remember.'],
    10: ['Meet the students', 'Our story would not be complete without you.'],
    11: ['Anonymous messages', 'Some things are easier to put into words.'],
    12: ['Our last goodbye', 'The end of a chapter. The beginning of everything.'],
  };
  return {
    version: 1,
    cover: { title: 'XII IPS', year: '2025/2026/2027', tagline: 'OUR MEMORIES, OUR STORY', image: '' },
    teacher: { name: 'Perdini Adma Sari, S.Pd.', subject: '', photo: '', message: '', note: '', position: '50% 50%' },
    students: officialNames.map((name, i) => ({ id: i + 1, name, photo: '', description: '', position: '50% 50%' })),
    memories: Array.from({ length: 9 }, (_, i) => ({ id: `memory-${i + 1}`, page: 4 + Math.floor(i / 3), photo: '', caption: '', date: '', alt: '', position: '50% 50%', order: i % 3 })),
    pages: Object.entries(titles).map(([id, [title, subtitle]]) => ({ id: Number(id), title, subtitle, text: '', ornament: 'botanical', photo: '' })),
    farewell: { text: 'Contoh teks — Terima kasih telah menjadi bagian dari cerita ini. Semoga langkah kita selanjutnya dipenuhi kebaikan, keberanian, dan kenangan yang selalu menghangatkan hati.', photo: '', position: '50% 50%' },
    settings: { audioEnabled: true, volume: 0.2, audioUrl: '', quality: 'balanced', particles: true, messagesEnabled: true },
  };
}
