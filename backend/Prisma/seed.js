import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default skills
  const skills = [
    // Frontend Technologies
    {
      name: 'React',
      category: 'Frontend',
      description: 'JavaScript library for building user interfaces',
    },
    {
      name: 'Vue.js',
      category: 'Frontend',
      description: 'Progressive framework for building user interfaces',
    },
    {
      name: 'Angular',
      category: 'Frontend',
      description: 'TypeScript-based web application framework',
    },
    {
      name: 'Next.js',
      category: 'Frontend',
      description: 'React framework for production',
    },
    {
      name: 'TypeScript',
      category: 'Frontend',
      description: 'Typed superset of JavaScript',
    },
    {
      name: 'JavaScript',
      category: 'Frontend',
      description: 'Programming language for web development',
    },
    {
      name: 'HTML/CSS',
      category: 'Frontend',
      description: 'Markup and styling languages for web',
    },
    {
      name: 'Tailwind CSS',
      category: 'Frontend',
      description: 'Utility-first CSS framework',
    },

    // Backend Technologies
    {
      name: 'Node.js',
      category: 'Backend',
      description: 'JavaScript runtime for server-side development',
    },
    {
      name: 'Python',
      category: 'Backend',
      description: 'High-level programming language',
    },
    {
      name: 'Java',
      category: 'Backend',
      description: 'Object-oriented programming language',
    },
    {
      name: 'PHP',
      category: 'Backend',
      description: 'Server-side scripting language',
    },
    {
      name: 'Ruby',
      category: 'Backend',
      description: 'Dynamic programming language',
    },
    {
      name: 'Go',
      category: 'Backend',
      description: 'Fast and efficient programming language',
    },
    {
      name: 'C#',
      category: 'Backend',
      description: 'Microsoft programming language',
    },
    {
      name: 'Rust',
      category: 'Backend',
      description: 'Systems programming language',
    },

    // Databases
    {
      name: 'PostgreSQL',
      category: 'Database',
      description: 'Advanced open-source relational database',
    },
    {
      name: 'MySQL',
      category: 'Database',
      description: 'Popular relational database',
    },
    {
      name: 'MongoDB',
      category: 'Database',
      description: 'NoSQL document database',
    },
    {
      name: 'Redis',
      category: 'Database',
      description: 'In-memory data structure store',
    },
    {
      name: 'SQLite',
      category: 'Database',
      description: 'Lightweight relational database',
    },

    // Cloud & DevOps
    {
      name: 'AWS',
      category: 'Cloud',
      description: 'Amazon Web Services cloud platform',
    },
    {
      name: 'Azure',
      category: 'Cloud',
      description: 'Microsoft cloud platform',
    },
    {
      name: 'Google Cloud',
      category: 'Cloud',
      description: 'Google cloud platform',
    },
    {
      name: 'Docker',
      category: 'DevOps',
      description: 'Containerization platform',
    },
    {
      name: 'Kubernetes',
      category: 'DevOps',
      description: 'Container orchestration system',
    },
    {
      name: 'CI/CD',
      category: 'DevOps',
      description: 'Continuous integration and deployment',
    },

    // Mobile Development
    {
      name: 'React Native',
      category: 'Mobile',
      description: 'Cross-platform mobile development',
    },
    {
      name: 'Flutter',
      category: 'Mobile',
      description: 'Google mobile UI framework',
    },
    {
      name: 'iOS Development',
      category: 'Mobile',
      description: 'Native iOS app development',
    },
    {
      name: 'Android Development',
      category: 'Mobile',
      description: 'Native Android app development',
    },

    // Design
    {
      name: 'UI/UX Design',
      category: 'Design',
      description: 'User interface and experience design',
    },
    {
      name: 'Figma',
      category: 'Design',
      description: 'Collaborative design tool',
    },
    {
      name: 'Adobe Creative Suite',
      category: 'Design',
      description: 'Professional design software',
    },
    {
      name: 'Sketch',
      category: 'Design',
      description: 'Digital design toolkit',
    },

    // Blockchain
    {
      name: 'Solidity',
      category: 'Blockchain',
      description: 'Smart contract programming language',
    },
    {
      name: 'Web3.js',
      category: 'Blockchain',
      description: 'Ethereum JavaScript API',
    },
    {
      name: 'Smart Contracts',
      category: 'Blockchain',
      description: 'Self-executing contracts',
    },
    {
      name: 'DeFi',
      category: 'Blockchain',
      description: 'Decentralized finance',
    },

    // Data Science & AI
    {
      name: 'Machine Learning',
      category: 'AI/ML',
      description: 'Artificial intelligence and machine learning',
    },
    {
      name: 'Data Science',
      category: 'AI/ML',
      description: 'Data analysis and insights',
    },
    {
      name: 'TensorFlow',
      category: 'AI/ML',
      description: 'Machine learning framework',
    },
    {
      name: 'PyTorch',
      category: 'AI/ML',
      description: 'Deep learning framework',
    },
    {
      name: 'Data Visualization',
      category: 'AI/ML',
      description: 'Creating visual representations of data',
    },

    // Marketing & Content
    {
      name: 'Digital Marketing',
      category: 'Marketing',
      description: 'Online marketing strategies',
    },
    {
      name: 'Content Writing',
      category: 'Marketing',
      description: 'Creating engaging content',
    },
    {
      name: 'SEO',
      category: 'Marketing',
      description: 'Search engine optimization',
    },
    {
      name: 'Social Media Marketing',
      category: 'Marketing',
      description: 'Marketing through social platforms',
    },

    // Project Management
    {
      name: 'Agile/Scrum',
      category: 'Management',
      description: 'Agile project management methodology',
    },
    {
      name: 'Project Management',
      category: 'Management',
      description: 'Planning and executing projects',
    },
    {
      name: 'Product Management',
      category: 'Management',
      description: 'Managing product development',
    },
  ];

  console.log('Seeding skills...');

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log('Skills seeded successfully!');

  // Create some sample users for testing
  const sampleUsers = [
    {
      email: 'client@example.com',
      password: '$2b$10$K7L/gZK4zRJgdKJCr5Z3QeKQWgZ1qH2Y9M1m8j1g8Z8K7L2Q1m8j1g', // password123
      name: 'John Client',
      role: Role.CLIENT,
    },
    {
      email: 'freelancer@example.com',
      password: '$2b$10$K7L/gZK4zRJgdKJCr5Z3QeKQWgZ1qH2Y9M1m8j1g8Z8K7L2Q1m8j1g', // password123
      name: 'Jane Freelancer',
      role: Role.FREELANCER,
    },
  ];

  console.log('Seeding sample users...');

  for (const user of sampleUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Sample users seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
