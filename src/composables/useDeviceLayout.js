import { ref, onMounted, onUnmounted } from "vue";

export function useDeviceLayout() {
  const isMobile = ref(window.innerWidth <= 900);

  function handleResize() {
    isMobile.value = window.innerWidth <= 900;
  }

  onMounted(() => {
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

  return {
    isMobile,
  };
}