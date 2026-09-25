import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { ProjectSchema } from "@/lib/schemas";
import type { Project } from "@/types/content";

import { getApiEnv } from "./_internal";

const projectIdSchema = z.object({
  id: z.string().min(1),
});

export const listProjectsFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.listProjects();
});

/** Public single-item read for a portfolio project. */
export const getProjectFn = createServerFn({ method: "GET" })
  .validator(projectIdSchema)
  .handler(async ({ data, context }) => {
    const store = getContentStore(getApiEnv(context));
    const projects = await store.listProjects();
    return projects.find((project) => project.id === data.id) ?? null;
  });

export const upsertProjectFn = createServerFn({ method: "POST" })
  .validator(ProjectSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    const project: Project = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
    };

    try {
      const store = getContentStore(getApiEnv(context));
      await store.putProject(project);
      return { success: true as const, project };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to save project");
    }
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .validator(projectIdSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.deleteProject(data.id);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete project");
    }
  });
