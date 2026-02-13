gsap.registerPlugin(ScrollTrigger);

let mm = gsap.matchMedia();

mm.add({
  isDesktop: "(min-width: 769px)",
  isMobile: "(max-width: 768px)"
}, (context) => {
  let { isDesktop, isMobile } = context.conditions;

  let processTL = gsap.timeline({
    scrollTrigger: {
      trigger: ".process",
      // 電腦版 top top 開始，手機版 top 80% 開始
      start: isDesktop ? "top top" : "top 80%",
      // 電腦版固定畫面，手機版不固定
      pin: isDesktop ? true : false, 
      end: isDesktop ? "+=1500" : "bottom 20%",
      scrub: 1
    }
  });

  processTL
    .fromTo(".process__arrow", 
      { 
        scaleX: isDesktop ? 0 : 1, 
        scaleY: isMobile ? 0 : 1 
      }, 
      { 
        scaleX: 1, 
        scaleY: 1, 
        duration: 3, 
        ease: "none" 
      }
    )
    .fromTo(".process__circle", { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.5 }, "-=2.8")
    .fromTo(".process__bar", { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.5 }, "<")
    .fromTo(".process__term", { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.5 }, "<")
    .fromTo(".process__text", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.5 }, "<");
});