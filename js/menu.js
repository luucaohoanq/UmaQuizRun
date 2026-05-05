// Menu and Character Selection module

// Menu Screen
const Menu = {
    selectedIndex: 0,
    options: [
        { text: 'Chế độ 10 câu hỏi', mode: GAME_MODES.RANDOM_10 },
        { text: 'Chế độ tùy chỉnh số câu', mode: GAME_MODES.CUSTOM },
        { text: 'Chế độ vô tận', mode: GAME_MODES.ENDLESS },
        { text: 'Hướng dẫn', mode: 'help' }
    ],
    backgroundImage: null,
    runningCharacters: [],
    lastSpawnTime: 0,
    spawnInterval: 6000, // 6 seconds
    frameDelay: 150,
    handleInputBound: null,

    update() {
        const currentTime = Date.now();

        // Spawn new characters
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnCharacters();
            this.lastSpawnTime = currentTime;
        }

        // Update running characters
        this.runningCharacters.forEach((runner, index) => {
            runner.x += runner.speed;

            // Update animation frame
            if (currentTime - runner.lastFrameTime > this.frameDelay) {
                const sprite = assets.characters[runner.char.id].mainSprite || assets.characters[runner.char.id].idle;
                if (sprite && sprite.complete) {
                    const spriteHeight = sprite.height;
                    const frameWidth = spriteHeight;
                    const frameCount = Math.floor(sprite.width / frameWidth);
                    if (frameCount > 1) {
                        runner.frameIndex = (runner.frameIndex + 1) % frameCount;
                    }
                }
                runner.lastFrameTime = currentTime;
            }

            // Remove if off screen
            if (runner.x > config.width + 200) {
                this.runningCharacters.splice(index, 1);
            }
        });
    },

    spawnCharacters() {
        if (this.runningCharacters.length >= 10) return;
        const numToSpawn = 2 + Math.floor(Math.random() * 3); // 2 to 4
        const availableChars = [...CHARACTERS];

        for (let i = 0; i < numToSpawn && availableChars.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            const char = availableChars.splice(randomIndex, 1)[0];

            this.runningCharacters.push({
                char: char,
                x: -200,
                yOffset: -200 + Math.random() * 100, // Random vertical offset from 50 to 150
                speed: 5 + Math.random() * 5, // 5-10
                frameIndex: 0,
                lastFrameTime: Date.now()
            });
        }
    },

    draw() {
        // Background image
        if (this.backgroundImage && this.backgroundImage.complete) {
            config.ctx.drawImage(this.backgroundImage, 0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Draw running characters
        this.runningCharacters.forEach(runner => {
            const sprite = assets.characters[runner.char.id].mainSprite || assets.characters[runner.char.id].idle;
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                const spriteHeight = sprite.height;
                const frameWidth = spriteHeight;
                const charSize = 250;
                const charY = config.height - charSize + runner.yOffset;

                config.ctx.drawImage(
                    sprite,
                    runner.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    runner.x - charSize / 2, charY, charSize, charSize
                );
            }
        });

        // Title
        const ctx = config.ctx;
const x = config.width / 2;
const y = 200;

ctx.font = 'bold 72px Arial';
ctx.textAlign = 'center';

// back layers (depth)
for (let i = 8; i > 0; i--) {
    ctx.fillStyle = `rgb(${40 + i*2}, ${40 + i*2}, ${40 + i*2})`;
    ctx.fillText('Uma Quiz Run', x + i, y + i);
}

// front
ctx.fillStyle = '#fff';
ctx.fillText('Uma Quiz Run', x, y);

        // Menu options
        this.options.forEach((option, index) => {
            const isSelected = index === this.selectedIndex;
            const y = 400 + index * 120;

            // Button background
            const buttonWidth = 500;
            const buttonHeight = 80;
            const buttonX = (config.width - buttonWidth) / 2;
            const buttonY = y - 40;

            config.ctx.fillStyle = isSelected ? '#4CAF50' : '#2d2d44';
            config.ctx.beginPath();
            config.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
            config.ctx.fill();

            // Button border
            config.ctx.strokeStyle = isSelected ? '#66BB6A' : '#444';
            config.ctx.lineWidth = isSelected ? 4 : 2;
            config.ctx.stroke();

            // Button text
            config.ctx.fillStyle = '#fff';
            config.ctx.font = isSelected ? 'bold 24px Arial' : '22px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(option.text, config.width / 2, y);

            // Selection indicator
            if (isSelected) {
                config.ctx.fillStyle = '#FFD700';
                config.ctx.font = '18px Arial';
                config.ctx.fillText('▶ NHẤN ENTER ĐỂ CHỌN ◀', config.width / 2, y + 35);
            }
        });

        // Instructions
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '20px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('Sử dụng phím mũi tên để điều hướng', config.width / 2, config.height - 50);
    },

    handleInput(e) {
        if (config.gameState !== 'menu') return;

        switch (e.key) {
            case 'ArrowUp':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                break;
            case 'ArrowDown':
                this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
                break;
            case 'Enter':
                AudioManager.stopBackgroundMusic();
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption.mode === 'help') {
                    config.gameState = 'help';
                    HelpUI.start();
                } else if (selectedOption.mode === GAME_MODES.CUSTOM) {
                    currentGameMode = selectedOption.mode;
                    config.gameState = 'customQuestionCount';
                    CustomQuestionCountInput.start();
                } else {
                    currentGameMode = selectedOption.mode;
                    config.gameState = 'questionSetSelect';
                    QuestionSetSelection.start();
                }
                break;
        }
    },

    start() {
        this.selectedIndex = 0; // Reset selection to first option
        this.backgroundImage = assets.backgrounds.bgMenu;
        this.lastSpawnTime = Date.now();

        // Play background music
        AudioManager.playBackgroundMusic('sounds/bg-menu.ogg', 0.2);

        // Remove existing listener to avoid duplicates
        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
        }
        this.handleInputBound = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInputBound);
        this.loop();
    },

    loop() {
        if (config.gameState === 'menu') {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else {
            if (this.handleInputBound) {
                document.removeEventListener('keydown', this.handleInputBound);
                this.handleInputBound = null;
            }
        }
    }
};

// Help UI Screen
const HelpUI = {
    backgroundImage: null,
    helpImage1: null,
    helpImage2: null,
    handleInputBound: null,

    draw() {
        // Background image
        if (this.backgroundImage && this.backgroundImage.complete) {
            config.ctx.drawImage(this.backgroundImage, 0, 0, config.width, config.height);
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            config.ctx.fillRect(0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Title
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 52px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('HƯỚNG DẪN', config.width / 2, 120);

        // Gameplay explanation
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 28px Arial';
        config.ctx.textAlign = 'left';
        const leftMargin = 120;
        let yPos = 220;

        config.ctx.fillText('Gameplay chung:', leftMargin, yPos);
        yPos += 50;
        config.ctx.font = '22px Arial';
        config.ctx.fillText('Giúp nhân vật yêu thích vượt qua các chướng ngại vật bằng cách trả lời đúng câu hỏi trắc nghiệm.', leftMargin, yPos);
        yPos += 60;

        config.ctx.font = 'bold 28px Arial';
        config.ctx.fillText('Chế độ 10 câu hỏi:', leftMargin, yPos);
        yPos += 50;
        config.ctx.font = '22px Arial';
        config.ctx.fillText('Trả lời đúng 10 câu hỏi để hoàn thành màn chơi.', leftMargin, yPos);
        yPos += 60;

        config.ctx.font = 'bold 28px Arial';
        config.ctx.fillText('Chế độ tùy chỉnh số câu:', leftMargin, yPos);
        yPos += 50;
        config.ctx.font = '22px Arial';
        config.ctx.fillText('Nhập nhanh số câu bạn muốn chạy để demo, hệ thống sẽ lấy đúng số câu đó.', leftMargin, yPos);
        yPos += 60;

        config.ctx.font = 'bold 28px Arial';
        config.ctx.fillText('Chế độ vô tận:', leftMargin, yPos);
        yPos += 50;
        config.ctx.font = '22px Arial';
        config.ctx.fillText('Trả lời liên tục các câu hỏi mà không giới hạn số lượng.', leftMargin, yPos);
        yPos += 70;

        // Placeholder for image 1
        const placeholderWidth = 500;
        const placeholderHeight = 320;
        const placeholder1X = leftMargin;
        const placeholder1Y = yPos;

        config.ctx.fillStyle = '#666';
        config.ctx.fillRect(placeholder1X, placeholder1Y, placeholderWidth, placeholderHeight);
        config.ctx.strokeStyle = '#fff';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(placeholder1X, placeholder1Y, placeholderWidth, placeholderHeight);

        // Draw image 1 if loaded, otherwise show placeholder text
        if (this.helpImage1 && this.helpImage1.complete) {
            config.ctx.drawImage(
                this.helpImage1,
                placeholder1X,
                placeholder1Y,
                placeholderWidth,
                placeholderHeight
            );
        } else {
            config.ctx.fillStyle = '#fff';
            config.ctx.font = '20px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText('Loading...', placeholder1X + placeholderWidth / 2, placeholder1Y + placeholderHeight / 2);
        }


        // Placeholder for image 2
        const placeholder2X = config.width - leftMargin - placeholderWidth;
        const placeholder2Y = yPos;

        config.ctx.fillStyle = '#666';
        config.ctx.fillRect(placeholder2X, placeholder2Y, placeholderWidth, placeholderHeight);
        config.ctx.strokeStyle = '#fff';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(placeholder2X, placeholder2Y, placeholderWidth, placeholderHeight);

        // Draw image 2 if loaded, otherwise show loading text
        if (this.helpImage2 && this.helpImage2.complete) {
            config.ctx.drawImage(
                this.helpImage2,
                placeholder2X,
                placeholder2Y,
                placeholderWidth,
                placeholderHeight
            );
        } else {
            config.ctx.fillStyle = '#fff';
            config.ctx.font = '20px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText('Loading...', placeholder2X + placeholderWidth / 2, placeholder2Y + placeholderHeight / 2);
        }

        // Instructions to go back
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '22px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('Nhấn ESC để quay lại menu', config.width / 2, config.height - 60);
    },

    handleInput(e) {
        if (config.gameState !== 'help') return;

        if (e.key === 'Escape') {
            config.gameState = 'menu';
            Menu.start();
        }
    },

    start() {
        this.backgroundImage = assets.backgrounds.bgMenu;
        
        // Load help images once
        if (!this.helpImage1) {
            this.helpImage1 = new Image();
            this.helpImage1.src = 'assets/background/ex-1.png';
        }
        
        if (!this.helpImage2) {
            this.helpImage2 = new Image();
            this.helpImage2.src = 'assets/background/ex-2.png';
        }
        
        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
        }

        this.handleInputBound = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInputBound);
        this.loop();
    },

    loop() {
        if (config.gameState === 'help') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else {
            if (this.handleInputBound) {
                document.removeEventListener('keydown', this.handleInputBound);
                this.handleInputBound = null;
            }
        }
    }
};

const CustomQuestionCountInput = {
    inputValue: '',
    errorMessage: null,
    handleInputBound: null,
    shouldReplaceOnNextDigit: false,

    draw() {
        if (assets.backgrounds.bgMenu && assets.backgrounds.bgMenu.complete) {
            config.ctx.drawImage(assets.backgrounds.bgMenu, 0, 0, config.width, config.height);
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            config.ctx.fillRect(0, 0, config.width, config.height);
        } else {
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        const boxWidth = 760;
        const boxHeight = 420;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        config.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 24);
        config.ctx.fill();

        config.ctx.strokeStyle = '#facc15';
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 46px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('NHẬP SỐ CÂU HỎI', config.width / 2, boxY + 80);

        config.ctx.fillStyle = '#cbd5e1';
        config.ctx.font = '24px Arial';
        config.ctx.fillText(
            'Dùng bàn phím số để nhập nhanh số câu muốn chạy demo.',
            config.width / 2,
            boxY + 140,
        );

        const inputBoxWidth = 280;
        const inputBoxHeight = 86;
        const inputBoxX = config.width / 2 - inputBoxWidth / 2;
        const inputBoxY = boxY + 180;

        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight, 18);
        config.ctx.fill();

        config.ctx.strokeStyle = '#58cc02';
        config.ctx.lineWidth = 3;
        config.ctx.stroke();

        config.ctx.fillStyle = '#0f172a';
        config.ctx.font = 'bold 40px Arial';
        config.ctx.fillText(this.inputValue || '0', config.width / 2, inputBoxY + 55);

        config.ctx.fillStyle = '#94a3b8';
        config.ctx.font = '20px Arial';
        config.ctx.fillText(
            `Mặc định: ${DEFAULT_CUSTOM_QUESTION_COUNT} câu • Tối đa nhập: ${MAX_CUSTOM_QUESTION_COUNT}`,
            config.width / 2,
            boxY + 310,
        );
        config.ctx.fillText(
            'Khi vào game, số câu thực tế sẽ không vượt quá số câu của bộ đề.',
            config.width / 2,
            boxY + 345,
        );

        if (this.errorMessage) {
            config.ctx.fillStyle = '#fecaca';
            config.ctx.font = 'bold 20px Arial';
            config.ctx.fillText(this.errorMessage, config.width / 2, boxY + 380);
        } else {
            config.ctx.fillStyle = '#fef08a';
            config.ctx.font = '20px Arial';
            config.ctx.fillText(
                'Enter để xác nhận • Backspace để xóa • Esc để quay lại',
                config.width / 2,
                boxY + 380,
            );
        }
    },

    confirm() {
        const parsedValue = Number.parseInt(this.inputValue, 10);
        if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
            this.errorMessage = 'Vui lòng nhập số nguyên lớn hơn 0.';
            return;
        }

        customQuestionCount = Math.min(parsedValue, MAX_CUSTOM_QUESTION_COUNT);
        this.errorMessage = null;
        currentGameMode = GAME_MODES.CUSTOM;
        config.gameState = 'questionSetSelect';
        QuestionSetSelection.start();
    },

    handleInput(e) {
        if (config.gameState !== 'customQuestionCount') return;

        if (/^[0-9]$/.test(e.key)) {
            if (
                this.shouldReplaceOnNextDigit ||
                this.inputValue.length < String(MAX_CUSTOM_QUESTION_COUNT).length
            ) {
                this.inputValue = this.shouldReplaceOnNextDigit
                    ? e.key
                    : `${this.inputValue}${e.key}`;
                this.shouldReplaceOnNextDigit = false;
                this.errorMessage = null;
            }
            return;
        }

        switch (e.key) {
            case 'Backspace':
                this.inputValue = this.inputValue.slice(0, -1);
                this.shouldReplaceOnNextDigit = false;
                this.errorMessage = null;
                break;
            case 'Enter':
                this.confirm();
                break;
            case 'Escape':
                config.gameState = 'menu';
                Menu.start();
                break;
        }
    },

    start() {
        this.inputValue = String(customQuestionCount || DEFAULT_CUSTOM_QUESTION_COUNT);
        this.errorMessage = null;
        this.shouldReplaceOnNextDigit = true;

        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
        }

        this.handleInputBound = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInputBound);
        this.loop();
    },

    loop() {
        if (config.gameState === 'customQuestionCount') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
            this.handleInputBound = null;
        }
    }
};

const QuestionSetSelection = {
    selectedBookIndex: 0,
    selectedGradeIndex: 0,
    selectedTopicIndex: 0,
    selectedPartIndex: 0,
    currentStep: 'book',
    listScrollOffset: 0,
    isLoading: false,
    errorMessage: null,
    handleInputBound: null,
    handleClickBound: null,
    handleWheelBound: null,

    wrapText(text, maxWidth, font = '18px Arial') {
        if (!text) return [];

        const ctx = config.ctx;
        const previousFont = ctx.font;
        ctx.font = font;

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach((word) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        ctx.font = previousFont;
        return lines;
    },

    getListLayout() {
        const listTop = 248;
        const listBottom = config.height - 150;
        const boxWidth = 900;
        const boxHeight = 92;
        const gap = 18;
        const boxX = (config.width - boxWidth) / 2;
        const viewportHeight = Math.max(listBottom - listTop, boxHeight);
        return {
            listTop,
            listBottom,
            boxWidth,
            boxHeight,
            gap,
            boxX,
            viewportHeight,
        };
    },

    getListMetrics(stepItems = this.getStepItems()) {
        const layout = this.getListLayout();
        const totalHeight = Math.max(
            stepItems.length * (layout.boxHeight + layout.gap) - layout.gap,
            0,
        );
        const maxScroll = Math.max(0, totalHeight - layout.viewportHeight);

        return {
            ...layout,
            totalHeight,
            maxScroll,
        };
    },

    clampScrollOffset(stepItems = this.getStepItems()) {
        const { maxScroll } = this.getListMetrics(stepItems);
        this.listScrollOffset = Math.min(Math.max(this.listScrollOffset, 0), maxScroll);
    },

    ensureSelectionVisible(stepItems = this.getStepItems()) {
        const { boxHeight, gap, viewportHeight } = this.getListMetrics(stepItems);
        const selectedIndex = this.getSelectedIndex();
        const itemTop = selectedIndex * (boxHeight + gap);
        const itemBottom = itemTop + boxHeight;

        if (itemTop < this.listScrollOffset) {
            this.listScrollOffset = itemTop;
        } else if (itemBottom > this.listScrollOffset + viewportHeight) {
            this.listScrollOffset = itemBottom - viewportHeight;
        }

        this.clampScrollOffset(stepItems);
    },

    getAvailableBooks() {
        return getAvailableBooks();
    },

    getSelectedBookEntry() {
        return this.getAvailableBooks()[this.selectedBookIndex] || null;
    },

    getAvailableGrades() {
        return getAvailableGrades();
    },

    getSelectedGradeEntry() {
        return this.getAvailableGrades()[this.selectedGradeIndex] || null;
    },

    getTopicGroups() {
        const selectedGrade = this.getSelectedGradeEntry();
        if (!selectedGrade) return [];
        return getTopicGroupsForGrade(selectedGrade.grade);
    },

    getSelectedTopicGroup() {
        return this.getTopicGroups()[this.selectedTopicIndex] || null;
    },

    getSelectedPartEntry() {
        return this.getSelectedTopicGroup()?.items?.[this.selectedPartIndex] || null;
    },

    getStepItems() {
        if (this.currentStep === 'book') {
            return this.getAvailableBooks().map((bookEntry) => ({
                id: bookEntry.bookCode,
                title: bookEntry.bookTitle || bookEntry.bookCode,
                subtitle: bookEntry.bookCode,
                description:
                    bookEntry.bookCode === quizCatalogIndex?.defaultBookCode
                        ? 'Mặc định'
                        : '',
            }));
        }

        if (this.currentStep === 'grade') {
            return this.getAvailableGrades().map((gradeEntry) => ({
                id: String(gradeEntry.grade),
                title: `Lớp ${gradeEntry.grade}`,
                subtitle: `${gradeEntry.topics.filter((topic) => topic.enabled && topic.questionFile).length} bộ câu hỏi khả dụng`,
                description: '',
            }));
        }

        if (this.currentStep === 'topic') {
            return this.getTopicGroups().map((topicGroup) => ({
                id: topicGroup.topicLetter,
                title: `Chủ đề ${topicGroup.topicLetter}`,
                subtitle: topicGroup.topicName,
                description: '',
            }));
        }

        return (this.getSelectedTopicGroup()?.items || []).map((topicEntry) => ({
            id: `${topicEntry.topicLetter}-${topicEntry.part || 1}`,
            title: `Phần ${topicEntry.part || 1}`,
            subtitle: topicEntry.topicName,
            description: topicEntry.code || '',
        }));
    },

    getSelectedIndex() {
        if (this.currentStep === 'book') return this.selectedBookIndex;
        if (this.currentStep === 'grade') return this.selectedGradeIndex;
        if (this.currentStep === 'topic') return this.selectedTopicIndex;
        return this.selectedPartIndex;
    },

    setSelectedIndex(index) {
        if (this.currentStep === 'book') this.selectedBookIndex = index;
        else if (this.currentStep === 'grade') this.selectedGradeIndex = index;
        else if (this.currentStep === 'topic') this.selectedTopicIndex = index;
        else this.selectedPartIndex = index;
        this.ensureSelectionVisible();
    },

    draw() {
        if (assets.backgrounds.bgMenu && assets.backgrounds.bgMenu.complete) {
            config.ctx.drawImage(assets.backgrounds.bgMenu, 0, 0, config.width, config.height);
            config.ctx.fillStyle = 'rgba(4, 12, 24, 0.20)';
            config.ctx.fillRect(0, 0, config.width, config.height);
        } else {
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 52px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('CHỌN BÀI HỌC', config.width / 2, 120);

        const modeLabel = getGameModeLabel(currentGameMode);
        const selectedBookEntry = this.getSelectedBookEntry();
        const currentBookLabel =
            selectedBookEntry?.bookTitle ||
            activeBookCatalog?.bookTitle ||
            quizCatalogIndex?.defaultBookCode ||
            'KNTTVCS';
        config.ctx.fillStyle = '#d1d5db';
        config.ctx.font = '22px Arial';
        config.ctx.fillText(
            `${currentBookLabel} • ${modeLabel}`,
            config.width / 2,
            168,
        );

        const stepItems = this.getStepItems();
        const stepTitle =
            this.currentStep === 'book'
                ? 'Bước 1: Chọn bộ sách'
                : this.currentStep === 'grade'
                    ? 'Bước 2: Chọn lớp'
                    : this.currentStep === 'topic'
                        ? 'Bước 3: Chọn chủ đề'
                        : 'Bước 4: Chọn phần';

        config.ctx.fillStyle = '#fef08a';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText(stepTitle, config.width / 2, 210);

        if ((this.currentStep !== 'book' && !activeBookCatalog) || stepItems.length === 0) {
            config.ctx.fillStyle = '#fca5a5';
            config.ctx.font = 'bold 24px Arial';
            config.ctx.fillText(
                quizDataLoadError || 'Chưa có bộ câu hỏi khả dụng.',
                config.width / 2,
                config.height / 2,
            );
            config.ctx.fillStyle = '#fff';
            config.ctx.font = '18px Arial';
            config.ctx.fillText('Nhấn ESC để quay lại menu', config.width / 2, config.height - 60);
            return;
        }

        const {
            listTop,
            listBottom,
            boxWidth,
            boxHeight,
            gap,
            boxX,
            viewportHeight,
            totalHeight,
            maxScroll,
        } = this.getListMetrics(stepItems);

        config.ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX - 18, listTop - 16, boxWidth + 36, viewportHeight + 32, 24);
        config.ctx.fill();

        config.ctx.save();
        config.ctx.beginPath();
        config.ctx.rect(boxX - 8, listTop - 8, boxWidth + 16, viewportHeight + 16);
        config.ctx.clip();

        stepItems.forEach((item, index) => {
            const isSelected = index === this.getSelectedIndex();
            const boxY = listTop + index * (boxHeight + gap) - this.listScrollOffset;

            config.ctx.fillStyle = isSelected ? 'rgba(88, 204, 2, 0.94)' : 'rgba(17, 24, 39, 0.92)';
            config.ctx.beginPath();
            config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 18);
            config.ctx.fill();

            config.ctx.strokeStyle = isSelected ? '#fef08a' : 'rgba(255, 255, 255, 0.15)';
            config.ctx.lineWidth = isSelected ? 4 : 2;
            config.ctx.stroke();

            config.ctx.fillStyle = '#fff';
            config.ctx.textAlign = 'left';
            config.ctx.font = isSelected ? 'bold 26px Arial' : 'bold 23px Arial';
            config.ctx.fillText(item.title, boxX + 28, boxY + 34);

            config.ctx.fillStyle = isSelected ? '#f7fee7' : '#cbd5e1';
            const subtitleLines = this.wrapText(item.subtitle || '', boxWidth - 220, '18px Arial');
            config.ctx.font = '18px Arial';
            subtitleLines.slice(0, 2).forEach((line, lineIndex) => {
                config.ctx.fillText(line, boxX + 28, boxY + 62 + lineIndex * 24);
            });

            if (item.description) {
                config.ctx.fillStyle = isSelected ? '#dcfce7' : '#94a3b8';
                config.ctx.font = '16px Arial';
                config.ctx.fillText(item.description, boxX + 28, boxY + boxHeight - 12);
            }

            if (isSelected) {
                config.ctx.fillStyle = '#fef08a';
                config.ctx.font = 'bold 18px Arial';
                config.ctx.textAlign = 'right';
                config.ctx.fillText('ENTER để chọn', boxX + boxWidth - 30, boxY + 52);
            }
        });
        config.ctx.restore();

        if (maxScroll > 0) {
            const trackX = boxX + boxWidth + 18;
            const trackY = listTop;
            const trackHeight = viewportHeight;
            const thumbHeight = Math.max(70, (viewportHeight / totalHeight) * trackHeight);
            const thumbY =
                trackY + (this.listScrollOffset / maxScroll) * (trackHeight - thumbHeight);

            config.ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            config.ctx.beginPath();
            config.ctx.roundRect(trackX, trackY, 10, trackHeight, 10);
            config.ctx.fill();

            config.ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
            config.ctx.beginPath();
            config.ctx.roundRect(trackX, thumbY, 10, thumbHeight, 10);
            config.ctx.fill();
        }

        if (this.errorMessage) {
            config.ctx.fillStyle = '#fecaca';
            config.ctx.font = 'bold 18px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(this.errorMessage, config.width / 2, config.height - 92);
        } else if (this.isLoading) {
            config.ctx.fillStyle = '#fde68a';
            config.ctx.font = 'bold 18px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText('Đang tải bộ đề...', config.width / 2, config.height - 92);
        } else {
            config.ctx.fillStyle = '#fff';
            config.ctx.font = '18px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText('↑ ↓ để chọn • Enter để tiếp tục • Esc để quay lại', config.width / 2, config.height - 60);
        }
    },

    async selectCurrentSet() {
        if (this.isLoading) return;
        if (this.getStepItems().length === 0) {
            this.errorMessage = quizDataLoadError || 'Chưa có bộ câu hỏi khả dụng ở bước này.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;

        try {
            if (this.currentStep === 'book') {
                const selectedBook = this.getSelectedBookEntry();
                if (!selectedBook) {
                    throw new Error('Không tìm thấy bộ sách đã chọn.');
                }

                await loadBookCatalog(selectedBook.bookCode);
                this.selectedGradeIndex = 0;
                this.selectedTopicIndex = 0;
                this.selectedPartIndex = 0;
                this.listScrollOffset = 0;
                this.currentStep = 'grade';
                return;
            }

            if (this.currentStep === 'grade') {
                this.selectedTopicIndex = 0;
                this.selectedPartIndex = 0;
                this.listScrollOffset = 0;
                this.currentStep = 'topic';
                return;
            }

            if (this.currentStep === 'topic') {
                const selectedTopicGroup = this.getSelectedTopicGroup();
                if (!selectedTopicGroup) {
                    throw new Error('Không tìm thấy chủ đề đã chọn.');
                }

                if ((selectedTopicGroup.items || []).length > 1) {
                    this.selectedPartIndex = 0;
                    this.listScrollOffset = 0;
                    this.currentStep = 'part';
                    return;
                }

                await loadQuizData(selectedTopicGroup.items[0].setId);
            } else {
                const selectedPart = this.getSelectedPartEntry();
                if (!selectedPart) {
                    throw new Error('Không tìm thấy phần đã chọn.');
                }
                await loadQuizData(selectedPart.setId);
            }

            config.gameState = 'characterSelect';
            CharacterSelection.start();
        } catch (error) {
            this.errorMessage = error.message || 'Không tải được bộ đề đã chọn.';
        } finally {
            this.isLoading = false;
        }
    },

    handleInput(e) {
        if (config.gameState !== 'questionSetSelect') return;

        const stepItems = this.getStepItems();
        if (stepItems.length === 0 && e.key !== 'Escape') {
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
                this.setSelectedIndex(Math.max(0, this.getSelectedIndex() - 1));
                break;
            case 'ArrowDown':
                this.setSelectedIndex(
                    Math.min(stepItems.length - 1, this.getSelectedIndex() + 1),
                );
                break;
            case 'Enter':
                void this.selectCurrentSet();
                break;
            case 'Escape':
                if (this.currentStep === 'part') {
                    this.listScrollOffset = 0;
                    this.currentStep = 'topic';
                } else if (this.currentStep === 'topic') {
                    this.listScrollOffset = 0;
                    this.currentStep = 'grade';
                } else if (this.currentStep === 'grade') {
                    this.listScrollOffset = 0;
                    this.currentStep = 'book';
                } else {
                    config.gameState = 'menu';
                    Menu.start();
                }
                break;
        }
    },

    handleWheel(e) {
        if (config.gameState !== 'questionSetSelect') return;

        const stepItems = this.getStepItems();
        const { maxScroll } = this.getListMetrics(stepItems);
        if (maxScroll <= 0) return;

        e.preventDefault();
        this.listScrollOffset += Math.sign(e.deltaY) * 64;
        this.clampScrollOffset(stepItems);
    },

    handleClick(e) {
        if (config.gameState !== 'questionSetSelect') return;

        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / config.scale;
        const y = (e.clientY - rect.top) * scaleY / config.scale;

        const offsetX = (config.canvas.width / config.scale - config.width) / 2;
        const offsetY = (config.canvas.height / config.scale - config.height) / 2;
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        const stepItems = this.getStepItems();
        const { listTop, boxWidth, boxHeight, gap, boxX } = this.getListMetrics(stepItems);

        stepItems.forEach((item, index) => {
            const boxY = listTop + index * (boxHeight + gap) - this.listScrollOffset;

            if (
                adjustedX >= boxX &&
                adjustedX <= boxX + boxWidth &&
                adjustedY >= boxY &&
                adjustedY <= boxY + boxHeight
            ) {
                this.setSelectedIndex(index);
                void this.selectCurrentSet();
            }
        });
    },

    start() {
        const defaultBookCode = quizCatalogIndex?.defaultBookCode || activeBookCatalog?.bookCode;
        const defaultBookIndex = this.getAvailableBooks().findIndex(
            (book) => book.bookCode === defaultBookCode,
        );

        this.selectedBookIndex = defaultBookIndex >= 0 ? defaultBookIndex : 0;
        this.selectedGradeIndex = 0;
        this.selectedTopicIndex = 0;
        this.selectedPartIndex = 0;
        this.currentStep = 'book';
        this.listScrollOffset = 0;
        this.isLoading = false;
        this.errorMessage = quizDataLoadError;

        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
        }
        if (this.handleClickBound) {
            config.canvas.removeEventListener('click', this.handleClickBound);
        }
        if (this.handleWheelBound) {
            config.canvas.removeEventListener('wheel', this.handleWheelBound);
        }

        this.handleInputBound = this.handleInput.bind(this);
        this.handleClickBound = this.handleClick.bind(this);
        this.handleWheelBound = this.handleWheel.bind(this);
        document.addEventListener('keydown', this.handleInputBound);
        config.canvas.addEventListener('click', this.handleClickBound);
        config.canvas.addEventListener('wheel', this.handleWheelBound, { passive: false });
        this.loop();
    },

    loop() {
        if (config.gameState === 'questionSetSelect') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        if (this.handleInputBound) {
            document.removeEventListener('keydown', this.handleInputBound);
            this.handleInputBound = null;
        }
        if (this.handleClickBound) {
            config.canvas.removeEventListener('click', this.handleClickBound);
            this.handleClickBound = null;
        }
        if (this.handleWheelBound) {
            config.canvas.removeEventListener('wheel', this.handleWheelBound);
            this.handleWheelBound = null;
        }
    },
};

// Character Selection Screen
const CharacterSelection = {
    selectedIndex: 0,
    currentCharacterIndex: 0,
    hasPlayedInitialSfx: false,
    backgroundImage: null,
    // Animation config cho character preview
    frameIndex: 0,
    frameCounter: 0,
    frameDelay: 150, // Slower animation for character selection
    lastAnimationTime: 0,
    // SFX debounce system
    sfxTimer: null,
    sfxDelay: 100, // 100ms delay trước khi phát SFX

    draw() {
        // Background image
        if (this.backgroundImage && this.backgroundImage.complete) {
            config.ctx.drawImage(this.backgroundImage, 0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Title
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 64px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('LỰA NHÂN VẬT', config.width / 2, 120);

        // Main character display area
        const centerX = config.width / 2;
        const centerY = config.height / 2;

        // Character platform/podium
        const platformWidth = 300;
        const platformHeight = 80;
        const platformX = centerX - platformWidth / 2;
        const platformY = centerY + 100;

        // Platform gradient
        const platformGradient = config.ctx.createLinearGradient(0, platformY, 0, platformY + platformHeight);
        platformGradient.addColorStop(0, '#8B4513');
        platformGradient.addColorStop(1, '#654321');
        config.ctx.fillStyle = platformGradient;
        config.ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

        // Platform border
        config.ctx.strokeStyle = '#444';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(platformX, platformY, platformWidth, platformHeight);

        // Current character display - ANIMATED
        const currentChar = CHARACTERS[this.currentCharacterIndex];
        const idleSprite = assets.characters[currentChar.id].idle;

        if (idleSprite && idleSprite.complete) {
            const spriteHeight = idleSprite.height;
            const frameWidth = spriteHeight; // Assuming square frames
            const frameCount = Math.floor(idleSprite.width / frameWidth);

            // Calculate display size and position
            const charSize = 200;
            const charX = centerX - charSize / 2;
            const charY = platformY - charSize + 20;

            // Draw current animated frame
            if (frameCount > 1) {
                // Multi-frame sprite sheet - draw current frame
                config.ctx.drawImage(
                    idleSprite,
                    this.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    charX, charY, charSize, charSize
                );
            } else {
                // Single frame - draw normally
                config.ctx.drawImage(idleSprite, charX, charY, charSize, charSize);
            }
        }

        // Character name
        const ctx = config.ctx;
const x = centerX;
const y = centerY - 150;

ctx.font = 'bold 48px Arial';
ctx.textAlign = 'center';

// back layers (depth)
for (let i = 6; i > 0; i--) {
    ctx.fillStyle = `rgb(${40 + i * 2}, ${40 + i * 2}, ${40 + i * 2})`;
    ctx.fillText(currentChar.name, x + i, y + i);
}

// front
ctx.fillStyle = '#fff';
ctx.fillText(currentChar.name, x, y);

        // Left arrow button
        const arrowSize = 80;
        const leftArrowX = centerX - 250;
        const leftArrowY = centerY - arrowSize / 2;

        config.ctx.fillStyle = this.currentCharacterIndex > 0 ? '#FFD700' : '#666';
        config.ctx.fillRect(leftArrowX, leftArrowY, arrowSize, arrowSize);
        config.ctx.strokeStyle = '#333';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(leftArrowX, leftArrowY, arrowSize, arrowSize);

        config.ctx.fillStyle = '#000';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.fillText('◀', leftArrowX + arrowSize / 2, leftArrowY + arrowSize / 2 + 15);

        // Right arrow button
        const rightArrowX = centerX + 170;
        const rightArrowY = centerY - arrowSize / 2;

        config.ctx.fillStyle = this.currentCharacterIndex < CHARACTERS.length - 1 ? '#FFD700' : '#666';
        config.ctx.fillRect(rightArrowX, rightArrowY, arrowSize, arrowSize);
        config.ctx.strokeStyle = '#333';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(rightArrowX, rightArrowY, arrowSize, arrowSize);

        config.ctx.fillStyle = '#000';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.fillText('▶', rightArrowX + arrowSize / 2, rightArrowY + arrowSize / 2 + 15);

        // Character counter
        config.ctx.fillStyle = '#aaa';
        config.ctx.font = '20px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(`${this.currentCharacterIndex + 1} / ${CHARACTERS.length}`, centerX, centerY + 200);

        // START button
        const startButtonWidth = 200;
        const startButtonHeight = 60;
        const startButtonX = centerX - startButtonWidth / 2;
        const startButtonY = centerY + 250;

        config.ctx.fillStyle = '#4CAF50';
        config.ctx.beginPath();
        config.ctx.roundRect(startButtonX, startButtonY, startButtonWidth, startButtonHeight, 15);
        config.ctx.fill();

        config.ctx.strokeStyle = '#66BB6A';
        config.ctx.lineWidth = 3;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('BẮT ĐẦU CHƠI', centerX, startButtonY + startButtonHeight / 2 + 8);

        // Instructions
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '18px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('Dùng mũi tên để lựa nhân vật | Enter để bắt đầu', config.width / 2, config.height - 30);
    },

    update() {
        // Play idle SFX once when character selection screen first loads
        if (!this.hasPlayedInitialSfx) {
            this.playCharacterIdleSfxImmediate(); // Phát ngay lập tức cho lần đầu
            this.hasPlayedInitialSfx = true;
        }

        // Update character animation
        const currentTime = Date.now();
        if (currentTime - this.lastAnimationTime > this.frameDelay) {
            const currentChar = CHARACTERS[this.currentCharacterIndex];
            const idleSprite = assets.characters[currentChar.id].idle;

            if (idleSprite && idleSprite.complete) {
                const spriteHeight = idleSprite.height;
                const frameWidth = spriteHeight;
                const frameCount = Math.floor(idleSprite.width / frameWidth);

                if (frameCount > 1) {
                    this.frameIndex = (this.frameIndex + 1) % frameCount;
                }
            }

            this.lastAnimationTime = currentTime;
        }
    },

    playCharacterIdleSfx() {
        // Clear existing timer nếu có
        if (this.sfxTimer) {
            clearTimeout(this.sfxTimer);
            this.sfxTimer = null;
        }

        // Set timer mới để phát SFX sau delay
        this.sfxTimer = setTimeout(() => {
            const currentChar = CHARACTERS[this.currentCharacterIndex];
            if (currentChar) {
                const idleSfxPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-idle.ogg`;
                AudioManager.playCharacterSFX(idleSfxPath, 0.2);
            }
            this.sfxTimer = null;
        }, this.sfxDelay);
    },

    // Phát SFX ngay lập tức cho initial load
    playCharacterIdleSfxImmediate() {
        const currentChar = CHARACTERS[this.currentCharacterIndex];
        if (currentChar) {
            const idleSfxPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-idle.ogg`;
            AudioManager.playCharacterSFX(idleSfxPath, 0.2);
        }
    },

    selectCharacterAndStart() {
        const selectedChar = CHARACTERS[this.currentCharacterIndex];
        characterConfig.currentCharacter = selectedChar.id;
        AudioManager.stopCharacterSFX();

        // Start game transition instead of going directly to playing
        config.gameState = 'gameStart';
        GameStartTransition.init();
    },

    handleInput(e) {
        if (config.gameState !== 'characterSelect') return;

        switch (e.key) {
            case 'ArrowLeft':
                if (this.currentCharacterIndex > 0) {
                    this.currentCharacterIndex--;
                    this.frameIndex = 0; // Reset animation
                    this.playCharacterIdleSfx();
                }
                break;
            case 'ArrowRight':
                if (this.currentCharacterIndex < CHARACTERS.length - 1) {
                    this.currentCharacterIndex++;
                    this.frameIndex = 0; // Reset animation
                    this.playCharacterIdleSfx();
                }
                break;
            case 'Enter':
                this.selectCharacterAndStart();
                break;
            case 'Escape':
                config.gameState = 'questionSetSelect';
                this.hasPlayedInitialSfx = false; // Reset flag khi quay về menu
                // Clear any existing SFX timer
                if (this.sfxTimer) {
                    clearTimeout(this.sfxTimer);
                    this.sfxTimer = null;
                }
                QuestionSetSelection.start();
                break;
        }
    },

    handleClick(e) {
        if (config.gameState !== 'characterSelect') return;

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

        const centerX = config.width / 2;
        const centerY = config.height / 2;
        const arrowSize = 80;

        // Left arrow button
        const leftArrowX = centerX - 250;
        const leftArrowY = centerY - arrowSize / 2;

        if (adjustedX >= leftArrowX && adjustedX <= leftArrowX + arrowSize &&
            adjustedY >= leftArrowY && adjustedY <= leftArrowY + arrowSize) {
            if (this.currentCharacterIndex > 0) {
                this.currentCharacterIndex--;
                this.frameIndex = 0; // Reset animation
                this.playCharacterIdleSfx();
            }
            return;
        }

        // Right arrow button
        const rightArrowX = centerX + 170;
        const rightArrowY = centerY - arrowSize / 2;

        if (adjustedX >= rightArrowX && adjustedX <= rightArrowX + arrowSize &&
            adjustedY >= rightArrowY && adjustedY <= rightArrowY + arrowSize) {
            if (this.currentCharacterIndex < CHARACTERS.length - 1) {
                this.currentCharacterIndex++;
                this.frameIndex = 0; // Reset animation
                this.playCharacterIdleSfx();
            }
            return;
        }

        // START button
        const startButtonWidth = 200;
        const startButtonHeight = 60;
        const startButtonX = centerX - startButtonWidth / 2;
        const startButtonY = centerY + 250;

        if (adjustedX >= startButtonX && adjustedX <= startButtonX + startButtonWidth &&
            adjustedY >= startButtonY && adjustedY <= startButtonY + startButtonHeight) {
            this.selectCharacterAndStart();
        }
    },

    start() {
        this.backgroundImage = assets.backgrounds.bgMenu;

        document.addEventListener('keydown', this.handleInput.bind(this));
        config.canvas.addEventListener('click', this.handleClick.bind(this));
        this.hasPlayedInitialSfx = false; // Reset flag khi vào character selection
        this.frameIndex = 0; // Reset animation
        this.lastAnimationTime = Date.now();
        // Clear any existing SFX timer
        if (this.sfxTimer) {
            clearTimeout(this.sfxTimer);
            this.sfxTimer = null;
        }
        this.loop();
    },

    loop() {
        if (config.gameState === 'characterSelect') {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else if (config.gameState === 'gameStart') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
            // gameStart will handle its own loop
        } else if (config.gameState === 'playing') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
            Game.start();
        } else if (config.gameState === 'menu') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
        }
    }
};
