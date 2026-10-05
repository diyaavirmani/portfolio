"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GitHubCalendar from "react-github-calendar";
import { ArrowUpRight, ChevronDown, ChevronUp, Github, Linkedin, Mail, Music2, Terminal } from "lucide-react";
import { achievements, experience, leadershipRoles, music, profile, projects, skillGroups, type Experience, type Skill as PortfolioSkill } from "@/lib/portfolio";

const Toggle = ({ open, onClick }: { open: boolean; onClick: () => void }) => <button className="see-toggle" onClick={onClick}>{open ? "See less" : "See more"}{open ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button>;

export default function Portfolio() {
  const router = useRouter();
  const [showExperience, setShowExperience] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const visibleSkills = skillGroups.map(({ name, base, more }) => ({ name, values: [...base, ...more] }));
  const openColoredFolio = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(() => router.push("/colored-folio"), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 460);
  };
  return <main className={`portfolio ${isNavigating ? "portfolio-leaving" : ""}`} id="top">
    <section className="profile-banner" aria-label="Profile banner"><img className="banner-image" src="/night-street-banner.jpeg" alt="A warmly lit city street at night with glowing shop windows and lampposts" width={736} height={245}/><div className="profile-photo-wrap"><button type="button" className="profile-photo" onClick={openColoredFolio} aria-label="Open colored portfolio"><img className="photo-face photo-front" src={profile.portrait} alt="Diya Virmani — illustrated portrait"/></button></div></section>
    <header className="intro"><div className="intro-copy"><h1>{profile.name}</h1><blockquote className="intro-quote"><p>&ldquo;The more I study, the more insatiable do I feel my genius for it to be.&rdquo;</p><cite>~ Ada Lovelace <span>· World&apos;s first computer programmer</span></cite></blockquote></div><div className="contact-icons"><a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github/></a><a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin/></a><a href={`mailto:${profile.email}`} aria-label="Email"><Mail/></a></div></header>
    <section className="about"><p>{profile.introduction}</p><p>{profile.education}</p><div className="intro-actions"><a className="bright-button" href={`mailto:${profile.email}`}>Let&apos;s work together <ArrowUpRight size={16}/></a><a className="outline-button" href={profile.github} target="_blank" rel="noreferrer">View GitHub</a></div></section>

    <section className="performance portfolio-section" aria-labelledby="activity-heading"><div className="section-title"><h2 id="activity-heading">GitHub activity</h2></div><GitHubCalendar username={profile.githubUsername} colorScheme="dark" theme={{ dark: ["#2a2a2a", "#444444", "#696969", "#969696", "#dedede"] }} hideColorLegend hideTotalCount blockSize={11} blockMargin={4} fontSize={13}/></section>

    <section className="inline-section portfolio-section" aria-labelledby="experience-heading"><div className="section-title"><h2 id="experience-heading">Experience</h2><Toggle open={showExperience} onClick={() => setShowExperience(!showExperience)}/></div>{showExperience ? <div className="expanded-experience reveal">{experience.map((job) => <ExperienceDetail key={job.company} job={job}/>)}</div> : <div className="experience-timeline reveal">{experience.map((job) => <TimelineItem key={job.company} job={job}/>)}</div>}</section>

    <section className="inline-section skills-section portfolio-section" aria-labelledby="skills-heading"><div className="section-title"><h2 id="skills-heading">Skills</h2></div><div className="skill-list">{visibleSkills.map((group) => <div className="skill-row-simple" key={group.name}><span>{group.name}</span><div>{group.values.map((skill) => <Skill key={skill.name} skill={skill}/>)}</div></div>)}</div></section>

    <section className="bento-section portfolio-section" aria-labelledby="personal-heading"><div className="section-title"><h2 id="personal-heading">More about me</h2></div><div className="bento"><article className="learn-card"><Terminal/><p>Currently learning</p><h3>Backend engineering</h3><span>From first principles.</span></article><article className="spotify-card"><img src={music.cover} alt={music.album}/><div><Music2 size={18}/><p>{music.artist}</p><h3>{music.title}</h3></div><a href={music.youtube} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${music.title} on YouTube`}><ArrowUpRight aria-hidden="true" /></a></article><article className="photo-card"><img src={profile.portrait} alt="Diya Virmani — illustrated portrait"/><div><p>{profile.location}</p><h3>{profile.name}</h3></div></article></div></section>

    <section className="projects-section inline-section portfolio-section" aria-labelledby="projects-heading"><div className="section-title"><h2 id="projects-heading">Projects</h2></div><div className="project-list">{projects.map((project) => <article className="project" key={project.name}><a className="project-link" href={project.href} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.name} on GitHub`}><h3><Github aria-hidden="true"/><span>{project.name}</span><ArrowUpRight aria-hidden="true"/></h3><p>{project.description}</p></a></article>)}</div></section>

    <section className="awards-section inline-section portfolio-section" aria-labelledby="awards-heading"><div className="section-title"><h2 id="awards-heading">Achievements &amp; awards</h2></div><div className="award-list">{achievements.map((achievement) => <article className="award" key={achievement.name}><h3>{achievement.name}</h3><p>{achievement.result}</p></article>)}</div></section>
    <section className="leadership-section inline-section portfolio-section" aria-labelledby="leadership-heading"><div className="section-title"><h2 id="leadership-heading">Leadership roles</h2></div>{leadershipRoles.map((position) => <article className="leadership-role" key={`${position.organization}-${position.role}`}><div className="leadership-role-header"><div><h3>{position.role}</h3><p>{position.organization}</p></div><span className="leadership-role-date">{position.date}</span></div><ul>{position.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</section>
    <footer><span>© 2026 {profile.name}</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}

function ExperienceHeading({ job }: { job: Experience }) { return <h3>{job.repoHref ? <a className="company-repo" href={job.repoHref} target="_blank" rel="noopener noreferrer" aria-label={`View ${job.company} on GitHub`}><span>{job.company}</span><ArrowUpRight aria-hidden="true"/></a> : job.company}</h3>; }
function TimelineItem({ job }: { job: Experience }) { return <article><i/><img className="company-logo" src={job.logo} alt={`${job.company} logo`}/><div><ExperienceHeading job={job}/><p>{job.role}</p>{job.date && <small>{job.date}</small>}</div></article>; }
function ExperienceDetail({ job }: { job: Experience }) { return <article><img className="company-logo" src={job.logo} alt={`${job.company} logo`}/><div><ExperienceHeading job={job}/><p>{job.href ? <a href={job.href} target="_blank" rel="noreferrer">{job.role}</a> : job.role}</p>{job.location && <p>{job.location}</p>}{job.items.length > 0 && <ul>{job.items.map((item) => <li key={item}>{item}</li>)}</ul>}</div>{job.date && <time>{job.date}</time>}</article>; }
function Skill({ skill }: { skill: PortfolioSkill }) { return <span className="skill"><b>{skill.name}</b></span>; }
