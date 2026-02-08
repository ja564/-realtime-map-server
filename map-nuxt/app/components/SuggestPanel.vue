<template>
  <section>
    <div class="suggestion-page">
      <p class="tip">欢迎提交你对本应用的功能建议或改进想法。</p>

      <el-form
        label-width="80px"
        class="suggest-form"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="称呼">
          <el-input v-model="name" placeholder="可选：方便后续联系你" />
        </el-form-item>

        <el-form-item label="建议内容">
          <el-input
            type="textarea"
            v-model="content"
            :rows="5"
            placeholder="请尽量详细描述你期望的功能或改进点"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit">提交</el-button>
        </el-form-item>
      </el-form>

      <!-- 额外的文字反馈（可选） -->
      <p v-if="feedback" class="feedback">{{ feedback }}</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'SuggestPanel',
  data() {
    return {
      name: '',
      content: '',
      feedback: '',
    };
  },
  methods: {
    onSubmit() {
      const text = this.content.trim();
      if (!text) {
        // Element Plus 的全局 message（由 @element-plus/nuxt 提供）
        this.$message?.warning?.('请填写建议内容');
        this.feedback = '请填写建议内容';
        return;
      }

      console.log('功能建议：', { name: this.name, content: text });

      this.$message?.success?.('感谢你的建议！');
      this.feedback = '感谢你的建议！';

      this.name = '';
      this.content = '';
    },
  },
};
</script>

<style scoped>
.suggestion-page {
  padding-right: 16px;
  max-width: 520px;
}

.tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.suggest-form :deep(.el-input),
.suggest-form :deep(.el-textarea) {
  width: 100%;
}

.feedback {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}
</style>
