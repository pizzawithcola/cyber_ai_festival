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
    photo: 'public/woman2.png'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    email: 'sarah.c@acc.com',
    department: 'Finance',
    position: 'Financial Controller',
    hobbies: ['Investment Analysis', 'Data Visualization', 'Risk Management'],
    personality: 'Analytical, risk-averse, process-driven',
    photo: '/api/placeholder/200/200'
  },
  {
    id: 3,
    name: 'Marcus Rodriguez',
    email: 'marcus.r@acc.com',
    department: 'Human Resources',
    position: 'HR Director',
    hobbies: ['Talent Development', 'Organizational Psychology', 'Team Building'],
    personality: 'People-focused, empathetic, diplomatic',
    photo: '/api/placeholder/200/200'
  }
];

export const missions: Mission[] = [
  {
    targetId: 1,
    title: 'Security Update Required',
    description: 'Urgent security patch needs immediate attention',
    targetLink: 'https://secure-update.company.com/patch',
    difficulty: 'Medium',
    hint: 'Exploit technical urgency'
  },
  {
    targetId: 2,
    title: 'Financial Audit Notification',
    description: 'Quarterly financial audit requires document submission',
    targetLink: 'https://finance-audit.company.com/submit',
    difficulty: 'Hard',
    hint: 'Leverage compliance pressure'
  },
  {
    targetId: 3,
    title: 'Employee Performance Review',
    description: 'Annual performance evaluations need completion',
    targetLink: 'https://hr-performance.company.com/review',
    difficulty: 'Easy',
    hint: 'Use HR authority'
  }
];
