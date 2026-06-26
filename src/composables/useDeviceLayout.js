import { ref, onMounted, onUnmounted } from "vue";

export function useDeviceLayout() {
  const MOBILE_BREAKPOINT = 900;

  const isMobile = ref(window.innerWidth <= MOBILE_BREAKPOINT);
  const isDesktop = ref(window.innerWidth > MOBILE_BREAKPOINT);

  function handleResize() {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;

    isMobile.value = mobile;
    isDesktop.value = !mobile;
  }

  onMounted(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

  return {
    isMobile,
    isDesktop,
  };
}