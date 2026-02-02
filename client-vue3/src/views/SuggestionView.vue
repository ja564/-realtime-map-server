
<template>
  <div class="suggestion-page">
    <h2>功能建议反馈</h2>
    <p class="tip">欢迎提交你对本应用的功能建议或改进想法。</p>

    <el-form label-width="80px" @submit.native.prevent="onSubmit">
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
  </div>
</template>

<script>
export default {
  name: 'SuggestionView',
  data() {
    return {
      name: '',
      content: '',
    };
  },
  methods: {
    onSubmit() {
      const text = this.content.trim();
      if (!text) {
        this.$message.warning('请填写建议内容');
        return;
      }
      // TODO: 在这里调用你的后端接口保存建议（目前先简单提示）
      console.log('功能建议：', { name: this.name, content: text });
      this.$message.success('感谢你的建议！');

      this.name = '';
      this.content = '';
    },
  },
};
</script>

<style scoped>
.suggestion-page {
  padding-right: 16px;
}

.tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}
</style>
