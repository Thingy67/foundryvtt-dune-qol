import { consumeRequestedTestResult } from "../features/guided-test-ui.mjs";

const MODULE_ID = "dune-qol";
const SOCKET_NAME = `module.${MODULE_ID}`;
const COMPLETE_ACTION = "complete-guided-test-request";
const OPEN_ACTION = "open-requested-test";

export function registerTestRequestCompletionHooks() {
  Hooks.once("ready", () => {
    game.socket.on(SOCKET_NAME, handleSocketMessage);
  });

  Hooks.on("createChatMessage", (message) => {
    const request = consumeRequestedTestResult(message);
    if (!request) return;

    void reportCompletedRequest({
      requestMessageId: request.requestMessageId,
      resultMessageId: message.id,
      recipientUserId: game.user.id
    });
  });

  Hooks.on("renderChatMessage", (message, html) => {
    renderRequestCompletion(message, html);
  });
}

async function reportCompletedRequest(payload) {
  if (game.user.isGM) {
    await completeRequest(payload);
    return;
  }

  game.socket.emit(SOCKET_NAME, {
    type: COMPLETE_ACTION,
    ...payload
  });
}

async function handleSocketMessage(payload) {
  if (!payload || payload.type !== COMPLETE_ACTION) return;
  if (!game.user.isGM) return;

  const primaryGM = getPrimaryActiveGM();
  if (primaryGM?.id !== game.user.id) return;

  await completeRequest(payload);
}

async function completeRequest(payload) {
  try {
    const requestMessage = await waitForMessage(payload.requestMessageId);
    const resultMessage = await waitForMessage(payload.resultMessageId);
    if (!requestMessage || !resultMessage) {
      throw new Error("The request or result message is unavailable.");
    }

    const request = requestMessage.getFlag(MODULE_ID, "testRequest");
    const guidedTest = resultMessage.getFlag(MODULE_ID, "guidedTest");
    const requestAuthor = getMessageAuthor(requestMessage);
    const resultAuthor = getMessageAuthor(resultMessage);

    const valid = Boolean(
      request
      && request.status === "pending"
      && requestAuthor?.isGM
      && request.requestedBy === requestAuthor.id
      && request.recipientUserId === payload.recipientUserId
      && resultAuthor?.id === payload.recipientUserId
      && guidedTest
      && guidedTest.actorUuid === request.actorUuid
      && Array.isArray(requestMessage.whisper)
      && requestMessage.whisper.includes(payload.recipientUserId)
    );

    if (!valid) {
      throw new Error("The request and result do not form a valid completed test.");
    }

    const completedAt = new Date().toISOString();
    await requestMessage.setFlag(MODULE_ID, "testRequest", {
      ...request,
      version: Math.max(Number(request.version) || 1, 2),
      status: "completed",
      completedAt,
      completedBy: payload.recipientUserId,
      resultMessageId: resultMessage.id
    });

    await resultMessage.setFlag(MODULE_ID, "testRequestResult", {
      version: 1,
      requestId: request.requestId,
      requestMessageId: requestMessage.id,
      completedAt
    });

    console.info("Dune QoL | Test request marked as completed.", {
      requestMessageId: requestMessage.id,
      resultMessageId: resultMessage.id,
      recipientUserId: payload.recipientUserId
    });
  } catch (error) {
    console.error("Dune QoL | Test-request completion failed.", error, payload);
  }
}

function renderRequestCompletion(message, html) {
  const request = message.getFlag(MODULE_ID, "testRequest");
  if (!request || request.status !== "completed") return;

  const root = getHtmlRoot(html);
  root?.querySelector(`[data-dune-qol-action="${OPEN_ACTION}"]`)?.remove();
}

async function waitForMessage(messageId) {
  if (!messageId) return null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const message = game.messages.get(messageId);
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return null;
}

function getPrimaryActiveGM() {
  return game.users
    .filter((user) => user.active && user.isGM)
    .sort((left, right) => left.id.localeCompare(right.id))[0] ?? null;
}

function getMessageAuthor(message) {
  const userId = typeof message.user === "string"
    ? message.user
    : message.user?.id ?? message.author?.id ?? null;
  return userId ? game.users.get(userId) ?? message.author ?? null : message.author ?? null;
}

function getHtmlRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}
