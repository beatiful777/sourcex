import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import worldData from "world-atlas/countries-110m.json";

// Catalog names that differ from the Natural Earth names in the atlas file.
const ATLAS_ALIAS: Record<string, string> = { USA: "United States of America", "Czech Republic": "Czechia" };

export type HubCount = { country: string; count: number };

const topo = worldData as unknown as Topology;
const land = feature(topo, topo.objects["countries"] as GeometryCollection) as unknown as FeatureCollection<Geometry, { name: string }>;
const W = 960, H = 480;
const projection = geoNaturalEarth1().fitSize([W, H], { type: "Sphere" } as never);
const pathGen = geoPath(projection);
const paths = land.features.map((f) => ({ name: f.properties.name, d: pathGen(f) ?? "" }));

/** Draws countries that have approved factories. `hubs` must come from the database; with none, the map is blank. */
export function HubMap({ hubs }: { hubs: HubCount[] }) {
  const byAtlas = useMemo(() => new Map(hubs.map((h) => [ATLAS_ALIAS[h.country] ?? h.country, h])), [hubs]);
  const undrawn = hubs.filter((h) => !paths.some((p) => p.name === (ATLAS_ALIAS[h.country] ?? h.country)));
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={hubs.length ? `World map: ${hubs.length} countries with approved factories` : "World map: no approved factories yet"} className="h-auto w-full rounded-xl border bg-muted/30">
        {paths.map((p) => {
          const h = byAtlas.get(p.name);
          return (
            <path key={p.name} d={p.d} className={h ? "fill-primary stroke-background" : "fill-muted-foreground/20 stroke-background"} strokeWidth={0.5}>
              {h ? <title>{`${h.country}: ${h.count} approved ${h.count === 1 ? "factory" : "factories"}`}</title> : null}
            </path>
          );
        })}
      </svg>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        {hubs.length === 0
          ? "No approved factories yet, so no country is highlighted. The map fills in as factories pass review."
          : `Highlighted: countries with at least one approved factory (${hubs.length}).`}
        {undrawn.length ? ` Not drawn on this map: ${undrawn.map((h) => h.country).join(", ")}.` : ""}
      </figcaption>
    </figure>
  );
}
