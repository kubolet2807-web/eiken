(function () {
  const baseQuestions = window.EIKEN5_QUESTIONS || [];
  const vocabulary = window.EIKEN5_VOCABULARY || [];
  const questions = [...baseQuestions, ...createVocabularyQuestions(vocabulary, baseQuestions)];
  const storageKey = "eiken5-progress-v1";
  const categories = [
    { id: "word", label: "単語", description: "英検5級によく出る基本語を確認します。" },
    { id: "grammar", label: "文法", description: "be動詞、一般動詞、疑問文などを練習します。" },
    { id: "conversation", label: "会話", description: "あいさつや日常会話の返答を身につけます。" },
    { id: "exam", label: "ミニ模試", description: "本番に近い形で総合問題に挑戦します。" },
    { id: "review", label: "復習", description: "前に間違えた問題だけをもう一度解きます。" }
  ];
  const choiceReadings = {
    am: "アム",
    is: "イズ",
    are: "アー",
    be: "ビー",
    plays: "プレイズ",
    play: "プレイ",
    playing: "プレイング",
    "to play": "トゥー プレイ",
    Do: "ドゥー",
    Does: "ダズ",
    an: "アン",
    a: "ア",
    the: "ザ",
    dogs: "ドッグズ",
    dog: "ドッグ",
    "a dog": "ア ドッグ",
    doges: "ドージズ",
    lunch: "ランチ",
    breakfast: "ブレックファスト",
    dinner: "ディナー",
    homework: "ホームワーク",
    "I'm fine, thank you.": "アイム ファイン サンキュー",
    "Nice to meet you, too.": "ナイス トゥー ミート ユー トゥー",
    "It's seven.": "イッツ セブン",
    "You're welcome.": "ユア ウェルカム",
    "I'm from Japan.": "アイム フロム ジャパン",
    "Yes, it is.": "イエス イット イズ",
    "Yes, I do.": "イエス アイ ドゥー",
    "No, I am.": "ノー アイ アム",
    "It is Sunday.": "イット イズ サンデー",
    "Yes, I can.": "イエス アイ キャン",
    "Yes, I am.": "イエス アイ アム",
    "No, it isn't.": "ノー イット イズント",
    "I am Ken.": "アイ アム ケン",
    "It's a pen.": "イッツ ア ペン",
    "At school.": "アット スクール",
    "I am twelve.": "アイ アム トゥエルブ",
    "Here you are.": "ヒア ユー アー",
    "Good night.": "グッド ナイト",
    "I'm sorry.": "アイム ソーリー",
    "See you.": "シー ユー",
    "Me, too.": "ミー トゥー",
    "I'm fine.": "アイム ファイン",
    "It's Monday.": "イッツ マンデー",
    "I play soccer.": "アイ プレイ サッカー"
  };

  const defaultProgress = {
    totalAnswered: 0,
    totalCorrect: 0,
    todayAnswered: 0,
    lastStudyDate: "",
    review: {},
    categoryStats: {}
  };

  let progress = loadProgress();
  let currentSet = [];
  let currentIndex = 0;
  let currentCorrect = 0;
  let currentMistakes = [];
  let currentMode = "daily";
  let answeredCurrent = false;

  const el = {
    loading: document.getElementById("loading"),
    homeScreen: document.getElementById("homeScreen"),
    quizScreen: document.getElementById("quizScreen"),
    resultScreen: document.getElementById("resultScreen"),
    vocabScreen: document.getElementById("vocabScreen"),
    totalAnswered: document.getElementById("totalAnswered"),
    accuracyRate: document.getElementById("accuracyRate"),
    todayAnswered: document.getElementById("todayAnswered"),
    reviewCount: document.getElementById("reviewCount"),
    categoryGrid: document.getElementById("categoryGrid"),
    startDailyButton: document.getElementById("startDailyButton"),
    openVocabButton: document.getElementById("openVocabButton"),
    vocabHomeButton: document.getElementById("vocabHomeButton"),
    vocabSearch: document.getElementById("vocabSearch"),
    vocabGroupFilter: document.getElementById("vocabGroupFilter"),
    vocabCount: document.getElementById("vocabCount"),
    vocabList: document.getElementById("vocabList"),
    resetButton: document.getElementById("resetButton"),
    backHomeButton: document.getElementById("backHomeButton"),
    questionCounter: document.getElementById("questionCounter"),
    quizTitle: document.getElementById("quizTitle"),
    progressBar: document.getElementById("progressBar"),
    questionType: document.getElementById("questionType"),
    questionText: document.getElementById("questionText"),
    readingText: document.getElementById("readingText"),
    speakButton: document.getElementById("speakButton"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    nextButton: document.getElementById("nextButton"),
    resultTitle: document.getElementById("resultTitle"),
    resultScore: document.getElementById("resultScore"),
    resultMessage: document.getElementById("resultMessage"),
    mistakeList: document.getElementById("mistakeList"),
    retryButton: document.getElementById("retryButton"),
    reviewButton: document.getElementById("reviewButton"),
    resultHomeButton: document.getElementById("resultHomeButton")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    updateToday();
    renderCategories();
    renderVocabularyFilters();
    renderVocabulary();
    renderStats();
    bindEvents();
    window.setTimeout(() => document.body.classList.add("is-ready"), 350);
  }

  function bindEvents() {
    el.startDailyButton.addEventListener("click", () => startQuiz("daily"));
    el.openVocabButton.addEventListener("click", () => showScreen("vocab"));
    el.vocabHomeButton.addEventListener("click", () => showScreen("home"));
    el.vocabSearch.addEventListener("input", renderVocabulary);
    el.vocabGroupFilter.addEventListener("change", renderVocabulary);
    el.backHomeButton.addEventListener("click", () => showScreen("home"));
    el.resultHomeButton.addEventListener("click", () => showScreen("home"));
    el.nextButton.addEventListener("click", nextQuestion);
    el.speakButton.addEventListener("click", speakCurrentQuestion);
    el.retryButton.addEventListener("click", () => startQuiz(currentMode));
    el.reviewButton.addEventListener("click", () => startQuiz("review"));
    el.resetButton.addEventListener("click", resetProgress);
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaultProgress, ...JSON.parse(saved) } : { ...defaultProgress };
    } catch (error) {
      return { ...defaultProgress };
    }
  }

  function saveProgress() {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function updateToday() {
    const today = getToday();
    if (progress.lastStudyDate !== today) {
      progress.todayAnswered = 0;
      progress.lastStudyDate = today;
      saveProgress();
    }
  }

  function getToday() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function renderCategories() {
    el.categoryGrid.innerHTML = "";
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "category-card";
      button.type = "button";
      button.innerHTML = `
        <h3>${category.label}</h3>
        <p>${category.description}</p>
        <span class="secondary-button">始める</span>
      `;
      button.addEventListener("click", () => startQuiz(category.id));
      el.categoryGrid.appendChild(button);
    });
  }

  function renderVocabularyFilters() {
    const groups = [...new Set(vocabulary.map((item) => item.group))];
    el.vocabGroupFilter.innerHTML = '<option value="all">すべて</option>';
    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      el.vocabGroupFilter.appendChild(option);
    });
  }

  function renderVocabulary() {
    const keyword = el.vocabSearch.value.trim().toLowerCase();
    const group = el.vocabGroupFilter.value;
    const filtered = vocabulary.filter((item) => {
      const matchesGroup = group === "all" || item.group === group;
      const text = `${item.word} ${item.reading} ${item.meaning} ${item.group}`.toLowerCase();
      return matchesGroup && text.includes(keyword);
    });

    el.vocabCount.textContent = `${filtered.length}語 / 全${vocabulary.length}語`;
    el.vocabList.innerHTML = "";

    filtered.forEach((item) => {
      const row = document.createElement("article");
      row.className = "vocab-item";
      row.innerHTML = `
        <div>
          <div class="vocab-word">${item.word}</div>
          <span class="vocab-group">${item.group}</span>
        </div>
        <div class="vocab-reading">${item.reading}</div>
        <div class="vocab-meaning">${item.meaning}</div>
      `;

      const button = document.createElement("button");
      button.className = "choice-sound-button";
      button.type = "button";
      button.textContent = "聞く";
      button.setAttribute("aria-label", `${item.word}を聞く`);
      button.disabled = !canSpeak();
      button.addEventListener("click", () => speakText(item.word, "en-US"));
      row.appendChild(button);
      el.vocabList.appendChild(row);
    });
  }

  function renderStats() {
    const reviewCount = Object.keys(progress.review || {}).length;
    const accuracy = progress.totalAnswered === 0
      ? 0
      : Math.round((progress.totalCorrect / progress.totalAnswered) * 100);

    el.totalAnswered.textContent = String(progress.totalAnswered);
    el.accuracyRate.textContent = `${accuracy}%`;
    el.todayAnswered.textContent = `${progress.todayAnswered}問`;
    el.reviewCount.textContent = `${reviewCount}問`;
    el.reviewButton.disabled = reviewCount === 0;
  }

  function startQuiz(mode) {
    currentMode = mode;
    currentIndex = 0;
    currentCorrect = 0;
    currentMistakes = [];
    answeredCurrent = false;

    currentSet = getQuestionSet(mode);
    if (currentSet.length === 0) {
      showEmptyReview();
      return;
    }

    showScreen("quiz");
    renderQuestion();
  }

  function getQuestionSet(mode) {
    if (mode === "daily") {
      return shuffle(questions).slice(0, 10);
    }

    if (mode === "review") {
      const ids = Object.keys(progress.review || {});
      return shuffle(questions.filter((question) => ids.includes(question.id))).slice(0, 10);
    }

    return shuffle(questions.filter((question) => question.category === mode)).slice(0, 10);
  }

  function showEmptyReview() {
    currentSet = [];
    currentCorrect = 0;
    currentMistakes = [];
    el.resultTitle.textContent = "復習する問題はありません";
    el.resultScore.textContent = "0問";
    el.resultMessage.textContent = "間違えた問題が出たら、ここに復習リストとして追加されます。";
    el.mistakeList.innerHTML = "";
    showScreen("result");
  }

  function renderQuestion() {
    const question = currentSet[currentIndex];
    answeredCurrent = false;
    el.quizTitle.textContent = getModeLabel(currentMode);
    el.questionCounter.textContent = `${currentIndex + 1} / ${currentSet.length}`;
    el.progressBar.style.width = `${(currentIndex / currentSet.length) * 100}%`;
    el.questionType.textContent = question.type;
    el.questionText.textContent = question.question;
    el.readingText.textContent = question.reading ? `読み方: ${question.reading}` : "読み方: なし";
    el.speakButton.disabled = !canSpeak() || !question.speak;
    el.feedback.className = "feedback";
    el.feedback.textContent = "答えを選んでください。";
    el.nextButton.classList.add("hidden");

    el.choices.innerHTML = "";
    shuffle(question.choices).forEach((choice) => {
      const row = document.createElement("div");
      row.className = "choice-row";

      const button = document.createElement("button");
      button.className = "choice-button";
      button.type = "button";
      button.dataset.choice = choice;
      button.textContent = formatChoice(choice);
      button.addEventListener("click", () => handleAnswer(button, choice));

      const soundButton = document.createElement("button");
      soundButton.className = "choice-sound-button";
      soundButton.type = "button";
      soundButton.textContent = "聞く";
      soundButton.setAttribute("aria-label", `${formatChoice(choice)}を聞く`);
      soundButton.disabled = !canSpeak();
      soundButton.addEventListener("click", () => speakChoice(choice));

      row.appendChild(button);
      row.appendChild(soundButton);
      el.choices.appendChild(row);
    });
  }

  function handleAnswer(button, choice) {
    if (answeredCurrent) {
      return;
    }

    answeredCurrent = true;
    const question = currentSet[currentIndex];
    const isCorrect = choice === question.answer;

    el.choices.querySelectorAll(".choice-button").forEach((choiceButton) => {
      choiceButton.disabled = true;
      if (choiceButton.dataset.choice === question.answer) {
        choiceButton.classList.add("correct");
      }
    });

    if (isCorrect) {
      currentCorrect += 1;
      removeReview(question.id);
      el.feedback.className = "feedback good";
      el.feedback.textContent = `正解！ ${question.explanation}`;
    } else {
      button.classList.add("incorrect");
      currentMistakes.push(question);
      addReview(question.id);
      el.feedback.className = "feedback bad";
      el.feedback.textContent = `不正解。正解は「${question.answer}」です。${question.explanation}`;
    }

    recordAnswer(question.category, isCorrect);
    el.progressBar.style.width = `${((currentIndex + 1) / currentSet.length) * 100}%`;
    el.nextButton.textContent = currentIndex + 1 === currentSet.length ? "結果を見る" : "次の問題へ";
    el.nextButton.classList.remove("hidden");
    renderStats();
  }

  function recordAnswer(category, isCorrect) {
    progress.totalAnswered += 1;
    progress.todayAnswered += 1;
    if (isCorrect) {
      progress.totalCorrect += 1;
    }

    if (!progress.categoryStats[category]) {
      progress.categoryStats[category] = { answered: 0, correct: 0 };
    }
    progress.categoryStats[category].answered += 1;
    if (isCorrect) {
      progress.categoryStats[category].correct += 1;
    }
    saveProgress();
  }

  function addReview(id) {
    progress.review[id] = {
      count: ((progress.review[id] && progress.review[id].count) || 0) + 1,
      lastMissed: getToday()
    };
    saveProgress();
  }

  function removeReview(id) {
    if (progress.review[id]) {
      delete progress.review[id];
      saveProgress();
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 >= currentSet.length) {
      renderResult();
      return;
    }

    currentIndex += 1;
    renderQuestion();
  }

  function renderResult() {
    const total = currentSet.length;
    const rate = total === 0 ? 0 : Math.round((currentCorrect / total) * 100);
    el.resultTitle.textContent = "学習結果";
    el.resultScore.textContent = `${currentCorrect} / ${total}`;
    el.resultMessage.textContent = rate >= 80
      ? "よくできました。この調子で復習も軽く進めましょう。"
      : "間違えた問題は復習に入りました。もう一度やると定着します。";

    el.mistakeList.innerHTML = "";
    if (currentMistakes.length === 0) {
      const item = document.createElement("div");
      item.className = "mistake-item";
      item.textContent = "間違えた問題はありません。";
      el.mistakeList.appendChild(item);
    } else {
      currentMistakes.forEach((question) => {
        const item = document.createElement("div");
        item.className = "mistake-item";
        item.textContent = `${question.type}: ${question.question} / 正解: ${question.answer}`;
        el.mistakeList.appendChild(item);
      });
    }

    showScreen("result");
  }

  function resetProgress() {
    const ok = window.confirm("学習記録と復習リストをリセットしますか？");
    if (!ok) {
      return;
    }
    progress = { ...defaultProgress, lastStudyDate: getToday() };
    saveProgress();
    renderStats();
    showScreen("home");
  }

  function speakCurrentQuestion() {
    const question = currentSet[currentIndex];
    if (!question || !question.speak || !canSpeak()) {
      return;
    }

    speakText(question.speak, "en-US");
  }

  function speakChoice(choice) {
    const lang = hasJapanese(choice) ? "ja-JP" : "en-US";
    speakText(choice, lang);
  }

  function formatChoice(choice) {
    if (!hasEnglish(choice)) {
      return choice;
    }

    const reading = choiceReadings[choice];
    return reading ? `${choice}（${reading}）` : choice;
  }

  function speakText(text, lang) {
    if (!text || !canSpeak()) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = lang === "en-US" ? 0.82 : 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function canSpeak() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function hasJapanese(text) {
    return /[ぁ-んァ-ン一-龥]/.test(text);
  }

  function hasEnglish(text) {
    return /[A-Za-z]/.test(text);
  }

  function showScreen(name) {
    const target = `${name}Screen`;
    [el.homeScreen, el.quizScreen, el.resultScreen, el.vocabScreen].forEach((screen) => {
      screen.classList.toggle("active", screen.id === target);
    });
    if (name === "home") {
      renderStats();
    }
  }

  function getModeLabel(mode) {
    if (mode === "daily") {
      return "今日の10問";
    }
    const category = categories.find((item) => item.id === mode);
    return category ? category.label : "練習";
  }

  function shuffle(items) {
    const copied = [...items];
    for (let i = copied.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }

  function createVocabularyQuestions(words, existingQuestions) {
    const existingWords = new Set(
      existingQuestions
        .filter((question) => question.category === "word")
        .map((question) => normalizeWord(question.speak || question.question.split(" ")[0]))
    );

    return words
      .filter((item) => !existingWords.has(normalizeWord(item.word)))
      .map((item, index) => {
        const distractors = getMeaningDistractors(item, words);
        return {
          id: `vocab-${String(index + 1).padStart(3, "0")}`,
          category: "word",
          type: "単語",
          question: `${item.word} の意味は？`,
          reading: item.reading,
          speak: item.word,
          choices: shuffle([item.meaning, ...distractors]).slice(0, 4),
          answer: item.meaning,
          explanation: `${item.word} は「${item.meaning}」という意味です。`
        };
      });
  }

  function getMeaningDistractors(target, words) {
    const sameGroup = words.filter((item) => item.group === target.group && item.word !== target.word);
    const otherGroup = words.filter((item) => item.group !== target.group && item.word !== target.word);
    const candidates = [...shuffle(sameGroup), ...shuffle(otherGroup)]
      .map((item) => item.meaning)
      .filter((meaning) => meaning !== target.meaning);
    return [...new Set(candidates)].slice(0, 3);
  }

  function normalizeWord(word) {
    return String(word).toLowerCase().trim();
  }
})();
