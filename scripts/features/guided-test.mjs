import {
  TEST_LIMITS,
  evaluateDuneTest,
  extraDiceCost
} from "../domain/dune-test.mjs";
import { buildGuidedTestPoolPlan } from "../domain/pool-plan.mjs";
import { format, localize } from "../localization.mjs";
import {
  getLauncherLocation,
  LAUNCHER_LOCATIONS,
  shouldHideNativeRoller
} from "../settings.mjs";

const MODULE_ID = "dune-qol";
const CONTROL_NAME = "dune-qol-guided-test";
const EXTRA_DICE_SOURCES = new Set(["none", "unrecorded", "momentum", "threat", "other"]);

export function registerGuidedTestHooks() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (game.system.id !== "dune") return;

    if (shouldHideNativeRoller()) {
      hideNativeRollerControls(controls);
    }

    const launcherLocation = getLauncherLocation();
    const showTokenLauncher = launcherLocation === LAUNCHER_LOCATIONS.tokenControls
      || launcherLocation === LAUNCHER_LOCATIONS.both;
    if (!showTokenLauncher || !controls.tokens?.tools) return;

    controls.tokens.tools[CONTROL_NAME] = {
      name: CONTROL_NAME,
      title: localize("DUNEQOL.GuidedTest.Control"),
      icon: "fa-solid fa-dice-d20",
      order: Object.keys(controls.tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => safelyOpenGuidedTest()
    };
  });

  Hooks.on("renderActorSheet", (application, html) => {
    if (game.system.id !== "dune") return;

    const launcherLocation = getLauncherLocation();
    const showSheetLauncher = launcherLocation === LAUNCHER_LOCATIONS.actorSheet
      || launcherLocation === LAUNCHER_LOCATIONS.both;
    if (!showSheetLauncher) return;

    const actor = application.actor ?? application.document;
    if (!isSupportedActor(actor)) return;

    addActorSheetLauncher(application, html, actor);
  });
}

export async function safelyOpenGuidedTest(actor = null) {
  try {
    await openGuidedTest(actor);
  } catch (error) {
    console.error("Dune QoL | Guided-test window failed to open.", error);
    ui.notifications.error(
      format("DUNEQOL.GuidedTest.Errors.OpenFailed", {
        message: error instanceof Error ? error.message : String(error)
      })
    );
  }
}

export async function openGuidedTest(actorOverride = null) {
  const actor = actorOverride ?? getRollActor();
  if (!actor) return;

  if (!actor.isOwner) {
    ui.notifications.warn(localize("DUNEQOL.GuidedTest.Errors.NotOwner"));
    return;
  }

  const skills = getStatOptions(actor.system?.Skills);
  const drives = getStatOptions(actor.system?.Drives);
  if (skills.length === 0 || drives.length === 0) {
    ui.notifications.warn(localize("DUNEQOL.GuidedTest.Errors.UnsupportedActor"));
    return;
  }

  const focusSuggestions = getFocusSuggestions(actor.system?.Skills);
  const determination = Number(actor.system?.resources?.determination?.value ?? 0);
  const DialogV2 = foundry.applications.api.DialogV2;
  if (!DialogV2) {
    throw new Error(localize("DUNEQOL.GuidedTest.Errors.DialogUnavailable"));
  }

  const dialog = new DialogV2({
    window: {
      title: format("DUNEQOL.GuidedTest.Title", { actor: actor.name })
    },
    position: {
      width: 560
    },
    content: buildDialogContent({
      actor,
      skills,
      drives,
      focusSuggestions,
      determination
    }),
    buttons: [
      {
        action: "roll",
        label: localize("DUNEQOL.GuidedTest.Roll"),
        icon: "fa-solid fa-dice-d20",
        default: true,
        callback: async (_event, button) => {
          if (!button.form.reportValidity()) return false;
          await performGuidedTest(actor, new FormData(button.form));
          return true;
        }
      },
      {
        action: "cancel",
        label: localize("DUNEQOL.Cancel"),
        icon: "fa-solid fa-xmark"
      }
    ]
  });

  dialog.addEventListener("render", () => configureDialog(dialog));
  await dialog.render({ force: true });
}

async function performGuidedTest(actor, formData) {
  try {
    const skills = getStatOptions(actor.system?.Skills);
    const drives = getStatOptions(actor.system?.Drives);
    const skill = skills.find((entry) => entry.key === formData.get("skill"));
    const drive = drives.find((entry) => entry.key === formData.get("drive"));

    if (!skill || !drive) {
      throw new Error(localize("DUNEQOL.GuidedTest.Errors.InvalidStats"));
    }

    const totalDice = Number(formData.get("totalDice"));
    const difficulty = Number(formData.get("difficulty"));
    const complicationRange = Number(formData.get("complicationRange"));
    const focus = String(formData.get("focus") ?? "").trim();
    const useDetermination = formData.has("determination");
    const context = String(formData.get("context") ?? "").trim();
    const requestedSource = totalDice > TEST_LIMITS.minimumDice
      ? String(formData.get("extraDiceSource") ?? "unrecorded")
      : "none";
    const extraDiceSource = EXTRA_DICE_SOURCES.has(requestedSource)
      ? requestedSource
      : "unrecorded";

    const availableDetermination = Number(actor.system?.resources?.determination?.value ?? 0);
    if (useDetermination && availableDetermination < 1) {
      ui.notifications.error(localize("DUNEQOL.GuidedTest.Errors.NoDetermination"));
      return;
    }

    const rolledDice = totalDice - (useDetermination ? 1 : 0);
    const roll = await new Roll(`${rolledDice}d20`).evaluate();
    const results = roll.dice.flatMap((die) =>
      die.results
        .filter((result) => result.active !== false)
        .map((result) => Number(result.result))
    );

    const target = skill.value + drive.value;
    const outcome = evaluateDuneTest({
      results,
      target,
      focusThreshold: focus ? skill.value : 1,
      complicationRange,
      difficulty,
      determination: useDetermination
    });
    const cost = extraDiceCost(totalDice);
    const poolPlan = buildGuidedTestPoolPlan({
      extraDiceSource,
      extraDiceCost: cost,
      momentumGenerated: outcome.momentum
    });

    if (useDetermination) {
      await actor.update({
        "system.resources.determination.value": availableDetermination - 1
      });
    }

    const content = buildChatCard({
      skill,
      drive,
      focus,
      target,
      totalDice,
      complicationRange,
      extraDiceSource,
      useDetermination,
      outcome,
      poolPlan
    });

    const rollMode = game.settings.get("core", "rollMode");
    await roll.toMessage(
      {
        speaker: ChatMessage.getSpeaker({ actor }),
        content,
        flavor: context ? escapeHtml(context) : undefined,
        flags: {
          [MODULE_ID]: {
            guidedTest: {
              version: 2,
              actorUuid: actor.uuid,
              actorName: actor.name,
              skill: skill.key,
              drive: drive.key,
              focus: focus || null,
              target,
              difficulty,
              totalDice,
              complicationRange,
              useDetermination,
              extraDiceSource,
              successes: outcome.successes,
              complications: outcome.complications,
              momentum: outcome.momentum,
              succeeded: outcome.succeeded,
              poolPlan,
              poolApplication: {
                version: 1,
                status: poolPlan.hasChanges ? "pending" : "not-required"
              }
            }
          }
        }
      },
      { rollMode }
    );
  } catch (error) {
    console.error("Dune QoL | Guided test failed.", error);
    ui.notifications.error(
      format("DUNEQOL.GuidedTest.Errors.RollFailed", {
        message: error instanceof Error ? error.message : String(error)
      })
    );
  }
}

function addActorSheetLauncher(application, html, actor) {
  const root = getHtmlRoot(html);
  const header = root?.querySelector(".window-header");
  if (!header || header.querySelector(`[data-dune-qol-action="${CONTROL_NAME}"]`)) return;

  const button = document.createElement("a");
  button.className = "header-button control dune-qol-sheet-launcher";
  button.dataset.duneQolAction = CONTROL_NAME;
  button.title = localize("DUNEQOL.GuidedTest.Control");
  button.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${escapeHtml(localize("DUNEQOL.GuidedTest.SheetButton"))}`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    safelyOpenGuidedTest(actor);
  });

  const closeButton = header.querySelector(".close");
  header.insertBefore(button, closeButton ?? null);

  console.debug(
    `Dune QoL | Added guided-test launcher to Actor sheet '${application.id ?? actor.name}'.`
  );
}

function hideNativeRollerControls(controls) {
  const nativeTitleKeys = new Set([
    "DUNE.roll.roller",
    "DUNE.apps.rolldice"
  ]);
  const nativeTitles = new Set([
    ...nativeTitleKeys,
    ...[...nativeTitleKeys].map((key) => game.i18n.localize(key))
  ]);

  for (const control of Object.values(controls ?? {})) {
    if (!control?.tools) continue;

    for (const [name, tool] of Object.entries(control.tools)) {
      if (name === CONTROL_NAME) continue;
      const callbackSource = String(tool?.onChange ?? "");
      const title = String(tool?.title ?? "");
      const localizedTitle = game.i18n.localize(title);
      const isNativeDuneRoller = callbackSource.includes("DuneRoll")
        || nativeTitles.has(title)
        || nativeTitles.has(localizedTitle);

      if (isNativeDuneRoller) {
        delete control.tools[name];
      }
    }
  }
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function isSupportedActor(actor) {
  return Boolean(actor?.system?.Skills && actor?.system?.Drives);
}

function configureDialog(dialog) {
  const form = dialog.form;
  if (!form) return;

  const diceInput = form.elements.namedItem("totalDice");
  const sourceSelect = form.elements.namedItem("extraDiceSource");
  const costOutput = form.querySelector("[data-extra-dice-cost]");
  if (!(diceInput instanceof HTMLInputElement)) return;

  const updateExtraDice = () => {
    const totalDice = Number(diceInput.value);
    const validDice = Number.isInteger(totalDice)
      && totalDice >= TEST_LIMITS.minimumDice
      && totalDice <= TEST_LIMITS.maximumDice;

    if (!validDice) {
      if (costOutput) costOutput.textContent = "";
      return;
    }

    const extraDice = totalDice - TEST_LIMITS.minimumDice;
    const cost = extraDiceCost(totalDice);

    if (costOutput) {
      costOutput.textContent = format("DUNEQOL.GuidedTest.ExtraDiceSummary", {
        dice: extraDice,
        cost
      });
    }

    if (sourceSelect instanceof HTMLSelectElement) {
      sourceSelect.disabled = extraDice === 0;
      if (extraDice === 0) sourceSelect.value = "none";
      else if (sourceSelect.value === "none") sourceSelect.value = "unrecorded";
    }
  };

  diceInput.addEventListener("input", updateExtraDice);
  updateExtraDice();
}

function getRollActor() {
  const controlled = globalThis.canvas?.tokens?.controlled ?? [];
  if (controlled.length > 1) {
    ui.notifications.warn(localize("DUNEQOL.GuidedTest.Errors.MultipleTokens"));
    return null;
  }

  const actor = controlled[0]?.actor ?? game.user.character ?? null;
  if (!actor) {
    ui.notifications.warn(localize("DUNEQOL.GuidedTest.Errors.NoActor"));
    return null;
  }
  return actor;
}

function getStatOptions(stats) {
  if (!stats || typeof stats !== "object") return [];

  return Object.entries(stats)
    .map(([key, data]) => ({
      key,
      label: key,
      value: Number(data?.value ?? data)
    }))
    .filter((entry) => Number.isInteger(entry.value));
}

function getFocusSuggestions(skills) {
  const focuses = new Set();
  for (const skill of Object.values(skills ?? {})) {
    for (const focus of normalizeFocuses(skill?.focuses)) {
      if (focus) focuses.add(focus);
    }
  }
  return [...focuses].sort((left, right) => left.localeCompare(right));
}

function normalizeFocuses(value) {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/[\n,;]/)
      .map((focus) => focus.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeFocuses(entry?.name ?? entry));
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => {
      if (typeof entry === "string") return normalizeFocuses(entry);
      if (entry && typeof entry === "object" && entry.name) return normalizeFocuses(entry.name);
      return normalizeFocuses(key);
    });
  }
  return [];
}

function buildDialogContent({ actor, skills, drives, focusSuggestions, determination }) {
  const skillOptions = skills
    .map((skill) => `<option value="${escapeHtml(skill.key)}">${escapeHtml(skill.label)} (${skill.value})</option>`)
    .join("");
  const driveOptions = drives
    .map((drive) => `<option value="${escapeHtml(drive.key)}">${escapeHtml(drive.label)} (${drive.value})</option>`)
    .join("");
  const focusOptions = focusSuggestions
    .map((focus) => `<option value="${escapeHtml(focus)}"></option>`)
    .join("");
  const determinationDisabled = determination < 1 ? "disabled" : "";

  return `
    <div class="dune-qol-guided-test">
      <p class="dune-qol-guided-test__actor">
        <strong>${escapeHtml(actor.name)}</strong>
      </p>

      <div class="dune-qol-form-grid">
        <label>
          <span>${localize("DUNEQOL.GuidedTest.Skill")}</span>
          <select name="skill" required>${skillOptions}</select>
        </label>

        <label>
          <span>${localize("DUNEQOL.GuidedTest.Drive")}</span>
          <select name="drive" required>${driveOptions}</select>
        </label>

        <label class="dune-qol-form-grid__wide">
          <span>${localize("DUNEQOL.GuidedTest.Focus")}</span>
          <input name="focus" type="text" list="dune-qol-focuses" autocomplete="off"
                 placeholder="${escapeHtml(localize("DUNEQOL.GuidedTest.FocusPlaceholder"))}">
          <datalist id="dune-qol-focuses">${focusOptions}</datalist>
        </label>

        <label>
          <span>${localize("DUNEQOL.GuidedTest.Difficulty")}</span>
          <input name="difficulty" type="number"
                 min="${TEST_LIMITS.minimumDifficulty}"
                 max="${TEST_LIMITS.maximumDifficulty}"
                 step="1" value="1" required>
        </label>

        <label>
          <span>${localize("DUNEQOL.GuidedTest.Dice")}</span>
          <input name="totalDice" type="number"
                 min="${TEST_LIMITS.minimumDice}"
                 max="${TEST_LIMITS.maximumDice}"
                 step="1" value="2" required>
        </label>

        <label>
          <span>${localize("DUNEQOL.GuidedTest.ComplicationRange")}</span>
          <input name="complicationRange" type="number"
                 min="${TEST_LIMITS.minimumComplicationRange}"
                 max="${TEST_LIMITS.maximumComplicationRange}"
                 step="1" value="20" required>
        </label>

        <label>
          <span>${localize("DUNEQOL.GuidedTest.ExtraDiceSource")}</span>
          <select name="extraDiceSource" disabled>
            <option value="none">${localize("DUNEQOL.GuidedTest.Sources.None")}</option>
            <option value="unrecorded">${localize("DUNEQOL.GuidedTest.Sources.Unrecorded")}</option>
            <option value="momentum">${localize("DUNEQOL.GuidedTest.Sources.Momentum")}</option>
            <option value="threat">${localize("DUNEQOL.GuidedTest.Sources.Threat")}</option>
            <option value="other">${localize("DUNEQOL.GuidedTest.Sources.Other")}</option>
          </select>
        </label>
      </div>

      <p class="hint" data-extra-dice-cost></p>

      <label class="dune-qol-checkbox">
        <input name="determination" type="checkbox" ${determinationDisabled}>
        <span>${format("DUNEQOL.GuidedTest.Determination", { value: determination })}</span>
      </label>

      <label class="dune-qol-context">
        <span>${localize("DUNEQOL.GuidedTest.Context")}</span>
        <input name="context" type="text" maxlength="240"
               placeholder="${escapeHtml(localize("DUNEQOL.GuidedTest.ContextPlaceholder"))}">
      </label>

      <p class="hint">${localize("DUNEQOL.GuidedTest.PoolApplicationHint")}</p>
    </div>
  `;
}

function buildChatCard({
  skill,
  drive,
  focus,
  target,
  totalDice,
  complicationRange,
  extraDiceSource,
  useDetermination,
  outcome,
  poolPlan
}) {
  const resultClass = outcome.succeeded ? "success" : "failure";
  const resultText = outcome.succeeded
    ? localize("DUNEQOL.GuidedTest.Result.Success")
    : localize("DUNEQOL.GuidedTest.Result.Failure");
  const extraDice = totalDice - TEST_LIMITS.minimumDice;
  const cost = extraDiceCost(totalDice);
  const sourceLabel = localize(`DUNEQOL.GuidedTest.Sources.${sourceKey(extraDiceSource)}`);
  const diceHtml = outcome.dice.map(buildDieHtml).join("");

  return `
    <section class="dune-qol-test-card">
      <header class="dune-qol-test-card__header">
        <strong>${escapeHtml(skill.label)} ${skill.value} + ${escapeHtml(drive.label)} ${drive.value}</strong>
        <span>${localize("DUNEQOL.GuidedTest.Target")}: ${target}</span>
      </header>

      <dl class="dune-qol-test-card__parameters">
        <div><dt>${localize("DUNEQOL.GuidedTest.Difficulty")}</dt><dd>${outcome.difficulty}</dd></div>
        <div><dt>${localize("DUNEQOL.GuidedTest.Focus")}</dt><dd>${focus ? escapeHtml(focus) : "—"}</dd></div>
        <div><dt>${localize("DUNEQOL.GuidedTest.ComplicationRange")}</dt><dd>${complicationRange}–20</dd></div>
        <div><dt>${localize("DUNEQOL.GuidedTest.Dice")}</dt><dd>${totalDice}d20</dd></div>
        ${extraDice > 0 ? `<div><dt>${localize("DUNEQOL.GuidedTest.ExtraDice")}</dt><dd>${extraDice} / ${cost} — ${escapeHtml(sourceLabel)}</dd></div>` : ""}
        ${useDetermination ? `<div><dt>${localize("DUNEQOL.GuidedTest.DeterminationLabel")}</dt><dd>${localize("DUNEQOL.Yes")}</dd></div>` : ""}
      </dl>

      <ol class="dune-qol-test-card__dice">${diceHtml}</ol>

      <div class="dune-qol-test-card__outcome ${resultClass}">
        <strong>${resultText}</strong>
        <span>${format("DUNEQOL.GuidedTest.Result.Successes", { value: outcome.successes })}</span>
        <span>${format("DUNEQOL.GuidedTest.Result.Momentum", { value: outcome.momentum })}</span>
        <span>${format("DUNEQOL.GuidedTest.Result.Complications", { value: outcome.complications })}</span>
      </div>

      ${buildPoolPlanHtml(poolPlan)}
    </section>
  `;
}

function buildPoolPlanHtml(poolPlan) {
  if (!poolPlan?.hasChanges) return "";

  const momentum = signed(poolPlan.deltas.momentum);
  const threat = signed(poolPlan.deltas.threat);
  return `
    <section class="dune-qol-pool-plan">
      <strong>${escapeHtml(localize("DUNEQOL.Pools.ProposedTitle"))}</strong>
      <div class="dune-qol-pool-plan__values">
        ${poolPlan.deltas.momentum !== 0
          ? `<span>Momentum ${momentum}</span>`
          : ""}
        ${poolPlan.deltas.threat !== 0
          ? `<span>${escapeHtml(localize("DUNEQOL.Pools.Threat"))} ${threat}</span>`
          : ""}
      </div>
      <button type="button" data-dune-qol-action="apply-pools">
        <i class="fa-solid fa-coins"></i>
        ${escapeHtml(localize("DUNEQOL.Pools.Apply"))}
      </button>
    </section>
  `;
}

function buildDieHtml(die) {
  const classes = ["dune-qol-test-card__die"];
  if (die.successes === 2) classes.push("critical");
  else if (die.successes === 1) classes.push("success");
  else classes.push("failure");
  if (die.complication) classes.push("complication");
  if (die.determination) classes.push("determination");

  const details = [];
  if (die.successes > 0) {
    details.push(format("DUNEQOL.GuidedTest.DieSuccesses", { value: die.successes }));
  }
  if (die.complication) details.push(localize("DUNEQOL.GuidedTest.DieComplication"));
  if (die.determination) details.push(localize("DUNEQOL.GuidedTest.DieDetermination"));

  return `<li class="${classes.join(" ")}" title="${escapeHtml(details.join(" — "))}">${die.result}</li>`;
}

function sourceKey(value) {
  const mapping = {
    none: "None",
    unrecorded: "Unrecorded",
    momentum: "Momentum",
    threat: "Threat",
    other: "Other"
  };
  return mapping[value] ?? "Unrecorded";
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
