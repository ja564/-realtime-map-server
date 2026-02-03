<script lang="ts" setup>
import { ElButton } from "element-plus";

const SuggestVisible = ref(false);

const your_email = ref("");
</script>

<template>
  <div id="safe_container">
    <slot />

    <!-- 新增：页面底部 footer -->
    <footer class="site_footer" :class="{ mobile: $device.isMobileOrTablet }">
      <div class="footer-inner" :class="{ desk: $device.isDesktop }">
        <div
          class="footer-column"
          :class="{ mobile: $device.isMobileOrTablet }"
        >
          <h4>文明出行</h4>
          <ul>
            <li>安全头盔</li>
            <li>规范停放</li>
            <li>礼让行人</li>
          </ul>
        </div>

        <div
          class="footer-column"
          :class="{ mobile: $device.isMobileOrTablet }"
        >
          <h4>平台信息</h4>
          <ul>
            <li>使用说明</li>
            <li>数据来源</li>
            <li>隐私与声明</li>
          </ul>
        </div>

        <div
          class="footer-column"
          :class="{ mobile: $device.isMobileOrTablet }"
        >
          <h4>联系与反馈</h4>
          <ul>
            <el-button type="primary" link @click="SuggestVisible = true"
              >功能建议</el-button
            >
          </ul>

          <!-- 微信二维码 -->
          <div class="wechat-qrcode">
            <p>微信扫码联系作者：</p>
            <img
              src="/wechat-qrcode.png"
              width="96px"
              height="96px"
              alt="微信二维码"
            />
          </div>
        </div>

        <div class="footer-column newsletter">
          <h4>订阅更新</h4>
          <p>获取电动车整治与文明出行相关更新。</p>
          <div class="newsletter_input">
            <ElInput v-model="your_email" placeholder="you@domain.com" />
            <ElButton color="#3b82f6">订阅</ElButton>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>Copyright © 2026 文明安全出行</span>
      </div>
    </footer>

    <suggest-dialog v-model="SuggestVisible"></suggest-dialog>
  </div>
</template>

<style scoped>
.site_footer {
  padding: 24px 40px;
  background: #050816; /* 深色背景，类似你截图 */
  color: #e5e7eb;
  font-size: 14px;
}

.site_footer.mobile {
  padding: 20px;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
  padding-top: 24px;
  padding-bottom: 16px;
  justify-content: space-around;
}

.footer-inner.desk {
  gap: 32px;
  justify-content: center;
  align-items: center;
}

.footer-column {
  min-width: 160px;
}

.footer-column.mobile {
  min-width: auto;
}

.footer-column h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #f9fafb;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 4px;
  color: #9ca3af;
}

.footer-column li:hover {
  color: #e5e7eb;
}

.footer-column a {
  color: inherit;
  text-decoration: none;
}

.footer-column a:hover {
  text-decoration: underline;
}

.footer-bottom {
  border-top: 1px solid rgba(55, 65, 81, 0.8);
  padding-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.wechat-qrcode {
  margin-top: 8px;
}

.wechat-qrcode p {
  margin: 0 0 4px;
  font-size: 12px;
  color: #9ca3af;
}

.wechat-qrcode img {
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #374151;
}

.newsletter p {
  margin: 0 0 8px;
  color: #9ca3af;
}

.newsletter_input {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
