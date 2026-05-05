(function () {
    const BRIDGE_SOURCE = 'BIT_LEARNING_GAME';
    const STORAGE_KEYS = {
        progress: 'bitlearning:last-progress',
        result: 'bitlearning:last-result',
    };
    const LOG_PREFIX = '[UmaBridge]';

    function logInfo(message, details) {
        if (details !== undefined) {
            console.info(LOG_PREFIX, message, details);
            return;
        }
        console.info(LOG_PREFIX, message);
    }

    function normalizeMessage(type, payload) {
        return {
            source: BRIDGE_SOURCE,
            type,
            attemptType: payload.attemptType || 'STANDARD_HTML',
            rawScore: Number(payload.rawScore || 0),
            maxRawScore: Number(
                type === 'GAME_RESULT' ? payload.maxRawScore || 100 : payload.maxRawScore || 0,
            ),
            duration:
                typeof payload.duration === 'number' && Number.isFinite(payload.duration)
                    ? payload.duration
                    : undefined,
            completed: type === 'GAME_RESULT' ? payload.completed !== false : payload.completed === true,
            metrics:
                payload.metrics && typeof payload.metrics === 'object'
                    ? payload.metrics
                    : undefined,
            emittedAt: Date.now(),
        };
    }

    function persistMessage(type, message) {
        try {
            const storageKey =
                type === 'GAME_RESULT' ? STORAGE_KEYS.result : STORAGE_KEYS.progress;
            sessionStorage.setItem(storageKey, JSON.stringify(message));
        } catch (error) {
            console.warn('[BitLearningGame] Failed to persist bridge message', error);
        }
    }

    function clearPersistedMessage(type) {
        try {
            const storageKey =
                type === 'GAME_RESULT' ? STORAGE_KEYS.result : STORAGE_KEYS.progress;
            sessionStorage.removeItem(storageKey);
        } catch (error) {
            console.warn('[BitLearningGame] Failed to clear persisted bridge message', error);
        }
    }

    function beginSession() {
        clearPersistedMessage('GAME_RESULT');
        clearPersistedMessage('GAME_PROGRESS');
        logInfo('Cleared persisted bridge state for new session');
    }

    function readPersistedMessage(type) {
        try {
            const storageKey =
                type === 'GAME_RESULT' ? STORAGE_KEYS.result : STORAGE_KEYS.progress;
            const raw = sessionStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[BitLearningGame] Failed to read persisted bridge message', error);
            return null;
        }
    }

    function broadcastMessage(message) {
        const sentTargets = new Set();
        const targets = [window.parent, window.top];

        logInfo('Broadcasting message', {
            type: message.type,
            attemptType: message.attemptType,
            rawScore: message.rawScore,
            maxRawScore: message.maxRawScore,
            duration: message.duration,
            hasMetrics: !!message.metrics,
        });

        targets.forEach((targetWindow) => {
            if (!targetWindow || targetWindow === window || sentTargets.has(targetWindow)) return;
            try {
                targetWindow.postMessage(message, '*');
                sentTargets.add(targetWindow);
                logInfo('postMessage sent to host window', {
                    type: message.type,
                    target: targetWindow === window.parent ? 'parent' : 'top',
                });
            } catch (error) {
                console.warn('[BitLearningGame] Failed to postMessage to host window', error);
            }
        });

        try {
            window.dispatchEvent(
                new CustomEvent('bitlearning:game-message', {
                    detail: message,
                }),
            );
        } catch (error) {
            console.warn('[BitLearningGame] Failed to dispatch local bridge event', error);
        }
    }

    function replayLatestState() {
        const latestProgress = readPersistedMessage('GAME_PROGRESS');
        const latestResult = readPersistedMessage('GAME_RESULT');

        if (
            latestResult &&
            (!latestProgress ||
                Number(latestResult.emittedAt || 0) >= Number(latestProgress.emittedAt || 0))
        ) {
            logInfo('Replaying latest result to host');
            broadcastMessage(latestResult);
            return;
        }

        if (latestProgress) {
            logInfo('Replaying latest progress to host');
            broadcastMessage(latestProgress);
        }
    }

    function emitGameProgress(payload) {
        const message = normalizeMessage('GAME_PROGRESS', payload);
        logInfo('emitGameProgress invoked', {
            rawScore: message.rawScore,
            maxRawScore: message.maxRawScore,
            duration: message.duration,
            attemptState: message.metrics?.attemptState,
            exitReason: message.metrics?.exitReason,
        });
        persistMessage('GAME_PROGRESS', message);
        broadcastMessage(message);
    }

    function emitGameResult(payload) {
        const message = normalizeMessage('GAME_RESULT', payload);
        logInfo('emitGameResult invoked', {
            rawScore: message.rawScore,
            maxRawScore: message.maxRawScore,
            duration: message.duration,
            completed: message.completed,
            attemptState: message.metrics?.attemptState,
        });
        clearPersistedMessage('GAME_PROGRESS');
        persistMessage('GAME_RESULT', message);
        broadcastMessage(message);
    }

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || data.type !== 'BITLEARNING_HOST_READY') return;
        logInfo('Received BITLEARNING_HOST_READY from host', {
            origin: event.origin,
        });
        replayLatestState();
    });

    window.BitLearningGame = Object.freeze({
        beginSession,
        emitGameProgress,
        emitGameResult,
        replayLatestState,
    });
})();
