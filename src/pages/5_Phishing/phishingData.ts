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

export interface DemoEmail {
  targetId: number;
  senderEmail: string;
  recipient: string;
  subject: string;
  content: string;
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

// Demo email templates for each target - high-scoring examples
export const demoEmails = [
  {
    targetId: 1,
    senderEmail: 'it-security@acc.com',
    recipient: 'alex.j@acc.com',
    subject: 'URGENT: Password Expiry Notice - Action Required Within 24 Hours',
    content: '<p>Dear Alex,</p><p>This is an automated notification from the <strong>IT Security Department</strong>.</p><p>Your corporate network password is scheduled to expire in <strong>24 hours</strong> due to our enhanced security policy.</p><p style="color: #d32f2f;"><strong>IMPORTANT:</strong> Failure to reset your password will result in:</p><ul><li>Account lockout</li><li>Loss of access to all company systems</li><li>Potential security incident report</li></ul><p>To avoid service disruption, please reset your password immediately by clicking the link below:</p><p><a href="https://acc-portal.com/password-reset" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password Now</a></p><p>If you have any questions, please contact the IT Help Desk.</p><p>Best regards,<br/>IT Security Team<br/>ACC Corporation</p>'
  },
  {
    targetId: 2,
    senderEmail: 'rewards@globalpromotions.com',
    recipient: 'sarah.c@acc.com',
    subject: '🎉 Congratulations! You\'ve Won a $500 Amazon Gift Card!',
    content: '<p>Dear Sarah Collins,</p><p>Congratulations! 🎊</p><p>You have been randomly selected as the winner of our <strong>Global Consumer Survey Sweepstakes</strong>!</p><p><strong>Prize: $500 Amazon Gift Card</strong></p><p>To claim your prize, simply verify your information by clicking the button below:</p><p style="text-align: center;"><a href="https://mega-rewards-global.com/claim" style="background-color: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">CLAIM YOUR PRIZE NOW</a></p><p><em>Please note: This offer expires in 48 hours. Unclaimed prizes will be forfeited.</em></p><p>This is a limited-time opportunity, so act fast!</p><p>Warm regards,<br/>Rewards Team<br/>Global Promotions Inc.<br/>rewardsglobal.com</p>'
  },
  {
    targetId: 3,
    senderEmail: 'michael.chen@acc.com',
    recipient: 'emily.p@acc.com',
    subject: 'CONFIDENTIAL: Q4 Financial Reports Needed ASAP',
    content: '<p>Emily,</p><p>I need you to prepare some <strong>confidential financial reports</strong> for an urgent board meeting this afternoon.</p><p>Please compile the following documents and upload them to our secure share drive:</p><ul><li>Q4 revenue projections</li><li>Cash flow statements</li><li>Budget variance analysis</li></ul><p>Access the secure document portal here:<br/><a href="https://acc-cloudshare.com/documents">https://acc-cloudshare.com/documents</a></p><p><strong>Deadline: Today by 3:00 PM</strong></p><p>This is time-sensitive and critical for the executive team. Please prioritize this task and let me know once completed.</p><p>Thanks,<br/><strong>Michael Chen</strong><br/>VP of Finance<br/>ACC Corporation<br/>Ext: 4521</p>'
  }
];
