// Microlink renders the page and gives back every href, so we don't
// need our own backend just to read another site's HTML.
const MICROLINK = "https://api.microlink.io/";

const MAX_LINKS = 80;
const PARALLEL = 6;
const TIMEOUT = 8000;
const SLOW_AFTER = 3000;

const form = document.getElementById("check-form");
const input = document.getElementById("url-input");
const button = document.getElementById("check-btn");
const message = document.getElementById("message");
const list = document.getElementById("results");
const summary = document.getElementById("summary");
const filters = document.getElementById("filters");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");

let counts = { total: 0, ok: 0, slow: 0, broken: 0 };
let done = 0;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  reset();

  const pageUrl = input.value.trim();
  button.disabled = true;
  setMessage("Reading the page...");

  try {
    const links = await getLinks(pageUrl);
    if (links.length === 0) {
      setMessage("No links found on this page.");
      return;
    }

    const toCheck = links.slice(0, MAX_LINKS);
    setMessage(
      links.length > MAX_LINKS
        ? `Found ${links.length} links, checking the first ${MAX_LINKS}...`
        : `Checking ${links.length} links...`
    );

    counts.total = toCheck.length;
    showStats();

    const rows = toCheck.map(addRow);
    await runInBatches(toCheck, (link, i) => checkLink(link, rows[i]));

    setMessage(counts.broken === 0 ? "Every link responded 🎉" : "Done.");
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    button.disabled = false;
  }
});

filters.addEventListener("click", (e) => {
  const filter = e.target.dataset.filter;
  if (!filter) return;

  filters.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");

  list.querySelectorAll("li").forEach((li) => {
    li.style.display = filter === "all" || li.dataset.status === filter ? "" : "none";
  });
});

async function getLinks(pageUrl) {
  const params = new URLSearchParams({
    url: pageUrl,
    meta: "false",
    "data.links.selectorAll": "a",
    "data.links.attr": "href",
  });

  const res = await fetch(`${MICROLINK}?${params}`);
  const json = await res.json();

  if (res.status === 429) {
    throw new Error("Daily limit of the free API is reached, try again tomorrow.");
  }
  if (json.status !== "success") {
    throw new Error(json.message || "Could not read that page.");
  }

  const hrefs = (json.data && json.data.links) || [];
  const found = new Set();

  for (const href of hrefs) {
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) {
      continue;
    }
    try {
      const url = new URL(href, pageUrl);
      url.hash = "";
      if (url.protocol === "http:" || url.protocol === "https:") {
        found.add(url.href);
      }
    } catch {
      // skip malformed hrefs
    }
  }

  return [...found];
}

// A no-cors request can't read the status code, but it still tells us
// whether the server answered at all (DNS errors, timeouts, refused connections).
async function checkLink(link, row) {
  let status = "broken";
  let label = "DOWN";

  if (link.startsWith("http:")) {
    // https pages aren't allowed to fetch plain http
    status = "slow";
    label = "HTTP";
  } else {
    const start = performance.now();
    try {
      await fetch(link, {
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT),
      });
      const ms = Math.round(performance.now() - start);
      status = ms > SLOW_AFTER ? "slow" : "ok";
      label = `${ms} ms`;
    } catch (err) {
      label = err.name === "TimeoutError" ? "TIMEOUT" : "DOWN";
    }
  }

  counts[status]++;
  done++;
  updateRow(row, status, label);
  showStats();
}

async function runInBatches(items, worker) {
  let index = 0;

  async function next() {
    while (index < items.length) {
      const i = index++;
      await worker(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(PARALLEL, items.length) }, next);
  await Promise.all(workers);
}

function addRow(link) {
  const li = document.createElement("li");
  li.dataset.status = "pending";

  const badge = document.createElement("span");
  badge.className = "badge pending";
  badge.textContent = "...";

  const a = document.createElement("a");
  a.href = link;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = link;

  li.append(badge, a);
  list.appendChild(li);
  return li;
}

function updateRow(li, status, label) {
  li.dataset.status = status;
  const badge = li.querySelector(".badge");
  badge.className = `badge ${status}`;
  badge.textContent = label;
}

function showStats() {
  summary.classList.remove("hidden");
  filters.classList.remove("hidden");
  progress.classList.remove("hidden");

  document.getElementById("total").textContent = counts.total;
  document.getElementById("ok-count").textContent = counts.ok;
  document.getElementById("slow-count").textContent = counts.slow;
  document.getElementById("broken-count").textContent = counts.broken;

  const percent = counts.total ? (done / counts.total) * 100 : 0;
  progressBar.style.width = percent + "%";
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function reset() {
  counts = { total: 0, ok: 0, slow: 0, broken: 0 };
  done = 0;
  list.innerHTML = "";
  progressBar.style.width = "0";
  summary.classList.add("hidden");
  filters.classList.add("hidden");
  progress.classList.add("hidden");
  filters.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === "all");
  });
}
