// Finite Questions Mode - fixed/custom number of questions, score based on correct answers
// Wrong answers don't cause game over, just continue to next question

// Result screen module for finite questions mode
const Game10QuestionsResult = {
    // Win animation configuration
    winAnimation: {
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: 20, // Slow animation (20 frames per sprite change)
        lastFrameTime: 0,
        isComplete: false,
        hasPlayedOnce: false,
        hasPlayedWinSound: false
    },
    reviewPage: 0,
    reviewPageSize: 2,

    getLayout() {
        const boxWidth = 980;
        const boxHeight = 620;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        return {
            boxWidth,
            boxHeight,
            boxX,
            boxY,
            menuButtonWidth: 150,
            menuButtonHeight: 60,
            menuButtonX: boxX + (boxWidth - 150) / 2,
            menuButtonY: boxY + boxHeight - 90,
            prevButtonX: boxX + 40,
            nextButtonX: boxX + boxWidth - 120,
            navButtonY: boxY + 530,
            navButtonWidth: 80,
            navButtonHeight: 44
        };
    },

    getReviewItems() {
        return (QuizSessionTracker.session?.questionResults || []).filter(
            (question) => question.outcome !== 'correct',
        );
    },

    getReviewPageCount() {
        return Math.max(1, Math.ceil(this.getReviewItems().length / this.reviewPageSize));
    },

    getCurrentReviewItems() {
        const reviewItems = this.getReviewItems();
        const start = this.reviewPage * this.reviewPageSize;
        return reviewItems.slice(start, start + this.reviewPageSize);
    },

    getOutcomeConfig(outcome) {
        if (outcome === 'timeout') {
            return {
                label: 'Hết giờ',
                bgColor: '#FEF3C7',
                textColor: '#B45309',
                borderColor: '#F59E0B'
            };
        }

        return {
            label: 'Sai',
            bgColor: '#FEE2E2',
            textColor: '#B91C1C',
            borderColor: '#EF4444'
        };
    },

    wrapText(ctx, text, maxWidth) {
        if (!text) return [''];

        const words = text.split(/\s+/);
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const testLine = `${currentLine} ${words[i]}`;
            if (ctx.measureText(testLine).width <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    drawReviewSection(boxX, boxY, boxWidth) {
        const ctx = config.ctx;
        const reviewItems = this.getReviewItems();
        const currentItems = this.getCurrentReviewItems();
        const reviewX = boxX + 30;
        const reviewY = boxY + 330;
        const reviewWidth = boxWidth - 60;
        const reviewHeight = 170;
        const pageCount = this.getReviewPageCount();

        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(reviewX, reviewY, reviewWidth, reviewHeight, 20);
        ctx.fill();

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Review câu sai / hết giờ', reviewX + 24, reviewY + 34);

        ctx.fillStyle = '#64748B';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            `${reviewItems.length} câu cần xem lại`,
            reviewX + reviewWidth - 24,
            reviewY + 34,
        );

        if (reviewItems.length === 0) {
            ctx.fillStyle = '#16A34A';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                'Bạn đã trả lời đúng toàn bộ câu hỏi trong lượt này.',
                reviewX + reviewWidth / 2,
                reviewY + 95,
            );

            ctx.fillStyle = '#64748B';
            ctx.font = '16px Arial';
            ctx.fillText(
                'Không có câu nào cần xem lại.',
                reviewX + reviewWidth / 2,
                reviewY + 125,
            );
            return;
        }

        currentItems.forEach((item, index) => {
            const itemHeight = 54;
            const itemY = reviewY + 52 + index * 58;
            const outcomeConfig = this.getOutcomeConfig(item.outcome);
            const promptMaxWidth = reviewWidth - 310;

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(reviewX + 16, itemY, reviewWidth - 32, itemHeight, 14);
            ctx.fill();

            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = outcomeConfig.bgColor;
            ctx.beginPath();
            ctx.roundRect(reviewX + 28, itemY + 12, 100, 28, 14);
            ctx.fill();

            ctx.fillStyle = outcomeConfig.textColor;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `Câu ${item.order} • ${outcomeConfig.label}`,
                reviewX + 78,
                itemY + 31,
            );

            ctx.textAlign = 'left';
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 15px Arial';
            const promptLine =
                this.wrapText(ctx, item.prompt || '', promptMaxWidth)[0] || '';
            ctx.fillText(promptLine, reviewX + 145, itemY + 22);

            ctx.font = '14px Arial';
            ctx.fillStyle = '#475569';
            const selectedText = item.selectedAnswerText || 'Không trả lời';
            const correctText = item.correctAnswerText || 'Không có';
            ctx.fillText(
                `Bạn chọn: ${selectedText}`,
                reviewX + 145,
                itemY + 42,
            );
            ctx.fillStyle = '#166534';
            ctx.fillText(
                `Đáp án đúng: ${correctText}`,
                reviewX + reviewWidth / 2 + 50,
                itemY + 42,
            );
        });

        if (pageCount > 1) {
            const layout = this.getLayout();
            const isFirstPage = this.reviewPage === 0;
            const isLastPage = this.reviewPage >= pageCount - 1;

            ctx.fillStyle = isFirstPage ? '#CBD5E1' : '#E2E8F0';
            ctx.beginPath();
            ctx.roundRect(
                layout.prevButtonX,
                layout.navButtonY,
                layout.navButtonWidth,
                layout.navButtonHeight,
                12,
            );
            ctx.fill();

            ctx.fillStyle = isLastPage ? '#CBD5E1' : '#E2E8F0';
            ctx.beginPath();
            ctx.roundRect(
                layout.nextButtonX,
                layout.navButtonY,
                layout.navButtonWidth,
                layout.navButtonHeight,
                12,
            );
            ctx.fill();

            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('◀', layout.prevButtonX + layout.navButtonWidth / 2, layout.navButtonY + 28);
            ctx.fillText('▶', layout.nextButtonX + layout.navButtonWidth / 2, layout.navButtonY + 28);

            ctx.fillStyle = '#475569';
            ctx.font = '15px Arial';
            ctx.fillText(
                `Trang ${this.reviewPage + 1}/${pageCount} • Dùng phím ← → để chuyển`,
                boxX + boxWidth / 2,
                layout.navButtonY + 28,
            );
        }
    },

    // Initialize result screen
    init() {
        // Reset win animation
        this.winAnimation.frameIndex = 0;
        this.winAnimation.frameCounter = 0;
        this.winAnimation.lastFrameTime = Date.now();
        this.winAnimation.isComplete = false;
        this.winAnimation.hasPlayedOnce = false;
        this.winAnimation.hasPlayedWinSound = false;
        this.reviewPage = 0;
    },

    // Update win animation
    updateWinAnimation() {
        if (this.winAnimation.isComplete) return;

        const currentTime = Date.now();
        if (currentTime - this.winAnimation.lastFrameTime > this.winAnimation.frameDelay * 16) { // Convert to milliseconds (assuming 60fps base)
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            const winSprite = assets.characters[currentChar.id].win;

            // Play win sound effect only once when animation starts
            if (this.winAnimation.frameIndex === 0 && !this.winAnimation.hasPlayedWinSound) {
                if (currentChar) {
                    const winSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-win.ogg`;
                    AudioManager.playSoundEffect(winSoundPath, 0.5);
                    this.winAnimation.hasPlayedWinSound = true;
                }
            }

            if (winSprite && winSprite.complete) {
                const spriteHeight = winSprite.height;
                const frameWidth = spriteHeight; // Assuming square frames
                const frameCount = Math.floor(winSprite.width / frameWidth);

                if (frameCount > 1) {
                    this.winAnimation.frameIndex++;

                    // Check if animation completed one full cycle
                    if (this.winAnimation.frameIndex >= frameCount) {
                        this.winAnimation.frameIndex = frameCount - 1; // Stay on last frame
                        this.winAnimation.isComplete = true;
                        this.winAnimation.hasPlayedOnce = true;
                    }
                } else {
                    // Single frame sprite
                    this.winAnimation.isComplete = true;
                    this.winAnimation.hasPlayedOnce = true;
                }

                this.winAnimation.lastFrameTime = currentTime;
            }
        }
    },

    // Draw character win animation
    drawWinCharacter() {
        const { boxX, boxY } = this.getLayout();
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        const winSprite = assets.characters[currentChar.id].win;

        if (winSprite && winSprite.complete) {
            const spriteHeight = winSprite.height;
            const frameWidth = spriteHeight; // Assuming square frames
            const frameCount = Math.floor(winSprite.width / frameWidth);

            // Character display position (left side of the result box)
            const charSize = 170;
            const charX = boxX + 50; // Left side of box
            const charY = boxY + 85;

            // Draw current frame of win animation
            if (frameCount > 1) {
                config.ctx.drawImage(
                    winSprite,
                    this.winAnimation.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    charX, charY, charSize, charSize
                );
            } else {
                // Single frame sprite
                config.ctx.drawImage(winSprite, charX, charY, charSize, charSize);
            }
        }
    },
    // Draw result screen
    draw() {
        // Update win animation
        this.updateWinAnimation();

        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        config.ctx.fillRect(0, 0, config.width, config.height);

        // Result popup box
        const { boxWidth, boxHeight, boxX, boxY, menuButtonX, menuButtonY, menuButtonWidth, menuButtonHeight } = this.getLayout();

        // Box background
        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        config.ctx.fill();

        // Box border with color based on performance
        const correctAnswers = Game10Questions.correctAnswers;
        const performanceTier = Game10Questions.getPerformanceTier();
        let borderColor = '#ff4b4b'; // Poor performance
        if (performanceTier === 'excellent') borderColor = '#58cc02'; // Excellent
        else if (performanceTier === 'good') borderColor = '#ff9600'; // Good

        config.ctx.strokeStyle = borderColor;
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        // Draw character win animation on the left
        this.drawWinCharacter();

        // Adjust text positions to account for character on left
        const textAreaX = boxX + 250; // Start text after character
        const textCenterX = textAreaX + (boxWidth - 280) / 2;

        // Result title
        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('HOÀN THÀNH!', textCenterX, boxY + 80);

        // Performance message
        let performanceText = '';
        let performanceEmoji = '';
        if (performanceTier === 'excellent') {
            performanceText = 'XUẤT SẮC!';
            performanceEmoji = '🌟';
        } else if (performanceTier === 'good') {
            performanceText = 'HOÀN THÀNH TỐT!';
            performanceEmoji = '🎉';
        } else {
            performanceText = 'CẦN LUYỆN TẬP THÊM!';
            performanceEmoji = '💪';
        }

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 20px Arial';
        config.ctx.fillText(`${performanceEmoji} ${performanceText} ${performanceEmoji}`, textCenterX, boxY + 120);

        // Score section
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('Điểm của bạn', textCenterX, boxY + 180);

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 42px Arial';
        config.ctx.fillText(`${currentScore}`, textCenterX, boxY + 230);

        // Accuracy percentage
        const accuracy = Math.round(
            (correctAnswers / Math.max(Game10Questions.maxQuestions, 1)) * 100,
        );
        config.ctx.fillStyle = '#4a5568';
        config.ctx.font = 'bold 18px Arial';
        config.ctx.fillText(`Độ chính xác: ${accuracy}%`, textCenterX, boxY + 270);

        // Character name
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        config.ctx.fillStyle = '#666';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText(currentChar ? currentChar.name : 'Unknown', textCenterX, boxY + 300);

        config.ctx.fillStyle = '#475569';
        config.ctx.font = '16px Arial';
        config.ctx.fillText(
            `Đúng ${correctAnswers} • Sai ${Math.max(Game10Questions.maxQuestions - correctAnswers - (QuizSessionTracker.session?.timeoutCount || 0), 0)} • Hết giờ ${QuizSessionTracker.session?.timeoutCount || 0}`,
            textCenterX,
            boxY + 325,
        );

        this.drawReviewSection(boxX, boxY, boxWidth);

        // Back to Menu button
        config.ctx.fillStyle = '#4a5568';
        config.ctx.beginPath();
        config.ctx.roundRect(menuButtonX, menuButtonY, menuButtonWidth, menuButtonHeight, 15);
        config.ctx.fill();
        config.ctx.strokeStyle = '#fff';
        config.ctx.lineWidth = 2;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText('MENU', menuButtonX + menuButtonWidth / 2, menuButtonY + menuButtonHeight / 2 + 5);
    },

    // Handle input
    handleInput(e) {
        if (config.gameState !== '10questionsResult') return;

        if (e.key === 'ArrowLeft') {
            this.reviewPage = Math.max(0, this.reviewPage - 1);
            return;
        }

        if (e.key === 'ArrowRight') {
            this.reviewPage = Math.min(this.getReviewPageCount() - 1, this.reviewPage + 1);
            return;
        }

        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            window.location.reload();
        }
    },

    // Handle clicks
    handleClick(e) {
        if (config.gameState !== '10questionsResult') return;

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

        const {
            boxX,
            boxY,
            boxWidth,
            boxHeight,
            menuButtonX,
            menuButtonY,
            menuButtonWidth,
            menuButtonHeight,
            prevButtonX,
            nextButtonX,
            navButtonY,
            navButtonWidth,
            navButtonHeight
        } = this.getLayout();

        // Menu button click detection
        if (adjustedX >= menuButtonX && adjustedX <= menuButtonX + menuButtonWidth &&
            adjustedY >= menuButtonY && adjustedY <= menuButtonY + menuButtonHeight) {
            window.location.reload();
            return;
        }

        if (
            adjustedX >= prevButtonX &&
            adjustedX <= prevButtonX + navButtonWidth &&
            adjustedY >= navButtonY &&
            adjustedY <= navButtonY + navButtonHeight
        ) {
            this.reviewPage = Math.max(0, this.reviewPage - 1);
            return;
        }

        if (
            adjustedX >= nextButtonX &&
            adjustedX <= nextButtonX + navButtonWidth &&
            adjustedY >= navButtonY &&
            adjustedY <= navButtonY + navButtonHeight
        ) {
            this.reviewPage = Math.min(this.getReviewPageCount() - 1, this.reviewPage + 1);
        }
    },

    // Result loop
    loop() {
        if (config.gameState === '10questionsResult') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        }
    }
};

const Game10Questions = {
    questionsAnswered: 0,
    maxQuestions: 10,
    correctAnswers: 0,
    currentQuestionNumber: 1,
    endGameTime: null,
    isEndingGame: false,
    lastObstacleCleared: false,

    getPerformanceTier() {
        const excellentThreshold = Math.max(1, Math.ceil(this.maxQuestions * 0.8));
        const goodThreshold = Math.max(1, Math.ceil(this.maxQuestions * 0.5));

        if (this.correctAnswers >= excellentThreshold) return 'excellent';
        if (this.correctAnswers >= goodThreshold) return 'good';
        return 'needs-practice';
    },

    // Initialize finite questions mode
    init() {
        console.log('Starting finite questions mode...');
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.maxQuestions = getQuestionLimitForMode(currentGameMode, quizData.length);
        this.currentQuestionNumber = 1;
        this.endGameTime = null;
        this.isEndingGame = false;
        this.lastObstacleCleared = false;
        this.questionIndex = 0;
        this.shuffledQuestions = [...quizData].sort(() => Math.random() - 0.5);
        currentScore = 0;
        
        // Track game start time for duration calculation
        gameStartTime = Date.now();

        // Reset all game state
        obstacles = [];
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        hasAnsweredCorrectly = false;
        hasAnsweredWrong = false;
        targetObstacle = null;

        // Reset character
        characterConfig.y = config.groundY;
        characterConfig.isJumping = false;
        characterConfig.paused = false;
        characterConfig.currentAnimation = 'run';
        characterConfig.frameIndex = 0;
        characterConfig.lastRunningSfxTime = Date.now();

        // Spawn first obstacle
        Game.spawnObstacle();
        lastQuizEnd = Date.now();
        this.setupControls();
        AudioManager.playBackgroundMusic('sounds/bg-10question.ogg', 0.3);
        this.loop();
    },

    // Handle correct answer
    handleCorrectAnswer() {
        this.correctAnswers++;
        hasAnsweredCorrectly = true;
        currentScore = this.correctAnswers * 10;

        console.log(`Correct! Question ${this.currentQuestionNumber}/${this.maxQuestions}, Score: ${this.correctAnswers}`);
        this.nextQuestion();
    },

    // Handle wrong answer - no penalty, just continue
    handleWrongAnswer() {
        console.log(`Wrong answer. Question ${this.currentQuestionNumber}/${this.maxQuestions}, Score: ${this.correctAnswers}`);
        hasAnsweredWrong = true; // Character won't jump but will continue running
        this.nextQuestion();
    },

    // Move to next question
    nextQuestion() {
        this.questionsAnswered++;
        this.currentQuestionNumber = this.currentQuestionNumber + 1;

        // Always reset quiz state first
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';

        // Check if we've completed all 10 questions
        if (this.questionsAnswered >= this.maxQuestions) {
            // Don't end game immediately - wait for character to clear the last obstacle
            console.log('All questions answered! Waiting for character to clear last obstacle...');
            return;
        }

        // Set timing for next obstacle spawn
        lastQuizEnd = Date.now();
    },

    // Start end game sequence after clearing last obstacle
    startEndGameSequence() {
        console.log(`Game completed! Final score: ${this.correctAnswers}/${this.maxQuestions}`);

        // Set ending game state with 3 second delay
        this.isEndingGame = true;
        this.endGameTime = Date.now();

        // Play completion sound based on performance
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        const performanceTier = this.getPerformanceTier();
        if (performanceTier === 'excellent') {
            // Excellent performance
            AudioManager.playSoundEffect('sounds/success.ogg', 0.7);
        } else if (performanceTier === 'good') {
            // Good performance 
            if (currentChar) {
                const jumpSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-jump.ogg`;
                AudioManager.playSoundEffect(jumpSoundPath, 0.7);
            }
        } else {
            // Poor performance
            if (currentChar) {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.7);
            }
        }

        // Clean up quiz state immediately
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        hasAnsweredCorrectly = false;
        hasAnsweredWrong = false;
        targetObstacle = null;
    },

    // Show final result screen after delay
    showResultScreen() {
        config.gameState = '10questionsResult';
        obstacles = [];
        AudioManager.stopBackgroundMusic();

        // Calculate duration in seconds
        const durationInSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        
        QuizSessionTracker.emitSessionResult(durationInSeconds);

        // Initialize result screen with win animation
        Game10QuestionsResult.init();

        // Setup result screen controls
        document.addEventListener('keydown', Game10QuestionsResult.handleInput.bind(Game10QuestionsResult));
        config.canvas.addEventListener('click', Game10QuestionsResult.handleClick.bind(Game10QuestionsResult));
        Game10QuestionsResult.loop();
    },

    // Draw progress UI for finite questions mode
    drawProgressUI() {
        if (config.gameState !== 'playing') return;

        // Question progress bar
        const barWidth = 400;
        const barHeight = 20;
        const barX = (config.width - barWidth) / 2;
        const barY = 60;

        // Background bar
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        config.ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 40);

        config.ctx.fillStyle = '#444';
        config.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress bar
        const progress = this.questionsAnswered / this.maxQuestions;
        config.ctx.fillStyle = '#4CAF50';
        config.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Progress text
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(`Câu hỏi ${this.currentQuestionNumber - 1}/${this.maxQuestions}`, config.width / 2, barY + barHeight + 25);


        // Show countdown when ending game
        if (this.isEndingGame) {
            const timeElapsed = Date.now() - this.endGameTime;
            const timeLeft = Math.ceil((3000 - timeElapsed) / 1000);

            if (timeLeft > 0) {
                // Semi-transparent overlay
                config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                config.ctx.fillRect(0, 0, config.width, config.height);

                // Completion message
                config.ctx.fillStyle = '#fff';
                config.ctx.font = 'bold 48px Arial';
                config.ctx.textAlign = 'center';
                config.ctx.fillText('Hoàn thành màn chơi!', config.width / 2, config.height / 2 - 50);

                // Countdown
                config.ctx.fillStyle = '#58cc02';
                config.ctx.font = 'bold 36px Arial';
                config.ctx.fillText(`Hiển thị kết quả trong ${timeLeft}...`, config.width / 2, config.height / 2 + 20);

                // Score preview
                config.ctx.fillStyle = '#ff9600';
                config.ctx.font = 'bold 32px Arial';
                config.ctx.fillText(`Điểm cuối cùng: ${currentScore}`, config.width / 2, config.height / 2 + 80);
            }
        }
    },

    // Setup controls for finite questions mode
    setupControls() {
        // Click handler for quiz
        config.canvas.addEventListener('click', (e) => {
            if (!isQuizActive) return;
            Quiz.handleClick(e);
        });

        // Hover cursor for quiz answers/input
        config.canvas.addEventListener('mousemove', (e) => {
            if (!isQuizActive || !currentQuestion) {
                config.canvas.style.cursor = 'default';
                return;
            }
            Quiz.handleMouseMove(e);
        });

        document.addEventListener('keydown', (e) => {
            if (config.gameState !== 'playing') return;

            if (isQuizActive) {
                // Let Quiz module handle all quiz inputs
                Quiz.handleKeyboard(e);
            } else {
                // Game controls
                switch (e.key) {
                    case 'Escape':
                        // Return to menu
                        config.gameState = 'menu';
                        Menu.loop();
                        break;
                }
            }
        });
    },

    // Main game loop for finite questions mode
    loop(currentTime = 0) {
        // Calculate delta time
        if (lastFrameTime === 0) {
            lastFrameTime = currentTime;
        }
        deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        // FPS counter
        frameCount++;
        if (currentTime - lastFpsUpdate >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsUpdate = currentTime;
        }

        config.ctx.clearRect(0, 0, config.width, config.height);

        // Update game logic (modified for 10 questions)
        this.updateObstacles10Q();
        if (!isGamePaused) {
            Game.updateCharacter();
        }
        this.updateQuiz10Q();

        // Draw everything
        Game.drawBackground();
        Game.drawObstacles();
        Game.drawCharacter();
        Game.drawUI();
        this.drawProgressUI(); // Draw progress specific to 10Q mode

        if (isQuizActive) {
            Quiz.draw();
        }

        // Check if we should show result screen after delay
        if (this.isEndingGame && Date.now() - this.endGameTime >= 3000) {
            this.showResultScreen();
            return;
        }

        if (config.gameState === '10questionsResult') {
            // Result screen is handled by its own module
            return;
        }

        requestAnimationFrame(this.loop.bind(this));
    },

    // Modified obstacle update for 10Q mode
    updateObstacles10Q() {
        const currentTime = Date.now();

        // Only spawn new obstacles if we haven't completed all questions
        if (!isQuizActive && currentTime - lastQuizEnd > (window.nextObstacleSpawnInterval || OBSTACLE_SPAWN_INTERVAL) && this.questionsAnswered < this.maxQuestions && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < config.width - 500)) {
            Game.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        // Move obstacles
        obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);

            // Trigger quiz if obstacle is near character and not already jumping or quiz active
            if (obstacle.x < characterConfig.x + QUIZ_TRIGGER_DISTANCE && obstacle.x > characterConfig.x + QUIZ_TRIGGER_DISTANCE - 100 && !characterConfig.isJumping && !isQuizActive && !obstacle.hasTriggeredQuiz && this.questionsAnswered < this.maxQuestions) {
                // Start quiz
                currentQuestion = this.shuffledQuestions[this.questionIndex++];
                isQuizActive = true;
                isGamePaused = true;
                quizStartTime = currentTime;
                QuizSessionTracker.startQuestion(currentQuestion, currentTime);
                console.log('Quiz time:', currentQuestion.duration_in_seconds || 10);

                // Per-question time limit: use duration_in_seconds if provided, else default
                const durationSeconds = currentQuestion.duration_in_seconds || 10;
                slowFactor = SLOW_FACTOR_BY_DURATION[durationSeconds] || 0.20;
                quizTimeLimitMs = durationSeconds * 1000;
                quizTimer = quizTimeLimitMs;
                targetObstacle = obstacle; // Mark this as the target to jump
                obstacle.hasTriggeredQuiz = true; // Mark as triggered to prevent re-triggering
            }

            // Jump logic - both correct and wrong answers allow continuation
            if ((hasAnsweredCorrectly || hasAnsweredWrong) && targetObstacle === obstacle && !characterConfig.isJumping) {
                const jumpDistance = 250;
                if (obstacle.x < characterConfig.x + jumpDistance && obstacle.x > characterConfig.x - 50) {
                    if (hasAnsweredCorrectly) {
                        // Jump over fence for correct answer
                        characterConfig.isJumping = true;
                        characterConfig.jumpVelocity = characterConfig.jumpPower;
                        characterConfig.paused = true;
                        characterConfig.currentAnimation = 'run';
                        characterConfig.frameIndex = 3;
                        // Reset running SFX timing when jumping
                        characterConfig.lastRunningSfxTime = Date.now();
                        // Play jump and success sound effects
                        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                        if (currentChar) {
                            const jumpSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-jump.ogg`;
                            AudioManager.playSoundEffect(jumpSoundPath, 0.7);
                        }
                        AudioManager.playSoundEffect('sounds/success.ogg', 0.7);
                    } else {
                        // Wrong answer - character runs through fence without jumping
                        // No collision, just continue running
                        console.log('Wrong answer - character runs through the obstacle.');
                        // Play fail sound effect
                        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                        if (currentChar) {
                            const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                            AudioManager.playSoundEffect(failSoundPath, 0.7);
                        }
                        AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
                    }

                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // Clear obstacle if character successfully passed it
            if (obstacle.x < characterConfig.x - 100 && !obstacle.hasBeenProcessed) {
                obstacle.hasBeenProcessed = true;
                // Check if this is the last question obstacle
                if (this.questionsAnswered >= this.maxQuestions && !this.lastObstacleCleared) {
                    this.lastObstacleCleared = true;
                    // Small delay to ensure character has visually cleared the obstacle
                    setTimeout(() => {
                        this.startEndGameSequence();
                    }, 500); // 0.5s delay after clearing
                }
                // Reset quiz-related flags if this was the target obstacle
                if (targetObstacle === obstacle) {
                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // No collision detection for wrong answers in 10Q mode - character passes through
        });

        // Remove off-screen obstacles
        obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
    },

    // Modified quiz timer for 10Q mode
    updateQuiz10Q() {
        if (isQuizActive && !Quiz.isAnswerLocked) {
            const currentTime = Date.now();
            quizTimer = quizTimeLimitMs - (currentTime - quizStartTime);
            if (quizTimer <= 0) {
                console.log('Quiz timeout! Counting as wrong answer.');
                QuizSessionTracker.recordQuestionResult({
                    outcome: 'timeout',
                    selectedAnswerText: quizInput,
                    answeredAt: currentTime,
                });
                Quiz.showWrongAnswerFeedback({
                    submittedAnswerText: quizInput,
                    isTimeout: true,
                    onComplete: () => {
                        this.handleWrongAnswer();
                    },
                });
            }
        }
    }
};
