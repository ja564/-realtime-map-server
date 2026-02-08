<template>
  <!-- 新增：页面底部 footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-column">
          <h4>文明出行</h4>
          <ul>
            <li>安全头盔</li>
            <li>规范停放</li>
            <li>礼让行人</li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>平台信息</h4>
          <ul>
            <li>使用说明</li>
            <li>数据来源</li>
            <li>隐私与声明</li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>联系与反馈</h4>
          <ul>
            <NuxtLink to="/suggest">功能建议</NuxtLink>
          </ul>

          <!-- 微信二维码 -->
          <div class="wechat-qrcode">
            <p>微信扫码联系作者：</p>
            <img src="/wechat-qrcode.png" alt="微信二维码" />
          </div>
        </div>

        <div class="footer-column newsletter">
          <h4>订阅更新</h4>
          <p>获取电动车整治与文明出行相关更新。</p>
          <div class="newsletter-input">
            <input type="email" placeholder="you@domain.com" />
            <button type="button">订阅</button>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>Copyright © 2026 文明安全出行</span>
      </div>
    </footer>
</template>

<script setup>
// 如果 footer 里有 <router-link>，在 Nuxt 中改为 <NuxtLink>
</script>

<style scoped lang="scss">
/* 复制对应 CSS */
</style>
