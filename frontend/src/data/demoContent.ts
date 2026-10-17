import type { Collection, InboxMessage } from '../types/learning'

// Preview fixtures, not learner records or an authoritative FSL curriculum.
export const demoProgress = { level: 5, streak: 15, experience: 510, nextLevel: 1000 }

export const collections: Collection[] = [
  { id: 'alphabet', title: 'Alphabet', description: 'Small signs. A world of possibilities.', progress: 92, lessons: ['Letters A–E', 'Letters F–J', 'Letters K–O', 'Letters P–T', 'Letters U–Z'] },
  { id: 'numbers', title: 'Numbers', description: 'Make every little number count.', progress: 44, lessons: ['Numbers 1–5', 'Numbers 6–10', 'Everyday numbers'] },
  { id: 'greetings', title: 'Greetings', description: 'A warm hello is a lovely place to start.', progress: 98, lessons: ['Hello & goodbye', 'Good morning', 'How are you?'] },
  { id: 'expressions', title: 'Expressions', description: 'Find a new way to say what you feel.', progress: 40, lessons: ['Everyday feelings', 'Showing appreciation', 'Asking for help'] },
  { id: 'introductions', title: 'Introductions', description: 'Let a new connection begin with you.', progress: 78, lessons: ['My name is…', 'Nice to meet you', 'A little about me'] },
]

export const inboxMessages: InboxMessage[] = [
  { id: '1', sender: 'Instructor Kristine', initials: 'IK', subject: 'FSL Improvement', date: '2026-09-15', preview: 'Good day, keep up the wonderful practice!', body: 'Good day! Keep taking your practice one sign at a time. In our next session, we will revisit hand positioning and movement together. Bring any questions you have — I’m happy to help.', unread: true },
  { id: '2', sender: 'Instructor Kristine', initials: 'IK', subject: 'New Lesson Materials', date: '2026-09-14', preview: 'Good day, let’s explore our next lesson.', body: 'Good day! Our next session will focus on everyday expressions. You can explore the Expressions collection to see the lesson outline. We’ll go through the signs together in class.', unread: true },
  { id: '3', sender: 'Carlo De Guzman', initials: 'CG', subject: 'Thank You', date: '2026-09-09', preview: 'Good morning, thanks for practicing with me!', body: 'Good morning! Thanks for practicing with me. It’s always easier to keep going with a friend. Looking forward to learning together again!', unread: false },
]
