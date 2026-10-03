const fs = require("fs");
const path = require("path");

const base = path.join(".build", "public", "legacy");

function edit(file, replacements) {
  const p = path.join(base, file);
  let s = fs.readFileSync(p, "utf8");
  for (const [from, to] of replacements) s = s.replace(from, to);
  fs.writeFileSync(p, s);
}

fs.rmSync(path.join(base, "setup.html"), { force: true });

edit("index.html", [
  ["onAuth: (user) => { location.replace(localStorage.getItem('rh_tmdb') ? 'home.html' : 'setup.html'); },", "onAuth: (user) => { location.replace('home.html'); },"]
]);

edit("shared.js", [
  ["key:()=>localStorage.getItem('rh_tmdb'),", "key:()=>localStorage.getItem('rh_tmdb')||'e39d09282fd73792b1e8110c4861ee7f',"],
  ["guard(){if(!RH.user())location.replace('index.html');else if(!RH.key())location.replace('setup.html')},", "guard(){if(!RH.user())location.replace('index.html')}, "]
]);

edit("settings.html", [
  ['<a class="rw" href="setup.html">TMDB API key<small></small></a>', ""]
]);

const mainPath = path.join(".build", "src", "main.jsx");
let main = fs.readFileSync(mainPath, "utf8");
main = main.replace("  'setup',", "");
fs.writeFileSync(mainPath, main);
