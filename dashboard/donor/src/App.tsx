import { useState } from "react";
import Reveal from "./components/Reveal";
import Terminal from "./components/Terminal";
import ScoreRing from "./components/ScoreRing";
import ConformanceMatrix from "./components/ConformanceMatrix";
import Roadmap from "./components/Roadmap";
import Steps from "./components/Steps";
import V01Sheet, { type Verdict } from "./components/V01Sheet";
import V02Sheet from "./components/V02Sheet";
import V03Sheet from "./components/V03Sheet";
import V03F2Section from "./components/V03F2Section";
import V03RSection from "./components/V03RSection";
import TaskRegistry from "./components/TaskRegistry";
import {
  counts,
  stages,
  stackLocal,
  stackTarget,
  templateFiles,
  entityContract,
  entityNotes,
} from "./data/audit";
import {
  evidenceRows,
  verbatimSelectors,
  processRules,
  fixFiles,
  scenarios,
  passCriteria,
} from "./data/v03f";

const DOC_ARCH =
  "https://github.com/annachurasheva/context-vkru/blob/main/docs/architecture.md";
const DOC_REG =
  "https://github.com/annachurasheva/context-vkru/blob/main/docs/%D0%A0%D0%95%D0%93%D0%9B%D0%90%D0%9C%D0%95%D0%9D%D0%A2_%D0%A0%D0%90%D0%91%D0%9E%D0%A2_v2_0.md";
const DOC_M03R =
  "https://github.com/annachurasheva/context-vkru/blob/main-qwen_v_03/reports/v_03/M03r.md";

const VERDICT_KEY = "ctxvkru-verdict-v03r";

const extensionFiles = [
  "EdgeExtension/manifest.json",
  "EdgeExtension/src/core/messaging.js",
  "EdgeExtension/src/background.js",
  "EdgeExtension/src/content.js",
  "EdgeExtension/src/adapters/vkru.js · заморожен",
  "reports/v_03/M03r.md",
  "reports/v_03/BUILD_v03r.md",
  "reports/v_03/TEST_v03r.md",
  "docs/ADDENDUM_3_card_contract_v2.md",
];

/* ---------- мелкие svg-иконки ---------- */

const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
    <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="var(--color-fail)" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
    <path d="M2 6.2L4.8 9L10 3.4" stroke="var(--color-pass)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconExt = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="inline-block">
    <path d="M4.5 2H2v8h8V7.5M7 2h3v3M10 2L5.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function SectionHead({
  num,
  title,
  sub,
}: {
  num: string;
  title: string;
  sub: string;
}) {
  return (
    <Reveal className="mb-8">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[13px] font-bold text-steel">{num}</span>
        <h2 className="font-display text-xl font-extrabold uppercase tracking-[0.08em] text-ink sm:text-2xl">
          {title}
        </h2>
      </div>
      <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-dim sm:pl-[52px]">
        {sub}
      </p>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-line2 via-line to-transparent" />
    </Reveal>
  );
}

/* ---------- приложение ---------- */

export default function App() {
  const [verdict, setVerdictState] = useState<Verdict>(() => {
    try {
      const raw = localStorage.getItem(VERDICT_KEY);
      if (raw === "pass" || raw === "fail") return raw;
    } catch {
      /* приватный режим */
    }
    return null;
  });

  const setVerdict = (v: Verdict) => {
    setVerdictState(v);
    try {
      if (v) localStorage.setItem(VERDICT_KEY, v);
      else localStorage.removeItem(VERDICT_KEY);
    } catch {
      /* приватный режим */
    }
  };

  const statusChip =
    verdict === "pass"
      ? { cls: "border-pass/50 bg-pass/10 text-pass", dot: "bg-pass", label: "v03r · PASS" }
      : { cls: "border-warn/50 bg-warn/10 text-warn", dot: "bg-warn", label: "v03r · ждёт Edge" };

  return (
    <div className="relative min-h-screen font-body text-ink">
      {/* фоновые слои */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 noise" />
      </div>

      <div className="relative z-10">
        {/* верхняя панель */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center border border-steel/50 bg-steel/10">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2L12.5 11H1.5L7 2Z" stroke="var(--color-steel)" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="font-mono text-[12px] font-bold tracking-wide text-ink">
                  context-vkru
                </p>
                <p className="font-mono text-[10px] tracking-wider text-faint">
                  Edge-расширение для vk.ru · Manifest V3
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 border border-pass/40 bg-pass/[0.07] px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-wider text-pass/80 lg:flex">
                v_01 PASS
              </span>
              <span className="hidden items-center gap-1.5 border border-pass/40 bg-pass/[0.07] px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-wider text-pass/80 md:flex">
                v_02 PASS
              </span>
              <a
                href={DOC_M03R}
                target="_blank"
                rel="noreferrer"
                className="filter-btn hidden items-center gap-1.5 border border-line bg-panel px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-dim hover:border-steel hover:text-ink lg:flex"
              >
                M03r.md · задание <IconExt />
              </a>
              <span
                className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10.5px] font-bold tracking-wider ${statusChip.cls}`}
              >
                <span className={`blink-soft h-1.5 w-1.5 rounded-full ${statusChip.dot}`} />
                {statusChip.label}
              </span>
            </div>
          </div>
        </header>

        {/* заголовок + терминал */}
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-10 sm:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
            <div>
              <Reveal>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-steel">
                  Задание M-03r принято · Архитектурное решение №2
                </p>
                <h1 className="mt-4 font-display text-[clamp(1.9rem,4.6vw,3.3rem)] font-extrabold leading-[1.08] tracking-tight text-ink">
                  <span className="text-pass">Сканеры — сняты.</span>
                  <br />
                  <span className={verdict === "pass" ? "text-pass" : "text-steel"}>
                    {verdict === "pass"
                      ? "Фундамент принят — курс на v_04r."
                      : "Молчим, пока не скажете «вот этот»."}
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-dim">
                  Переворот архитектуры: расширение <span className="text-ink">молчит</span>, пока
                  пользователь не скажет «вот этот». ПКМ на ссылке — браузер{" "}
                  <span className="text-ink">сам отдаёт</span>{" "}
                  <span className="font-mono text-[12.5px] text-steel">linkUrl / pageUrl</span> (не
                  выцарапываем из разметки, не зависим от vkit-*); пункты «Сохранить персонажа /
                  сообщество»; изъятие логируется (<span className="font-mono text-[12.5px] text-ink">ctx:captured</span>).
                  Массовый сканер и MutationObserver сняты как избыточные; наработки по href-схеме и
                  data-testid уходят в нормализатор (<span className="font-mono text-[12.5px] text-ink">v_04r</span>)
                  и маркировку после F5 (<span className="font-mono text-[12.5px] text-ink">v_06r</span>).
                  Контракт карточки v2 заложен (дополнение №3) и вступает в силу с{" "}
                  <span className="font-mono text-[12.5px] text-ink">v_05r</span>.
                </p>
              </Reveal>

              <Reveal delay={120}>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="border border-pass/40 bg-pass/[0.07] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-pass/90">
                    v_01 PASS · v_02 PASS
                  </span>
                  <span
                    className={`border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                      verdict === "pass"
                        ? "border-pass/50 bg-pass/10 text-pass"
                        : "border-warn/50 bg-warn/10 text-warn"
                    }`}
                  >
                    {verdict === "pass" ? "v03r · PASS зафиксирован" : "v03r · вердикт ожидается"}
                  </span>
                  <span className="border border-steel/50 bg-steel/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-steel">
                    {verdict === "pass" ? "далее: v_04r · портал + id" : "пакет: 0.0.6 · contextMenus"}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-pass/80">
                      Пакет · v03r на диске (готов к коммиту)
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {extensionFiles.map((f) => (
                        <span
                          key={f}
                          className="border border-pass/25 bg-pass/[0.06] px-2.5 py-1 font-mono text-[11px] text-dim transition-colors hover:border-pass/50 hover:text-ink"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
                      Шаблон · вне пакета (§2.2)
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {templateFiles.map((f) => (
                        <span
                          key={f}
                          className="border border-line bg-inset px-2.5 py-1 font-mono text-[11px] text-faint transition-colors hover:border-line2 hover:text-dim"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-faint">
                      Сборки нет — plain MV3. Ветка main-qwen_v_03 — последний верный источник
                      (манифест 0.0.5 сверен raw-каналом до применения 0.0.6); дополнение №3 к
                      архитектуре сохранено в <span className="font-mono text-[11px] text-dim">docs/</span>.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={150}>
              <Terminal />
            </Reveal>
          </div>

          {/* сводная полоса */}
          <Reveal delay={100}>
            <div className="mt-12 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
              <div className="flex items-center gap-5 bg-panel px-5 py-5">
                <ScoreRing size={104} />
                <div className="font-mono text-[11.5px] leading-relaxed text-dim">
                  <p><span className="font-bold text-pass">{counts.pass} PASS</span></p>
                  <p><span className="font-bold text-warn">{counts.warn} WARN</span></p>
                  <p><span className="font-bold text-fail">{counts.fail} FAIL</span></p>
                </div>
              </div>

              <div className="bg-panel px-5 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  Подтверждённые сборки
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-ink">
                  {verdict === "pass" ? 3 : 2}
                  <span className="text-lg text-faint"> / {stages.length}</span>
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className={`progress-fill h-full rounded-full ${verdict === "pass" ? "w-[20%] bg-pass" : "w-[13%] bg-steel"}`}
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-dim">
                  v_01 ✓ · v_02 ✓ · v03r {verdict === "pass" ? "PASS" : "ждёт теста"}
                </p>
              </div>

              <div className="bg-panel px-5 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  Пакет расширения
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-ink">
                  0.0.6<span className="text-lg text-faint"> · MV3</span>
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-dim">
                  v03r: permissions contextMenus · ctx:captured · linkUrl/pageUrl от браузера
                </p>
              </div>

              <div className="bg-panel px-5 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Режим процесса</p>
                <p className="mt-2 font-display text-[15px] font-bold leading-snug text-steel">
                  Решение №2: изъятие в момент фиксации
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-dim">
                  ПКМ отдаёт ссылку; сканеры сняты; РЕПО-ГЕЙТ и правило §25 сохранены
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 01 — v03r: переворот архитектуры №2 */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="01"
            title="v03r — изъятие в момент фиксации (Решение №2)"
            sub="Задание M-03r исполнено: массовое сканирование снято — расширение молчит, пока пользователь не скажет «вот этот». ПКМ на ссылке: браузер сам отдаёт linkUrl/pageUrl; пункты «Сохранить персонажа / сообщество»; контракт карточки v2 заложен (в силу с v_05r). Итоговый вердикт фундамента фиксируется здесь."
          />
          <V03RSection verdict={verdict} setVerdict={setVerdict} />
        </section>

        {/* 02 — реестр заданий Кодеру */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="02"
            title="Реестр заданий · TASK-0001 — 0005"
            sub="Группа заданий Кодеру в формате conventional commits с тегами [TASK-XXXX] (первоисточник — docs/tasks/TASK-0001.md): от фундамента M-03r до инфраструктуры, регламента, делового стиля дашборда и workspace-окружения. Клик по заданию раскрывает цель, файлы, тест и PASS-критерий."
          />
          <TaskRegistry />
        </section>

        {/* 03 — фикс v03f2 (история, снят с обязанности) */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="03"
            title="Фикс v03f2 — порче-невозможная реализация · снят с обязанности"
            sub="История: замер 3C (dates=168 / roots=0), конструкция селекторов через String.fromCharCode(95), data-post-id, coverage-гейт. Решением №2 (M03r.md) массовый сканер и MutationObserver сняты как избыточные; наработки ушли в нормализатор (v_04r) и маркировку после F5 (v_06r)."
          />
          <V03F2Section verdict={verdict} setVerdict={setVerdict} active={false} />
        </section>

        {/* 02 — фикс v_03f (история, 3B) */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="04"
            title="Фикс v_03f — первый ответ на дефект (3B)"
            sub="История дефекта: доказательная база первого анализа, корень причины (markdown съел подчёркивания), verbatim-контракт селекторов и процедурные решения. Замер 3C показал, что verbatim-передача недостаточна, — понадобилась конструкция через fromCharCode(95)."
          />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-6">
              <Reveal>
                <div className="cornered border border-line bg-panel/70 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-[15px] font-semibold text-ink">
                      Доказательная база (прод)
                    </h3>
                    <span className="border border-fail/50 bg-fail/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-fail">
                      FAIL частичный
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {evidenceRows.map((r) => (
                      <div
                        key={r.sel}
                        className={`border px-4 py-3 transition-colors ${
                          r.works
                            ? "border-pass/30 bg-pass/[0.05] hover:border-pass/60"
                            : "border-fail/30 bg-fail/[0.05] hover:border-fail/60"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <code className="font-mono text-[12px] font-bold text-ink">{r.sel}</code>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                            разделитель: {r.sep}
                          </span>
                          <span
                            className={`ml-auto border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${
                              r.works
                                ? "border-pass/50 bg-pass/10 text-pass"
                                : "border-fail/50 bg-fail/10 text-fail"
                            }`}
                          >
                            {r.works ? "работает" : "не работает"}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{r.evidence}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-l-2 border-warn bg-warn/[0.06] px-4 py-3">
                    <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-warn">
                      Корень причины
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-dim">
                      Подчёркивания съедены markdown-рендером при копировании из чата
                      (<span className="font-mono text-[11.5px] text-fail">wall_comment_date → wallcommentdate</span>).
                      Дефект передачи кода, а не архитектуры: сами селекторы CONFIRMED диагностикой 3A.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="cornered border border-line bg-inset/90 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-[15px] font-semibold text-ink">
                      Verbatim-контракт селекторов
                    </h3>
                    <span className="font-mono text-[10px] text-faint">BUILD_v_03f.md</span>
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {verbatimSelectors.map((s) => {
                      const hasUnderscore = s.includes("_");
                      return (
                        <span
                          key={s}
                          className={`border px-2.5 py-1.5 font-mono text-[11.5px] transition-all hover:-translate-y-0.5 ${
                            hasUnderscore
                              ? "border-warn/50 bg-warn/10 text-warn"
                              : "border-pass/40 bg-pass/[0.07] text-pass/90"
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-faint">
                    Жёлтым — селекторы с подчёркиваниями (группа риска при передаче через рендер-канал).
                    Вердикт 3C: verbatim-фиксации недостаточно — нужен fromCharCode(95) (секция 01).
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="space-y-6">
              <Reveal delay={60}>
                <div className="border border-line bg-panel/70 p-5">
                  <h3 className="font-display text-[15px] font-semibold text-ink">
                    Процедурные решения (действуют)
                  </h3>
                  <div className="mt-3.5 space-y-3">
                    {processRules.map((r, i) => (
                      <div key={r.t} className="flex gap-3.5">
                        <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center border border-warn/50 bg-warn/10 font-mono text-[11px] font-bold text-warn">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-mono text-[12.5px] font-bold uppercase tracking-wide text-ink">
                            {r.t}
                          </p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-dim">{r.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="border border-line bg-panel/70 p-5">
                  <h3 className="font-display text-[15px] font-semibold text-ink">
                    Изменённые файлы v_03f · 0.0.4
                  </h3>
                  <ul className="mt-3.5 space-y-2">
                    {fixFiles.map((f) => (
                      <li
                        key={f.path}
                        className="group border border-line/70 bg-inset/60 px-3.5 py-2.5 transition-colors hover:border-line2 hover:bg-inset"
                      >
                        <p className="font-mono text-[12px] font-bold text-ink">
                          EdgeExtension/{f.path}
                        </p>
                        <p className="mt-0.5 font-mono text-[10.5px] text-faint">{f.note}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[12px] leading-relaxed text-faint">
                    Сценарии P1–P4 того теста (TEST_v_03f.md) уступили место минимальному тесту
                    3C на /feed — см. секцию 01.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={140}>
                <div className="border border-line bg-panel/70 p-5">
                  <h3 className="font-display text-[15px] font-semibold text-ink">
                    Сценарии P1–P4 (исторические)
                  </h3>
                  <div className="mt-3.5 space-y-3">
                    {scenarios.map((sc) => (
                      <div
                        key={sc.id}
                        className="group border border-line/70 px-3.5 py-3 transition-all hover:border-steel/50 hover:bg-steel/[0.04]"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-[12px] font-bold text-steel">{sc.id}</span>
                          <p className="font-mono text-[12px] text-ink">{sc.page}</p>
                        </div>
                        <ul className="mt-1.5 space-y-1 pl-[37px]">
                          {sc.expect.map((e) => (
                            <li key={e} className="flex gap-2 text-[12px] leading-relaxed text-dim">
                              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-steel/70" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-pass/80">
                    PASS-критерии (исторические)
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {passCriteria.map((p) => (
                      <li key={p} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                        <IconCheck />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 03 — шаг 3 / v_03 */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="05"
            title="Шаг 3 · v_03 — VK.RU Adapter: обнаружение"
            sub="Рабочий лист исходной сборки по заданию docs/3A.md: таблица признаков 3A, конвейер обнаружения, листинги пакета, критерии TEST.md. Итоговый вердикт (по fix2) фиксируется в секции 01."
          />
          <V03Sheet verdict={verdict} setVerdict={setVerdict} />
        </section>

        {/* 04 — шаг 2 / v_02 (закрыт) */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="06"
            title="Шаг 2 · v_02 — диагностический канал · закрыт"
            sub="Историческая сборка: PING/PONG между content.js и Service Worker. Закрыта вердиктом PASS (RESULT_v_02.md, 19.08.2026); в v03r канал снят — фундамент перестроен (Решение №2)."
          />
          <V02Sheet verdict="pass" setVerdict={() => undefined} locked />
        </section>

        {/* 05 — шаг 1 / v_01 (закрыт) */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="07"
            title="Шаг 1 · v_01 — контрольный каркас · закрыт"
            sub="Историческая сборка: минимальный MV3-манифест, Service Worker и content script. Закрыта вердиктом PASS (RESULT_v_01.md, 18.08.2026); листинги оставлены для протокола."
          />
          <V01Sheet verdict="pass" setVerdict={() => undefined} locked />
        </section>

        {/* 06 — дорожная карта */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="08"
            title="Дорожная карта v_01 — v_15"
            sub="Часть 6 регламента: строго последовательно, один модуль — одна тестовая сборка. v_01 и v_02 зелёные (PASS); серия v_03 решением №2 (M03r.md) переведена в r-серию (v_03r → v_07r) — актуальный порядок в секции 01; клик раскрывает цель и PASS-критерий."
          />
          <Roadmap />
        </section>

        {/* 07 — матрица */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="09"
            title="Сверка с architecture.md"
            sub={`Постатейная проверка: границы и стек (§B), компоненты (§D), контракт ENTITY (§E), идентификация (§F–I), сценарий ПКМ (§J), отказ от legacy (§K), структура каталогов (§L). Всего ${counts.total} пунктов. Бейдж «файл · v_XX» — артефакт создан в соответствующей сборке, полная функция приходит по плану.`}
          />
          <ConformanceMatrix />
        </section>

        {/* 08 — контракт */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="10"
            title="Контракт ENTITY"
            sub="Часть 3 регламента: структура заморожена, компоненты обмениваются только ею. Полевые правила — что можно считать ключом, а что запрещено трогать; вопрос §F закрыт диагностикой 3A."
          />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <Reveal>
              <div className="cornered h-full border border-line bg-inset/90">
                <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
                  <span className="font-mono text-[11px] tracking-wider text-faint">
                    entity.contract · зафиксирован
                  </span>
                  <span className="border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-warn">
                    не менять без согласования
                  </span>
                </div>
                <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.8] text-dim">
                  {entityContract}
                </pre>
              </div>
            </Reveal>
            <div className="space-y-3">
              {entityNotes.map((n, i) => (
                <Reveal key={n.field} delay={i * 80}>
                  <div className="req-row group border border-line bg-panel/70 px-4 py-3.5 transition-all hover:bg-panel" data-status="warn">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[12px] font-bold text-ink">{n.field}</p>
                      <span className="font-mono text-[10px] tracking-wider text-steel">{n.doc}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">{n.rule}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 09 — стек */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="11"
            title="Конфликт стека — решён разведением корней"
            sub="Единственный WARN аудита (§2.2): шаблон собран на том, что регламент запрещает внутри расширения. Пакет EdgeExtension/ пишется на Vanilla JS с нулём зависимостей — шаблон остаётся снаружи."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="cornered h-full border border-fail/30 bg-panel/80 p-5 sm:p-6">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fail">
                  Как было · package.json
                </p>
                <h3 className="mt-1.5 font-display text-[16px] font-bold text-ink">
                  Vite-шаблон с фреймворками
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {stackLocal.map((s) => (
                    <li key={s} className="flex items-center gap-3 text-[13.5px] text-dim">
                      <IconX />
                      <span className="font-mono text-[12.5px]">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="cornered h-full border border-pass/30 bg-panel/80 p-5 sm:p-6">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-pass">
                  Как надо · РЕГЛАМЕНТ §2.2
                </p>
                <h3 className="mt-1.5 font-display text-[16px] font-bold text-ink">
                  Vanilla JS + нативные API браузера
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {stackTarget.map((s) => (
                    <li key={s} className="flex items-center gap-3 text-[13.5px] text-dim">
                      <IconCheck />
                      <span className="font-mono text-[12.5px]">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 10 — чек-лист */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <SectionHead
            num="12"
            title="Чек-лист запуска"
            sub="Семь шагов старта проекта. Прогресс сохраняется локально; справа — шаблон задания M-01 по форме §7 как эталон формата для всех следующих модулей."
          />
          <Steps />
        </section>

        {/* финал */}
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <Reveal>
              <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                    СТОП<span className="text-fail">.</span>
                  </p>
                  <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-dim">
                    {verdict === "pass"
                      ? "RESULT_v03r.md зафиксирован: фундамент = PASS. По M03r.md следующий шаг — v_04r (опознание портала + нормализация id + авто-тип); задание выдаёт проектировщик."
                      : "v03r реализован. Дальше — РЕПО-ГЕЙТ: закоммитьте EdgeExtension/ (0.0.6), reports/v_03/ и docs/ в main-qwen_v_03 и отправьте ссылку на коммит проектировщику. Тест — три действия из TEST_v03r.md, только после raw-верификации. Вердикт устанавливает Пользователь (§5.6)."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 font-mono text-[11.5px] text-faint">
                  <a href={DOC_ARCH} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink">
                    docs/architecture.md <IconExt />
                  </a>
                  <a href={DOC_REG} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink">
                    docs/РЕГЛАМЕНТ_РАБОТ_v2_0.md <IconExt />
                  </a>
                  <a href={DOC_M03R} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-ink">
                    reports/v_03/M03r.md · задание <IconExt />
                  </a>
                  <span className="mt-1 text-line2">—</span>
                  <span>
                    v_01 PASS · v_02 PASS · v03r: {verdict === "pass" ? "PASS" : "ОЖИДАНИЕ"} · сканеры сняты (Решение №2)
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </footer>
      </div>
    </div>
  );
}
