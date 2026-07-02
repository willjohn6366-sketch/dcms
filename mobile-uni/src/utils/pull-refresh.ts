import { computed, ref } from 'vue';

const PULL_HINT_DISTANCE = 12;
const PULL_TRIGGER_DISTANCE = 64;

export function usePullRefresh(loadData: () => Promise<boolean>) {
  const refreshing = ref(false);
  const pullDistance = ref(0);

  let startY = 0;
  let tracking = false;

  const refreshTipVisible = computed(() => refreshing.value || pullDistance.value > PULL_HINT_DISTANCE);
  const refreshTipText = computed(() => {
    if (refreshing.value) return '正在刷新...';
    return pullDistance.value >= PULL_TRIGGER_DISTANCE ? '松开刷新' : '下拉刷新';
  });

  async function runRefresh() {
    if (refreshing.value) return;

    refreshing.value = true;
    const ok = await loadData();

    setTimeout(() => {
      refreshing.value = false;
      pullDistance.value = 0;
      uni.stopPullDownRefresh();
      if (ok) {
        uni.showToast({ title: '已刷新', icon: 'none' });
      }
    }, 350);
  }

  function handleRefreshTouchStart(event: TouchEvent) {
    if (refreshing.value || !isPageAtTop()) return;

    const y = getTouchY(event);
    if (y === null) return;

    startY = y;
    tracking = true;
  }

  function handleRefreshTouchMove(event: TouchEvent) {
    if (!tracking || refreshing.value || !isPageAtTop()) return;

    const y = getTouchY(event);
    if (y === null) return;

    const distance = y - startY;
    pullDistance.value = distance > 0 ? Math.min(distance, 96) : 0;
  }

  function handleRefreshTouchEnd() {
    if (!tracking) return;

    const shouldRefresh = pullDistance.value >= PULL_TRIGGER_DISTANCE;
    tracking = false;
    startY = 0;

    if (shouldRefresh) {
      runRefresh();
      return;
    }

    pullDistance.value = 0;
  }

  return {
    refreshTipVisible,
    refreshTipText,
    handleRefreshTouchStart,
    handleRefreshTouchMove,
    handleRefreshTouchEnd,
    runRefresh
  };
}

function getTouchY(event: TouchEvent) {
  return event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY ?? null;
}

function isPageAtTop() {
  if (typeof window === 'undefined') return true;

  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  return scrollTop <= 0;
}
