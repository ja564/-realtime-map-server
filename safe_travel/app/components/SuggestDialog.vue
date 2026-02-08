<script lang="ts" setup>
const dialogFormVisible = defineModel({ type: Boolean, default: false });

const name = ref("");
const content = ref("");

function onSubmit() {
  const text = content.value.trim();
  if (!text) {
    ElMessage.warning("请填写建议内容");
    return;
  }
  // TODO: 在这里调用你的后端接口保存建议（目前先简单提示）
  console.log("功能建议：", { name: name.value, content: text });
  ElMessage.success("感谢你的建议！");

  name.value = "";
  content.value = "";
}
</script>

<template>
  <el-dialog
    v-model="dialogFormVisible"
    title="功能建议反馈"
    :width="$device.isDesktop ? 500 : 'calc(100vw - 40px)'"
  >
    <p class="tip">欢迎提交你对本应用的功能建议或改进想法。</p>
    <el-form label-width="80px">
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
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style></style>
