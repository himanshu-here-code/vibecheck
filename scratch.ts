import { detectProjectType } from './lib/detect/project-type';

const cases: [string, string, string][] = [
  ['Next.js site', '# My App\n\nA web app built with Next.js\n\nnpm run dev', '{"dependencies":{"next":"^15","react":"^19"}}'],
  ['CLI tool', '# MyCLI\n\nInstall: npm i -g mycli\n\nUsage:\n$ mycli --help', '{"bin":{"mycli":"./cli.js"}}'],
  ['Library', '# react-query\n\nInstall: npm i react-query\n\nImport: import { useQuery } from ...\n\nSee the API reference.', '{"main":"index.js"}'],
  ['Mobile app', '# Expo app\n\nBuilt with React Native and Expo', '{"dependencies":{"expo":"^50"}}'],
  ['Chrome extension', '# Tab Timer\n\nA Chrome extension that limits tabs', '{}'],
];

for (const [name, readme, pkg] of cases) {
  const r = detectProjectType(readme, pkg);
  console.log(`${name.padEnd(20)} → ${r.type.padEnd(18)} (${r.confidence})  [${r.signals.join(', ')}]`);
}