"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Download, Github, Linkedin, Mail, X } from "lucide-react";
import { achievements, conceptProjects, experience, interests, leadershipRoles, learning, profile, quote, skills } from "./content";
import { useDeskLayout } from "./editable";
import styles from "./site-panels.module.css";

// The top-bar links. Each one opens a panel over the room with that part of Diya's story, so the
// landing page stays a single screen.
const PANELS = [
  { id: "about", label: "about me", title: "About me" },
  { id: "projects", label: "projects", title: "Projects" },
  { id: "experience", label: "experience", title: "Experience" },
  { id: "stack", label: "tech stack", title: "Tech stack" },
  { id: "socials", label: "socials", title: "Socials" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteNav({ className }: { className: string }) {
  const { editing } = useDeskLayout();
  const nav = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [open, setOpen] = useState<PanelId | null>(null);

  useEffect(() => { setHost(nav.current?.closest("[data-lamp]") ?? null); }, []);

  useEffect(() => {
    if (editing) setOpen(null);
  }, [editing]);

  const close = () => {
    setOpen(null);
    opener.current?.focus();
  };

  return <>
    <nav ref={nav} className={className} aria-label="Sections">
      <ul>{PANELS.map((panel) => <li key={panel.id}>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open === panel.id}
          disabled={editing}
          onClick={(event) => { opener.current = event.currentTarget; setOpen(panel.id); }}
        >{panel.label}</button>
      </li>)}</ul>
    </nav>
    {host && open && createPortal(<Panel current={open} onSelect={setOpen} onClose={close} />, host)}
  </>;
}

function Panel({ current, onSelect, onClose }: { current: PanelId; onSelect: (id: PanelId) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const body = useRef<HTMLDivElement>(null);
  const panel = PANELS.find((item) => item.id === current) ?? PANELS[0];

  // Focus the active tab when the panel opens, and keep the page behind it still.
  useEffect(() => {
    tabs.current[current]?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => { root.style.overflow = previous; };
    // Only on open: switching tabs moves focus itself.
  }, []);

  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [current]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialog.current) return;
    const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = PANELS.findIndex((item) => item.id === current);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % PANELS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + PANELS.length) % PANELS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = PANELS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onSelect(PANELS[next].id);
    tabs.current[PANELS[next].id]?.focus();
  };

  const onBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return <div className={styles.backdrop} onMouseDown={onBackdrop}>
    <div ref={dialog} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="site-panel-title" onKeyDown={onKeyDown}>
      <header className={styles.head}>
        <h2 id="site-panel-title" className={styles.title}>{panel.title}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
      </header>
      <div className={styles.tabs} role="tablist" aria-label="Sections">
        {PANELS.map((item) => <button
          key={item.id}
          ref={(el) => { tabs.current[item.id] = el; }}
          type="button"
          role="tab"
          id={`site-tab-${item.id}`}
          aria-selected={item.id === current}
          aria-controls="site-panel-body"
          tabIndex={item.id === current ? 0 : -1}
          className={styles.tab}
          onClick={() => onSelect(item.id)}
          onKeyDown={onTabKey}
        >{item.label}</button>)}
      </div>
      <div ref={body} id="site-panel-body" className={styles.body} role="tabpanel" aria-labelledby={`site-tab-${current}`} tabIndex={0}>
        {current === "about" && <About />}
        {current === "projects" && <Projects />}
        {current === "experience" && <Experience />}
        {current === "stack" && <Stack />}
        {current === "socials" && <Socials />}
      </div>
    </div>
  </div>;
}

function About() {
  return <>
    <p className={styles.lede}>I like to work on agentic systems, RAG pipelines, and study core ML/DL architectures.</p>
    <p>{profile.perspective}</p>
    <p>{profile.hobbies}</p>
    <dl className={styles.facts}>
      <div><dt>Studying</dt><dd>{profile.education}</dd></div>
      <div><dt>Currently learning</dt><dd>{learning.topic}, {learning.note.charAt(0).toLowerCase() + learning.note.slice(1)}</dd></div>
      <div><dt>Into</dt><dd>{interests.join(" · ")}</dd></div>
    </dl>
    <figure className={styles.quote}>
      <blockquote>“{quote.text}”</blockquote>
      <figcaption>{quote.author}, {quote.note.charAt(0).toLowerCase() + quote.note.slice(1)}</figcaption>
    </figure>
  </>;
}

function Projects() {
  return <ul className={styles.list}>
    {conceptProjects.map((project) => <li key={project.slug} className={styles.card}>
      <p className={styles.kicker}>{project.area}</p>
      <h3 className={styles.cardTitle}>{project.name}</h3>
      <p className={styles.cardLede}>{project.description}</p>
      <p>{project.details}</p>
      {project.fact && <p className={styles.fact}>{project.fact}</p>}
      <ul className={styles.chips} aria-label="Built with">{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
      <a className={styles.link} href={project.href} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" />View on GitHub<ArrowUpRight aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a>
    </li>)}
  </ul>;
}

function Experience() {
  return <>
    <ol className={styles.list}>
      {experience.map((job) => <li key={job.company} className={styles.card}>
        <div className={styles.job}>
          <img className={styles.logo} src={job.logo} alt="" width={40} height={40} />
          <div>
            <h3 className={styles.cardTitle}>{job.repoHref
              ? <a className={styles.titleLink} href={job.repoHref} target="_blank" rel="noopener noreferrer">{job.company}<ArrowUpRight aria-hidden="true" /><span className={styles.srOnly}> (repository, opens in a new tab)</span></a>
              : job.company}</h3>
            <p className={styles.meta}>{job.role}{job.date && <> · {job.date}</>}{job.location && <> · {job.location}</>}</p>
          </div>
        </div>
        <p className={styles.cardLede}>{job.summary}</p>
        {job.items.filter((item) => item !== job.summary).length > 0 && <ul className={styles.bullets}>
          {job.items.filter((item) => item !== job.summary).map((item) => <li key={item}>{item}</li>)}
        </ul>}
      </li>)}
    </ol>

    <h3 className={styles.subhead}>Hackathons</h3>
    <ul className={styles.results}>
      {achievements.map((item) => <li key={item.name}><span>{item.name}</span><span>{item.result}</span></li>)}
    </ul>

    <h3 className={styles.subhead}>Leadership</h3>
    {leadershipRoles.map((position) => <div key={position.role} className={styles.card}>
      <h4 className={styles.cardTitle}>{position.role}</h4>
      <p className={styles.meta}>{position.organization} · {position.date}</p>
      <ul className={styles.bullets}>{position.items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>)}
  </>;
}

function Stack() {
  return <div className={styles.groups}>
    {skills.map((group) => <section key={group.name} aria-labelledby={`stack-${group.name}`}>
      <h3 id={`stack-${group.name}`} className={styles.groupTitle}>{group.name}</h3>
      <ul className={styles.chips}>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>)}
  </div>;
}

function Socials() {
  return <>
    <p className={styles.lede}>Write to me, or find me on GitHub and LinkedIn.</p>
    <ul className={styles.socials}>
      <li><a href={`mailto:${profile.email}`}><Mail aria-hidden="true" /><span><strong>Email</strong>{profile.email}</span></a></li>
      <li><a href={profile.github} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" /><span><strong>GitHub</strong>github.com/{profile.githubUsername}</span><ArrowUpRight aria-hidden="true" /></a></li>
      <li><a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden="true" /><span><strong>LinkedIn</strong>in/diya-virmani</span><ArrowUpRight aria-hidden="true" /></a></li>
      <li><a href={profile.resume} download="Diya-Virmani-Resume.pdf"><Download aria-hidden="true" /><span><strong>Résumé</strong>PDF download</span></a></li>
    </ul>
  </>;
}
