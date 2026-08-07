import { safelyOpenGuidedTest } from "../features/guided-test.mjs";
import { queueGuidedTestPreset } from "../features/guided-test-ui.mjs";
import { format, localize } from "../localization.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const OPEN_ACTION = "open-requested-test";
const INBOX_FLAG = "testRequestInbox";
const processedRequestIds = new Set();
const processingRequestIds = new Set();

export function registerTestRequestHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
    void processCurrentUserInbox();
  });

  Hooks.on("createChatMessage", (message) => {
    void processIncomingRequestMessage(message, { reportInvalid: false });
  });

  Hooks.on("updateUser", (user) => {
    if (user.id !== game.user.id) return;
    void processCurrentUserInbox();
  });

  Hooks.on("renderChatMessage", (message, html) => {
    void configureRequestCard(message, html);
  });
}

async function handleSocketMessage(payload) {
  if (!payload || typeof payload !== "object") return;

  if (payload.type === "refresh-test-request-inbox") {
    if (payload.recipientUserId !== game.user.id) return;
    await processCurrentUserInbox();
    return;
  }

  if (payload.type === "acknowledge-test-request") {
    if (!game.user.isGM) return;
    const primaryGM = primaryActiveGM();
    if (primaryGM?.id !== game.user.id) return;

    await removeRequestFromUserInbox(
      payload.recipientUserId,
      payload.requestId
    );
  }
}

async function processCurrentUserInbox() {
  if (!game.user || game.user.isGM) return;

  const inbox = game.user.getFlag(MODULE_ID, INBOX_FLAG);
  if (!inbox || typeof inbox !== "object") return;

  const deliveries = Object.values(inbox)
    .filter((delivery) => delivery?.request?.recipientUserId === game.user.id)
    .sort((left, right) => String(left.createdAt ?? "").localeCompare(String(right.createdAt ?? "")));

  for (const delivery of deliveries) {
    await processIncomingDelivery(delivery, { reportInvalid: true });
  }
}

async function processIncomingRequestMessage(message, { reportInvalid }) {
  const request = message?.getFlag?.(MODULE_ID, "testRequest");
  if (!request || request.recipientUserId !== game.user.id) return false;

  return processIncomingDelivery(
    {
      version: 1,
      messageId: message.id,
      createdAt: request.createdAt,
      request
    },
    { message, reportInvalid }
  );
}

async function processIncomingDelivery(delivery, { message = null, reportInvalid }) {
  const request = delivery?.request;
  if (!request || request.recipientUserId !== game.user.id) return false;

  const requestingUser = game.users.get(request.requestedBy);
  const sourceMessage = message ?? game.messages.get(delivery.messageId) ?? null;
  const sourceAuthor = sourceMessage ? getMessageAuthor(sourceMessage) : null;
  const messageValid = !sourceMessage || Boolean(
    sourceAuthor?.isGM
    && sourceAuthor.id === request.requestedBy
    && Array.isArray(sourceMessage.whisper)
    && sourceMessage.whisper.includes(game.user.id)
  );
  const validRequest = Boolean(
    requestingUser?.isGM
    && typeof request.requestId === "string"
    && request.requestId.length > 0
    && messageValid
  );

  if (!validRequest) {
    console.warn("Dune QoL | Rejected an invalid test-request delivery.", {
      delivery,
      requestingUserId: requestingUser?.id ?? null,
      sourceMessageId: sourceMessage?.id ?? null,
      sourceAuthorId: sourceAuthor?.id ?? null
    });
    if (reportInvalid) {
      ui.notifications.error(localize("DUNEQOL.TestRequests.Errors.InvalidRequest"));
    }
    return false;
  }

  if (processedRequestIds.has(request.requestId)) return true;
  if (processingRequestIds.has(request.requestId)) return true;

  processingRequestIds.add(request.requestId);
  try {
    const actor = request.actorUuid ? await fromUuid(request.actorUuid).catch(() => null) : null;
    if (!actor || !actor.isOwner) {
      ui.notifications.error(localize("DUNEQOL.TestRequests.Errors.ActorUnavailable"));
      return false;
    }

    processedRequestIds.add(request.requestId);

    ui.notifications.info(
      format("DUNEQOL.TestRequests.Received", {
        user: request.requestedByName ?? localize("DUNEQOL.TestRequests.UnknownGm"),
        actor: actor.name
      })
    );

    queueGuidedTestPreset({
      actorUuid: actor.uuid,
      requestMessageId: delivery.messageId ?? sourceMessage?.id ?? null,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName,
      preset: request.preset
    });

    console.info("Dune QoL | Test request received from user inbox.", {
      messageId: delivery.messageId ?? sourceMessage?.id ?? null,
      requestId: request.requestId,
      actorUuid: actor.uuid,
      recipientUserId: game.user.id
    });

    await safelyOpenGuidedTest(actor);
    acknowledgeRequest(request.requestId);
    return true;
  } finally {
    processingRequestIds.delete(request.requestId);
  }
}

function acknowledgeRequest(requestId) {
  game.socket.emit(SOCKET_NAME, {
    type: "acknowledge-test-request",
    requestId,
    recipientUserId: game.user.id
  });
}

async function removeRequestFromUserInbox(recipientUserId, requestId) {
  const recipient = game.users.get(recipientUserId);
  if (!recipient || !requestId) return;

  const existing = recipient.getFlag(MODULE_ID, INBOX_FLAG);
  if (!existing || typeof existing !== "object" || !Object.hasOwn(existing, requestId)) return;

  const inbox = foundry.utils.deepClone(existing);
  delete inbox[requestId];

  if (Object.keys(inbox).length === 0) {
    await recipient.unsetFlag(MODULE_ID, INBOX_FLAG);
  } else {
    await recipient.setFlag(MODULE_ID, INBOX_FLAG, inbox);
  }

  console.debug("Dune QoL | Cleared acknowledged test request from user inbox.", {
    recipientUserId,
    requestId
  });
}

async function configureRequestCard(message, html) {
  const request = message.getFlag(MODULE_ID, "testRequest");
  if (!request) return;

  const root = getHtmlRoot(html);
  const button = root?.querySelector(`[data-dune-qol-action="${OPEN_ACTION}"]`);
  if (!(button instanceof HTMLButtonElement)) return;

  if (request.recipientUserId !== game.user.id) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    try {
      const actor = await fromUuid(request.actorUuid).catch(() => null);
      if (!actor || !actor.isOwner) {
        ui.notifications.error(localize("DUNEQOL.TestRequests.Errors.ActorUnavailable"));
        return;
      }

      queueGuidedTestPreset({
        actorUuid: actor.uuid,
        requestMessageId: message.id,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        preset: request.preset
      });
      await safelyOpenGuidedTest(actor);
      acknowledgeRequest(request.requestId);
    } finally {
      button.disabled = false;
    }
  });
}

function getMessageAuthor(message) {
  const userId = typeof message.user === "string"
    ? message.user
    : message.user?.id ?? message.author?.id ?? null;
  return userId ? game.users.get(userId) ?? message.author ?? null : message.author ?? null;
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
