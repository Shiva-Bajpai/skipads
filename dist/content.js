"use strict";
/**
 * SkipAds - YouTube Ad Skipper
 *
 * Uses a MutationObserver to watch for DOM changes on YouTube pages.
 * When the "Skip Ad" button appears, it automatically clicks it.
 * Also handles video ad overlays by seeking past the ad.
 */
const SKIP_BUTTON_SELECTORS = [
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button",
    'button.ytp-ad-skip-button-modern',
    ".ytp-ad-skip-button-container button",
];
const AD_SHOWING_CLASS = "ad-showing";
/**
 * Try to find and click any visible skip-ad button on the page.
 * Returns true if a button was found and clicked.
 */
function tryClickSkipButton() {
    for (const selector of SKIP_BUTTON_SELECTORS) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.click();
            console.log(`[SkipAds] Clicked skip button: ${selector}`);
            return true;
        }
    }
    return false;
}
/**
 * Check if the YouTube player is currently showing an ad.
 * If so, try to skip it by seeking the video to the end or muting it.
 */
function handleAdOverlay() {
    const player = document.querySelector(".html5-video-player");
    if (!player)
        return;
    const isAdPlaying = player.classList.contains(AD_SHOWING_CLASS);
    if (!isAdPlaying)
        return;
    // Try clicking skip button first
    if (tryClickSkipButton())
        return;
    // Fallback: try to speed through the ad by seeking to end
    const video = document.querySelector("video.html5-main-video");
    if (video && video.duration && isFinite(video.duration)) {
        video.currentTime = video.duration;
        console.log("[SkipAds] Seeked ad video to end");
    }
    // Mute the ad so it's less annoying while it plays
    if (video && !video.muted) {
        video.muted = true;
        console.log("[SkipAds] Muted ad video");
        // Unmute after the ad ends
        const unmuteHandler = () => {
            const playerNow = document.querySelector(".html5-video-player");
            if (playerNow && !playerNow.classList.contains(AD_SHOWING_CLASS)) {
                video.muted = false;
                console.log("[SkipAds] Unmuted video after ad");
                video.removeEventListener("playing", unmuteHandler);
            }
        };
        video.addEventListener("playing", unmuteHandler);
    }
}
/**
 * Dismiss any skippable ad overlay banners or popups.
 */
function dismissAdOverlays() {
    const overlayCloseButtons = [
        ".ytp-ad-overlay-close-button",
        ".ytp-ad-overlay-close-container",
        'button[id="dismiss-button"]',
    ];
    for (const selector of overlayCloseButtons) {
        const closeBtn = document.querySelector(selector);
        if (closeBtn) {
            closeBtn.click();
            console.log(`[SkipAds] Dismissed ad overlay: ${selector}`);
        }
    }
}
/**
 * Main check function — called on every relevant DOM mutation.
 */
function checkForAds() {
    tryClickSkipButton();
    handleAdOverlay();
    dismissAdOverlays();
}
// --- MutationObserver setup ---
const observer = new MutationObserver((mutations) => {
    // Only process if there are actual DOM changes
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0 || mutation.type === "attributes") {
            checkForAds();
            break; // one check per batch of mutations is enough
        }
    }
});
// Start observing once the body is available
function startObserving() {
    if (!document.body) {
        // Body not ready yet, wait for it
        document.addEventListener("DOMContentLoaded", () => {
            startObserving();
        });
        return;
    }
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
    });
    console.log("[SkipAds] MutationObserver started — watching for ads");
    // Run once immediately in case an ad is already showing
    checkForAds();
}
startObserving();
