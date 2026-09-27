import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { projects, getProject } from "../../../content/projects";

export const alt = "Case study by Mitarth Pathak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  const [inter, mono] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Inter-SemiBold-subset.ttf")),
    readFile(join(process.cwd(), "assets/fonts/GeistMono-Medium-subset.ttf")),
  ]);

  const title = project?.title ?? "Mitarth Pathak";
  const line = project?.oneLiner ?? "AI & Full-Stack Developer";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#F7F1ED",
          backgroundImage:
            "linear-gradient(to right, rgba(172,172,172,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(172,172,172,0.18) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          color: "#242424",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Geist Mono", fontSize: 24, letterSpacing: 2 }}>
          <span>CASE STUDY</span>
          <span>{project?.year ?? ""}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 12 ? 128 : 150, lineHeight: 0.95, letterSpacing: -6 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, lineHeight: 1.25, maxWidth: 900, color: "#3a3733" }}>
            <span style={{ background: "#FFE862", padding: "2px 10px" }}>{line}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "Geist Mono", fontSize: 24 }}>
          <span>MITARTH PATHAK — AI &amp; FULL-STACK DEVELOPER</span>
          <span style={{ display: "flex", width: 22, height: 22, borderRadius: 11, background: "#FF9500" }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter, style: "normal", weight: 600 },
        { name: "Geist Mono", data: mono, style: "normal", weight: 500 },
      ],
    }
  );
}
