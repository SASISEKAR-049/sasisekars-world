/* ==========================================================================
   All portfolio content in one place. Edit text here; the components only
   handle layout. Placeholders look like [DEMO_URL] (see README).
   ========================================================================== */

export const BASE = import.meta.env.BASE_URL;
export const img = (file) => `${BASE}assets/img/${file}`;

export const profile = {
  name: 'SASISEKAR R L',
  first: 'SASISEKAR',
  initials: 'R L',
  kicker: 'AI & DATA SCIENCE DEVELOPER',
  role: 'AI & Data Science Undergraduate · Python & Django Backend Developer',
  tagline: 'Building AI-powered and backend applications with Python, Django and Machine Learning.',
  typer: ['Python Developer', 'Django Backend Engineer', 'ML Enthusiast', 'Computer Vision Builder'],
  status: 'Open to internships & entry-level roles',
  location: 'Tamil Nadu, India',
  coords: 'TAMIL NADU, IN — 11.1271° N, 78.6569° E',
  email: 'sasisekarsasi8@gmail.com',
  phone: '+91 99528 36291',
  phoneHref: 'tel:+919952836291',
  linkedin: 'https://www.linkedin.com/in/sasisekar049',
  github: 'https://github.com/SASISEKAR-049',
  resume: `${BASE}assets/resume.pdf`
};

export const nav = [
  { id: 'about', label: 'About', preview: img('portrait-600.webp') },
  { id: 'skills', label: 'Skills', preview: img('preview-skills.webp') },
  { id: 'projects', label: 'Projects', preview: img('project-smart-attendance-720.webp') },
  { id: 'experience', label: 'Experience', preview: img('preview-experience.webp') },
  { id: 'education', label: 'Education', preview: img('preview-education.webp') },
  { id: 'contact', label: 'Contact', preview: img('preview-contact.webp') }
];

export const about = {
  quote: '“I build intelligent systems that turn data into decisions.”',
  bio: 'I’m a motivated Artificial Intelligence and Data Science undergraduate at Stella Mary’s College of Engineering, with hands-on experience in Python, Django, Django REST Framework, Machine Learning and Data Analytics. I’m passionate about developing AI-powered and backend applications, and I’m looking for an internship or entry-level opportunity where I can contribute to innovative projects and keep growing my technical skills.',
  stats: [
    { label: 'CGPA', value: 7.3, decimals: 1 },
    { label: 'Internships', value: 3 },
    { label: 'Certifications', value: 3 },
    { label: 'Hackathon', value: 1 }
  ],
  interests: ['Artificial Intelligence', 'Machine Learning', 'Backend Development'],
  hobbies: ['Exploring emerging technologies', 'Reading technology articles', 'Listening to music']
};

export const skills = [
  { group: 'Programming Languages', items: ['Python', 'Java (Basic)'] },
  { group: 'Frameworks', items: ['Django', 'Django REST Framework (DRF)'] },
  { group: 'Machine Learning', items: ['Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'Matplotlib'] },
  { group: 'Data Analytics', items: ['Microsoft Excel', 'Power BI'] },
  { group: 'Databases', items: ['MySQL'] },
  { group: 'Development Tools', items: ['VS Code', 'Cursor', 'Google Colab', 'Jupyter Notebook'] },
  { group: 'Version Control', items: ['Git', 'GitHub'] },
  { group: 'AI Tools', items: ['ChatGPT', 'GitHub Copilot'] },
  { group: 'Soft Skills', items: ['Communication', 'Leadership', 'Problem Solving'] }
];

// Marquee rows: [text, style] where style is '' (outline), 'fill' or 'accent'
export const marquees = [
  { dir: -1, items: [['Python', ''], ['Django', 'fill'], ['Django REST Framework', ''], ['Java', 'accent'], ['MySQL', '']] },
  { dir: 1, items: [['Scikit-learn', 'fill'], ['Pandas', ''], ['OpenCV', 'accent'], ['NumPy', ''], ['Matplotlib', 'fill']] },
  { dir: -1, items: [['Power BI', ''], ['Excel', 'fill'], ['Git', ''], ['GitHub', 'accent'], ['Jupyter', ''], ['Colab', 'fill']] }
];

export const project = {
  code: 'P—01',
  category: 'COMPUTER VISION / IoT',
  title: 'Smart Attendance System',
  intro: 'A real-time face recognition attendance system that automates attendance recording over a wireless camera module.',
  tags: ['Python', 'OpenCV', 'ESP32-CAM', 'Arduino IDE'],
  highlights: [
    'Developed a real-time face recognition attendance system using OpenCV and ESP32-CAM.',
    'Automated attendance recording to improve efficiency and reduce manual effort.',
    'Applied image processing and computer vision techniques for face detection and recognition.',
    'Integrated ESP32-CAM for wireless attendance monitoring.'
  ],
  github: '[GITHUB_PROJECT_URL]',
  demo: '[DEMO_URL]',
  architecture: [
    { name: 'ESP32-CAM', sub: 'camera module' },
    { name: 'WI-FI', sub: 'wireless link' },
    { name: 'PYTHON / OPENCV', sub: 'server', hub: true },
    { name: 'FACE RECOGNITION', sub: 'detect + match' },
    { name: 'ATTENDANCE DB', sub: 'records' }
  ],
  pipeline: ['Capture', 'Detect', 'Recognize', 'Record']
};

export const comingSoon = [
  { code: 'P—02', status: 'TRAINING…', note: 'The next AI build is in training.', variant: 'pixel' },
  { code: 'P—03', status: 'COMPILING…', note: 'A backend project is being built.', variant: 'blur' }
];

export const experience = [
  { year: 2025, role: 'Machine Learning Intern', org: 'GenLab IB', kind: 'INTERNSHIP', cert: '[CERT_LINK_1]' },
  { year: 2026, role: 'Drone Development and Automation Intern', org: 'Entudio Pvt Ltd', kind: 'INTERNSHIP', cert: '[CERT_LINK_2]' },
  { year: 2026, role: 'Front-End Development Trainee (In-Plant Training)', org: 'Iniramsquare Pvt Ltd', kind: 'IN-PLANT TRAINING' }
];

export const education = [
  { years: '2023 — 2027', school: 'Stella Mary’s College of Engineering', degree: 'B.Tech, Artificial Intelligence & Data Science', score: 'CGPA 7.3/10', preview: 'CGPA 7.3 / 10' },
  { years: '2023', school: 'Sree Narayana Guru Matriculation Higher Secondary School', degree: 'HSC', score: '75%', preview: 'HSC · 75%' },
  { years: '2021', school: 'Sree Narayana Guru Matriculation Higher Secondary School', degree: 'SSLC', score: '—', preview: 'SSLC · 2021' }
];

export const certifications = [
  { name: 'Python for Data Science', issuer: 'Infosys Springboard', year: '2023' },
  { name: 'Django', issuer: 'Simplilearn', year: '—' },
  { name: 'Google Data Analytics', issuer: 'Coursera', year: '—' }
];

export const achievements = [
  { text: 'Developed a Smart Attendance System using ESP32-CAM and OpenCV.', preview: 'ESP32-CAM + OpenCV' },
  { text: 'Participated in a Hackathon conducted at Kalasalingam University.', preview: 'Kalasalingam University' },
  { text: 'Participated in multiple technical workshops.', preview: 'Workshops' }
];
