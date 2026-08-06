import {
  describeDunePoolApi,
  readDunePools,
  writeDunePool
} from "../adapters/dune-pools.mjs";
import { calculatePoolTargets } from "../domain/pool-plan.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const APPLY_ACTION = "apply-pools";

export function registerPoolTransactionHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
  });

  Hooks.on("renderChatMessage", (message, html) => {
    configurePoolAction(message, html);
  });
}

export async function requestGuidedTestPoolApplication(messageId) {
  const message = game.messages.get(messageId);
  if (!message) {
    ui.notifications.error(localize("DUNEQOL.Pools.Errors.MessageMissing"));
    return;
  }

  if (game.user.isGM) {
    await applyGuidedTestPoolPlan(message, game.user.id);
    return;
  }

  const gm = primaryActiveGM();
  if (!gm) {
    ui.notifications.error(localize("DUNEQOL.Pools.Errors.NoActiveGM"));
    return;
  }

  const requestId = foundry.utils.randomID();
  game.socket.emit(SOCKET_NAME, {
    type: "apply-guided-test-pools",
    requestId,
    messageId,
    requestedBy: game.user.id
  });

  ui.notifications.info(localize("DUNEQOL.Pools.RequestSent"));
}

async function handleSocketMessage(payload) {
  if (!payload || typeof payload !== "object") return;

  if (payload.type === "apply-guided-test-pools") {
    const gm = primaryActiveGM();
    if (!game.user.isGM || gm?.id !== game.user.id) return;

    let result;
    try {
      const message = game.messages.get(payload.messageId);
      if (!message) throw new Error(localize("DUNEQOL.Pools.Errors.MessageMissing"));

      await applyGuidedTestPoolPlan(message, payload.requestedBy);
      result = {
        type: "pool-application-result",
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: true
      };
    } catch (error) {
      console.error("Dune QoL | Pool transaction request failed.", error);
      result = {
        type: "pool-application-result",
        requestId: payload.requestId,
        requestedBy: payload.requestedBy,
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }

    game.socket.emit(SOCKET_NAME, result);
    return;
  }

  if (payload.type === "pool-application-result" && payload.requestedBy === game.user.id) {
    if (payload.success) {
      ui.notifications.info(localize("DUNEQOL.Pools.Applied"));
    } else {
      ui.notifications.error(
        format("DUNEQOL.Pools.Errors.ApplicationFailed", {
          message: payload.message ?? localize("DUNEQOL.Pools.Errors.Unknown")
        })
      );
    }
  }
}

async function applyGuidedTestPoolPlan(message, requestedBy) {
  const guidedTest = message.getFlag(MODULE_ID, "guidedTest");
  const plan = guidedTest?.poolPlan;
  if (!plan?.hasChanges) {
    throw new Error(localize("DUNEQOL.Pools.Errors.NoChanges"));
  }

  if (guidedTest.poolApplication?.status === "applied") {
    throw new Error(localize("DUNEQOL.Pools.Errors.AlreadyApplied"));
  }

  const requester = game.users.get(requestedBy);
  if (!requester || !(await canApplyMessagePools(requester, message, guidedTest))) {
    throw new Error(localize("DUNEQOL.Pools.Errors.NotAllowed"));
  }

  let current;
  try {
    current = await readDunePools();
  } catch (error) {
    console.error("Dune QoL | Upstream pool API probe failed.", describeDunePoolApi(), error);
    throw new Error(
      format("DUNEQOL.Pools.Errors.AdapterUnavailable", {
        message: error instanceof Error ? error.message : String(error)
      })
    );
  }

  let targets;
  try {
    targets = calculatePoolTargets({ current, plan });
  } catch (error) {
    if (error?.code === "INSUFFICIENT_MOMENTUM") {
      throw new Error(
        format("DUNEQOL.Pools.Errors.InsufficientMomentum", {
          available: error.available,
          required: error.required
        })
      );
    }
    if (error?.code === "INSUFFICIENT_THREAT") {
      throw new Error(
        format("DUNEQOL.Pools.Errors.InsufficientThreat", {
          available: error.available,
          required: error.required
        })
      );
    }
    throw error;
  }

  const writtenPools = [];
  try {
    for (const pool of targets.changedPools) {
      await writeDunePool(pool, targets.after[pool]);
      writtenPools.push(pool);
    }
  } catch (error) {
    await rollbackPools(writtenPools, targets.before);
    console.error("Dune QoL | Pool write failed and rollback was attempted.", error);
    throw error;
  }

  const actual = await readDunePools();
  const application = {
    version: 1,
    status: "applied",
    requestedBy,
    appliedBy: game.user.id,
    appliedAt: new Date().toISOString(),
    before: {
      momentum: targets.before.momentum,
      threat: targets.before.threat
    },
    after: {
      momentum: actual.momentum,
      threat: actual.threat
    },
    discardedMomentum: targets.discardedMomentum
  };

  const updatedGuidedTest = foundry.utils.deepClone(guidedTest);
  updatedGuidedTest.poolApplication = application;
  await message.setFlag(MODULE_ID, "guidedTest", updatedGuidedTest);

  await createTransactionMessage({
    sourceMessage: message,
    guidedTest,
    application,
    requester
  });

  ui.notifications.info(localize("DUNEQOL.Pools.Applied"));
}

async function rollbackPools(writtenPools, before) {
  for (const pool of [...writtenPools].reverse()) {
    try {
      await writeDunePool(pool, before[pool]);
    } catch (rollbackError) {
      console.error(`Dune QoL | Failed to roll back ${pool}.`, rollbackError);
    }
  }
}

async function canApplyMessagePools(user, message, guidedTest) {
  if (user.isGM || message.author?.id === user.id) return true;
  if (!guidedTest.actorUuid) return false;

  try {
    const actor = await fromUuid(guidedTest.actorUuid);
    return Boolean(actor?.testUserPermission(user, "OWNER"));
  } catch {
    return false;
  }
}

async function createTransactionMessage({ sourceMessage, guidedTest, application, requester }) {
  const actor = guidedTest.actorUuid ? await fromUuid(guidedTest.actorUuid).catch(() => null) : null;
  const content = buildTransactionCard({
    sourceMessage,
    actor,
    requester,
    application
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: {
      [MODULE_ID]: {
        poolTransaction: {
          version: 1,
          sourceMessageUuid: sourceMessage.uuid,
          actorUuid: actor?.uuid ?? null,
          requestedBy: requester.id,
          appliedBy: game.user.id,
          before: application.before,
          after: application.after,
          discardedMomentum: application.discardedMomentum
        }
      }
    }
  });
}

function buildTransactionCard({ sourceMessage, actor, requester, application }) {
  const momentumDelta = application.after.momentum - application.before.momentum;
  const threatDelta = application.after.threat - application.before.threat;
  const actorName = actor?.name ?? localize("DUNEQOL.Pools.UnknownActor");
  const requesterName = requester?.name ?? localize("DUNEQOL.Pools.UnknownUser");

  return `
    <section class="dune-qol-pool-card">
      <header><strong>${escapeHtml(localize("DUNEQOL.Pools.HistoryTitle"))}</strong></header>
      <p>${escapeHtml(format("DUNEQOL.Pools.HistoryContext", {
        actor: actorName,
        user: requesterName
      }))}</p>
      <dl>
        ${buildPoolHistoryRow("Momentum", application.before.momentum, application.after.momentum, momentumDelta)}
        ${buildPoolHistoryRow(localize("DUNEQOL.Pools.Threat"), application.before.threat, application.after.threat, threatDelta)}
      </dl>
      ${application.discardedMomentum > 0
        ? `<p class="hint">${escapeHtml(format("DUNEQOL.Pools.DiscardedMomentum", { value: application.discardedMomentum }))}</p>`
        : ""}
      <p class="hint">${escapeHtml(format("DUNEQOL.Pools.SourceRoll", { id: sourceMessage.id }))}</p>
    </section>
  `;
}

function buildPoolHistoryRow(label, before, after, delta) {
  const sign = delta > 0 ? "+" : "";
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${before} → ${after} (${sign}${delta})</dd>
    </div>
  `;
}

function configurePoolAction(message, html) {
  const root = getHtmlRoot(html);
  if (!root) return;

  const button = root.querySelector(`[data-dune-qol-action="${APPLY_ACTION}"]`);
  if (!(button instanceof HTMLButtonElement)) return;

  const guidedTest = message.getFlag(MODULE_ID, "guidedTest");
  if (!guidedTest?.poolPlan?.hasChanges) {
    button.remove();
    return;
  }

  if (guidedTest.poolApplication?.status === "applied") {
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(localize("DUNEQOL.Pools.AlreadyApplied"))}`;
    return;
  }

  const allowed = game.user.isGM
    || message.author?.id === game.user.id
    || Boolean(guidedTest.actorUuid && game.actors.getName?.(guidedTest.actorName)?.isOwner);
  if (!allowed) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await requestGuidedTestPoolApplication(message.id);
    } finally {
      if (message.getFlag(MODULE_ID, "guidedTest")?.poolApplication?.status !== "applied") {
        button.disabled = false;
      }
    }
  });
}

function primaryActiveGM() {
  return game.users
    .filter((user) => user.active && user.isGM)
    .sort((left, right) => left.id.localeCompare(right.id))[0] ?? null;
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
