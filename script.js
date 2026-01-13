/* =========================
   Tabs logic
   ========================= */
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const tabPanes = Array.from(document.querySelectorAll('.tab-pane'));

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');

    const target = btn.getAttribute('aria-controls');
    tabPanes.forEach(p => p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

/* =========================
   Carousel logic (only run if carousel exists)
   ========================= */
const track = document.getElementById('carouselTrack');
if (track) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dots = Array.from(document.querySelectorAll('.dot'));
  const slideCount = dots.length;
  let index = 0;

  function updateCarousel(i){
    index = (i + slideCount) % slideCount;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    dots[index].classList.add('active');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => updateCarousel(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateCarousel(index + 1));
  dots.forEach(d => d.addEventListener('click', () => updateCarousel(Number(d.dataset.slide))));

  // Optional: auto-advance (comment out if you prefer manual)
  // setInterval(() => updateCarousel(index + 1), 6500);
}
