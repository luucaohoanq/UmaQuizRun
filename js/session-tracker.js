const QuizSessionTracker = {
    session: null,
    pendingQuestion: null,
    emitted: false,
    logPrefix: '[UmaTracker]',

    log(message, details) {
        if (details !== undefined) {
            console.info(this.logPrefix, message, details);
            return;
        }
        console.info(this.logPrefix, message);
    },

    startSession(mode) {
        if (
            window.BitLearningGame &&
            typeof window.BitLearningGame.beginSession === 'function'
        ) {
            window.BitLearningGame.beginSession();
        }

        this.session = {
            mode: getSessionModeName(mode),
            configuredQuestionLimit: isFiniteQuestionMode(mode)
                ? getQuestionLimitForMode(mode)
                : null,
            bookCode: activeQuestionSet?.bookCode || null,
            bookTitle: activeQuestionSet?.bookTitle || null,
            grade: activeQuestionSet?.grade || null,
            topicLetter: activeQuestionSet?.topicLetter || null,
            part: activeQuestionSet?.part ?? null,
            topicName: activeQuestionSet?.topicName || null,
            questionSetId: activeQuestionSet?.id || null,
            questionSetTitle: activeQuestionSet?.title || null,
            questionSetVersion: activeQuestionSet?.version || null,
            questionResults: [],
            correctCount: 0,
            wrongCount: 0,
            timeoutCount: 0,
            answeredCount: 0,
            startedQuestionCount: 0,
        };
        this.pendingQuestion = null;
        this.emitted = false;
        this.log('Session started', {
            mode: this.session.mode,
            configuredQuestionLimit: this.session.configuredQuestionLimit,
            bookCode: this.session.bookCode,
            grade: this.session.grade,
            topicLetter: this.session.topicLetter,
            topicName: this.session.topicName,
            questionSetId: this.session.questionSetId,
        });
        this.emitProgress('SESSION_STARTED');
    },

    startQuestion(question, startedAt) {
        if (!this.session || !question) return;

        this.session.startedQuestionCount += 1;
        this.pendingQuestion = {
            order: this.session.questionResults.length + 1,
            question,
            startedAt: typeof startedAt === 'number' ? startedAt : Date.now(),
        };
        this.log('Question started', {
            order: this.pendingQuestion.order,
            questionId: question.id,
            type: question.type,
        });
        this.emitProgress('QUESTION_OPENED');
    },

    recordQuestionResult(payload) {
        if (!this.session || !this.pendingQuestion) return;

        const { question, order, startedAt } = this.pendingQuestion;
        const finishedAt =
            typeof payload.answeredAt === 'number' ? payload.answeredAt : Date.now();
        const durationMs = Math.max(0, finishedAt - startedAt);

        const result = {
            order,
            questionId: String(question.id),
            type: question.type,
            prompt: question.question,
            selectedAnswerText:
                typeof payload.selectedAnswerText === 'string'
                    ? payload.selectedAnswerText
                    : null,
            selectedOptionIndex:
                typeof payload.selectedOptionIndex === 'number'
                    ? payload.selectedOptionIndex
                    : null,
            correctAnswerText: this.getCorrectAnswerText(question),
            correctOptionIndex:
                question.type === 'MC' && typeof question.correct === 'number'
                    ? question.correct
                    : null,
            outcome: payload.outcome,
            durationMs,
        };

        this.session.questionResults.push(result);

        if (payload.outcome === 'correct') {
            this.session.correctCount += 1;
            this.session.answeredCount += 1;
        } else if (payload.outcome === 'timeout') {
            this.session.timeoutCount += 1;
            this.session.wrongCount += 1;
        } else {
            this.session.wrongCount += 1;
            this.session.answeredCount += 1;
        }

        this.pendingQuestion = null;
        this.log('Question result recorded', {
            order,
            questionId: result.questionId,
            outcome: result.outcome,
            correctCount: this.session.correctCount,
            wrongCount: this.session.wrongCount,
            timeoutCount: this.session.timeoutCount,
            totalRecorded: this.session.questionResults.length,
        });
        this.emitProgress('QUESTION_ANSWERED');
    },

    emitSessionResult(durationInSeconds) {
        if (!this.session || this.emitted) return;

        if (
            window.BitLearningGame &&
            typeof window.BitLearningGame.emitGameResult === 'function'
        ) {
            const metrics = this.buildMetrics({
                attemptState: 'COMPLETED',
            });
            this.log('Emitting final result', {
                durationInSeconds,
                correctCount: metrics.correctCount,
                wrongCount: metrics.wrongCount,
                timeoutCount: metrics.timeoutCount,
                totalCount: metrics.totalCount,
                accuracy: metrics.accuracy,
            });

            window.BitLearningGame.emitGameResult({
                attemptType: 'STANDARD_HTML',
                rawScore: this.session.correctCount,
                maxRawScore: Math.max(metrics.totalCount, 1),
                duration: durationInSeconds,
                completed: true,
                metrics,
            });
        }

        this.emitted = true;
    },

    reset() {
        this.session = null;
        this.pendingQuestion = null;
        this.emitted = false;
        this.log('Session reset');
    },

    getCorrectAnswerText(question) {
        if (!question) return null;
        if (question.type === 'MC' && Array.isArray(question.options)) {
            return question.options[question.correct] ?? null;
        }
        if (typeof question.correct === 'string') {
            return question.correct;
        }
        return null;
    },

    emitProgress(exitReason) {
        if (!this.session || this.emitted) return;

        if (
            window.BitLearningGame &&
            typeof window.BitLearningGame.emitGameProgress === 'function'
        ) {
            const metrics = this.buildMetrics({
                attemptState: 'PARTIAL',
                exitReason,
            });
            this.log('Emitting progress', {
                exitReason,
                correctCount: metrics.correctCount,
                wrongCount: metrics.wrongCount,
                timeoutCount: metrics.timeoutCount,
                totalCount: metrics.totalCount,
                answeredCount: metrics.answeredCount,
                duration: this.getDurationInSeconds(),
            });

            window.BitLearningGame.emitGameProgress({
                attemptType: 'STANDARD_HTML',
                rawScore: this.session.correctCount,
                maxRawScore: metrics.totalCount,
                duration: this.getDurationInSeconds(),
                completed: false,
                metrics,
            });
        }
    },

    buildMetrics(extra = {}) {
        const totalCount = this.session.startedQuestionCount;
        const accuracy =
            totalCount > 0
                ? Math.round((this.session.correctCount * 100) / totalCount)
                : 0;

        return {
            mode: this.session.mode,
            configuredQuestionLimit: this.session.configuredQuestionLimit,
            bookCode: this.session.bookCode,
            bookTitle: this.session.bookTitle,
            grade: this.session.grade,
            topicLetter: this.session.topicLetter,
            part: this.session.part,
            topicName: this.session.topicName,
            questionSetId: this.session.questionSetId,
            questionSetTitle: this.session.questionSetTitle,
            questionSetVersion: this.session.questionSetVersion,
            correctCount: this.session.correctCount,
            wrongCount: this.session.wrongCount,
            timeoutCount: this.session.timeoutCount,
            totalCount,
            answeredCount: this.session.answeredCount,
            accuracy,
            questionResults: this.session.questionResults,
            ...extra,
        };
    },

    getDurationInSeconds() {
        if (!gameStartTime) return 0;
        return Math.max(0, Math.floor((Date.now() - gameStartTime) / 1000));
    },
};
