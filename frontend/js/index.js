// ── Hero headline letter stagger ───────────────
const headline = document.getElementById("heroHeadline");
headline.innerHTML = headline.textContent
    .split("")
    .map((char, i) =>
        char === " "
            ? "&nbsp;"
            : `<span class="letter" style="animation-delay:${(i * 0.038).toFixed(3)}s">${char}</span>`
    )
    .join("");

// ── Navbar: add .scrolled class on scroll ───────
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 80);
}, { passive: true });

// ── Step cards scroll-reveal ─────────────────────
const cards = document.querySelectorAll(".step-card");
cards.forEach(card => {
    card.style.transition = "opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)";
});

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }, i * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15 }
);

cards.forEach(card => revealObserver.observe(card));

// ── Floating image parallax + bounce ────────────
const heroImgs = document.querySelectorAll(".hero-img");
const imgRotations = [-8, 6];
let heroT = 0;

(function animateHero() {
    heroT += 0.018;
    const scrollY = window.scrollY;
    heroImgs.forEach((img, i) => {
        const parallax = scrollY * (0.09 + i * 0.06);
        const bounce   = Math.sin(heroT + i * 1.9) * 7;
        img.style.transform = `translateY(${parallax + bounce}px) rotate(${imgRotations[i]}deg)`;
    });
    requestAnimationFrame(animateHero);
}());
