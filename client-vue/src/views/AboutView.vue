<template>
  <div class="about-page">
    <h1>功能说明：实时互助路况地图</h1>

    <section class="about-block">
      <p>直接点击网址微信打开。</p>
      <p>
        直接点击网址：
        <a
          href="https://map.orange3dfashion.com"
          target="_blank"
          rel="noopener"
        >
          https://map.orange3dfashion.com 
        </a>
        （测试版），然后点击“继续访问”即可。
      </p>
    </section>

    <section class="about-block">
      <h2>使用功能：</h2>
      <ol>
        <li>
          点击 <strong>“定位到我”</strong> → 点击 <strong>“+号”</strong> → 添加事件点
        </li>
        <li>
          输入所在地址 → <strong>搜索</strong> → <strong>确认</strong> → 添加事件点
        </li>
        <li>
          拖动放大地图到特定位置 → 点击 <strong>“+号”</strong> → 添加事件点
        </li>
      </ol>
    </section>

    <section class="about-block">
      <h2>说明</h2>
      <p>纯分享：只做一件事——让你掌握路上的动态。</p>
      <p>使用过程中有意见或改进建议，欢迎联系反馈。</p>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
};
</script>

<style scoped>
.about-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  line-height: 1.8;
  color: #111827;
  background: #f9fafb;
}

.about-block + .about-block {
  margin-top: 16px;
}

.about-block h2 {
  margin: 8px 0;
  font-size: 18px;
}

a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
