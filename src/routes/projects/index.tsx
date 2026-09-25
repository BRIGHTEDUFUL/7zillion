import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { listProjectsFn } from "@/api/projects";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { YouTubeEmbed } from "@/components/youtube-embed";

export const Route = createFileRoute("/projects/")({
  loader: async () => {
    const projects = await listProjectsFn();
    void recordActivityFn({
      data: { eventType: "page_view", path: "/projects", timestamp: new Date().toISOString() },
    });
    return projects;
  },
  head: () => ({
    meta: [
      { title: "Projects | Seven Zillions — Delivered Production Lines" },
      {
        name: "description",
        content:
          "Bottling lines, mineral water plants and water treatment systems delivered and commissioned across Africa and Asia.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = Route.useLoaderData();

  return (
    <InnerPage
      eyebrow="Global delivery"
      title="Recent customer projects"
      intro="Every project below was designed, built, shipped and commissioned — then accepted against measured output rather than nameplate speed."
      crumbs={[{ label: "Projects" }]}
    >
      <section className="section shell">
        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id ?? project.title}>
              <div className="project-image">
                <img loading="lazy" decoding="async" src={project.image} alt={project.title} />
              </div>
              <time dateTime={project.date}>{project.date}</time>
              <h2>{project.title}</h2>
              <p>{project.copy}</p>
              {project.videoUrl && (
                <YouTubeEmbed videoUrl={project.videoUrl} title={`${project.title} video`} />
              )}
              <Link className="text-link" to="/contact">
                Discuss a similar project <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Start yours"
          title="From requirement review to acceptance"
          action="Talk to an engineer"
          to="/contact"
        />
        <p className="wide-copy">
          The project process normally includes requirement review, technical proposal, layout
          confirmation, manufacturing, factory testing, shipment, installation, commissioning and
          training. Acceptance criteria measure correctly filled, closed, labeled and packed product
          — not only the nameplate speed of one machine.
        </p>
      </section>
    </InnerPage>
  );
}
