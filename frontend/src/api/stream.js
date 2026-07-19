import { API_BASE_URL, STORAGE_KEYS } from "../utils/constants";

/**
 * Stream chat completion tokens from the backend SSE endpoint.
 *
 * @param {Object} payload - { session_uuid: string|null, content: string }
 * @param {Function} onToken - Callback(tokenString) called as each chunk arrives
 * @param {Function} onComplete - Callback(finalData) called when stream completes
 * @param {Function} onError - Callback(error) called if stream fails
 * @returns {AbortController} - Controller to cancel stream if needed
 */
export function streamChatMessage(payload, onToken, onComplete, onError) {
  const controller = new AbortController();
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  };

  fetch(`${API_BASE_URL}/chat/message`, fetchOptions)
    .then(async (response) => {
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.detail?.error || "AI service streaming request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // keep incomplete chunk in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.token) {
                onToken(data.token);
              }

              if (data.done) {
                onComplete(data);
                return;
              }
            } catch (e) {
              console.warn("Failed to parse SSE JSON chunk:", jsonStr, e);
            }
          }
        }
      }

      onComplete({ done: true });
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err);
      }
    });

  return controller;
}
