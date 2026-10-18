// The factual core of the site: projects, experience, skills and contact details.
// Everything comes from src/lib/portfolio.ts (the live site) or the public GitHub
// repository descriptions; nothing here adds metrics, roles, or results.
import { achievements, experience, leadershipRoles, music, profile, projects } from "@/lib/portfolio";

export { achievements, experience, leadershipRoles, music, profile };

export const role = "Developer · Agentic systems, RAG & ML";

export const learning = { topic: "Backend engineering", note: "From first principles." };

// From the site's "When I'm not pushing commits…" paragraph.
export const interests = ["The gym", "Books", "Fictional worlds", "Hobbies I'm picking back up"];

export const quote = {
  text: "The more I study, the more insatiable do I feel my genius for it to be.",
  author: "Ada Lovelace",
  note: "World's first computer programmer",
};

export type ConceptProject = (typeof projects)[number] & {
  slug: string;
  area: string;
  stack: string[];
  fact?: string;
};

// Areas and stacks are taken from each project's details on the site and its repository description.
const projectFacts: Record<string, Omit<ConceptProject, keyof (typeof projects)[number]>> = {
  "Scam Bait AI": { slug: "scam-bait", area: "Agentic AI · Fraud defence", stack: ["Python", "FastAPI", "LangGraph"] },
  FLOWITS: { slug: "flowits", area: "Machine learning · Traffic", stack: ["Python", "NetworkX"], fact: "Trained on 8,057 Bengaluru incidents" },
  "Telecom Standards Assistant": { slug: "telecom", area: "RAG · Telecom standards", stack: ["Python", "Pinecone", "Cross-encoder reranking"], fact: "Grounded in 3GPP TS 38.300 and TS 38.401" },
  "Pancake: Agentic Coding Assistant": { slug: "pancake", area: "Agents · Developer tools", stack: ["TypeScript", "Terminal UI", "Telegram"], fact: "Ask, Plan, and Agent modes" },
};

export const conceptProjects: ConceptProject[] = projects.map((project) => ({ ...project, ...projectFacts[project.name] }));

// The site's five skill groups regrouped into four; every skill is kept.
export const skills = [
  { name: "AI & machine learning", items: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP", "Generative AI", "LLMs", "RAG", "Agentic AI", "Prompt Engineering", "Knowledge Engineering"] },
  { name: "Frameworks", items: ["PyTorch", "TensorFlow", "scikit-learn", "OpenCV", "YOLO", "Hugging Face", "LangChain", "LangGraph", "FastAPI", "Streamlit", "SQLAlchemy"] },
  { name: "Data work", items: ["EDA", "Data Analytics", "Data Quality", "Cleaning & Preprocessing", "Feature Engineering", "Model Training", "Evaluation & Validation", "Benchmarking", "Data Pipelines", "Data Visualization"] },
  { name: "Build & ship", items: ["Python", "SQL", "SQLite", "Pinecone", "n8n", "REST APIs", "Docker", "AWS", "Render"] },
];

export const contacts = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
  { label: "GitHub", value: `github.com/${profile.githubUsername}`, href: profile.github },
  { label: "LinkedIn", value: "in/diya-virmani", href: profile.linkedin },
  { label: "Résumé", value: "PDF", href: profile.resume },
];
