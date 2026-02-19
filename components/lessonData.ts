import { Task } from './LessonEngine';

export interface Lesson {
  id: string;
  label: string;
  desc: string;
  tasks: Task[];
}

export const english_lessons: Lesson[] = [
  {
    id: 'en-1',
    label: 'Basics: Greetings',
    desc: 'Master common English greetings and introductions.',
    tasks: [
      {
        id: 'en-q1',
        type: 'IMAGE_MCQ',
        question: 'Which image represents a "Handshake"?',
        target: 'Handshake',
        options: [
          { text: 'Wave', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wave' },
          { text: 'Handshake', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Handshake' },
          { text: 'Hug', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hug' },
          { text: 'Smile', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Smile' },
        ]
      },
      {
        id: 'en-q2',
        type: 'FILL_BLANK',
        question: 'Complete the greeting',
        target: 'Hello',
        translation: 'Hi!',
        words: ['___', ', how are you?'],
        options: ['Goodbye', 'Hello', 'Night', 'Please']
      }
    ]
  },
  {
    id: 'en-2',
    label: 'Basics: Numbers',
    desc: 'Learn to count from 1 to 10 in English.',
    tasks: []
  }
];

export const chinese_lessons: Lesson[] = [
  {
    id: 'zh-1',
    label: 'Lesson 1: Introduction',
    desc: 'Basic characters for "Middle Kingdom".',
    tasks: [
      {
        id: 'zh-q1',
        type: 'IMAGE_MCQ',
        question: 'Choose the right picture',
        target: 'China',
        options: [
          { text: '韩国', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KR', pinyin: 'hán guó' },
          { text: '法国', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FR', pinyin: 'fǎ guó' },
          { text: '美国', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=US', pinyin: 'měi guó' },
          { text: '中国', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CN', pinyin: 'zhōng guó' },
        ]
      },
      {
        id: 'zh-q2',
        type: 'HANDWRITING',
        question: 'Write the character',
        target: '中',
        pinyin: 'zhōng',
        translation: 'middle'
      }
    ]
  }
];
