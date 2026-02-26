import 'dotenv/config';
import db from './db.js';
import * as bookService from './services/bookService.js';
import * as translateService from './services/translateService.js';

console.log('🌱 Seeding database...');

// Очищаем для чистого старта
db.exec('DELETE FROM books');
db.exec('DELETE FROM dictionary');

// ── Книга ─────────────────────────────────────────────────────
bookService.createBook({
  id: '1984',
  title: '1984',
  author: 'George Orwell',
  coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
  description: 'A dystopian novel set in Airstrip One, a province of the superstate Oceania in a world of perpetual war and omnipresent government surveillance.',
  authorNote: 'I write it partly to show the intellectual implications of totalitarianism, and partly as a warning against it.',
  sortOrder: 1,
});

// ── Глава 1 ───────────────────────────────────────────────────
bookService.createChapter({ id: 'ch1', bookId: '1984', title: 'Chapter 1 – The Ministry of Truth', sortOrder: 1 });

bookService.createPage({
  bookId: '1984',
  chapterId: 'ch1',
  number: 1,
  image: null,
  paragraphs: [
    { id: '1984-ch1-p1', text: 'It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.' },
    { id: '1984-ch1-p2', text: 'The hallway smelt of boiled cabbage and old rag mats. At one end of it a coloured poster, too large for the hallway, had been tacked to the wall. It depicted simply an enormous face, more than a metre wide: the face of a man of about forty-five, with a heavy black moustache and ruggedly handsome features.' },
    { id: '1984-ch1-p3', text: 'Winston made for the stairs. It was no use trying the lift. Even at the best of times it was seldom working, and at present the electric current was cut off during daylight hours. It was part of the economy drive in preparation for Hate Week.' },
  ],
});

bookService.createPage({
  bookId: '1984',
  chapterId: 'ch1',
  number: 2,
  image: {
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
    position: 'top',
    height: 280,
    alt: 'Dark library corridor',
  },
  paragraphs: [
    { id: '1984-ch1-p4', text: 'On each landing, opposite the lift-shaft, the poster with the enormous face gazed from the wall. It was one of those pictures which are so contrived that the eyes follow you about when you move. BIG BROTHER IS WATCHING YOU, the caption beneath it ran.' },
    { id: '1984-ch1-p5', text: 'The instrument (the telescreen, it was called) could be dimmed, but there was no way of shutting it off completely. You had to live in the assumption that every sound you made was overheard, and, except in darkness, every movement scrutinized.' },
  ],
});

// ── Переводы ──────────────────────────────────────────────────
translateService.upsertPageTranslation('1984', 'ch1', 1,
  'Был яркий холодный день в апреле, и часы пробили тринадцать. Уинстон Смит, вжав подбородок в грудь в попытке укрыться от омерзительного ветра, быстро проскользнул сквозь стеклянные двери «Победных Мэншн». В коридоре пахло варёной капустой и старыми половиками. На стене висел огромный плакат с лицом мужчины лет сорока пяти с густыми чёрными усами.'
);

translateService.upsertParagraphTranslation('1984-ch1-p1',
  'Был яркий холодный день в апреле, и часы пробили тринадцать. Уинстон Смит, вжав подбородок в грудь в попытке укрыться от омерзительного ветра, быстро проскользнул сквозь стеклянные двери «Победных Мэншн».'
);
translateService.upsertParagraphTranslation('1984-ch1-p2',
  'В коридоре пахло варёной капустой и старыми половиками. На одном его конце к стене был прикреплён цветной плакат — огромное лицо мужчины лет сорока пяти с густыми чёрными усами и суровыми красивыми чертами.'
);
translateService.upsertParagraphTranslation('1984-ch1-p3',
  'Уинстон направился к лестнице. Пытаться вызвать лифт было бесполезно — даже в лучшие времена он редко работал, а сейчас электричество отключали в дневное время в рамках подготовки к Неделе Ненависти.'
);

// ── Словари ───────────────────────────────────────────────────
const commonWords = {
  'the': '—', 'and': 'и', 'was': 'был / была', 'were': 'были',
  'with': 'с', 'from': 'из / от', 'into': 'в / внутрь',
  'that': 'что / тот', 'his': 'его', 'had': 'имел / имела',
  'which': 'который', 'when': 'когда', 'about': 'о / около',
  'through': 'через / сквозь', 'only': 'только', 'after': 'после',
  'face': 'лицо', 'eyes': 'глаза', 'voice': 'голос',
  'door': 'дверь', 'doors': 'двери', 'wall': 'стена',
  'day': 'день', 'night': 'ночь', 'time': 'время',
  'man': 'мужчина / человек', 'people': 'люди',
  'thought': 'мысль / думал', 'came': 'пришёл', 'went': 'пошёл',
};

const bookWords = {
  'telescreen': 'телеэкран',
  'bright': 'яркий',
  'cold': 'холодный',
  'striking': 'бьющий / поразительный',
  'thirteen': 'тринадцать',
  'vile': 'отвратительный',
  'slipped': 'проскользнул',
  'gritty': 'покрытый пылью / песчаный',
  'smelt': 'пахло (прош. вр. от smell)',
  'cabbage': 'капуста',
  'enormous': 'огромный',
  'moustache': 'усы',
  'ruggedly': 'мужественно / грубовато',
  'scrutinized': 'под наблюдением',
  'overheard': 'подслушан',
  'caption': 'подпись / заголовок',
  'landing': 'лестничная площадка',
  'lift': 'лифт',
  'hatred': 'ненависть',
  'rage': 'ярость',
  'party': 'Партия',
  'ministry': 'министерство',
  'oceania': 'Океания',
};

Object.entries(commonWords).forEach(([word, translation]) =>
  translateService.upsertDictionaryWord(word, translation, null)
);
Object.entries(bookWords).forEach(([word, translation]) =>
  translateService.upsertDictionaryWord(word, translation, '1984')
);

console.log('✅ Done!');
process.exit(0);