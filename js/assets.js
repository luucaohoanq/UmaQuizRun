// Assets management module

// Assets to load
const assets = {
    backgrounds: {
        bg1: null,
        bg2: null,
        fence: null,
        bgBoost1: null,
        bgBoost2: null,
        bgMenu: null
    },
    characters: {},
    effects: {
        smoke: null
    },
    loaded: 0,
    total: 0
};

// Initialize empty character slots
CHARACTERS.forEach(char => {
    assets.characters[char.id] = {
        run: null,
        boost: null,
        idle: null,
        win: null,
        portrait: null,
        mainSprite: null
    };
});

// Utility function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function normalizeQuestion(question, index, questionSetId) {
    return {
        ...question,
        id:
            typeof question.id === 'string'
                ? question.id
                : `${questionSetId}-q${String(index + 1).padStart(3, '0')}`,
    };
}

function buildActiveQuestionSet(fileData, catalogEntry) {
    return {
        id: fileData.setId || catalogEntry.setId,
        setId: fileData.setId || catalogEntry.setId,
        title:
            fileData.questionSetTitle ||
            fileData.setTitle ||
            `${fileData.bookTitle || activeBookCatalog?.bookTitle || 'Tin học'} - Lớp ${fileData.grade || catalogEntry.grade} - Chủ đề ${fileData.topicLetter || catalogEntry.topicLetter}`,
        version: fileData.version || catalogEntry.version || 'v1',
        description: fileData.description || catalogEntry.topicName || '',
        shuffle: fileData.shuffle !== false,
        bookCode: fileData.bookCode || catalogEntry.bookCode || activeBookCatalog?.bookCode || null,
        bookTitle: fileData.bookTitle || catalogEntry.bookTitle || activeBookCatalog?.bookTitle || null,
        grade: fileData.grade ?? catalogEntry.grade ?? null,
        topicLetter: fileData.topicLetter || catalogEntry.topicLetter || null,
        part: fileData.part ?? catalogEntry.part ?? null,
        topicName: fileData.topicName || catalogEntry.topicName || null,
        topicSlug: fileData.topicSlug || catalogEntry.topicSlug || null,
        questionFile: catalogEntry.questionFile,
    };
}

function getAvailableBooks() {
    if (!quizCatalogIndex || !Array.isArray(quizCatalogIndex.books)) {
        return [];
    }

    return quizCatalogIndex.books.filter(
        (book) => book.enabled !== false && typeof book.catalogFile === 'string' && book.catalogFile,
    );
}

function getAvailableGrades() {
    if (!activeBookCatalog || !Array.isArray(activeBookCatalog.grades)) {
        return [];
    }

    return activeBookCatalog.grades.filter((gradeEntry) =>
        Array.isArray(gradeEntry.topics) &&
        gradeEntry.topics.some((topic) => topic.enabled && topic.questionFile),
    );
}

function getTopicGroupsForGrade(grade) {
    const gradeEntry = getAvailableGrades().find((entry) => entry.grade === grade);
    if (!gradeEntry || !Array.isArray(gradeEntry.topics)) {
        return [];
    }

    const topicMap = new Map();

    gradeEntry.topics
        .filter((topic) => topic.enabled && topic.questionFile)
        .forEach((topic) => {
            const topicLetter = topic.topicLetter;
            if (!topicMap.has(topicLetter)) {
                topicMap.set(topicLetter, {
                    topicLetter,
                    topicName: topic.topicName,
                    items: [],
                });
            }

            topicMap.get(topicLetter).items.push(topic);
        });

    return Array.from(topicMap.values())
        .map((group) => ({
            ...group,
            items: group.items.sort((left, right) => (left.part || 1) - (right.part || 1)),
        }))
        .sort((left, right) => left.topicLetter.localeCompare(right.topicLetter));
}

function getQuestionSetById(setId) {
    for (const gradeEntry of activeBookCatalog?.grades || []) {
        for (const topic of gradeEntry.topics || []) {
            if (topic.setId === setId) {
                return {
                    ...topic,
                    grade: gradeEntry.grade,
                    gradeSlug: gradeEntry.slug,
                };
            }
        }
    }

    return null;
}

async function loadBookCatalog(bookCode) {
    const selectedBook = getAvailableBooks().find((book) => book.bookCode === bookCode);

    if (!selectedBook || !selectedBook.catalogFile) {
        throw new Error('Không tìm thấy bộ sách đã chọn.');
    }

    const bookResponse = await fetch(selectedBook.catalogFile);
    if (!bookResponse.ok) {
        throw new Error('Không tải được catalog bộ sách.');
    }

    const bookCatalog = await bookResponse.json();
    activeBookCatalog = {
        ...bookCatalog,
        bookCode: bookCatalog.bookCode || selectedBook.bookCode,
        bookTitle: bookCatalog.bookTitle || selectedBook.bookTitle || selectedBook.bookCode,
    };
    activeQuestionSet = null;
    quizDataLoadError = null;
}

async function loadCurriculumCatalog() {
    try {
        const response = await fetch('js/catalog/index.json');
        if (!response.ok) {
            throw new Error('Failed to load curriculum catalog');
        }
        const catalogIndex = await response.json();
        const availableBooks = Array.isArray(catalogIndex.books) ? catalogIndex.books : [];
        const defaultBookCode =
            catalogIndex.defaultBookCode ||
            availableBooks.find((book) => book.enabled !== false)?.bookCode;
        if (!defaultBookCode) {
            throw new Error('Default book catalog is not configured');
        }

        quizCatalogIndex = catalogIndex;
        await loadBookCatalog(defaultBookCode);
    } catch (error) {
        console.error('Error loading curriculum catalog:', error);
        quizCatalogIndex = null;
        activeBookCatalog = null;
        quizDataLoadError = error.message || 'Không tải được danh mục bộ sách.';
    }
}

async function loadQuizData(questionSetId) {
    const selectedSet = getQuestionSetById(questionSetId);

    if (!selectedSet) {
        throw new Error('Question set not found');
    }

    try {
        const response = await fetch(selectedSet.questionFile);
        if (!response.ok) {
            throw new Error('Failed to load question set');
        }
        const data = await response.json();
        const rawQuestions = Array.isArray(data.questions)
            ? data.questions
            : Array.isArray(data)
                ? data
                : [];

        if (rawQuestions.length === 0) {
            throw new Error('Question set is empty');
        }

        const normalizedQuestions = rawQuestions.map((question, index) =>
            normalizeQuestion(question, index, selectedSet.setId),
        );

        const resolvedQuestionSet = buildActiveQuestionSet(data, selectedSet);

        quizData = resolvedQuestionSet.shuffle
            ? shuffleArray(normalizedQuestions)
            : normalizedQuestions;
        activeQuestionSet = {
            ...resolvedQuestionSet,
            totalQuestions: normalizedQuestions.length,
        };
        quizDataLoadError = null;
        console.log('Quiz data loaded:', activeQuestionSet.title, quizData.length, 'questions');
    } catch (error) {
        console.error('Error loading quiz data:', error);
        quizData = [];
        activeQuestionSet = null;
        quizDataLoadError = error.message || 'Không tải được bộ đề.';
        throw error;
    }
}

// Load all assets
function loadAssets() {
    const imagesToLoad = [
        // Backgrounds
        { key: 'bg1', path: 'assets/background/bg-1.png', category: 'backgrounds' },
        { key: 'bg2', path: 'assets/background/bg-2.png', category: 'backgrounds' },
        { key: 'fence', path: 'assets/background/fence_00.png', category: 'backgrounds' },
        { key: 'bgBoost1', path: 'assets/background/bg-boost-1.png', category: 'backgrounds' },
        { key: 'bgBoost2', path: 'assets/background/bg-boost-2.png', category: 'backgrounds' },
        { key: 'bgMenu', path: 'assets/background/bg-menu.png', category: 'backgrounds' },

        // Run smoke effects (sprite sheet)
        { key: 'sheet', path: 'assets/run/run_smoke_sheet.png', category: 'effects', effect: 'smoke' }
    ];

    // Dynamically add all characters
    CHARACTERS.forEach(char => {
        ANIMATION_TYPES.forEach(animType => {
            imagesToLoad.push({
                key: animType,
                path: `assets/characters/${char.folder}/${char.prefix}-${animType}.png`,
                category: 'characters',
                character: char.id
            });
        });

        // Add portrait (using idle or main image)
        imagesToLoad.push({
            key: 'portrait',
            path: `assets/characters/${char.folder}/${char.prefix}-idle.png`,
            category: 'characters',
            character: char.id
        });

        // Add main sprite (no suffix) if exists
        imagesToLoad.push({
            key: 'mainSprite',
            path: `assets/characters/${char.folder}/${char.prefix}.png`,
            category: 'characters',
            character: char.id
        });
    });

    assets.total = imagesToLoad.length;

    imagesToLoad.forEach(imageInfo => {
        const img = new Image();
        img.onload = () => {
            assets.loaded++;
            if (assets.loaded === assets.total) {
                background.x2 = config.width;
                config.gameState = 'menu';
                Menu.start();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load: ${imageInfo.path}`);
            assets.loaded++;
            if (assets.loaded === assets.total) {
                config.gameState = 'menu';
                Menu.start();
            }
        };
        img.src = imageInfo.path;

        // Store the loaded image in the correct location
        if (imageInfo.category === 'backgrounds') {
            assets.backgrounds[imageInfo.key] = img;
        } else if (imageInfo.category === 'characters') {
            assets.characters[imageInfo.character][imageInfo.key] = img;
        } else if (imageInfo.category === 'effects') {
            if (imageInfo.effect === 'smoke') {
                assets.effects.smoke = img;
            }
        }
    });
}

// Draw loading screen
function drawLoadingScreen() {
    config.ctx.fillStyle = '#1a1a2e';
    config.ctx.fillRect(0, 0, config.width, config.height);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '24px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText('Đang tải...', config.width / 2, config.height / 2 - 20);

    // Progress bar
    const barWidth = 300;
    const barHeight = 30;
    const barX = (config.width - barWidth) / 2;
    const barY = config.height / 2 + 10;

    config.ctx.strokeStyle = '#fff';
    config.ctx.strokeRect(barX, barY, barWidth, barHeight);

    const progress = assets.loaded / assets.total;
    config.ctx.fillStyle = '#4CAF50';
    config.ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * progress, barHeight - 4);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '16px Arial';
    config.ctx.fillText(`${assets.loaded} / ${assets.total}`, config.width / 2, barY + 20);
}
