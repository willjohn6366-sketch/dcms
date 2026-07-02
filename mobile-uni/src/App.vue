<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("Circuit Mobile Launch");
});
onShow(() => {
  console.log("Circuit Mobile Show");
});
onHide(() => {
  console.log("Circuit Mobile Hide");
});
</script>
<style lang="scss">
:root {
  --cm-bg: #f5f7fb;
  --cm-shell: #e9edf5;
  --cm-surface: #ffffff;
  --cm-surface-soft: #eef3ff;
  --cm-text: #162033;
  --cm-muted: #7a8496;
  --cm-border: #e3e8f2;
  --cm-primary: #2563eb;
  --cm-primary-strong: #1e3a8a;
  --cm-primary-soft: #eaf2ff;
  --cm-warning: #f59e0b;
  --cm-danger: #dc2626;
  --cm-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.07);
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
  background: var(--cm-shell);
}

page {
  background: var(--cm-shell);
  color: var(--cm-text);
  font-family: "PingFang SC", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
}

uni-page-body {
  width: 100%;
  max-width: 520px;
  min-height: 100%;
  margin: 0 auto;
  overflow-x: hidden;
  background: var(--cm-bg);
  box-sizing: border-box;
  box-shadow: 0 0 0 1px rgba(24, 36, 34, 0.06), 0 24rpx 80rpx rgba(24, 36, 34, 0.12);
}

.uni-page-head {
  left: 50% !important;
  right: auto !important;
  width: 100%;
  max-width: 520px;
  transform: translateX(-50%);
  color: var(--cm-text) !important;
  background: rgba(255, 255, 255, 0.94) !important;
  box-shadow: 0 1rpx 0 rgba(22, 32, 51, 0.06);
  backdrop-filter: blur(18rpx);
}

uni-tabbar.uni-tabbar-bottom {
  position: fixed !important;
  left: 50% !important;
  right: auto !important;
  bottom: calc(14rpx + env(safe-area-inset-bottom)) !important;
  width: calc(100% - 32rpx);
  max-width: 488px;
  height: 124rpx !important;
  min-height: 124rpx;
  padding: 0 !important;
  border: 1rpx solid rgba(22, 32, 51, 0.08);
  border-radius: 30rpx;
  transform: translateX(-50%);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 18rpx 48rpx rgba(25, 43, 78, 0.14);
  backdrop-filter: blur(18rpx);
}

uni-tabbar.uni-tabbar-bottom > .uni-tabbar {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  min-height: 0 !important;
  padding: 12rpx 10rpx !important;
  transform: none !important;
  display: flex !important;
  align-items: stretch !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 30rpx !important;
  box-shadow: none !important;
}

uni-tabbar .uni-tabbar__item,
.uni-tabbar .uni-tabbar__item {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  min-height: 0 !important;
  border-radius: 24rpx;
}

uni-tabbar .uni-tabbar__bd,
.uni-tabbar .uni-tabbar__bd {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 6rpx 0 !important;
  border-radius: 22rpx !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4rpx !important;
}

uni-tabbar .uni-tabbar__icon,
.uni-tabbar .uni-tabbar__icon {
  margin: 0 !important;
  flex: 0 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

uni-tabbar .uni-tabbar__label,
.uni-tabbar .uni-tabbar__label {
  margin-top: 2rpx !important;
  font-size: 22rpx !important;
  font-weight: 700 !important;
  line-height: 1.1 !important;
}

uni-tabbar .uni-tabbar__item:has(img[src*="-active"]) .uni-tabbar__bd,
.uni-tabbar .uni-tabbar__item:has(img[src*="-active"]) .uni-tabbar__bd,
uni-tabbar .uni-tabbar__item:has(.uni-tabbar__label[style*="37, 99, 235"]) .uni-tabbar__bd,
.uni-tabbar .uni-tabbar__item:has(.uni-tabbar__label[style*="37, 99, 235"]) .uni-tabbar__bd,
uni-tabbar .uni-tabbar__item:has(.uni-tabbar__label[style*="2563"]) .uni-tabbar__bd,
.uni-tabbar .uni-tabbar__item:has(.uni-tabbar__label[style*="2563"]) .uni-tabbar__bd {
  background: var(--cm-primary-soft) !important;
  box-shadow: inset 0 0 0 1rpx rgba(37, 99, 235, 0.14), 0 8rpx 18rpx rgba(37, 99, 235, 0.12);
}

.page {
  min-height: 100% !important;
  box-sizing: border-box;
  background: var(--cm-bg) !important;
}

.refresh-tip {
  position: fixed;
  left: 50%;
  top: calc(18rpx + env(safe-area-inset-top));
  z-index: 1200;
  min-width: 164rpx;
  height: 56rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.14);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.96);
  color: var(--cm-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 56rpx;
  text-align: center;
  box-shadow: 0 12rpx 28rpx rgba(25, 43, 78, 0.12);
  transform: translateX(-50%);
  backdrop-filter: blur(14rpx);
}

.form,
.form-body {
  margin: 20rpx 28rpx 24rpx !important;
  padding: 6rpx 24rpx !important;
  border: 1rpx solid var(--cm-border) !important;
  border-radius: 28rpx !important;
  background: var(--cm-surface) !important;
  box-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.06) !important;
}

.form-body + .form-body {
  margin-top: 0 !important;
}

.field {
  padding: 28rpx 0 !important;
  border-bottom: 1rpx solid var(--cm-border) !important;
}

.field--last,
.field:last-child {
  border-bottom: 0 !important;
}

.divider {
  display: none !important;
}

.field__label {
  display: block !important;
  margin-bottom: 14rpx !important;
  color: #5f6b7a !important;
  font-size: 24rpx !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
}

.field__required,
.required {
  color: var(--cm-danger) !important;
}

.field__input,
.port-row__input {
  width: 100% !important;
  height: 80rpx !important;
  padding: 0 22rpx !important;
  border: 1rpx solid #dbe3ef !important;
  border-radius: 18rpx !important;
  background: #f8fbff !important;
  color: var(--cm-text) !important;
  font-size: 30rpx !important;
  font-weight: 600 !important;
}

.field__textarea {
  width: 100% !important;
  min-height: 132rpx !important;
  padding: 18rpx 22rpx !important;
  border: 1rpx solid #dbe3ef !important;
  border-radius: 18rpx !important;
  background: #f8fbff !important;
  color: var(--cm-text) !important;
  font-size: 28rpx !important;
  font-weight: 600 !important;
  line-height: 1.6 !important;
}

.field__placeholder,
.picker-placeholder {
  color: #98a2b3 !important;
  font-weight: 400 !important;
}

.picker-row {
  min-height: 80rpx !important;
  height: auto !important;
  padding: 0 20rpx 0 22rpx !important;
  border: 1rpx solid #dbe3ef !important;
  border-radius: 18rpx !important;
  background: #f8fbff !important;
  gap: 16rpx !important;
}

.picker-value {
  min-width: 0 !important;
  flex: 1 !important;
  overflow: hidden !important;
  color: var(--cm-text) !important;
  font-size: 30rpx !important;
  font-weight: 600 !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.picker-arrow {
  color: #98a2b3 !important;
  font-size: 40rpx !important;
}

.section-header {
  padding: 8rpx 32rpx 18rpx !important;
  color: var(--cm-muted) !important;
  font-size: 24rpx !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
}

.seg {
  display: flex !important;
  gap: 12rpx !important;
}

.seg__item {
  flex: 1 !important;
  height: 76rpx !important;
  line-height: 76rpx !important;
  border: 1rpx solid #dbe3ef !important;
  border-radius: 18rpx !important;
  background: #f8fbff !important;
  color: var(--cm-muted) !important;
  text-align: center !important;
  font-size: 28rpx !important;
  font-weight: 700 !important;
}

.seg__item--active {
  border-color: rgba(37, 99, 235, 0.18) !important;
  background: var(--cm-primary-soft) !important;
  color: var(--cm-primary) !important;
}

.port-list {
  margin: 0 28rpx 24rpx !important;
  padding: 6rpx 24rpx !important;
  border: 1rpx solid var(--cm-border) !important;
  border-radius: 28rpx !important;
  background: var(--cm-surface) !important;
  box-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.06) !important;
}

.port-row {
  padding: 20rpx 0 !important;
  border-bottom: 1rpx solid var(--cm-border) !important;
}

.port-row--last {
  border-bottom: 0 !important;
}

.add-port-btn {
  padding: 28rpx 0 !important;
  color: var(--cm-primary) !important;
  text-align: center !important;
  font-size: 28rpx !important;
  font-weight: 700 !important;
}

.footer,
.footer-actions {
  display: flex !important;
  flex-direction: column !important;
  gap: 16rpx !important;
  border-top: 1rpx solid var(--cm-border) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  box-shadow: 0 -12rpx 30rpx rgba(25, 43, 78, 0.08) !important;
  backdrop-filter: blur(18rpx);
}

.footer__btn,
.btn {
  height: 96rpx !important;
  line-height: 96rpx !important;
  border-radius: 18rpx !important;
  text-align: center !important;
  font-size: 32rpx !important;
  font-weight: 700 !important;
}

.footer__btn,
.btn--primary {
  background: var(--cm-primary) !important;
  color: #fff !important;
}

.btn--danger {
  border: 1rpx solid rgba(220, 38, 38, 0.18) !important;
  background: #fff !important;
  color: var(--cm-danger) !important;
}

.danger-bar {
  justify-content: flex-end !important;
  padding: 20rpx 28rpx 0 !important;
}

.danger-bar__btn,
.clear-btn {
  color: var(--cm-danger) !important;
  font-weight: 700 !important;
}

.footer,
.footer-actions {
  left: 50% !important;
  right: auto !important;
  width: 100%;
  max-width: 520px;
  transform: translateX(-50%);
  background: var(--cm-surface) !important;
}

view,
text {
  box-sizing: border-box;
}

input,
textarea {
  box-sizing: border-box;
}

@media (max-width: 520px) {
  uni-page-body {
    box-shadow: none;
  }

  .footer,
  .footer-actions,
  .uni-page-head {
    left: 16rpx !important;
    right: 0 !important;
    width: calc(100% - 32rpx);
    max-width: none;
    transform: none;
  }

  .uni-page-head {
    left: 0 !important;
    width: 100%;
  }

  uni-tabbar.uni-tabbar-bottom {
    left: 16rpx !important;
    right: 16rpx !important;
    width: auto;
    max-width: none;
    transform: none;
  }
}
</style>
