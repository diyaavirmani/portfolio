// Personal details from Diya's supplied about.html and subsequent instructions.
// Skills, projects, project links, and achievements from Diya's supplied résumé.
export const profile = {
  name: "Diya Virmani",
  location: "New Delhi",
  email: "diyavirmani41@gmail.com",
  phone: "+91-8800703686",
  phoneHref: "tel:+918800703686",
  github: "https://github.com/diyaavirmani",
  githubUsername: "diyaavirmani",
  linkedin: "https://www.linkedin.com/in/diya-virmani-3bb62b1a0/",
  resume: "/diya-resume.pdf",
  portrait: "/diya-portrait.jpg",
  introduction: "I'm a developer based in New Delhi. I like to work on agentic systems, RAG pipelines, and study core ML/DL architectures.",
  education: "B.Tech AI & DS · VIPS-TC · Graduating 2027",
  perspective: "To me, an idea and a product are just two ends of the same rope, and everything in between is the part people rarely see: the failed attempts, the rewrites, the late fixes, the ‘this should work’ moments that somehow don’t, and the small breakthroughs that finally make it real. That messy middle is what I enjoy most about engineering.",
  hobbies: "When I'm not pushing commits, I'm at the gym, lost in a book, or somewhere in a fictional world I refuse to leave. Reconnecting with the hobbies I gave up. Turns out you don't have to choose.",
};
export const roles = ["Developer", "Agentic systems · RAG", "B.Tech AI & DS"];
export const music = {
  title: "Style (Taylor's Version)",
  artist: "Taylor Swift",
  album: "1989 (Taylor's Version)",
  cover: "/1989-taylors-version.jpg",
  youtube: "https://www.youtube.com/watch?v=2JgvVfOfoWI",
};
export const projects = [
  {
    name: "Scam Bait AI",
    href: "https://github.com/diyaavirmani/SCAM-BAIT",
    description: "An AI honeypot that engages scammers on Telegram and calls.",
    details: "An AI honeypot that engages scammers on Telegram and phone calls. Uses FastAPI and LangGraph to classify scams and extract threat indicators.",
  },
  {
    name: "FLOWITS",
    href: "https://github.com/diyaavirmani/Flowits",
    description: "Predicts traffic incident severity and plans safer diversions.",
    details: "A traffic-control system trained on 8,057 Bengaluru incidents. Predicts severity, maps spatial risk zones, and plans diversions with NetworkX.",
  },
  {
    name: "Telecom Standards Assistant",
    href: "https://github.com/diyaavirmani/Telecom-Standards-Assistant-",
    description: "Answers 3GPP standards questions with verified citations.",
    details: "An evidence-gated RAG assistant for 3GPP standards, using Pinecone and reranking to return verified citations and refuse unsupported answers.",
  },
  {
    name: "Pancake: Agentic Coding Assistant",
    href: "https://github.com/diyaavirmani/probable-pancake",
    description: "An agentic coding assistant with approval-gated file edits.",
    details: "An agentic coding assistant with Ask, Plan, and Agent modes in a terminal UI and Telegram. File edits stay sandboxed until user approval.",
  },
];
export const achievements = [
  { name: "Hermes Buildathon", result: "Top 5 Finalist" },
  { name: "OpenAI Codex Community Hackathon", result: "Top 6 Finalist among all participating teams" },
  { name: "GUVI India AI Impact Buildathon", result: "Top 2% Finalist of national submissions" },
  { name: "Hacktivate", result: "2nd Place overall" },
  { name: "FrostByte Hack", result: "Theme Winner ($100 prize)" },
];
// Leadership details transcribed from Diya's supplied screenshot.
export const leadershipRoles = [
  {
    role: "Head of Operations",
    organization: "Entrepreneurship Cell (E-Cell) · VIPS",
    date: "2023 – 2026",
    items: [
      "Spearheaded operations, event logistics, and institutional partnerships across flagship tech and entrepreneurship summits.",
      "Led corporate sponsorship outreach and coordinated cross-functional execution teams of 50+ members.",
    ],
  },
];
export type Experience = {
  company: string;
  role: string;
  date?: string;
  location?: string;
  mark: string;
  logo: string;
  href?: string;
  repoHref?: string;
  summary: string;
  items: string[];
};
export const experience: Experience[] = [
  {
    company: "Agent Orchestrator",
    role: "Open Source Contributor",
    date: "2026 – Present",
    mark: "AO",
    logo: "/companies/agent-orchestrator.png",
    repoHref: "https://github.com/Untrivial-ai/agent-orchestrator",
    summary: "6+ PRs merged into a production AI orchestration desktop app for macOS Intel, with real users.",
    items: ["6+ PRs merged into a production AI orchestration desktop app for macOS Intel, with real users."],
  },
  {
    company: "Prewery Private Limited",
    role: "Software Development Intern",
    date: "Jul 2026 – Aug 2026",
    location: "Janakpuri, New Delhi",
    mark: "P",
    // Official site logo: https://prewery.in/assets/prelogo.png
    logo: "/companies/prewery.png",
    href: "https://github.com/greyXytOP/newish-backend",
    repoHref: "https://github.com/greyXytOP/newish-backend",
    summary: "Built backend APIs, Instagram integrations, and campaign budget guardrails for a creator-monetization platform.",
    items: [
      "Architected backend REST APIs in Express.js & MongoDB for a creator-monetization platform, handling real-time Meta Webhook ingestion, tag verification, and automated DM dispatch via Instagram Graph API.",
      "Implemented dynamic campaign budget guardrails, multipart media/receipt upload pipelines (Multer), and aggregated endpoints that reduced mobile client data fetch overhead.",
    ],
  },
  {
    company: "Sansoftech",
    role: "Generative AI & Prompt Engineering Intern",
    date: "Jun 2025 – Jul 2025",
    location: "6-week summer internship",
    mark: "S",
    // Official site icon: https://www.sansoftech.in/assets/favicon-sansoft-logo.png
    logo: "/companies/sansoftech.png",
    summary: "Built a Python RAG assistant that reduced document retrieval time by roughly 30%.",
    items: [
      "Iterated on prompt templates to ground answers in retrieved context and cut hallucinated responses, reviewing model outputs against the source documents to check they were supported.",
      "Built a document Q&A assistant in Python using Retrieval-Augmented Generation (RAG) that answers natural-language questions over company documents, reducing information retrieval time by roughly 30%.",
    ],
  },
];
export type Skill = { name: string };
const toSkills = (names: string[]): Skill[] => names.map((name) => ({ name }));
export const skillGroups = [
  {
    name: "Technology",
    base: toSkills(["Machine Learning", "Deep Learning", "Computer Vision"]),
    more: toSkills(["NLP", "Generative AI", "Large Language Models (LLMs)", "RAG", "Agentic AI", "Prompt Engineering", "Knowledge Engineering"]),
  },
  {
    name: "Data Science",
    base: toSkills(["Exploratory Data Analysis (EDA)", "Data Analytics", "Data Quality"]),
    more: toSkills(["Data Cleaning", "Data Preprocessing", "Feature Engineering", "Model Training", "Model Evaluation", "Model Validation", "Benchmarking", "Data Pipelines", "Data Visualization"]),
  },
  {
    name: "Libraries & Frameworks",
    base: toSkills(["PyTorch", "TensorFlow", "scikit-learn"]),
    more: toSkills(["OpenCV", "YOLO", "Hugging Face", "LangChain", "LangGraph", "FastAPI", "Streamlit", "SQLAlchemy"]),
  },
  {
    name: "Data & Automation Tools",
    base: toSkills(["SQL", "SQLite", "Pinecone"]),
    more: toSkills(["n8n"]),
  },
  {
    name: "Development & Deployment",
    base: toSkills(["Python", "REST APIs", "Docker"]),
    more: toSkills(["AWS", "Render"]),
  },
];
