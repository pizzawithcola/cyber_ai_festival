export interface Target {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  hobbies: string[];
  personality: string;
  photo: string;
}

export interface Mission {
  targetId: number;
  title: string;
  description: string;
  targetLink: string;
  difficulty: string;
  hint: string;
}

export const targets: Target[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.j@acc.com',
    department: 'IT Security',
    position: 'Senior Security Analyst',
    hobbies: ['Cybersecurity Research', 'Penetration Testing', 'AI Ethics'],
    personality: 'Detail-oriented, skeptical, tech-savvy',
    photo: 'public/phishing/man1.png'
  },
  {
    id: 2,
    name: 'Sarah Collins',
    email: 'sarah.c@acc.com',
    department: 'Marketing & Communications',
    position: 'Social Media Coordinator',
    hobbies: ['Online Shopping', 'Travel Photography', 'Food Blogging'],
    personality: 'Enthusiastic, curious, easily excited by new opportunities',
    photo: 'public/phishing/woman1.png'
  },
  {
    id: 3,
    name: 'Emily Parker',
    email: 'emily.p@acc.com',
    department: 'Finance & Accounting',
    position: 'Junior Financial Analyst',
    hobbies: ['Yoga', 'Book Club', 'Volunteering'],
    personality: 'Diligent, people-pleasing, eager to impress superiors',
    photo: 'public/phishing/woman2.png'
  }
];

export const missions: Mission[] = [
  {
    targetId: 1,
    title: 'Password Expiration Notice',
    description: 'Your company password will expire in 24 hours. You must reset it immediately or your account will be locked and you will lose access to your computer.',
    targetLink: 'https://acc-portal.com/password-reset',
    difficulty: 'Medium',
    hint: 'Create urgency with account lockout threat — everyone fears losing access to their work computer'
  },
  {
    targetId: 2,
    title: 'Lucky Winner Notification',
    description: 'Craft an email from an external company claiming the target has won a prize or reward (e.g. gift card, vacation package). Convince her to click the link to claim it.',
    targetLink: 'https://mega-rewards-global.com/claim',
    difficulty: 'Easy',
    hint: 'Appeal to excitement and FOMO — she loves deals and new opportunities'
  },
  {
    targetId: 3,
    title: 'Urgent Request from Management',
    description: 'Impersonate a senior manager or direct supervisor at ACC, and request confidential financial reports or sensitive data via an internal-looking shared link.',
    targetLink: 'https://acc-cloudshare.com/documents',
    difficulty: 'Hard',
    hint: 'Leverage authority and time pressure — she is eager to impress and unlikely to question a superior'
  }
];
