
/* ========================================
   Hekayetna — Storybook, Telegram & Music
======================================== */

(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);

    const home = $("#home");
    const story = $("#story");
    const book = $("#storyBook");
    const openBookButton = $("#openBookButton");
    const chapters = [...document.querySelectorAll("#storyBook .chapter")];
    const prevButton = $("#prevChapter");
    const nextButton = $("#nextChapter");
    const chapterCounter = $("#chapterCounter");
    const ending = $("#ending");
    const backHome = $("#backHome");
    const heartsBackground = $("#heartsBackground");

    if (
        !home || !story || !book || !openBookButton ||
        !prevButton || !nextButton || !chapterCounter ||
        !ending || !backHome || chapters.length !== 4
    ) {
        console.error("Hekayetna: Check the story elements in index.html.");
        return;
    }

    let currentChapter = 0;
    let hasOpenedBook = false;
    const lastChapter = chapters.length - 1;

    /* Chapter navigation */

    function updateChapter() {
        chapters.forEach((chapter, index) => {
            chapter.hidden = index !== currentChapter;
            chapter.classList.toggle("active", index === currentChapter);
        });

        chapterCounter.textContent = `${currentChapter + 1} / ${chapters.length}`;
        prevButton.disabled = currentChapter === 0;

        nextButton.innerHTML = currentChapter === lastChapter
            ? 'النهاية <span aria-hidden="true">♥</span>'
            : 'التالي <span aria-hidden="true">←</span>';

        ending.hidden = true;
    }

    function openStory() {
        home.hidden = true;
        story.hidden = false;
        currentChapter = 0;
        updateChapter();

        if (!hasOpenedBook) {
            hasOpenedBook = true;
            book.classList.remove("is-open");

            window.setTimeout(() => {
                if (!story.hidden) book.classList.add("is-open");
            }, 250);
        } else {
            book.classList.add("is-open");
        }

        story.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function nextChapter() {
        if (currentChapter < lastChapter) {
            currentChapter++;
            updateChapter();
            book.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            ending.hidden = false;
            ending.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function previousChapter() {
        if (currentChapter > 0) {
            currentChapter--;
            updateChapter();
            book.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (!ending.hidden) {
            ending.hidden = true;
        }
    }

    openBookButton.addEventListener("click", openStory);
    nextButton.addEventListener("click", nextChapter);
    prevButton.addEventListener("click", previousChapter);

    backHome.addEventListener("click", () => {
        story.hidden = true;
        ending.hidden = true;
        home.hidden = false;
        book.classList.remove("is-open");
        currentChapter = 0;
        updateChapter();
        home.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* Floating hearts */

    const heartSymbols = ["♥", "♡", "❤"];

    function createFloatingHeart() {
        if (!heartsBackground || heartsBackground.childElementCount >= 18) return;

        const heart = document.createElement("span");
        heart.className = "particle-heart";
        heart.textContent = heartSymbols[
            Math.floor(Math.random() * heartSymbols.length)
        ];
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${10 + Math.random() * 17}px`;
        heart.style.animationDuration = `${8 + Math.random() * 8}s`;

        heartsBackground.appendChild(heart);
        heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }

    if (heartsBackground) {
        createFloatingHeart();
        window.setInterval(createFloatingHeart, 1400);
    }

    /* Keyboard navigation */

    document.addEventListener("keydown", (event) => {
        if (story.hidden) return;

        const target = event.target;
        const typing = target instanceof HTMLElement && (
            target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        );

        if (typing || event.altKey || event.ctrlKey || event.metaKey) return;

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            nextChapter();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            previousChapter();
        } else if (event.key === "Escape") {
            backHome.click();
        }
    });

    /* Wish form and surprise gallery */

    const form = $("#messageForm");
    const input = $("#messageInput");
    const submitButton = $("#sendMessageButton");
    const status = $("#messageStatus");
    const characterCount = $("#characterCount");
    const gallery = $("#memoryGallery");

    if (form && input && submitButton && status && characterCount) {
        const buttonText = submitButton.querySelector(".button-text");
        const originalButtonText = buttonText
            ? buttonText.textContent
            : submitButton.textContent;

        input.addEventListener("input", () => {
            characterCount.textContent = `${input.value.length} / 2000`;
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const message = input.value.trim();
            status.textContent = "";
            status.className = "wish-status";

            if (!message) {
                status.textContent = "اكتبي أمنيتك الأول يا بوبتي ❤️";
                status.classList.add("error");
                input.focus();
                return;
            }

            if (message.length > 2000) {
                status.textContent = "الرسالة طويلة شوية، اختصريها وجربي تاني.";
                status.classList.add("error");
                return;
            }

            submitButton.disabled = true;
            if (buttonText) buttonText.textContent = "بنبعت رسالتك...";
            status.textContent = "لحظة صغيرة يا بوبتي... 💌";

            try {
                const response = await fetch("/api/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.error || "الإرسال ما تمّش. جربي مرة تانية."
                    );
                }

                status.textContent =
                    "وصلت أمنيتك بنجاح ❤️ استني المفاجأة يا بوبتي!";
                status.classList.add("success");

                // Reveal the gallery only after the server confirms success.
                if (gallery) {
                    gallery.hidden = false;
                    gallery.classList.remove("gallery-reveal");
                    void gallery.offsetWidth;
                    gallery.classList.add("gallery-reveal");

                    gallery.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

                form.reset();
                characterCount.textContent = "0 / 2000";
            } catch (error) {
                status.textContent =
                    error.message || "حصلت مشكلة في الاتصال. جربي تاني.";
                status.classList.add("error");
            } finally {
                submitButton.disabled = false;
                if (buttonText) buttonText.textContent = originalButtonText;
            }
        });
    }

    updateChapter();
    console.log("Hekayetna initialized successfully.");
})();

/* ========================================
   Romantic Music Player
======================================== */

(() => {
    "use strict";

    const song = document.getElementById("loveSong");
    const toggle = document.getElementById("musicToggle");
    const icon = document.getElementById("musicIcon");
    const label = document.getElementById("musicLabel");

    if (!song || !toggle || !icon || !label) {
        console.error("Hekayetna: Music player elements are missing.");
        return;
    }

    toggle.addEventListener("click", async () => {
        if (song.paused) {
            try {
                await song.play();
            } catch (error) {
                label.textContent = "مش قادرين نشغّل الأغنية 🎵";
                console.error("Music playback failed:", error);
            }
        } else {
            song.pause();
        }
    });

    song.addEventListener("play", () => {
        toggle.classList.add("is-playing");
        toggle.setAttribute("aria-pressed", "true");
        toggle.setAttribute("aria-label", "إيقاف الأغنية");
        icon.textContent = "♫";
        label.textContent = "وقّفي الأغنية ❤️";
    });

    song.addEventListener("pause", () => {
        toggle.classList.remove("is-playing");
        toggle.setAttribute("aria-pressed", "false");
        toggle.setAttribute("aria-label", "تشغيل الأغنية");
        icon.textContent = "♫";
        label.textContent = "شغّلي أغنيتنا ❤️";
    });

    song.addEventListener("ended", () => {
        label.textContent = "شغّلي أغنيتنا ❤️";
    });

    song.addEventListener("error", () => {
        label.textContent = "راجعي ملف الأغنية 🎵";
        console.error("Could not load /audio/love-song.mp3");
    });
})();
