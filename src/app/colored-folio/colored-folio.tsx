"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import GitHubCalendar from "react-github-calendar";
import { ArrowLeft, ArrowUpRight, FileText, Github, Linkedin, Mail } from "lucide-react";
import { experience, music, profile, projects, skillGroups } from "@/lib/portfolio";
import styles from "./colored-folio.module.css";

export default function ColoredFolio() {
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  // The Paris footage is licensed for local evaluation only; never include it in a public build.
  const localParisPreview = process.env.NODE_ENV === "development";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setMotionAllowed(!preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const video = backgroundVideo.current;
    if (!video || !localParisPreview) return;
    void video.play().catch(() => setMotionAllowed(false));
  }, [motionAllowed, localParisPreview]);

  return <main className={styles.page} id="top">
    <div className={styles.background} aria-hidden="true">
      <img className={styles.backgroundPoster} src="/night-street-banner.jpeg" alt="" />
      {localParisPreview && motionAllowed && <video ref={backgroundVideo} className={styles.backgroundVideo} autoPlay muted loop playsInline preload="metadata" poster="/night-street-banner.jpeg" onError={() => setMotionAllowed(false)}>
        <source src="/paris-rain-loop.mp4" type="video/mp4" />
      </video>}
      <div className={styles.backgroundVeil} />
    </div>
    <div className={styles.content}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/"><ArrowLeft aria-hidden="true" /> Back to portfolio</Link>
      </header>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={styles.section} aria-labelledby="about-heading">
            <h1 id="about-heading">About me</h1>
            <p>To me: an idea and a <span className={styles.highlightPink}>product</span> are just two ends of the same rope, and everything in between is the part people rarely see. The failed attempts, the rewrites, the late fixes, the &ldquo;this should work&rdquo; moments that somehow don&apos;t, and the small breakthroughs that <span className={styles.highlightTeal}>finally make it real</span>. The <span className={styles.highlightBlue}>messy middle</span> is what I enjoy the most about engineering.</p>
            <div className={styles.clawdSticker}><img src="/clawd-sticker.png" alt="Clawd with coffee and a laptop" width={85} height={85} /></div>
            <p>When I&apos;m not pushing commits, I&apos;m at the gym, lost in a book, or somewhere in a fictional world where I refuse to leave. Reconnecting with the hobbies I gave up, turns out you do not have to choose.</p>
          </section>

          <section className={styles.section} aria-labelledby="learning-heading">
            <h2 id="learning-heading">Currently learning</h2>
            <p>Backend engineering from first principles.</p>
            <div className={styles.listeningBlock} role="group" aria-labelledby="listening-heading">
              <h2 id="listening-heading">Listening to</h2>
              <a className={styles.listening} href={music.youtube} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${music.title} on YouTube`}>
                <img className={styles.albumCover} src={music.cover} alt={`${music.album} album cover`} width={64} height={64} /><span>{music.title}<small>{music.artist}</small></span><ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.section} aria-labelledby="stack-heading">
            <h2 id="stack-heading">Tech stack</h2>
            <div className={styles.stackList}>{skillGroups.map(({ name, base, more }) => <div className={styles.stackRow} key={name}><strong>{name}</strong><span>{[...base, ...more].map((skill) => skill.name).join(", ")}</span></div>)}</div>
          </section>

          <section className={styles.section} id="experience" aria-labelledby="colored-experience-heading">
            <h2 id="colored-experience-heading">Work experience</h2>
            <div className={styles.experienceList}>{experience.map((job) => <article className={styles.job} key={job.company}>
              <img className={styles.companyIcon} src={job.logo} alt={`${job.company} logo`} width={36} height={36} />
              <div>
                <h3>{job.repoHref ? <a className={styles.companyRepo} href={job.repoHref} target="_blank" rel="noopener noreferrer" aria-label={`View ${job.company} on GitHub`}><span>{job.company}</span><ArrowUpRight aria-hidden="true" /></a> : job.company}</h3>
                <p className={styles.jobRole}>{job.href ? <a href={job.href} target="_blank" rel="noopener noreferrer">{job.role}</a> : job.role}{job.date && <span className={styles.jobMeta}> · {job.date}</span>}</p>
                <p className={styles.jobDescription}>{job.summary}</p>
              </div>
            </article>)}</div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.section} id="projects" aria-labelledby="colored-projects-heading">
            <h2 id="colored-projects-heading">Projects</h2>
            <div className={styles.projects}>{projects.map((project) => <article className={styles.project} key={project.name}>
              <h3><a className={styles.projectLink} href={project.href} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.name} on GitHub`}><Github aria-hidden="true" /><span>{project.name}</span><ArrowUpRight aria-hidden="true" /></a></h3>
              <p>{project.details}</p>
            </article>)}</div>
          </section>

          <section className={styles.section} aria-labelledby="socials-heading">
            <h2 id="socials-heading">Socials</h2>
            <div className={styles.socials}>
              <a href={profile.github} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" /> GitHub <ArrowUpRight aria-hidden="true" /></a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden="true" /> LinkedIn <ArrowUpRight aria-hidden="true" /></a>
              <a href={profile.resume} target="_blank" rel="noopener noreferrer"><FileText aria-hidden="true" /> Résumé <ArrowUpRight aria-hidden="true" /></a>
            </div>
            <a className={styles.contactLink} href={`mailto:${profile.email}?subject=Meeting%20request`}><Mail aria-hidden="true" /> Book a meeting <ArrowUpRight aria-hidden="true" /></a>
            <div className={styles.contributions}>
              <h3>GitHub contributions</h3>
              <div className={styles.contributionGraph} role="region" aria-label="GitHub contributions, scroll horizontally to see more" tabIndex={0}>
                <GitHubCalendar username={profile.githubUsername} colorScheme="dark" theme={{ dark: ["#252525", "#0e5136", "#128a55", "#27b971", "#58e697"] }} hideColorLegend hideTotalCount blockSize={10} blockMargin={3} blockRadius={2} fontSize={12} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>;
}
