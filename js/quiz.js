// Quiz and Game Over modules

const Quiz = {
    // State for answer feedback effects
    answerEffect: null,
    isAnswerLocked: false,

    // Helper to wrap long text into multiple lines within a max width
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach((word) => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const { width } = ctx.measureText(testLine);
            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    getReadableCorrectAnswer(question) {
        if (!question) return '';

        if (question.type === 'MC' && Array.isArray(question.options)) {
            return question.options[question.correct] || '';
        }

        return question.correct || '';
    },

    completeAnswerEffect() {
        if (!this.answerEffect) return;

        const onComplete = this.answerEffect.onComplete;
        this.answerEffect = null;
        this.isAnswerLocked = false;

        if (typeof onComplete === 'function') {
            onComplete();
        }
    },

    // Trigger visual feedback for answers
    triggerAnswerEffect(type, options = {}) {
        const duration = options.duration ?? (type === 'correct' ? 800 : 2800);
        const effect = {
            type,
            startTime: Date.now(),
            duration,
            title: options.title || '',
            subtitle: options.subtitle || '',
            submittedAnswerText: options.submittedAnswerText || '',
            correctAnswerText: options.correctAnswerText || '',
            onComplete: options.onComplete || null,
        };

        this.isAnswerLocked = type === 'wrong';

        if (type === 'correct') {
            const centerX = config.width / 2;
            const centerY = config.height / 2;
            const colors = ['#ffdd57', '#ff4b4b', '#58cc02', '#1cb0f6'];
            const particles = [];

            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 3;
                particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 400 + Math.random() * 400,
                    color: colors[i % colors.length]
                });
            }

            effect.particles = particles;
        }

        this.answerEffect = effect;
    },
    // Draw quiz UI
    draw() {
        if (!currentQuestion) return;

        if (this.isAnswerLocked && this.answerEffect?.type === 'wrong') {
            const elapsed = Date.now() - this.answerEffect.startTime;
            if (this.answerEffect.duration !== null && elapsed > this.answerEffect.duration) {
                this.completeAnswerEffect();
                return;
            }
            this.drawWrongEffect(elapsed);
            return;
        }

        // Semi-transparent overlay with Duolingo green
        // config.ctx.fillStyle = 'rgba(0, 8, 2, 0.81)';
        // config.ctx.fillRect(0, 0, config.width, config.height);

        // Quiz box - Duolingo style (rounded rectangle)
        const boxWidth = 1000;
        const boxHeight = 520;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        // Draw rounded rectangle background
        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
        config.ctx.fill();

        // Border
        config.ctx.strokeStyle = '#00000093';
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        // Question text with Duolingo styling (supports wrapping for long text)
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 28px Arial';
        config.ctx.textAlign = 'center';

        const questionMaxWidth = boxWidth - 160; // padding inside box
        const questionStartY = boxY + 80;
        const questionLineHeight = 34;

        const questionLines = Quiz.wrapText(config.ctx, currentQuestion.question, questionMaxWidth);
        questionLines.forEach((line, index) => {
            config.ctx.fillText(line, config.width / 2, questionStartY + index * questionLineHeight);
        });

        if (currentQuestion.type === 'MC') {
            // Draw Duolingo-style option buttons in 2x2 grid
            const buttonColors = ['#58cc02', '#ff9600', '#ff4b4b', '#1cb0f6'];
            const buttonWidth = 320;
            const buttonHeight = 100;
            const buttonSpacing = 20;
            const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
            const startY = boxY + 200;

            currentQuestion.options.forEach((option, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const buttonX = startX + col * (buttonWidth + buttonSpacing);
                const buttonY = startY + row * (buttonHeight + buttonSpacing);

                // Button background with rounded corners
                config.ctx.fillStyle = buttonColors[index % buttonColors.length];
                config.ctx.beginPath();
                config.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
                config.ctx.fill();

                // Button border
                config.ctx.strokeStyle = '#fff';
                config.ctx.lineWidth = 2;
                config.ctx.stroke();

                // Button text (wrap long answers inside button)
                config.ctx.fillStyle = '#fff';
                config.ctx.font = 'bold 18px Arial';

                config.ctx.textAlign = 'center';

                const optionMaxWidth = buttonWidth - 40; // padding inside button
                const lineHeight = 22;
                const lines = Quiz.wrapText(config.ctx, option, optionMaxWidth);
                const totalTextHeight = lines.length * lineHeight;
                let textY = buttonY + (buttonHeight - totalTextHeight) / 2 + lineHeight - 4;

                lines.forEach(line => {
                    config.ctx.fillText(line, buttonX + buttonWidth / 2, textY);
                    textY += lineHeight;
                });
            });
        } else if (currentQuestion.type === 'TI') {
            // Input box with Duolingo styling
            const inputBoxWidth = 400;
            const inputBoxHeight = 60;
            const inputBoxX = (config.width - inputBoxWidth) / 2;
            const inputBoxY = boxY + 200;

            // Input box background
            config.ctx.fillStyle = '#f7fafc';
            config.ctx.beginPath();
            config.ctx.roundRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight, 10);
            config.ctx.fill();

            // Input box border (highlight if focused)
            config.ctx.strokeStyle = '#cbd5e0';
            config.ctx.lineWidth = 2;
            config.ctx.stroke();

            // Input text
            config.ctx.fillStyle = '#2d3748';
            config.ctx.font = 'bold 24px Arial';
            config.ctx.textAlign = 'center';
            const displayText = quizInput || '...';
            config.ctx.fillStyle = quizInput ? '#2d3748' : '#9ca3af';
            config.ctx.fillText(displayText, inputBoxX + inputBoxWidth / 2, inputBoxY + inputBoxHeight / 2 + 8);

            // Badge hint: type Vietnamese without accents (không dấu)
            const badgePaddingX = 16;
            const badgePaddingY = 6;
            const badgeText = 'Gõ KHÔNG DẤU, ví dụ: doc lap';

            config.ctx.font = 'bold 14px Arial';
            const badgeTextWidth = config.ctx.measureText(badgeText).width;
            const badgeWidth = badgeTextWidth + badgePaddingX * 2;
            const badgeHeight = 28;
            const badgeX = (config.width - badgeWidth) / 2;
            const badgeY = inputBoxY - badgeHeight - 12;

            // Badge background
            config.ctx.fillStyle = '#e2e8f0';
            config.ctx.beginPath();
            config.ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 14);
            config.ctx.fill();

            // Badge border
            config.ctx.strokeStyle = '#a0aec0';
            config.ctx.lineWidth = 1;
            config.ctx.stroke();

            // Badge text
            config.ctx.fillStyle = '#2d3748';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 4);
        }

        // Timer with Duolingo styling
        const timeLeft = Math.ceil(quizTimer / 1000);
        const timerColor = timeLeft <= 5 ? '#ff4b4b' : '#58cc02';
        config.ctx.fillStyle = timerColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.fillText(`⏱️ ${timeLeft}s`, config.width / 2, boxY + boxHeight - 100);
    },

    // Normalize Vietnamese text for comparison
    // - trim & lowercase
    // - normalize Unicode
    // - remove accents (so "doc lap" matches "độc lập")
    // - collapse multiple spaces
    normalizeVietnameseText(text) {
        if (!text) return '';

        let result = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
            .replace(/đ/g, 'd')             // map đ
            .replace(/[^a-z0-9\s]/g, ' ')   // bỏ ký tự đặc biệt
            .replace(/\s+/g, ' ')           // gộp space
            .trim();

        return result;
    },

    // Handle keyboard input for quiz
    handleKeyboard(e) {
        if (!isQuizActive || !currentQuestion) return;

        if (this.isAnswerLocked && this.answerEffect?.type === 'wrong') {
            if (e.key === 'Enter' || e.key === ' ') {
                this.completeAnswerEffect();
                e.preventDefault();
            }
            return;
        }

        if (currentQuestion.type === 'TI') {
            // Handle text input quiz with Vietnamese UTF-8 support
            if (e.key === 'Enter') {
                this.checkTextAnswer();
            } else if (e.key === 'Backspace') {
                // Handle backspace - properly remove last character including UTF-8 composed chars


                const chars = Array.from(quizInput);
                quizInput = chars.slice(0, -1).join('');
            } else if (e.key.length === 1 || e.key === 'Dead') {
                // Allow single character input including Vietnamese characters
                // Dead keys are used for composing Vietnamese diacritics
                if (e.key !== 'Dead') {
                    quizInput += e.key;
                }
            }
            e.preventDefault();
        }
        // Multiple choice is handled via mouse clicks only
    },

    // Draw active answer effects (called from main UI loop)
    drawEffects() {
        if (!this.answerEffect) return;

        if (this.answerEffect.type !== 'correct') {
            return;
        }

        const now = Date.now();
        const { type, startTime, duration } = this.answerEffect;
        const elapsed = now - startTime;

        if (duration !== null && elapsed > duration) {
            this.completeAnswerEffect();
            return;
        }

        if (type === 'correct') {
            this.drawFireworkEffect(elapsed, duration);
        }
    },

    drawFireworkEffect(elapsed, duration) {
        const effect = this.answerEffect;
        if (!effect || !effect.particles) return;

        const ctx = config.ctx;
        const fade = Math.max(0, 1 - elapsed / duration);

        effect.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= 16;
        });

        effect.particles = effect.particles.filter(p => p.life > 0);

        ctx.save();
        ctx.globalAlpha = fade;
        effect.particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    },

    drawWrongEffect(elapsed) {
        const effect = this.answerEffect;
        if (!effect) return;

        const ctx = config.ctx;
        const progress = Math.min(elapsed / 250, 1);
        const intensity = 10 * Math.max(0, 1 - progress * 1.8);
        const offsetX = (Math.random() - 0.5) * intensity;
        const boxWidth = 960;
        const boxHeight = 360;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        ctx.save();
        ctx.translate(offsetX, 0);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(0, 0, config.width, config.height);

        ctx.fillStyle = '#fff7f7';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 24);
        ctx.fill();

        ctx.shadowColor = 'rgba(255,75,75,0.28)';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 34px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.title || 'CHƯA ĐÚNG!', config.width / 2, boxY + 58);

        ctx.fillStyle = '#475569';
        ctx.font = '18px Arial';
        ctx.fillText(
            effect.subtitle || 'Xem đáp án đúng trước khi tiếp tục.',
            config.width / 2,
            boxY + 90,
        );

        const answerCardWidth = boxWidth - 120;
        const answerCardX = boxX + 60;

        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.roundRect(answerCardX, boxY + 118, answerCardWidth, 98, 18);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Đáp án đúng', answerCardX + 24, boxY + 150);

        ctx.fillStyle = '#7f1d1d';
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        const correctLines = this.wrapText(
            ctx,
            effect.correctAnswerText || 'Không có dữ liệu',
            answerCardWidth - 48,
        );
        correctLines.slice(0, 2).forEach((line, index) => {
            ctx.fillText(line, config.width / 2, boxY + 184 + index * 30);
        });

        if (effect.submittedAnswerText) {
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(answerCardX, boxY + 236, answerCardWidth, 74, 18);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#334155';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Bạn đã chọn / nhập', answerCardX + 24, boxY + 262);

            ctx.fillStyle = '#0f172a';
            ctx.font = '20px Arial';
            const submittedLines = this.wrapText(
                ctx,
                effect.submittedAnswerText,
                answerCardWidth - 48,
            );
            submittedLines.slice(0, 1).forEach((line, index) => {
                ctx.fillText(line, answerCardX + 24, boxY + 290 + index * 24);
            });
        }

        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.fillText(
            'Nhấn Enter hoặc bấm chuột để tiếp tục',
            config.width / 2,
            boxY + boxHeight - 24,
        );

        ctx.restore();
    },

    showWrongAnswerFeedback({
        submittedAnswerText = '',
        isTimeout = false,
        onComplete = null,
    } = {}) {
        this.triggerAnswerEffect('wrong', {
            duration: 2800,
            title: isTimeout ? 'HẾT GIỜ!' : 'CHƯA ĐÚNG!',
            subtitle: isTimeout
                ? 'Đã hết thời gian. Xem lại đáp án đúng.'
                : 'Đây là đáp án đúng của câu này.',
            submittedAnswerText: submittedAnswerText || '',
            correctAnswerText: this.getReadableCorrectAnswer(currentQuestion),
            onComplete,
        });
    },

    // Check text input answer
    checkTextAnswer() {
        const userAnswer = this.normalizeVietnameseText(quizInput);
        const correctAnswer = this.normalizeVietnameseText(currentQuestion.correct);
        const submittedText = quizInput;

        if (userAnswer === correctAnswer) {
            QuizSessionTracker.recordQuestionResult({
                outcome: 'correct',
                selectedAnswerText: submittedText,
                answeredAt: Date.now(),
            });
            this.triggerAnswerEffect('correct');
            // Correct answer
            if (isFiniteQuestionMode(currentGameMode)) {
                Game10Questions.handleCorrectAnswer();
            } else {
                // Endless mode
                hasAnsweredCorrectly = true;
                currentScore += 10;
                // Update high score if needed
                if (currentScore > highScore) {
                    highScore = currentScore;
                    localStorage.setItem('gameHighScore', highScore.toString());
                }
                this.resetQuiz();
            }
        } else {
            QuizSessionTracker.recordQuestionResult({
                outcome: 'wrong',
                selectedAnswerText: submittedText,
                answeredAt: Date.now(),
            });
            this.showWrongAnswerFeedback({
                submittedAnswerText: submittedText,
                onComplete: () => {
                    if (isFiniteQuestionMode(currentGameMode)) {
                        Game10Questions.handleWrongAnswer();
                    } else {
                        GameEndless.handleWrongAnswer();
                    }
                },
            });
        }
    },

    // Check multiple choice answer
    checkMultipleChoiceAnswer(selectedIndex) {
        if (selectedIndex === currentQuestion.correct) {
            QuizSessionTracker.recordQuestionResult({
                outcome: 'correct',
                selectedAnswerText: currentQuestion.options[selectedIndex] || '',
                selectedOptionIndex: selectedIndex,
                answeredAt: Date.now(),
            });
            this.triggerAnswerEffect('correct');
            // Correct answer
            if (isFiniteQuestionMode(currentGameMode)) {
                Game10Questions.handleCorrectAnswer();
            } else {
                // Endless mode
                hasAnsweredCorrectly = true;
                currentScore += 10;
                // Update high score if needed
                if (currentScore > highScore) {
                    highScore = currentScore;
                    localStorage.setItem('gameHighScore', highScore.toString());
                }
                this.resetQuiz();
            }
        } else {
            QuizSessionTracker.recordQuestionResult({
                outcome: 'wrong',
                selectedAnswerText: currentQuestion.options[selectedIndex] || '',
                selectedOptionIndex: selectedIndex,
                answeredAt: Date.now(),
            });
            this.showWrongAnswerFeedback({
                submittedAnswerText: currentQuestion.options[selectedIndex] || '',
                onComplete: () => {
                    if (isFiniteQuestionMode(currentGameMode)) {
                        Game10Questions.handleWrongAnswer();
                    } else {
                        GameEndless.handleWrongAnswer();
                    }
                },
            });
        }
    },

    // Reset quiz state
    resetQuiz() {
        // Calculate dynamic spawn interval based on last question's duration
        if (currentQuestion && currentQuestion.duration_in_seconds) {
            const distanceToTrigger = config.width + 500 - (characterConfig.x + QUIZ_TRIGGER_DISTANCE);
            const travelTimeMs = (distanceToTrigger / background.speed) * 1000;
            const targetTotalTimeMs = currentQuestion.duration_in_seconds * 1000;
            window.nextObstacleSpawnInterval = Math.max(3000, targetTotalTimeMs - travelTimeMs);
        }

        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        lastQuizEnd = Date.now();
    },

    // Handle mouse move for hover cursor over answers/input
    handleMouseMove(e) {
        if (!currentQuestion) {
            config.canvas.style.cursor = 'default';
            return;
        }

        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / config.scale;
        const y = (e.clientY - rect.top) * scaleY / config.scale;

        // Adjust for translate
        const offsetX = (config.canvas.width / config.scale - config.width) / 2;
        const offsetY = (config.canvas.height / config.scale - config.height) / 2;
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        if (this.isAnswerLocked && this.answerEffect?.type === 'wrong') {
            config.canvas.style.cursor = 'pointer';
            return;
        }

        const boxWidth = 1000;
        const boxHeight = 520;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        let isHover = false;

        if (currentQuestion.type === 'MC') {
            const buttonWidth = 320;
            const buttonHeight = 100;
            const buttonSpacing = 20;
            const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
            const startY = boxY + 200;

            currentQuestion.options.forEach((option, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const buttonX = startX + col * (buttonWidth + buttonSpacing);
                const buttonY = startY + row * (buttonHeight + buttonSpacing);

                if (adjustedX >= buttonX && adjustedX <= buttonX + buttonWidth &&
                    adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
                    isHover = true;
                }
            });
        } else if (currentQuestion.type === 'TI') {
            const inputBoxWidth = 400;
            const inputBoxHeight = 60;
            const inputBoxX = (config.width - inputBoxWidth) / 2;
            const inputBoxY = boxY + 200;

            if (adjustedX >= inputBoxX && adjustedX <= inputBoxX + inputBoxWidth &&
                adjustedY >= inputBoxY && adjustedY <= inputBoxY + inputBoxHeight) {
                isHover = true;
            }
        }

        config.canvas.style.cursor = isHover ? 'pointer' : 'default';
    },

    handleClick(e) {
        if (!currentQuestion) {
            return;
        }

        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / config.scale;
        const y = (e.clientY - rect.top) * scaleY / config.scale;

        // Adjust for translate
        const offsetX = (config.canvas.width / config.scale - config.width) / 2;
        const offsetY = (config.canvas.height / config.scale - config.height) / 2;
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        if (this.isAnswerLocked && this.answerEffect?.type === 'wrong') {
            this.completeAnswerEffect();
            return;
        }

        const boxWidth = 1000;
        const boxHeight = 520;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        if (currentQuestion.type === 'MC') {
            // Handle 2x2 grid button clicks
            const buttonWidth = 320;
            const buttonHeight = 100;
            const buttonSpacing = 20;
            const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
            const startY = boxY + 200;

            currentQuestion.options.forEach((option, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const buttonX = startX + col * (buttonWidth + buttonSpacing);
                const buttonY = startY + row * (buttonHeight + buttonSpacing);

                if (adjustedX >= buttonX && adjustedX <= buttonX + buttonWidth &&
                    adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
                    this.checkMultipleChoiceAnswer(index);
                }
            });
        } else if (currentQuestion.type === 'TI') {
            // Handle text input box clicks
            const inputBoxWidth = 400;
            const inputBoxHeight = 60;
            const inputBoxX = (config.width - inputBoxWidth) / 2;
            const inputBoxY = boxY + 200;

            if (adjustedX >= inputBoxX && adjustedX <= inputBoxX + inputBoxWidth &&
                adjustedY >= inputBoxY && adjustedY <= inputBoxY + inputBoxHeight) {
                // Focus on input box (canvas will capture keyboard events)
                config.canvas.focus();
            }
        }
    }
};

const GameOver = {
    // Draw game over screen
    draw() {
        // Duolingo-style gradient background
        const gradient = config.ctx.createLinearGradient(0, 0, config.width, config.height);
        gradient.addColorStop(0, '#6E656521');
        gradient.addColorStop(1, '#64646438');
        config.ctx.fillStyle = gradient;
        config.ctx.fillRect(0, 0, config.width, config.height);

        // Game Over popup box
        const boxWidth = 600;
        const boxHeight = 500;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        // Box background
        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        config.ctx.fill();

        // Box border
        config.ctx.strokeStyle = '#ff4b4b';
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        // Game Over title
        config.ctx.fillStyle = '#ff4b4b';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('GAME OVER', config.width / 2, boxY + 80);

        // Score section
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('Your Score', config.width / 2, boxY + 140);

        config.ctx.fillStyle = '#58cc02';
        config.ctx.font = 'bold 36px Arial';
        config.ctx.fillText(`${currentScore}`, config.width / 2, boxY + 180);

        // High score section
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 20px Arial';
        config.ctx.fillText('High Score', config.width / 2, boxY + 220);

        const isNewHighScore = currentScore === highScore && currentScore > 0;
        config.ctx.fillStyle = isNewHighScore ? '#ff9600' : '#4a5568';
        config.ctx.font = isNewHighScore ? 'bold 28px Arial' : '24px Arial';
        config.ctx.fillText(`${highScore}`, config.width / 2, boxY + 250);

        if (isNewHighScore) {
            config.ctx.fillStyle = '#ff9600';
            config.ctx.font = 'bold 16px Arial';
            config.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', config.width / 2, boxY + 275);
        }

        // Buttons
        const buttonWidth = 220;
        const buttonHeight = 80;
        const startX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 100;

        // Play Again button
        config.ctx.fillStyle = '#58cc02';
        config.ctx.beginPath();
        config.ctx.roundRect(startX, buttonY, buttonWidth, buttonHeight, 15);
        config.ctx.fill();
        config.ctx.strokeStyle = '#fff';
        config.ctx.lineWidth = 2;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 18px Arial';
        config.ctx.fillText('PLAY AGAIN', startX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
    },

    // Handle game over input
    handleInput(e) {
        if (config.gameState !== 'gameOver') return;

        if (e.key === 'Enter' || e.key === ' ') {
            // Play again with same character
            this.restartGame();
        } else if (e.key === 'Escape') {
            // Go back to menu
            config.gameState = 'menu';
            Menu.loop();
        }
    },

    // Handle game over clicks
    handleClick(e) {
        if (config.gameState !== 'gameOver') return;

        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / config.scale;
        const y = (e.clientY - rect.top) * scaleY / config.scale;

        // Adjust for translate
        const offsetX = (config.canvas.width / config.scale - config.width) / 2;
        const offsetY = (config.canvas.height / config.scale - config.height) / 2;
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        const boxWidth = 600;
        const boxHeight = 500;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        const buttonWidth = 220;
        const buttonHeight = 80;
        const startX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 100;

        // Play Again button
        if (adjustedX >= startX && adjustedX <= startX + buttonWidth &&
            adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
            this.restartGame();
        }
    },

    // Restart game function
    restartGame() {
        window.location.reload();
    },

    // Game over loop
    loop() {
        if (config.gameState === 'gameOver') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else if (config.gameState === 'characterSelect') {
            document.removeEventListener('keydown', GameOver.handleInput.bind(GameOver));
            document.removeEventListener('click', GameOver.handleClick.bind(GameOver));
        } else if (config.gameState === 'playing') {
            document.removeEventListener('keydown', GameOver.handleInput.bind(GameOver));
            document.removeEventListener('click', GameOver.handleClick.bind(GameOver));
        }
    }
};
